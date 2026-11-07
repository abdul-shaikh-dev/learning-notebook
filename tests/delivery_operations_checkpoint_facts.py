"""Fact checks for the Delivery & Operations checkpoint answers.

Each fact runs the course's offline labs in paths/delivery-operations/practice (release_tools.py, the
expand/backfill/contract steps in schema_coexistence.py, the v1 -> v2 -> v1 drill in
distinct_artifact_drill.py and release_app.py on an ephemeral 127.0.0.1 port), or reads the Dockerfile
and ci-example.yaml as text, and returns the text of the option the result supports. The script fails if
that differs from the authored correct option. No Docker, network or deployment is used.
Run with Python 3.14+: python tests/delivery_operations_checkpoint_facts.py
"""
from contextlib import closing, contextmanager, redirect_stdout
from functools import cache
import io
import json
import os
from pathlib import Path
import re
import shutil
import sqlite3
import subprocess
import sys
from tempfile import TemporaryDirectory
import threading
import urllib.request

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / 'paths' / 'delivery-operations'
PRACTICE = COURSE / 'practice'
sys.path.insert(0, str(PRACTICE))
import release_app  # noqa: E402
import release_tools  # noqa: E402
import schema_coexistence as schema  # noqa: E402
import distinct_artifact_drill  # noqa: E402

# Answers that follow from the lesson text rather than lab behaviour.
SOURCED = {
    'environments/2': 'Container 0.0.0.0 listening and a 127.0.0.1 host binding are different boundaries, lesson 2',
    'reproducible-builds/2': 'Tags can change; resolve and record the digest, lesson 4',
    'secrets/2': 'ARG, ENV and copied files can leave values in image metadata or layers, lesson 9',
    'web-topology/2': 'Browser build-time configuration is public; a frontend API URL is acceptable, lesson 10',
    'deployment-strategies/2': 'Changing which local port a client calls models a traffic switch, lesson 15',
    'incident-response/2': 'Compare symptoms with recent changes without assuming the newest deploy is the cause, lesson 23',
    'release-review/2': 'Separate local tests from Docker, staging and production checks, lesson 24',
}

DOCKERFILE = (PRACTICE / 'Dockerfile').read_text(encoding='utf-8')
CI = (PRACTICE / 'ci-example.yaml').read_text(encoding='utf-8')


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


def stages():
    """Dockerfile stages as {name: [instruction lines]}."""
    result, current = {}, None
    for line in DOCKERFILE.splitlines():
        if line.startswith('FROM '):
            current = line.split(' AS ')[-1].strip()
            result[current] = [line]
        elif current and line.strip():
            result[current].append(line)
    return result


@cache
def drill():
    with redirect_stdout(io.StringIO()):
        return distinct_artifact_drill.drill()


@contextmanager
def app():
    with TemporaryDirectory(ignore_cleanup_errors=True) as folder:
        db = str(Path(folder) / 'notes.db')
        server = release_app.make_server('127.0.0.1', 0, db)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            yield f'http://127.0.0.1:{server.server_address[1]}', db, folder
        finally:
            server.shutdown()
            server.server_close()


def get(base, path):
    with urllib.request.urlopen(base + path, timeout=5) as response:
        return response.status, json.loads(response.read())


