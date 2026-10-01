"""Opt-in: mutate one disposable release-demo Pod, observe, then restore its gate."""
import json
import subprocess
import time
from urllib.parse import urlparse


def main():
    def raw(*args):
        return subprocess.run(['kubectl', '--context=kind-notebook-lab', *args],
                              capture_output=True, text=True, timeout=20, check=True).stdout

    config = json.loads(raw('config', 'view', '--minify', '-o', 'json'))
    server = urlparse(config['clusters'][0]['cluster']['server'])
    if server.scheme != 'https' or server.hostname not in ('127.0.0.1', 'localhost'):
        raise SystemExit('Refusing: named kind context must use a loopback API')
    namespace = json.loads(raw('get', 'namespace', 'notebook-lab', '-o', 'json'))
    if namespace['metadata'].get('labels', {}).get('training-owner') != 'notebook':
        raise SystemExit('Refusing: namespace must have training-owner=notebook')

    def kubectl(*args):
        return raw('-n', 'notebook-lab', *args)

    pods = json.loads(kubectl('get', 'pods', '-l', 'app=release-demo', '-o', 'json'))['items']
    eligible = [p for p in pods if not p['metadata'].get('deletionTimestamp') and
                any(c['type'] == 'Ready' and c['status'] == 'True' for c in p['status'].get('conditions', []))]
    if len(eligible) != 2:
        raise SystemExit('Start from exactly two ready lab Pods using README.md')
    pod = eligible[0]
    name, uid = pod['metadata']['name'], pod['metadata']['uid']
    print('Selected disposable Pod:', name, 'UID:', uid, flush=True)

    def status():
        current = json.loads(kubectl('get', 'pod', name, '-o', 'json'))
        assert current['metadata']['uid'] == uid, 'Pod replaced during observation'
        app = next(c for c in current['status']['containerStatuses'] if c['name'] == 'app')
        ready = any(c['type'] == 'Ready' and c['status'] == 'True' for c in current['status']['conditions'])
        return ready, app['restartCount']

    def wait_ready(expected):
        deadline = time.monotonic() + 60
        while time.monotonic() < deadline:
            ready, count = status()
            if ready == expected:
                return count
            time.sleep(1)
        raise TimeoutError('Pod readiness did not reach ' + str(expected))

    restarts = status()[1]
    # Refuse to overwrite an existing gate; only remove a file created by this run.
    kubectl('exec', name, '-c', 'app', '--', 'python', '-c',
            "from pathlib import Path; Path('/tmp/not-ready').open('x').close()")
    try:
        assert wait_ready(False) == restarts
        deadline = time.monotonic() + 30
        while True:
            slices = json.loads(kubectl('get', 'endpointslices', '-l', 'kubernetes.io/service-name=release-demo', '-o', 'json'))
            endpoints = [e for s in slices['items'] for e in s.get('endpoints', [])
                         if e.get('targetRef', {}).get('uid') == uid]
            if endpoints and all(e.get('conditions', {}).get('ready') is False for e in endpoints):
                break
            if time.monotonic() >= deadline:
                raise TimeoutError('EndpointSlice did not mark chosen Pod unready')
            time.sleep(1)
        assert status()[1] == restarts
        print('PASS: same Pod UID, readiness false, endpoint unready, no restart')
    finally:
        # A name can be reused. Recheck identity immediately before removing our gate.
        cleanup_pod = json.loads(kubectl('get', 'pod', name, '-o', 'json'))
        if cleanup_pod['metadata']['uid'] != uid:
            raise RuntimeError('Cleanup skipped: Pod UID changed; replacement Pod was not modified')
        kubectl('exec', name, '-c', 'app', '--', 'python', '-c',
                "from pathlib import Path; Path('/tmp/not-ready').unlink(missing_ok=True)")
        assert wait_ready(True) == restarts
        print('RESTORED: gate removed, chosen Pod ready, restart count unchanged')


if __name__ == '__main__':
    main()
