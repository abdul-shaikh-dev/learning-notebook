"""Fact checks for the Kubernetes checkpoint answers.

No cluster is used. Each fact either runs the course's release app (paths/kubernetes/practice/
release_app.py, in process or as a subprocess on an ephemeral 127.0.0.1 port), runs readiness_drill.py
against a fake kubectl that only returns canned JSON, runs the offline manifest checks in
check_manifests.py, or reads the shipped manifests as data. It returns the text of the option the
result supports, and the script fails if that differs from the authored correct option.
Run with Python 3.14+: python tests/kubernetes_checkpoint_facts.py
"""
import copy
from contextlib import closing, contextmanager, redirect_stdout
import io
import json
import os
from pathlib import Path
import sqlite3
import subprocess
import sys
from tempfile import TemporaryDirectory
import threading
import unittest
import urllib.error
import urllib.request

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / 'paths' / 'kubernetes'
PRACTICE = COURSE / 'practice'
sys.path.insert(0, str(PRACTICE))
import release_app  # noqa: E402
import readiness_drill  # noqa: E402
import check_manifests  # noqa: E402

# Answers that follow from the lesson text rather than lab behaviour.
SOURCED = {
    'ingress-gateway/2': 'Application teams own routes attached to a shared Gateway, lesson 15',
    'workload-types/2': 'StatefulSet claims are retained on scale-down by default, lesson 20',
    'quotas-and-extensions/2': 'LimitRange defaults are applied before the quota check, lesson 25',
    'control-plane/2': 'A Pod can remain Pending though the API request succeeded, lesson 2',
    'secrets/2': 'Anyone able to create a Pod that mounts a Secret may obtain it, lesson 9',
    'scheduling/2': 'A single-node kind cluster cannot meaningfully satisfy multi-zone rules, lesson 13',
    'persistent-storage/2': 'Deleting a Pod need not delete the claim or its data, lesson 18',
    'helm/2': 'A chart does not make invalid selectors or unsafe privileges correct, lesson 23',
    'gitops/2': 'Manual changes can be overwritten on reconciliation, lesson 24',
}


def pick(value, table):
    if value not in table:
        raise AssertionError(f'unexpected result {value!r}')
    return table[value]


def outcome(action):
    """Run action and name the exception it raises, or return its result."""
    try:
        return action()
    except Exception as error:
        return f'{type(error).__name__}: {error}'


def manifest(file):
    value = json.loads((PRACTICE / file).read_text(encoding='utf-8'))
    return value.get('items', [value])


def kind(file, name):
    return next(item for item in manifest(file) if item['kind'] == name)


def matches(selector, labels):
    return all(labels.get(k) == v for k, v in selector.items())


def millicores(value):
    return int(value[:-1]) if value.endswith('m') else int(float(value) * 1000)


DEPLOYMENT = kind('workload.json', 'Deployment')
CONTAINER = DEPLOYMENT['spec']['template']['spec']['containers'][0]


@contextmanager
def app(**options):
    with TemporaryDirectory(ignore_cleanup_errors=True) as folder:
        db = str(Path(folder) / 'notes.db')
        server = release_app.make_server('127.0.0.1', 0, db, **options)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            yield f'http://127.0.0.1:{server.server_address[1]}', db, folder
        finally:
            server.shutdown()
            server.server_close()


def call(base, path, body=None):
    data = None if body is None else json.dumps(body).encode()
    request = urllib.request.Request(base + path, data=data, method='POST' if data else 'GET',
                                     headers={'Content-Type': 'application/json'} if data else {})
    try:
        with urllib.request.urlopen(request, timeout=5) as response:
            return response.status, json.loads(response.read())
    except urllib.error.HTTPError as error:
        with error:
            return error.code, json.loads(error.read())


