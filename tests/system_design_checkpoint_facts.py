"""Fact checks for the System Design checkpoint answers.

Each fact runs the course's offline labs (paths/system-design/practice/booking_lab.py against a SQLite
file in a temporary folder, and the arithmetic in capacity_calculator.py) and returns the text of the
option its result supports. The script fails if that differs from the authored correct option. No
network or external effects are used.
Run with Python 3.11+: python tests/system_design_checkpoint_facts.py
"""
from contextlib import closing, contextmanager
import json
from pathlib import Path
import sys
from tempfile import TemporaryDirectory

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / 'paths' / 'system-design'
sys.path.insert(0, str(COURSE / 'practice'))
import booking_lab as booking  # noqa: E402
import capacity_calculator as capacity  # noqa: E402

# Answers that follow from the lesson text rather than lab behaviour.
SOURCED = {
    'network/2': 'A stable operation identifier lets the server look up the original intent, lesson 5',
    'data-model/2': 'A composite key encodes one record per learner and lesson, lesson 7',
    'replication/2': 'An asynchronous follower can lag, so a learner may read an old value, lesson 12',
    'consistency-cap/2': 'Returning an error does not satisfy CAP availability, lesson 13',
    'partitioning/2': 'A large tenant or celebrity workshop can still create a hot key, lesson 14',
    'resilience/2': 'The 1,000 ms worked budget leaves 100 ms for a third attempt, lesson 17',
    'observability/2': 'A successful response with an incorrect result is still a product failure, lesson 20',
    'security/2': 'Client-supplied tenant identifiers are inputs to validate, not proof, lesson 21',
    'recovery/2': 'A backup schedule alone does not prove a recovery point, lesson 22',
    'evolution/2': 'A binary rollback may not reverse a destructive schema migration, lesson 23',
}


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


def raises(action):
    return 'Raises ' + outcome(action)


def number(value):
    return f'{round(value, 9):g}'


@contextmanager
def workshop(seats=1):
    with TemporaryDirectory(ignore_cleanup_errors=True) as folder:
        path = str(Path(folder) / 'booking.db')
        booking.initialize(path, seats)
        yield path


def query(path, sql):
    with closing(booking.connect(path)) as db:
        return db.execute(sql).fetchall()


def remaining(path):
    return query(path, "SELECT remaining FROM workshop WHERE id='W'")[0][0]


def bookings(path):
    return query(path, 'SELECT count(*) FROM booking')[0][0]


def requirements():
    with TemporaryDirectory(ignore_cleanup_errors=True) as folder:
        return raises(lambda: booking.initialize(str(Path(folder) / 'booking.db'), seats=-1))


def slos():
    return number(capacity.allowed_bad_requests(1000000, 0.999))


def workload():
    return f'{capacity.workload(10000, 40, 8, 2000).peak_rps:.0f}'


def latency():
    return number(capacity.mean_in_flight(200, 0.25))


def api_contracts():
    with workshop(2) as path:
        booking.book(path, 'alice', 'K1')
        return raises(lambda: booking.book(path, 'alice', 'K1', workshop_id='X'))


def indexes_storage():
    result = capacity.retained_bytes(200000, 500, 30, 1.5, 3)
    return f"{number(result['raw_bytes'] / 1e9)} GB raw, {number(result['modeled_bytes'] / 1e9)} GB modeled"


def scaling():
    return str(capacity.instance_count(370, 100, 0.7, 1))


def cache():
    with workshop(1) as path:
        booking.book(path, 'alice', 'K1')
        stale_display = 1  # the cache still says one seat is left
        assert stale_display == 1 and remaining(path) == 0
        return raises(lambda: booking.book(path, 'bob', 'K2'))


def queues():
    with workshop(1) as path:
        booking.book(path, 'alice', 'K1')
        published = []
        crash = outcome(lambda: booking.relay_one(path, lambda event_id, payload: published.append(event_id),
                                                  crash_after_publish=True))
        assert crash.startswith('RuntimeError')
        booking.relay_one(path, lambda event_id, payload: published.append(event_id))
        return pick(tuple(published), {(1, 1): '1 twice', (1,): '1 once', (): 'None'})


