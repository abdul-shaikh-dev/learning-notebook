"""Local SQLite booking, idempotency and outbox exercise; no external effects."""
import json
import sqlite3
from contextlib import closing


def connect(path):
    db = sqlite3.connect(path, timeout=5)
    db.execute('PRAGMA busy_timeout=5000')
    db.execute('PRAGMA foreign_keys=ON')
    return db


def initialize(path, seats=1):
    if type(seats) is not int or seats < 0:
        raise ValueError('seats must be a nonnegative integer')
    with closing(connect(path)) as db, db:
        db.executescript("""
            CREATE TABLE IF NOT EXISTS workshop (id TEXT PRIMARY KEY, remaining INTEGER NOT NULL CHECK(remaining >= 0));
            CREATE TABLE IF NOT EXISTS booking (id INTEGER PRIMARY KEY, workshop_id TEXT NOT NULL REFERENCES workshop(id), learner TEXT NOT NULL, UNIQUE(workshop_id, learner));
            CREATE TABLE IF NOT EXISTS intent (learner TEXT NOT NULL, operation TEXT NOT NULL, key TEXT NOT NULL, workshop_id TEXT NOT NULL, booking_id INTEGER NOT NULL REFERENCES booking(id), PRIMARY KEY(learner,operation,key));
            CREATE TABLE IF NOT EXISTS outbox (id INTEGER PRIMARY KEY, booking_id INTEGER NOT NULL UNIQUE REFERENCES booking(id), payload TEXT NOT NULL, sent INTEGER NOT NULL DEFAULT 0);
        """)
        db.execute('INSERT OR IGNORE INTO workshop VALUES (?,?)', ('W', seats))


def book(path, learner, key, workshop_id='W', fail_after_decrement=False):
    if any(type(x) is not str or not x for x in (learner, key, workshop_id)):
        raise ValueError('learner, key and workshop are required')
    db = connect(path)
    try:
        db.execute('BEGIN IMMEDIATE')  # serialize competing SQLite writers
        existing = db.execute('SELECT workshop_id, booking_id FROM intent WHERE learner=? AND operation=? AND key=?',
                              (learner, 'reserve', key)).fetchone()
        if existing:
            if existing[0] != workshop_id:
                raise ValueError('key reused for different workshop')
            db.commit()
            return existing[1], True
        updated = db.execute('UPDATE workshop SET remaining=remaining-1 WHERE id=? AND remaining>0',
                             (workshop_id,))
        if updated.rowcount != 1:
            raise ValueError('sold out or unknown workshop')
        if fail_after_decrement:
            raise RuntimeError('injected failure between writes')
        booking_id = db.execute('INSERT INTO booking(workshop_id,learner) VALUES (?,?)',
                                (workshop_id, learner)).lastrowid
        db.execute('INSERT INTO intent VALUES (?,?,?,?,?)', (learner, 'reserve', key, workshop_id, booking_id))
        db.execute('INSERT INTO outbox(booking_id,payload) VALUES (?,?)',
                   (booking_id, json.dumps({'booking_id': booking_id, 'workshop_id': workshop_id})))
        db.commit()
        return booking_id, False
    except BaseException:
        db.rollback()
        raise
    finally:
        db.close()


def relay_one(path, publish, crash_after_publish=False):
    """Publish one pending event; a crash can cause repeat delivery on restart."""
    db = connect(path)
    try:
        row = db.execute('SELECT id,payload FROM outbox WHERE sent=0 ORDER BY id LIMIT 1').fetchone()
        if row is None:
            return None
        event_id, payload = row
        publish(event_id, json.loads(payload))
        if crash_after_publish:
            raise RuntimeError('relay crashed after publish')
        with db:
            db.execute('UPDATE outbox SET sent=1 WHERE id=?', (event_id,))
        return event_id
    finally:
        db.close()