class FakeKubectl:
    """Stands in for subprocess.run inside readiness_drill: canned JSON, no process is started."""
    def __init__(self, server='https://127.0.0.1:6443', labels=None):
        self.answers = {
            'config': {'clusters': [{'cluster': {'server': server}}]},
            'namespace': {'metadata': {'labels': {'training-owner': 'notebook'} if labels is None else labels}},
        }

    def __call__(self, args, **_):
        key = 'config' if 'config' in args else 'namespace' if 'namespace' in args else None
        if key is None:
            raise AssertionError(f'drill went past its guards: {args}')
        return subprocess.CompletedProcess(args, 0, json.dumps(self.answers[key]), '')


def drill(fake):
    original = readiness_drill.subprocess.run
    readiness_drill.subprocess.run = fake
    try:
        readiness_drill.main()
    except SystemExit as stop:
        return str(stop)
    finally:
        readiness_drill.subprocess.run = original
    raise AssertionError('drill did not refuse')


def cluster_model():
    with app() as (first, _, _f), app() as (second, _, _s):
        call(first, '/notes', {'title': 'Only here'})
        return pick(len(call(second, '/notes')[1]['notes']), {0: 'No notes', 1: 'The new note'})


def local_context():
    return 'Exits: ' + drill(FakeKubectl(server='https://10.0.0.5:6443'))


def objects_labels():
    service = kind('workload.json', 'Service')
    changed = copy.deepcopy(DEPLOYMENT['spec']['template']['metadata']['labels'])
    changed['app'] = 'release-demo-v2'
    before = matches(service['spec']['selector'], DEPLOYMENT['spec']['template']['metadata']['labels'])
    return pick((before, matches(service['spec']['selector'], changed)),
                {(True, False): 'No: the selector no longer matches the Pod labels'})


def pods():
    env = {e['name']: e['value'] for e in CONTAINER['env']}
    mount = next(m for m in CONTAINER['volumeMounts'] if env['RELEASE_DB'].startswith(m['mountPath'] + '/'))
    volume = next(v for v in DEPLOYMENT['spec']['template']['spec']['volumes'] if v['name'] == mount['name'])
    return pick((CONTAINER['securityContext']['readOnlyRootFilesystem'], mount['mountPath'], 'emptyDir' in volume),
                {(True, '/tmp', True): 'Under /tmp, on an emptyDir volume'})


def deployments():
    return str(DEPLOYMENT['spec']['revisionHistoryLimit'])


def services_dns():
    job, service = kind('job.json', 'Job'), kind('workload.json', 'Service')
    command = ' '.join(job['spec']['template']['spec']['containers'][0]['command'])
    same = job['metadata']['namespace'] == service['metadata']['namespace']
    return pick((same, f"//{service['metadata']['name']}:" in command),
                {(True, True): 'The Job runs in the same namespace as the Service'})


def configmaps():
    with TemporaryDirectory(ignore_cleanup_errors=True) as folder:
        env = dict(os.environ, RELEASE_VERSION='v2', PORT='0', BIND_HOST='127.0.0.1',
                   RELEASE_DB=str(Path(folder) / 'notes.db'), PYTHONDONTWRITEBYTECODE='1')
        env.pop('NOT_READY_FILE', None)
        process = subprocess.Popen([sys.executable, 'release_app.py'], cwd=PRACTICE, env=env,
                                   stdout=subprocess.PIPE, text=True)
        try:
            port = json.loads(process.stdout.readline())['started'][1]
            status, body = call(f'http://127.0.0.1:{port}', '/version')
            return json.dumps(body)
        finally:
            process.terminate()
            process.wait(timeout=10)
            process.stdout.close()


def probes():
    with TemporaryDirectory(ignore_cleanup_errors=True) as gate_folder:
        gate = Path(gate_folder) / 'not-ready'
        gate.touch()
        with app(ready_file=str(gate)) as (base, _, _f):
            return f"/live {call(base, '/live')[0]} and /ready {call(base, '/ready')[0]}"


def resources():
    requested = millicores(CONTAINER['resources']['requests']['cpu']) * DEPLOYMENT['spec']['replicas']
    return pick(requested, {200: '200m, a fifth of a CPU', 100: '100m'})