def transactions():
    with workshop(1) as path:
        error = outcome(lambda: booking.book(path, 'alice', 'K1', fail_after_decrement=True))
        return pick((error.split(':')[0], remaining(path), bookings(path)),
                    {('RuntimeError', 1, 0): '1 seat, with no booking', ('RuntimeError', 0, 0): '0 seats, with no booking'})


def idempotency():
    with workshop(2) as path:
        first, second = booking.book(path, 'alice', 'K1'), booking.book(path, 'alice', 'K1')
        return pick((first[0] == second[0], first[1], second[1], remaining(path)),
                    {(True, False, True, 1): 'The same booking ID both times, the second marked as a replay; 1 seat left'})


def backpressure():
    return number(capacity.backlog_after(0, 120, 100, 60))


def outbox():
    with workshop(1) as path:
        booking.book(path, 'alice', 'K1')
        rows = query(path, 'SELECT sent FROM outbox')
        return pick(tuple(r[0] for r in rows), {(0,): 'One row, with sent 0 until the relay runs',
                                                (): 'Nothing until the relay runs', (1,): 'One row, already marked sent'})


def design_review():
    return pick(capacity.drain_seconds(1200, 100, 100), {None: 'None: the backlog never drains'})


def foundation_peak():
    return raises(lambda: capacity.workload(1000, 10, 0.5, 100))


def foundation_target():
    return raises(lambda: capacity.allowed_bad_requests(1000, 1.5))


def foundation_overhead():
    return raises(lambda: capacity.retained_bytes(1000, 100, 30, 0.5))


def intermediate_two_keys():
    with workshop(2) as path:
        booking.book(path, 'alice', 'K1')
        error = outcome(lambda: booking.book(path, 'alice', 'K2'))
        return pick((error.split(':')[0], remaining(path)),
                    {('IntegrityError', 1): 'sqlite3.IntegrityError, and 1 seat remains'})


def intermediate_not_banked():
    return number(capacity.backlog_after(500, 80, 100, 60))


def intermediate_average():
    return number(capacity.workload(8640, 10, 1, 0).average_rps)


def advanced_empty_drain():
    return number(capacity.drain_seconds(0, 120, 100))


def advanced_relayed():
    with workshop(1) as path:
        booking.book(path, 'alice', 'K1')
        sent = booking.relay_one(path, lambda event_id, payload: None)
        assert sent == 1
        return str(booking.relay_one(path, lambda event_id, payload: None))


def advanced_unknown_workshop():
    with workshop(1) as path:
        error = raises(lambda: booking.book(path, 'alice', 'K1', workshop_id='X'))
        assert bookings(path) == 0 and remaining(path) == 1
        return error


FACTS = {
    'requirements/2': requirements, 'slos/2': slos, 'workload/2': workload, 'latency/2': latency,
    'api-contracts/2': api_contracts, 'indexes-storage/2': indexes_storage, 'scaling/2': scaling,
    'cache/2': cache, 'queues/2': queues, 'transactions/2': transactions, 'idempotency/2': idempotency,
    'backpressure/2': backpressure, 'outbox/2': outbox, 'design-review/2': design_review,
    'stage/foundation/1': foundation_peak, 'stage/foundation/2': foundation_target,
    'stage/foundation/3': foundation_overhead,
    'stage/intermediate/1': intermediate_two_keys, 'stage/intermediate/2': intermediate_not_banked,
    'stage/intermediate/3': intermediate_average,
    'stage/advanced/1': advanced_empty_drain, 'stage/advanced/2': advanced_relayed,
    'stage/advanced/3': advanced_unknown_workshop,
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
            answer = FACTS[key]()
        except Exception as error:  # report every failing fact, not just the first
            failures.append(f'{key}: {error}')
            continue
        if answer != q['options'][q['correct']]:
            failures.append(f'{key}: the lab supports {answer!r}, the question marks {q["options"][q["correct"]]!r}')
    failures += [f'{key}: fact has no question' for key in set(FACTS) | set(SOURCED) if key not in seen]
    if failures:
        sys.exit('System Design checkpoint facts failed:\n' + '\n'.join(failures))
    print(f'PASS: {len(FACTS)} System Design checkpoint answers checked against the course labs; '
          f'{len(SOURCED)} cited from the lessons.')


if __name__ == '__main__':
    main()
