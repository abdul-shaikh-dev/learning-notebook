"""Execute expand/backfill/contract against an isolated real SQLite database."""
import sqlite3
import tempfile
from pathlib import Path


def old_reader(db):
    return db.execute('SELECT title FROM notes ORDER BY id').fetchall()


def new_reader(db):
    return db.execute('SELECT COALESCE(label, title) FROM notes ORDER BY id').fetchall()


def drill():
    with tempfile.TemporaryDirectory(prefix='notebook-schema-') as folder:
        with sqlite3.connect(Path(folder) / 'notes.db') as db:
            db.execute('CREATE TABLE notes(id INTEGER PRIMARY KEY, title TEXT NOT NULL)')
            db.execute("INSERT INTO notes(title) VALUES ('first')")
            db.execute('ALTER TABLE notes ADD COLUMN label TEXT')
            assert old_reader(db) == new_reader(db) == [('first',)]
            db.execute('UPDATE notes SET label=title WHERE label IS NULL')
            # An old writer can still run after the first backfill.
            db.execute("INSERT INTO notes(title) VALUES ('late old write')")
            assert db.execute('SELECT COUNT(*) FROM notes WHERE label IS NULL').fetchone()[0] == 1
            assert new_reader(db) == [('first',), ('late old write',)]
            # New writers dual-write while old readers remain.
            db.execute('INSERT INTO notes(title,label) VALUES (?,?)', ('new write', 'new write'))
            assert old_reader(db) == new_reader(db)
            db.commit()
            # In this single-process lab no old writer remains. A deployment needs evidence.
            db.execute('UPDATE notes SET label=title WHERE label IS NULL')
            expected = new_reader(db)
            db.execute('ALTER TABLE notes DROP COLUMN title')
            assert db.execute('SELECT label FROM notes ORDER BY id').fetchall() == expected
            try:
                old_reader(db)
            except sqlite3.OperationalError as error:
                assert 'no such column' in str(error)
            else:
                raise AssertionError('old reader unexpectedly survived contraction')
            assert db.execute('PRAGMA integrity_check').fetchone() == ('ok',)
        # Closing the real connection before TemporaryDirectory cleanup matters on Windows.
        db.close()
    print('PASS: mixed readers, late old write, dual write, backfill, old-reader failure after DROP')


if __name__ == '__main__':
    if sqlite3.sqlite_version_info < (3, 35, 0):
        raise SystemExit('SQLite 3.35+ is required for DROP COLUMN')
    drill()
