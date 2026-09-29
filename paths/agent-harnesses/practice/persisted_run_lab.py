"""Single-host SQLite effect/receipt plus persisted Harness checkpoint exercise."""
import json
import sqlite3

from durable_state import StateStore
from harness_workshop import Harness, IntentConflict, MissingResource, UncertainOutcome


class SQLiteEffects:
    def __init__(self, path, lessons=None):
        self.db = sqlite3.connect(path)
        self.db.execute('PRAGMA foreign_keys=ON')
        self.db.executescript("""
            CREATE TABLE IF NOT EXISTS lab_note (id INTEGER PRIMARY KEY, subject TEXT NOT NULL, lesson_id TEXT NOT NULL, body TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS lab_receipt (subject TEXT NOT NULL, run_id TEXT NOT NULL, call_id TEXT NOT NULL, fingerprint TEXT NOT NULL, note_id TEXT NOT NULL, PRIMARY KEY(subject,run_id,call_id));
        """)
        self.lessons = {'L1': 'Indexes trade read speed for write work.'} if lessons is None else dict(lessons)
        self.lose_reply_once = False

    def close(self):
        self.db.close()

    def read(self, lesson_id):
        if lesson_id not in self.lessons:
            raise ValueError('missing lesson')
        return {'lesson_id': lesson_id, 'text': self.lessons[lesson_id], 'truncated': False}

    def lookup(self, key, fingerprint):
        row = self.db.execute('SELECT fingerprint,note_id FROM lab_receipt WHERE subject=? AND run_id=? AND call_id=?', key).fetchone()
        if row is None:
            return None
        if row[0] != fingerprint:
            raise IntentConflict('operation ID changed intent')
        return {'fingerprint': row[0], 'note_id': row[1]}

    def save(self, key, fingerprint, subject, args):
        with self.db:
            existing = self.lookup(key, fingerprint)
            if existing is not None:
                return existing
            if args['lesson_id'] not in self.lessons:
                raise MissingResource('lesson absent')
            row_id = self.db.execute('INSERT INTO lab_note(subject,lesson_id,body) VALUES (?,?,?)',
                                     (subject, args['lesson_id'], args['text'])).lastrowid
            receipt = {'fingerprint': fingerprint, 'note_id': f'N{row_id}'}
            self.db.execute('INSERT INTO lab_receipt VALUES (?,?,?,?,?)', (*key, fingerprint, receipt['note_id']))
        if self.lose_reply_once:
            self.lose_reply_once = False
            raise UncertainOutcome('reply lost after SQLite commit')
        return receipt

    def effect_count(self):
        return self.db.execute('SELECT count(*) FROM lab_note').fetchone()[0]


def save_checkpoint(state_store, run, expected_version):
    return state_store.save(run.run_id, expected_version, {'snapshot': run.checkpoint()})


def restore_checkpoint(state_store, effects, script, *, run_id, subject):
    loaded = state_store.load(run_id)
    if loaded is None:
        raise ValueError('missing persisted run')
    version, state = loaded
    snapshot = json.loads(state['snapshot'])
    if snapshot['status'] == 'waiting':
        # A process may die after effect commit but before saving uncertain state.
        probe = Harness.restore(state['snapshot'], script, effects,
                                expected_run_id=run_id, subject=subject)
        action = probe.pending
        if effects.lookup(probe._key(action), probe.fingerprint(action)) is not None:
            snapshot['status'] = 'uncertain'
            state['snapshot'] = json.dumps(snapshot)
            version = state_store.save(run_id, version, state)
    run = Harness.restore(state['snapshot'], script, effects,
                          expected_run_id=run_id, subject=subject)
    return version, run
