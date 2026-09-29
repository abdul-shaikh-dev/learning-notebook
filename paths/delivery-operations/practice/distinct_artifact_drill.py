"""Run v1 -> distinct v2 -> v1 rollback on loopback with shared SQLite data."""
from contextlib import contextmanager
import hashlib
import http.client
import json
from pathlib import Path
from queue import Empty, Queue
import subprocess
import sys
from tempfile import TemporaryDirectory
from threading import Thread


SOURCE = Path(__file__).with_name('release_app.py')
OLD = 'if route=="/version":return self.respond(200,{"release":version})'
NEW = 'if route=="/version":return self.respond(200,{"release":version,"capability":"candidate-v2"})'


def request(port, method, route, body=None):
    client = http.client.HTTPConnection('127.0.0.1', port, timeout=3)
    headers = {'Content-Type':'application/json'} if body is not None else {}
    try:
        client.request(method, route, json.dumps(body) if body is not None else None, headers)
        response = client.getresponse()
        return response.status, json.loads(response.read())
    finally:
        client.close()


@contextmanager
def running(artifact, db, version, ready_file=None, startup_timeout=5):
    args = [sys.executable, '-u', str(artifact), '--port', '0', '--db', str(db), '--version', version]
    if ready_file: args += ['--ready-file', str(ready_file)]
    process = subprocess.Popen(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    try:
        lines = Queue(maxsize=1)
        Thread(target=lambda: lines.put(process.stdout.readline()), daemon=True).start()
        try: line = lines.get(timeout=startup_timeout)
        except Empty: raise TimeoutError('server startup did not report a port')
        if not line:
            raise RuntimeError('server failed to start: ' + process.stderr.read())
        port = json.loads(line)['started'][1]
        yield port
    finally:
        process.terminate()
        try: process.communicate(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill(); process.communicate()


def drill():
    source = SOURCE.read_text(encoding='utf-8')
    if source.count(OLD) != 1: raise RuntimeError('v2 source edit target changed; review the drill')
    with TemporaryDirectory(prefix='release-artifact-') as folder:
        root = Path(folder)
        v1, v2 = root/'release-v1.py', root/'release-v2.py'
        v1.write_text(source, encoding='utf-8')
        v2.write_text(source.replace(OLD, NEW), encoding='utf-8')
        hashes = {p.stem: hashlib.sha256(p.read_bytes()).hexdigest() for p in (v1,v2)}
        assert hashes[v1.stem] != hashes[v2.stem]
        db = root/'notes.db'
        gate = root/'not-ready'
        eligible = []
        with running(v1, db, 'v1') as port:
            assert request(port,'GET','/ready')[0] == 200
            assert request(port,'POST','/notes',{'title':'retained note'})[0] == 201
            eligible.append(request(port,'GET','/notes')[0])
            assert request(port,'GET','/version') == (200, {'release':'v1'})
        gate.write_text('candidate held', encoding='utf-8')
        with running(v2, db, 'v2', gate) as port:
            assert request(port,'GET','/ready')[0] == 503
            gate.unlink()
            assert request(port,'GET','/ready')[0] == 200
            assert request(port,'GET','/version') == (200, {'release':'v2','capability':'candidate-v2'})
            status, data = request(port,'GET','/notes')
            eligible.append(status)
            assert data['notes'][0]['title'] == 'retained note'
        with running(v1, db, 'v1') as port:
            assert request(port,'GET','/ready')[0] == 200
            assert request(port,'GET','/version') == (200, {'release':'v1'})
            status, data = request(port,'GET','/notes')
            eligible.append(status)
            assert data['notes'][0]['title'] == 'retained note'
        return {'artifact_sha256':hashes, 'eligible_note_reads':len(eligible),
                'good_note_reads':sum(status==200 for status in eligible),
                'read_sli':sum(status==200 for status in eligible)/len(eligible),
                'candidate_readiness_denied_before_gate':True,
                'rollback_retained_note':True}


if __name__ == '__main__': print(json.dumps(drill(), indent=2))