def rolling_updates():
    replicas = DEPLOYMENT['spec']['replicas']
    rolling = DEPLOYMENT['spec']['strategy']['rollingUpdate']
    return (f"At most {replicas + rolling['maxSurge']} Pods, "
            f"never fewer than {replicas - rolling['maxUnavailable']} available")


def network_policy():
    policy = kind('network-policy.json', 'NetworkPolicy')
    allowed = policy['spec']['ingress'][0]['from'][0]['podSelector']['matchLabels']
    chosen = tuple(p['metadata']['name'] for p in manifest('policy-clients.json') if matches(allowed, p['metadata']['labels']))
    return pick(chosen, {('allowed-client',): 'allowed-client only', ('allowed-client', 'denied-client'): 'Both'})


def rbac():
    role = kind('rbac.json', 'Role')
    binding = kind('rbac.json', 'RoleBinding')
    assert binding['roleRef']['name'] == role['metadata']['name'] and binding['subjects'][0]['name'] == 'viewer'

    def can(verb, resource):
        return any(verb in r['verbs'] and resource in r['resources'] for r in role['rules'])
    return pick((can('delete', 'pods'), can('get', 'secrets')), {(False, False): 'Neither', (True, False): 'Delete Pods only',
                                                                (True, True): 'Both'})


def pod_security():
    labels = kind('namespace.json', 'Namespace')['metadata']['labels']
    return f"{labels['pod-security.kubernetes.io/enforce']}, pinned to {labels['pod-security.kubernetes.io/enforce-version']}"


def jobs():
    spec = kind('job.json', 'Job')['spec']
    assert spec['template']['spec']['restartPolicy'] == 'Never'
    return str(spec['backoffLimit'] + 1)


def autoscaling():
    hpa = kind('hpa.json', 'HorizontalPodAutoscaler')
    target = hpa['spec']['metrics'][0]['resource']['target']
    assert target['type'] == 'Utilization'
    return f"{millicores(CONTAINER['resources']['requests']['cpu']) * target['averageUtilization'] // 100}m"


def disruptions():
    pdb = kind('disruption-budget.json', 'PodDisruptionBudget')
    assert matches(pdb['spec']['selector']['matchLabels'], DEPLOYMENT['spec']['template']['metadata']['labels'])
    return str(DEPLOYMENT['spec']['replicas'] - pdb['spec']['minAvailable'])


def troubleshooting():
    with app() as (base, db, _):
        Path(db).unlink()
        return f"/live {call(base, '/live')[0]} and /ready {call(base, '/ready')[0]}"


def backup_production():
    with TemporaryDirectory(ignore_cleanup_errors=True) as folder:
        source, target = Path(folder) / 'notes.db', Path(folder) / 'backup.db'
        release_app.initialize(str(source))
        target.write_text('earlier backup')
        return outcome(lambda: release_app.backup(str(source), str(target)))


def foundation_strip():
    with app() as (base, _, _f):
        status, body = call(base, '/notes', {'title': '  Plan  '})
        return f"{status} with the title '{body['title']}'"


def foundation_long():
    with app() as (base, _, _f):
        status, body = call(base, '/notes', {'title': 'x' * 101})
        return f"{status} {body['error']}"


def foundation_metrics():
    with TemporaryDirectory(ignore_cleanup_errors=True) as gate_folder:
        gate = Path(gate_folder) / 'not-ready'
        gate.touch()
        with app(ready_file=str(gate)) as (base, _, _f):
            assert call(base, '/ready')[0] == 503 and call(base, '/missing')[0] == 404
            metrics = call(base, '/metrics')[1]
            return f"{metrics['requests']} requests, {metrics['errors']} error{'s' if metrics['errors'] != 1 else ''}"


def probe_seconds(name):
    probe = CONTAINER[name]
    return probe['periodSeconds'] * probe['failureThreshold']


def intermediate_readiness():
    return f"About {probe_seconds('readinessProbe')} seconds"


def intermediate_startup():
    return f"About {probe_seconds('startupProbe')} seconds"


