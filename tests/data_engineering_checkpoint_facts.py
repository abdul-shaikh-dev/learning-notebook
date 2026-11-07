"""Fact checks for the Data Engineering checkpoint answers.

Each fact runs the course's labs (paths/data-engineering/practice: pipeline_lab.py for the CSV import and
replay, revision_lab.py for revised events) or the standard library they rely on, and returns the text of
the option its result supports. The script fails if that differs from the authored correct option.
Every database and file is temporary. Run with Python 3.14+: python tests/data_engineering_checkpoint_facts.py
"""
from contextlib import closing
from datetime import datetime, timedelta, timezone
from decimal import Decimal
import json
from pathlib import Path
import sqlite3
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / 'paths' / 'data-engineering'
PRACTICE = COURSE / 'practice'
sys.path.insert(0, str(PRACTICE))
import pipeline_lab  # noqa: E402
from pipeline_lab import import_csv, read_batch, reconcile  # noqa: E402
import revision_lab  # noqa: E402

# Answers that follow from the lesson text rather than lab behaviour.
SOURCED = {
    'etl-and-elt/2': 'Extraction, transformation and loading, lesson 2',
    'dag-and-orchestration/2': 'Reconcile before publish, lesson 14',
    'privacy-and-data-governance/2': 'Deletion across data stores, lesson 19',
    'sql-server-bridge/2': 'UTC and unexecuted integration, lesson 20',
    'data-engineering-capstone/2': 'Remaining distributed boundaries, lesson 22',
}
SAMPLE = (PRACTICE / 'sample_orders.csv').read_bytes()
HEADER = 'order_id,customer_id,occurred_at,amount_cents\n'


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


class Folder:
    """A temporary folder for CSV files and a practice database."""
    def __enter__(self):
        self.temp = tempfile.TemporaryDirectory(prefix='de-facts-')
        self.path = Path(self.temp.name)
        self.database = self.path / 'practice.db'
        return self

    def __exit__(self, *error):
        self.temp.cleanup()

    def csv(self, name, content):
        target = self.path / name
        target.write_bytes(content if isinstance(content, bytes) else content.encode('utf-8'))
        return target

    def load(self, name, content, batch):
        return outcome(lambda: import_csv(self.csv(name, content), self.database, batch))

    def query(self, sql):
        with closing(sqlite3.connect(self.database)) as db:
            return db.execute(sql).fetchall()


def rows(*lines):
    return HEADER + ''.join(line + '\n' for line in lines)


def parse(content):
    with Folder() as folder:
        return outcome(lambda: read_batch(folder.csv('batch.csv', content)))


def projection(*events):
    with closing(sqlite3.connect(':memory:')) as db:
        revision_lab.initialize(db)
        results = [outcome(lambda e=e: revision_lab.apply(db, e)) for e in events]
        return results, revision_lab.totals(db)


def grain():
    with Folder() as folder:
        folder.load('sample.csv', SAMPLE, 'sept-01')
        days = reconcile(folder.database)['utc_days']
    return pick(tuple(days), {(('2026-09-01', 2000),): 'One row: 2026-09-01 with 2000 cents'})


def csv_bom():
    return pick(parse(b'\xef\xbb\xbf' + SAMPLE), {'ValueError: exact ordered headers required': 'Raises ValueError: exact ordered headers required'})


def schema_amount():
    return pick(parse(rows('o1,c1,2026-09-01T10:00:00Z,12.50')), {'ValueError: amount contract': 'Raises ValueError: amount contract'})


def quarantine():
    with Folder() as folder:
        folder.load('sample.csv', SAMPLE, 'sept-01')
        result = folder.load('bad.csv', rows('o3,c2,2026-09-02T09:00:00Z,500', 'o4,c2,2026-09-02T10:00:00Z,-5', 'o5,c3,2026-09-02T11:00:00Z,900'), 'sept-02')
        count = reconcile(folder.database)['orders']
    if result != 'ValueError: amount contract':
        raise AssertionError(f'the negative amount was not rejected: {result!r}')
    return pick(count, {2: '2: the whole second batch is rejected before anything is written', 4: '4: the two valid rows are kept'})


def business_day():
    instant = datetime.fromisoformat('2026-09-01T23:30:00+00:00')
    return instant.astimezone(timezone(timedelta(hours=5, minutes=30))).date().isoformat()


def float_money():
    return str(0.10 + 0.20 == 0.30)


def batch_rollback():
    with Folder() as folder:
        folder.load('sample.csv', SAMPLE, 'sept-01')
        result = folder.load('second.csv', rows('o3,c2,2026-09-02T09:00:00Z,500', 'o1,c1,2026-09-01T10:00:00Z,1250'), 'sept-02')
        ids = tuple(reconcile(folder.database)['ids'])
        runs = tuple(r[0] for r in folder.query('SELECT batch_id FROM runs ORDER BY batch_id'))
    if not result.startswith('IntegrityError'):
        raise AssertionError(f'the duplicate order did not fail the batch: {result!r}')
    return pick((ids, runs), {
        (('o1', 'o2'), ('sept-01',)): 'Only o1 and o2: o3 and the sept-02 run marker were rolled back',
        (('o1', 'o2', 'o3'), ('sept-01',)): 'o1, o2 and o3, with no sept-02 marker',
    })


