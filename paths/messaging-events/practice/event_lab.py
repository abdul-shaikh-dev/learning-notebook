"""SQLite outbox/inbox reference. No network, broker or external side effect."""
import json
import sqlite3
import tempfile
from contextlib import closing
from pathlib import Path

def connect(path):
    db = sqlite3.connect(path)
    db.execute('PRAGMA foreign_keys=ON')
    db.executescript('''
      CREATE TABLE IF NOT EXISTS jobs(id TEXT PRIMARY KEY, value INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS outbox(id TEXT PRIMARY KEY, payload TEXT NOT NULL, sent INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE IF NOT EXISTS inbox(consumer TEXT, id TEXT, payload TEXT NOT NULL, PRIMARY KEY(consumer,id));
      CREATE TABLE IF NOT EXISTS projection(consumer TEXT, job TEXT, total INTEGER NOT NULL, PRIMARY KEY(consumer,job));
    ''')
    return db

def validate(event):
    if not isinstance(event, dict): raise ValueError('event must be an object')
    if set(event) != {'id','job_id','type','version','value'}: raise ValueError('unexpected or missing envelope fields')
    if type(event.get('version')) is not int or event['version'] != 1: raise ValueError('unsupported version')
    for key in ('id', 'job_id', 'type'):
        if not isinstance(event.get(key), str) or not 1 <= len(event[key]) <= 128 or event[key] != event[key].strip():
            raise ValueError('identifier must be 1-128 characters without surrounding whitespace: ' + key)
    if event['type'] != 'ExportRequested': raise ValueError('unsupported type')
    if type(event.get('value')) is not int or not 0 <= event['value'] < 2**63: raise ValueError('value must be a nonnegative SQLite signed-64-bit integer')
    return json.dumps(event, sort_keys=True, separators=(',', ':'))

def create_job(db, job_id, event_id, value, crash=False):
    event = dict(id=event_id, job_id=job_id, value=value, type='ExportRequested', version=1)
    payload = validate(event)
    with db:
        old = db.execute('SELECT payload FROM outbox WHERE id=?', (event_id,)).fetchone()
        if old:
            if old[0] != payload: raise ValueError('event identity collision')
            return event
        db.execute('INSERT INTO jobs VALUES(?,?)', (job_id, value))
        if crash: raise RuntimeError('crash between job and outbox writes')
        db.execute('INSERT INTO outbox(id,payload) VALUES(?,?)', (event_id, payload))
    return event

def pending(db):
    return [json.loads(r[0]) for r in db.execute('SELECT payload FROM outbox WHERE sent=0 ORDER BY rowid')]

def mark_sent(db, event_id):
    with db:
        row = db.execute('UPDATE outbox SET sent=1 WHERE id=?', (event_id,))
        if row.rowcount != 1: raise ValueError('unknown outbox event')

def consume(db, consumer, event, crash=False):
    if not isinstance(consumer, str) or not 1 <= len(consumer) <= 128 or consumer != consumer.strip(): raise ValueError('consumer must be 1-128 characters without surrounding whitespace')
    payload = validate(event)
    with db:
        old = db.execute('SELECT payload FROM inbox WHERE consumer=? AND id=?', (consumer,event['id'])).fetchone()
        if old:
            if old[0] != payload: raise ValueError('event identity collision')
            return False
        db.execute('INSERT INTO inbox VALUES(?,?,?)', (consumer,event['id'],payload))
        if crash: raise RuntimeError('crash before effect commit')
        db.execute('''INSERT INTO projection VALUES(?,?,?)
          ON CONFLICT(consumer,job) DO UPDATE SET total=total+excluded.total''', (consumer,event['job_id'],event['value']))
    return True

def total(db, consumer, job):
    row = db.execute('SELECT total FROM projection WHERE consumer=? AND job=?', (consumer,job)).fetchone()
    return row[0] if row else 0

def retry_decision(attempt, transient, max_attempts=3):
    if type(transient) is not bool: raise ValueError('transient must be a boolean')
    if type(attempt) is not int or attempt < 1 or type(max_attempts) is not int or max_attempts < 1:
        raise ValueError('positive integer attempt limits required')
    if not transient or attempt >= max_attempts: return dict(action='quarantine', delay=0)
    return dict(action='retry', delay=2 ** (attempt-1))

def demo():
    with tempfile.TemporaryDirectory() as folder:
        with closing(connect(Path(folder)/'events.db')) as db:
            event = create_job(db,'j-4','e-17',7)
            first = consume(db,'projection',event)
            duplicate = consume(db,'projection',pending(db)[0])
            mark_sent(db,event['id'])
            return dict(first=first, duplicate_applied=duplicate, total=total(db,'projection','j-4'), pending=len(pending(db)), retry=retry_decision(2,True))

if __name__ == '__main__': print(json.dumps(demo(),indent=2))