def intermediate_role_secrets():
    shipped = check_manifests.documents
    original = list(shipped())

    def widened():
        for file, obj in original:
            if obj['kind'] == 'Role':
                obj = copy.deepcopy(obj)
                obj['rules'][0]['resources'].append('secrets')
            yield file, obj
    check_manifests.documents = widened
    try:
        failed = []
        for test in ('test_namespace_and_supported_api', 'test_selectors_ports_and_security', 'test_optional_boundaries'):
            result = unittest.TestResult()
            check_manifests.ManifestChecks(test).run(result)
            if not result.wasSuccessful():
                failed.append(test)
    finally:
        check_manifests.documents = shipped
    return pick(tuple(failed), {('test_optional_boundaries',): 'test_optional_boundaries', (): 'None of them'})


def advanced_backup():
    with TemporaryDirectory(ignore_cleanup_errors=True) as folder:
        with app() as (base, db, _):
            call(base, '/notes', {'title': 'Keep me'})
            target = Path(folder) / 'backup.db'
            release_app.backup(db, str(target))
        with closing(sqlite3.connect(target)) as copy_db:
            titles = [r[0] for r in copy_db.execute('SELECT title FROM notes')]
        return pick(tuple(titles), {('Keep me',): 'The note', (): 'An empty notes table'})


def advanced_hpa_window():
    window = kind('hpa.json', 'HorizontalPodAutoscaler')['spec']['behavior']['scaleDown']['stabilizationWindowSeconds']
    return f'{window} seconds'


def advanced_owner_label():
    return 'Exits: ' + drill(FakeKubectl(labels={}))


FACTS = {
    'cluster-model/2': cluster_model, 'local-context/2': local_context, 'objects-labels/2': objects_labels,
    'pods/2': pods, 'deployments/2': deployments, 'services-dns/2': services_dns, 'configmaps/2': configmaps,
    'probes/2': probes, 'resources/2': resources, 'rolling-updates/2': rolling_updates,
    'network-policy/2': network_policy, 'rbac/2': rbac, 'pod-security/2': pod_security, 'jobs/2': jobs,
    'autoscaling/2': autoscaling, 'disruptions/2': disruptions, 'troubleshooting/2': troubleshooting,
    'backup-production/2': backup_production,
    'stage/foundation/1': foundation_strip, 'stage/foundation/2': foundation_long,
    'stage/foundation/3': foundation_metrics,
    'stage/intermediate/1': intermediate_readiness, 'stage/intermediate/2': intermediate_startup,
    'stage/intermediate/3': intermediate_role_secrets,
    'stage/advanced/1': advanced_backup, 'stage/advanced/2': advanced_hpa_window,
    'stage/advanced/3': advanced_owner_label,
}


def questions():
    data = json.loads((COURSE / 'checkpoints.json').read_text(encoding='utf-8'))
    for lesson, items in data['lessons'].items():
        for i, q in enumerate(items):
            yield f'{lesson}/{i + 2}', q
    for stage, items in data['stages'].items():
        for i, q in enumerate(items):
            yield f'stage/{stage}/{i + 1}', q


def main():
    seen, failures = set(), []
    for key, q in questions():
        seen.add(key)
        if key in SOURCED:
            continue
        if key not in FACTS:
            failures.append(f'{key}: no fact check and no cited source')
            continue
        try:
            with redirect_stdout(io.StringIO()):  # release_app prints one access-log line per request
                answer = FACTS[key]()
        except Exception as error:  # report every failing fact, not just the first
            failures.append(f'{key}: {error}')
            continue
        if answer != q['options'][q['correct']]:
            failures.append(f'{key}: the lab supports {answer!r}, the question marks {q["options"][q["correct"]]!r}')
    failures += [f'{key}: fact has no question' for key in set(FACTS) | set(SOURCED) if key not in seen]
    if failures:
        sys.exit('Kubernetes checkpoint facts failed:\n' + '\n'.join(failures))
    print(f'PASS: {len(FACTS)} Kubernetes checkpoint answers checked against the course labs and manifests; '
          f'{len(SOURCED)} cited from the lessons.')


if __name__ == '__main__':
    main()