def crlf_replay():
    with Folder() as folder:
        folder.load('sample.csv', SAMPLE, 'sept-01')
        result = folder.load('crlf.csv', SAMPLE.replace(b'\r\n', b'\n').replace(b'\n', b'\r\n'), 'sept-01')
    return pick(result, {'ValueError: batch identity conflicts with payload': 'ValueError: batch identity conflicts with payload', 'replay': 'replay, because the orders are the same'})


def missed_row():
    with closing(sqlite3.connect(':memory:')) as db:
        db.execute('CREATE TABLE source(id TEXT, occurred_at TEXT)')
        db.executemany('INSERT INTO source VALUES (?,?)', [('o1', '10:00'), ('o2', '10:05')])
        watermark = db.execute('SELECT MAX(occurred_at) FROM source').fetchone()[0]
        db.execute("INSERT INTO source VALUES ('o3', '09:59')")  # inserted after the extract, describing an earlier event
        found = [r[0] for r in db.execute('SELECT id FROM source WHERE occurred_at > ? ORDER BY occurred_at', (watermark,))]
    return pick((watermark, 'o3' in found), {('10:05', False): 'No, not in this or any later run'})


def tombstone():
    results, totals = projection(revision_lab.event(1), revision_lab.event(2, 150), revision_lab.event(3, 0, deleted=True))
    if results != ['applied'] * 3:
        raise AssertionError(f'unexpected results {results!r}')
    return pick(json.dumps(totals), {'{}': "{}: the day has no live orders", '{"2026-09-28": 0}': "{'2026-09-28': 0}"})


def join_fanout():
    with closing(sqlite3.connect(':memory:')) as db:
        db.execute('CREATE TABLE orders(order_id TEXT, customer_id TEXT, amount_cents INTEGER)')
        db.execute('CREATE TABLE customers(customer_id TEXT, region TEXT)')
        db.executemany('INSERT INTO orders VALUES (?,?,?)', [('o1', 'c1', 1250), ('o2', 'c1', 750)])
        db.executemany('INSERT INTO customers VALUES (?,?)', [('c1', 'North')] * 3)
        total = db.execute('SELECT SUM(o.amount_cents) FROM orders AS o JOIN customers AS c ON c.customer_id = o.customer_id').fetchone()[0]
    return str(total)


def closed_intervals():
    with closing(sqlite3.connect(':memory:')) as db:
        db.execute('CREATE TABLE versions(region TEXT, start TEXT, finish TEXT)')
        db.executemany('INSERT INTO versions VALUES (?,?,?)', [('North', '2026-09-01', '2026-09-10'), ('South', '2026-09-10', '9999-12-31')])
        matches = db.execute("SELECT COUNT(*) FROM versions WHERE '2026-09-10' BETWEEN start AND finish").fetchone()[0]
        half_open = db.execute("SELECT COUNT(*) FROM versions WHERE start <= '2026-09-10' AND '2026-09-10' < finish").fetchone()[0]
    if half_open != 1:
        raise AssertionError('half-open intervals should match one version')
    return str(matches)


def recompute():
    results, totals = projection(revision_lab.event(1), revision_lab.event(2, 150))
    return pick(json.dumps(totals), {'{"2026-09-28": 150}': "{'2026-09-28': 150}", '{"2026-09-28": 250}': "{'2026-09-28': 250}"})


def byte_limit():
    oversized = b'\xff' * (300 * 1024)  # 0xff never appears in valid UTF-8
    return pick(parse(oversized), {'ValueError: batch exceeds byte limit': 'ValueError: batch exceeds byte limit'})


def added_column():
    content = 'order_id,customer_id,occurred_at,amount_cents,currency\no1,c1,2026-09-01T10:00:00Z,1250,EUR\n'
    return pick(parse(content), {'ValueError: exact ordered headers required': 'Raises ValueError: exact ordered headers required'})


def reordered_rows():
    header, first_row, second_row = SAMPLE.decode('utf-8').splitlines()
    reordered = '\n'.join([header, second_row, first_row, '']).encode('utf-8')
    with Folder() as first, Folder() as second:
        _, original = read_batch(first.csv('a.csv', SAMPLE))
        _, changed = read_batch(second.csv('b.csv', reordered))
        first.load('a.csv', SAMPLE, 'sept-01'); second.load('b.csv', reordered, 'sept-01')
        a, b = reconcile(first.database), reconcile(second.database)
    same = (a['orders'], a['ids'], a['total_cents']) == (b['orders'], b['ids'], b['total_cents']) == (2, ['o1', 'o2'], 2000)
    return pick((original != changed, same), {(True, True): 'The fingerprint differs; the orders, IDs and 2000-cent total are the same'})


def repeated_conflict():
    with Folder() as folder:
        folder.load('sample.csv', SAMPLE, 'sept-01')
        changed = rows('o1,c1,2026-09-01T10:00:00Z,1250', 'o2,c1,2026-09-01T11:00:00Z,800')
        results = {folder.load('changed.csv', changed, 'sept-01') for _ in range(4)}
        total = reconcile(folder.database)['total_cents']
    return pick((tuple(results), total), {(('ValueError: batch identity conflicts with payload',), 2000): 'The same conflict every time, with no rows written'})