def post_note(base, title):
    request = urllib.request.Request(base + '/notes', data=json.dumps({'title': title}).encode(), method='POST',
                                     headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(request, timeout=5) as response:
        return response.status


@contextmanager
def notes_db():
    """The schema drill's starting point: a notes table with one old row."""
    with TemporaryDirectory(ignore_cleanup_errors=True) as folder:
        with closing(sqlite3.connect(Path(folder) / 'notes.db')) as db:
            db.execute('CREATE TABLE notes(id INTEGER PRIMARY KEY, title TEXT NOT NULL)')
            db.execute("INSERT INTO notes(title) VALUES ('first')")
            yield db


def release_contract():
    result = drill()
    return pick((result['good_note_reads'], result['eligible_note_reads'], result['rollback_retained_note']),
                {(3, 3, True): 'All 3, and the note survives the rollback'})


def source_release():
    with TemporaryDirectory() as a, TemporaryDirectory() as b:
        copies = [shutil.copy(PRACTICE / 'release_app.py', folder) for folder in (a, b)]
        return pick(release_tools.digest(copies[0]) == release_tools.digest(copies[1]),
                    {True: 'Yes: the digest depends only on the bytes'})


def test_gates():
    test, runtime = stages()['test'], stages()['runtime']
    runs_tests = any(line.startswith('RUN python -m unittest') for line in test)
    copies_from_test = any(line.startswith('COPY --from=test ') for line in runtime)
    return pick((runs_tests, copies_from_test),
                {(True, True): 'The test stage runs the tests, and the runtime stage copies from it'})


def containers():
    user = next(line.split()[1] for line in stages()['runtime'] if line.startswith('USER '))
    return pick(user, {'10001:10001': 'UID 10001, not root'})


def docker_build():
    copied = [line.split()[2:-1] for line in stages()['runtime'] if line.startswith('COPY --from=test ')]
    names = tuple(Path(p).name for group in copied for p in group)
    return pick(names, {('release_app.py',): 'Only release_app.py'})


def runtime_configuration():
    with TemporaryDirectory(ignore_cleanup_errors=True) as folder:
        env = {k: v for k, v in os.environ.items() if k not in ('BIND_HOST', 'NOT_READY_FILE')}
        env.update(PORT='0', RELEASE_DB=str(Path(folder) / 'notes.db'), PYTHONDONTWRITEBYTECODE='1')
        process = subprocess.Popen([sys.executable, 'release_app.py'], cwd=PRACTICE, env=env,
                                   stdout=subprocess.PIPE, text=True)
        try:
            return json.loads(process.stdout.readline())['started'][0]
        finally:
            process.terminate()
            process.wait(timeout=10)
            process.stdout.close()


def schema_evolution():
    with notes_db() as db:
        db.execute('ALTER TABLE notes ADD COLUMN label TEXT')
        label = db.execute('SELECT label FROM notes').fetchone()[0]
        return pick((label, tuple(schema.new_reader(db))), {(None, (('first',),)): 'Its title, through COALESCE'})


def ci_value(key):
    return next(line.split(':', 1)[1].strip() for line in CI.splitlines() if line.strip().startswith(key + ':'))


def ci_pipeline():
    block = CI.split('permissions:', 1)[1].split('jobs:', 1)[0]
    granted = tuple(line.strip() for line in block.splitlines() if line.strip())
    return pick((granted, ci_value('persist-credentials')), {(('contents: read',), 'false'): 'contents: read only'})


def artifact_promotion():
    upload = CI.split('actions/upload-artifact', 1)[1]
    paths = re.search(r'path: \|\n((?:\s{12}\S.*\n)+)', upload).group(1).split()
    return pick(tuple(paths), {('release_app.py', 'release-sha256.txt'): 'release_app.py with its SHA-256 file'})


def health_contracts():
    return pick(drill()['candidate_readiness_denied_before_gate'], {True: '503'})


def rollback():
    with notes_db() as db:
        db.execute('ALTER TABLE notes ADD COLUMN label TEXT')
        db.execute('UPDATE notes SET label=title WHERE label IS NULL')
        db.execute('ALTER TABLE notes DROP COLUMN title')
        error = outcome(lambda: schema.old_reader(db))
        return pick(error.split(':')[0] + ': ' + ('no such column' if 'no such column' in error else error),
                    {'OperationalError: no such column': 'sqlite3.OperationalError: no such column'})


def structured_logs():
    with app() as (base, _, _f):
        log = io.StringIO()
        with redirect_stdout(log):
            outcome(lambda: get(base, '/admin?debug=1'))
        return json.loads(log.getvalue().strip().splitlines()[-1])['route']


def metrics():
    with app() as (base, _, _f):
        get(base, '/live')
        get(base, '/live')
        return str(get(base, '/metrics')[1]['requests'])


def slos():
    result = release_tools.budget(10000, 12, 0.999)
    return (f"{result['allowed_bad']:g} allowed, so remaining is {result['remaining']:g} "
            f"and the burn rate is {round(result['burn_rate'], 9):g}")


def load_testing():
    error = outcome(lambda: release_tools.local_load('http://example.com/', 10))
    return pick(error.split(':')[0], {'ValueError': 'Raises ValueError before sending any request'})


def backups():
    with TemporaryDirectory(ignore_cleanup_errors=True) as folder:
        source = Path(folder) / 'notes.db'
        release_app.initialize(str(source))
        run = subprocess.run([sys.executable, '-B', 'release_tools.py', 'backup', str(source), str(Path(folder) / 'copy.db')],
                             cwd=PRACTICE, capture_output=True, text=True, timeout=30, check=True)
        return run.stdout.strip()


def restore_drill():
    with TemporaryDirectory(ignore_cleanup_errors=True) as folder:
        with app() as (base, db, _):
            post_note(base, 'Restore me')
            target = Path(folder) / 'copy.db'
            release_app.backup(db, str(target))
        with closing(sqlite3.connect(target)) as copy:
            check = copy.execute('PRAGMA integrity_check').fetchone()[0]
            titles = [r[0] for r in copy.execute('SELECT title FROM notes')]
        return pick((check, titles == ['Restore me']), {('ok', True): 'ok, and the note is present'})


def foundation_empty_digest():
    with TemporaryDirectory() as folder:
        empty = Path(folder) / 'empty'
        empty.write_bytes(b'')
        value = release_tools.digest(empty)
        return pick(value.startswith('e3b0c442') and len(value) == 64,
                    {True: 'The SHA-256 of zero bytes, beginning e3b0c442'})


def foundation_healthcheck():
    line = next(line for line in stages()['runtime'] if line.startswith('HEALTHCHECK'))
    return re.search(r'127\.0\.0\.1:8080(/\w+)', line).group(1)


def foundation_base():
    bases = {line.split()[1] for stage in stages().values() for line in stage if line.startswith('FROM ')}
    return pick(tuple(bases), {('python:3.14-slim',): 'python:3.14-slim'})


def intermediate_late_write():
    with notes_db() as db:
        db.execute('ALTER TABLE notes ADD COLUMN label TEXT')
        db.execute('UPDATE notes SET label=title WHERE label IS NULL')
        db.execute("INSERT INTO notes(title) VALUES ('late old write')")
        return str(db.execute('SELECT COUNT(*) FROM notes WHERE label IS NULL').fetchone()[0])


def intermediate_dual_write():
    with notes_db() as db:
        db.execute('ALTER TABLE notes ADD COLUMN label TEXT')
        db.execute('UPDATE notes SET label=title WHERE label IS NULL')
        db.execute('INSERT INTO notes(title,label) VALUES (?,?)', ('new write', 'new write'))
        return pick(schema.old_reader(db) == schema.new_reader(db), {True: 'Yes'})


def intermediate_distinct():
    hashes = list(drill()['artifact_sha256'].values())
    return pick(hashes[0] == hashes[1], {False: 'No', True: 'Yes'})


def advanced_percentile():
    return str(release_tools.percentile([5, 1, 9, 3], 0.5))


def advanced_full_budget():
    result = release_tools.budget(1000, 0, 0.99)
    return f"{result['allowed_bad']:g} allowed, {result['remaining']:g} remaining, burn rate {result['burn_rate']:g}"


def advanced_local_load():
    with app() as (base, _, _f):
        with redirect_stdout(io.StringIO()):
            result = release_tools.local_load(base + '/live', 5)
        return pick((result['requests'], result['errors']), {(5, 0): '0', (5, 5): '5'})


FACTS = {
    'release-contract/2': release_contract, 'source-release/2': source_release, 'test-gates/2': test_gates,
    'containers/2': containers, 'docker-build/2': docker_build, 'runtime-configuration/2': runtime_configuration,
    'schema-evolution/2': schema_evolution, 'ci-pipeline/2': ci_pipeline, 'artifact-promotion/2': artifact_promotion,
    'health-contracts/2': health_contracts, 'rollback/2': rollback, 'structured-logs/2': structured_logs,
    'metrics/2': metrics, 'slos/2': slos, 'load-testing/2': load_testing, 'backups/2': backups,
    'restore-drill/2': restore_drill,
    'stage/foundation/1': foundation_empty_digest, 'stage/foundation/2': foundation_healthcheck,
    'stage/foundation/3': foundation_base,
    'stage/intermediate/1': intermediate_late_write, 'stage/intermediate/2': intermediate_dual_write,
    'stage/intermediate/3': intermediate_distinct,
    'stage/advanced/1': advanced_percentile, 'stage/advanced/2': advanced_full_budget,
    'stage/advanced/3': advanced_local_load,
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
        sys.exit('Delivery & Operations checkpoint facts failed:\n' + '\n'.join(failures))
    print(f'PASS: {len(FACTS)} Delivery & Operations checkpoint answers checked against the course labs; '
          f'{len(SOURCED)} cited from the lessons.')


if __name__ == '__main__':
    main()
