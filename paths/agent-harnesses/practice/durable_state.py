"""Trusted local SQLite checkpoint exercise, not a sandbox or effect transaction."""
import json
import sqlite3

class Conflict(Exception):
    pass

class StateStore:
    def __init__(self, path):
        self.db = sqlite3.connect(path)
        self.db.execute("CREATE TABLE IF NOT EXISTS checkpoints (id TEXT PRIMARY KEY, version INTEGER NOT NULL, schema_version INTEGER NOT NULL, body TEXT NOT NULL)")
        self.db.commit()

    def close(self):
        self.db.close()

    def load(self, run_id):
        row = self.db.execute("SELECT version, schema_version, body FROM checkpoints WHERE id=?", (run_id,)).fetchone()
        if row is None:
            return None
        version, schema, body = row
        if schema != 1:
            raise ValueError("unsupported checkpoint schema")
        return version, json.loads(body)

    def save(self, run_id, expected_version, state):
        if type(run_id) is not str or not run_id or type(state) is not dict:
            raise ValueError("invalid checkpoint")
        if type(expected_version) is not int or expected_version < 0:
            raise ValueError("invalid version")
        body = json.dumps(state, allow_nan=False, sort_keys=True)
        with self.db:
            if expected_version == 0:
                try:
                    self.db.execute("INSERT INTO checkpoints VALUES (?,1,1,?)", (run_id, body))
                except sqlite3.IntegrityError as error:
                    raise Conflict("checkpoint already exists") from error
            else:
                cursor = self.db.execute("UPDATE checkpoints SET version=version+1, body=? WHERE id=? AND version=? AND schema_version=1", (body, run_id, expected_version))
                if cursor.rowcount != 1:
                    raise Conflict("stale or missing checkpoint")
        return expected_version + 1