def foundation_identifier():
    return pick(parse(rows('o 1,c1,2026-09-01T10:00:00Z,1250')), {'ValueError: identifier contract': 'Raises ValueError: identifier contract'})


def foundation_offset():
    return pick(parse(rows('o1,c1,2026-09-01T10:00:00+00:00,1250')), {'ValueError: UTC seconds timestamp required': 'Raises ValueError: UTC seconds timestamp required'})


def foundation_extra_value():
    return pick(parse(rows('o1,c1,2026-09-01T10:00:00Z,1250,extra')), {'ValueError: row field count': 'Raises ValueError: row field count'})


def intermediate_stale():
    results, totals = projection(revision_lab.event(1), revision_lab.event(2, 150), revision_lab.event(1))
    return pick((results[-1], json.dumps(totals)), {('stale', '{"2026-09-28": 150}'): "'stale', and the total is unchanged"})


def intermediate_conflict():
    results, _ = projection(revision_lab.event(1), revision_lab.event(2, 150), revision_lab.event(2, 175))
    return pick(results[-1], {'ValueError: conflicting revision': 'Raises ValueError: conflicting revision', 'replay': "Returns 'replay'"})


def intermediate_move():
    _, totals = projection(revision_lab.event(1, 100, day='2026-09-28'), revision_lab.event(2, 100, day='2026-09-29'))
    return pick(json.dumps(totals), {'{"2026-09-29": 100}': "{'2026-09-29': 100}"})


def advanced_new_batch_id():
    with Folder() as folder:
        folder.load('sample.csv', SAMPLE, 'sept-01')
        result = folder.load('sample.csv', SAMPLE, 'sept-01-retry')
        runs = [r[0] for r in folder.query('SELECT batch_id FROM runs')]
    return pick((result.split(':')[0], tuple(runs)), {
        ('IntegrityError', ('sept-01',)): 'It fails on the duplicate order IDs, and no sept-01-retry run is recorded',
        ('replay', ('sept-01',)): 'replay',
    })


def advanced_days():
    with Folder() as folder:
        result = folder.load('late.csv', rows('o1,c1,2026-09-01T23:30:00Z,500', 'o2,c1,2026-09-02T00:30:00Z,700'), 'late-01')
        if result != 'committed':
            raise AssertionError(f'the batch did not commit: {result!r}')
        return str(len(reconcile(folder.database)['utc_days']))


def advanced_decimal():
    return str(Decimal('0.10') + Decimal('0.20') == Decimal('0.30'))


FACTS = {
    'data-products-and-grain/2': grain, 'csv-and-encoding/2': csv_bom, 'schema-and-contracts/2': schema_amount,
    'validation-and-quarantine/2': quarantine, 'time-and-business-days/2': business_day,
    'money-and-numeric-precision/2': float_money, 'batch-loading/2': batch_rollback,
    'idempotency-and-replay/2': crlf_replay, 'incremental-watermarks/2': missed_row, 'cdc-and-deletions/2': tombstone,
    'joins-and-dimensional-models/2': join_fanout, 'slowly-changing-dimensions/2': closed_intervals,
    'late-data-and-windows/2': recompute, 'partitioning-and-formats/2': byte_limit, 'schema-evolution/2': added_column,
    'reconciliation-and-lineage/2': reordered_rows, 'failure-recovery/2': repeated_conflict,
    'stage/foundation/1': foundation_identifier, 'stage/foundation/2': foundation_offset,
    'stage/foundation/3': foundation_extra_value,
    'stage/intermediate/1': intermediate_stale, 'stage/intermediate/2': intermediate_conflict,
    'stage/intermediate/3': intermediate_move,
    'stage/advanced/1': advanced_new_batch_id, 'stage/advanced/2': advanced_days, 'stage/advanced/3': advanced_decimal,
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
    if pipeline_lab.MAX_BYTES != 262144:
        sys.exit('pipeline_lab.MAX_BYTES changed; review the byte-limit question')
    seen, failures = set(), []
    for key, q in questions():
        seen.add(key)
        if key in SOURCED:
            continue
        if key not in FACTS:
            failures.append(f'{key}: no fact check and no cited source'); continue
        try:
            answer = FACTS[key]()
        except Exception as error:  # report every failing fact, not just the first
            failures.append(f'{key}: {error}'); continue
        if answer != q['options'][q['correct']]:
            failures.append(f'{key}: the lab supports {answer!r}, the question marks {q["options"][q["correct"]]!r}')
    failures += [f'{key}: fact has no question' for key in set(FACTS) | set(SOURCED) if key not in seen]
    if failures:
        sys.exit('Data Engineering checkpoint facts failed:\n' + '\n'.join(failures))
    print(f'PASS: {len(FACTS)} Data Engineering checkpoint answers checked against the course labs; {len(SOURCED)} cited from the lessons.')


if __name__ == '__main__':
    main()
