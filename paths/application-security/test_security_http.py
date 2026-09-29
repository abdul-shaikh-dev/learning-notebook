from contextlib import closing
from pathlib import Path
from tempfile import TemporaryDirectory
from threading import Thread
import http.client
import json
import sqlite3
import unittest

from security_lab import Principal, Sessions
from security_http import initialize, make_server


class MutationBoundaryTests(unittest.TestCase):
    def test_denials_preserve_persisted_rows_and_owner_can_update(self):
        with TemporaryDirectory() as folder:
            file = Path(folder) / 'documents.db'
            initialize(file)
            sessions = Sessions()
            alice = sessions.login(Principal('alice', 'red'), 0)
            reader = sessions.login(Principal('reviewer', 'red', 'reader'), 0)
            blue = sessions.login(Principal('alice', 'blue'), 0)
            expired = sessions.login(Principal('alice', 'red'), -301)
            server = make_server(file, sessions)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            def rows():
                with closing(sqlite3.connect(file)) as db:
                    return db.execute('SELECT id,tenant,owner,title FROM documents ORDER BY id').fetchall()
            def patch(document, sid, token, body):
                client = http.client.HTTPConnection('127.0.0.1', server.server_port, timeout=2)
                headers = {'Content-Type': 'application/json'}
                if sid is not None: headers['Cookie'] = 'sid=' + sid
                if token is not None: headers['X-CSRF-Token'] = token
                try:
                    client.request('PATCH', '/documents/' + document, json.dumps(body), headers)
                    response = client.getresponse()
                    return response.status, json.loads(response.read())
                finally:
                    client.close()
            try:
                before = rows()
                good = sessions.records[alice][2]
                for document, sid, token, body, status in [
                    ('a', None, None, {'title':'changed'}, 403),
                    ('a', expired, sessions.records[expired][2], {'title':'changed'}, 403),
                    ('a', alice, None, {'title':'changed'}, 403),
                    ('a', alice, 'wrong', {'title':'changed'}, 403),
                    ('a', reader, sessions.records[reader][2], {'title':'changed'}, 404),
                    ('a', blue, sessions.records[blue][2], {'title':'changed'}, 404),
                    ('b', alice, good, {'title':'changed'}, 404),
                    ('missing', alice, good, {'title':'changed'}, 404),
                    ('a', alice, good, {'title':'changed', 'owner':'alice'}, 400),
                ]:
                    self.assertEqual(patch(document, sid, token, body)[0], status)
                    self.assertEqual(rows(), before)
                self.assertEqual(patch('a', alice, good, {'title':'Reviewed title'}),
                                 (200, {'title':'Reviewed title'}))
                self.assertEqual(rows()[0], ('a','red','alice','Reviewed title'))
                self.assertEqual(rows()[1:], before[1:])
            finally:
                server.shutdown()
                server.server_close()
                thread.join(timeout=2)


if __name__ == '__main__': unittest.main()
