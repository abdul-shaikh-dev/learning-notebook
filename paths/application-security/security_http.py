"""Loopback-only HTTP mutation seam for synthetic, trusted fixture sessions.

No credential verification or production web-server behavior is implied.
"""
from contextlib import closing
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import sqlite3

from security_lab import Principal, Sessions, authorized, parse_update


def initialize(file):
    with closing(sqlite3.connect(file)) as db, db:
        db.execute("CREATE TABLE documents(id TEXT PRIMARY KEY, tenant TEXT NOT NULL, owner TEXT NOT NULL, title TEXT NOT NULL)")
        db.executemany("INSERT INTO documents VALUES(?,?,?,?)", [
            ('a', 'red', 'alice', 'Alice private'),
            ('b', 'red', 'bob', 'Bob private'),
            ('c', 'blue', 'alice', 'Other tenant'),
        ])


def make_server(file, sessions: Sessions, now=lambda: 0):
    """Caller owns server lifetime and injects already authenticated sessions."""
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_):
            pass

        def respond(self, status, value):
            body = json.dumps(value).encode('utf-8')
            self.send_response(status)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_PATCH(self):
            if not self.path.startswith('/documents/') or self.path.count('/') != 2:
                return self.respond(404, {'error': 'unavailable'})
            # Session id is a synthetic fixture cookie, never a caller-supplied Principal.
            cookie = self.headers.get('Cookie', '')
            if not cookie.startswith('sid=') or ';' in cookie:
                return self.respond(403, {'error': 'denied'})
            sid = cookie[4:]
            try:
                principal = sessions.identity(sid, now())
                sessions.csrf(sid, self.headers.get('X-CSRF-Token'), now())
            except PermissionError:
                return self.respond(403, {'error': 'denied'})
            if not isinstance(principal, Principal):
                return self.respond(403, {'error': 'denied'})
            try:
                length = int(self.headers.get('Content-Length', '0'))
                if not 0 < length <= 1024 or self.headers.get('Content-Type') != 'application/json':
                    raise ValueError()
                update = parse_update(json.loads(self.rfile.read(length)))
            except (ValueError, TypeError):
                return self.respond(400, {'error': 'invalid_body'})
            with closing(sqlite3.connect(file)) as db:
                db.execute('BEGIN IMMEDIATE')
                row = db.execute('SELECT tenant,owner,title FROM documents WHERE id=?', (self.path.rsplit('/', 1)[-1],)).fetchone()
                if row is None or not authorized(principal, {'tenant': row[0], 'owner': row[1]}, 'update'):
                    db.rollback()
                    return self.respond(404, {'error': 'unavailable'})
                db.execute('UPDATE documents SET title=? WHERE id=?', (update['title'], self.path.rsplit('/', 1)[-1]))
                db.commit()
            return self.respond(200, {'title': update['title']})

    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    server.daemon_threads = True
    return server
