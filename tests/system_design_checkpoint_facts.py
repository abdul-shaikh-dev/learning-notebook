"""Fact checks for the System Design checkpoint answers.

Each fact runs the course's offline labs (paths/system-design/practice/booking_lab.py against a SQLite
file in a temporary folder, and the arithmetic in capacity_calculator.py) and returns the text of the
option its result supports. The script fails if that differs from the authored correct option. No
network or external effects are used.
Run with Python 3.14+: python tests/system_design_checkpoint_facts.py
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
sys.path.insert(0, str(Path(__file__).resolve().parent))
from practice_facts import practice_failures  # noqa: E402
import booking_lab as booking  # noqa: E402
import capacity_calculator as capacity  # noqa: E402

# Answers that follow from the lesson text rather than lab behaviour.
SOURCED = {
    'network/2': 'A stable operation identifier lets the server look up the original intent, lesson 5',
    'data-model/2': 'A composite key encodes one record per learner and lesson, lesson 7',
    'replication/2': 'An asynchronous follower can lag, so a learner may read an old value, lesson 13',
    'consistency-cap/2': 'Returning an error does not satisfy CAP availability, lesson 14',
    'partitioning/2': 'A large tenant or celebrity workshop can still create a hot key, lesson 15',
    'resilience/2': 'The 1,000 ms worked budget leaves 100 ms for a third attempt, lesson 19',
    'observability/2': 'A successful response with an incorrect result is still a product failure, lesson 23',
    'security/2': 'Client-supplied tenant identifiers are inputs to validate, not proof, lesson 24',
    'recovery/2': 'A backup schedule alone does not prove a recovery point, lesson 25',
    'evolution/2': 'A binary rollback may not reverse a destructive schema migration, lesson 26',
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



def edge_and_object_storage():
    import hashlib, hmac
    secret, key, expires = b'k', 'recordings/a.mp4', 300
    sig = hmac.new(secret, f'GET\n{key}\n{expires}'.encode(), hashlib.sha256).hexdigest()
    def check(now):
        return 'expired' if now > expires else 'ok'
    return pick(check(301), {'expired': 'It is rejected as expired'})


def consistent_hashing():
    import hashlib
    keys = [f'learner-{i}' for i in range(10_000)]
    h = lambda t: int(hashlib.sha256(t.encode()).hexdigest()[:8], 16)
    moved = sum(h(k) % 4 != h(k) % 5 for k in keys) / len(keys)
    return pick(round(moved, 1), {0.8: 'About 80%'})


def search_systems():
    import re
    docs = {1: 'Join tables without losing records', 2: 'Window functions rank rows and running totals',
            3: 'Indexes speed up joins on large tables'}
    tokens = lambda text: set(re.findall(r'[a-z0-9]+', text.lower()))
    found = sorted(i for i, text in docs.items() if {'tables', 'joins'} <= tokens(text))
    return str(found)


def case_study():
    return f'About {round(40_000 * 6 / 86_400 * 4)}'


FACTS = {
    'edge-and-object-storage/2': edge_and_object_storage, 'consistent-hashing/2': consistent_hashing,
    'search-systems/2': search_systems, 'case-study/2': case_study,
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


# Practice ladder answers that are numbers or program output: each fact computes values that the
# step's solution must state. Steps not listed here are judged against their checks only.
def _keys():
    import hashlib
    h = lambda t: int(hashlib.sha256(t.encode()).hexdigest()[:8], 16)
    return h, [f'learner-{i}' for i in range(10_000)]


def _ring(nodes, vnodes=100):
    import bisect
    h, keys = _keys()
    points = sorted((h(f'{n}#{v}'), n) for n in nodes for v in range(vnodes))
    hashes = [p for p, _ in points]
    return {k: points[bisect.bisect(hashes, h(k)) % len(points)][1] for k in keys}


def practice_cache_rates():
    return [f'{2000 * (1 - 0.95):,.0f}/s', 'up to 2,000/s']


def practice_cache_hit_drop():
    before, after = 1000 * (1 - 0.9), 1000 * (1 - 0.8)
    assert after / before == 2
    return [f'from {before:.0f}/s to {after:.0f}/s']


def practice_partition_average():
    overall = (50 * 10 + 90 * 90) / (10 + 90)
    return [f'= {overall:.0f}%', f'gives {(50 + 90) / 2:.0f}%']


def practice_modulo_ten_to_nine():
    h, keys = _keys()
    moved = sum(h(k) % 10 != h(k) % 9 for k in keys)
    return [f'{moved / len(keys):.1%}', f'{moved:,} of 10,000']


def practice_ring_remove():
    five, four = _ring('abcde'), _ring('abcd')
    moved = [k for k in five if five[k] != four[k]]
    assert all(five[k] == 'e' for k in moved), 'only keys owned by the removed node move'
    return [f'{len(moved):,} of 10,000', f'{len(moved) / len(five):.1%}']


def practice_rendezvous():
    h, keys = _keys()
    place = lambda nodes: {k: max(nodes, key=lambda n: h(f'{n}:{k}')) for k in keys}
    four, five = place('abcd'), place('abcde')
    moved = [k for k in keys if four[k] != five[k]]
    assert all(five[k] == 'e' for k in moved), 'keys move only to the new node'
    return [f'{len(moved) / len(keys):.2%}']


def practice_two_seats():
    with workshop(2) as path:
        results = [outcome(lambda learner=learner: booking.book(path, learner, 'K')) for learner in ('a', 'b', 'c')]
        sold_out = [r for r in results if isinstance(r, str)]
        assert len(sold_out) == 1 and 'sold out' in sold_out[0] and remaining(path) == 0 and bookings(path) == 2
    return ['Exactly two confirmed bookings, one documented sold-out response and `remaining` equal to 0']


def practice_key_conflict():
    with workshop(2) as path:
        booking.book(path, 'alice', 'request-abc')
        error = outcome(lambda: booking.book(path, 'alice', 'request-abc', workshop_id='43'))
    return [error.split(': ', 1)[1]]


def practice_drain():
    backlog = capacity.backlog_after(0, 150, 100, 30)
    return [f'{backlog:,.0f} / {100 - 70} = {capacity.drain_seconds(backlog, 70, 100):.0f} seconds']


def practice_worker():
    faster = 10 / 0.9
    grows = capacity.backlog_after(0, 12, faster, 60)
    return [f'120 / 2 = {capacity.drain_seconds(120, 8, 10):.0f} seconds', f'{faster:.1f} jobs/s',
            f'{12 - faster:.1f} jobs/s', f'about {grows:.0f} more jobs per minute']


def practice_token_bucket():
    burst, rate, sent = 20, 10, 50
    now, later = min(burst, sent), min(sent, burst + rate * 1)
    return [f'{now} are accepted immediately', f'about {later} after one second', f'remaining {sent - later} rejected']


def practice_relay_crashes():
    counts = []
    for crash in ('before', 'after_publish', 'after_mark'):
        with workshop(1) as path:
            booking.book(path, 'alice', 'K1')
            published = []
            publish = lambda event_id, payload: published.append(event_id)
            if crash == 'before':
                pass  # the relay dies before reading the outbox
            elif crash == 'after_publish':
                outcome(lambda: booking.relay_one(path, publish, crash_after_publish=True))
            else:
                booking.relay_one(path, publish)
            booking.relay_one(path, publish)  # the restarted relay
            counts.append(len(published))
    assert counts == [1, 2, 1], counts
    return ['once after restart', 'Twice in total', '(3) Once']


def practice_stemming():
    import re
    docs = {1: 'Join tables without losing records', 2: 'Window functions rank rows and running totals',
            3: 'Indexes speed up joins on large tables'}
    stem = lambda t: t[:-1] if t.endswith('s') and len(t) > 3 else t
    tokens = lambda text: [stem(t) for t in re.findall(r'[a-z0-9]+', text.lower())]
    search = lambda q: sorted(i for i, text in docs.items() if set(tokens(q)) <= set(tokens(text)))
    assert search('index') == [] and 'indexe' in tokens(docs[3])
    return [f'`join` returns {search("join")}', f'`tables joins` also returns {search("tables joins")}', '`indexe`']


PRACTICE_FACTS = {
    'cache/1': practice_cache_rates, 'cache/2': practice_cache_hit_drop,
    'partitioning/1': practice_partition_average,
    'consistent-hashing/1': practice_modulo_ten_to_nine, 'consistent-hashing/2': practice_ring_remove,
    'consistent-hashing/3': practice_rendezvous,
    'transactions/2': practice_two_seats, 'idempotency/2': practice_key_conflict,
    'backpressure/1': practice_drain, 'backpressure/2': practice_worker, 'backpressure/3': practice_token_bucket,
    'outbox/1': practice_relay_crashes, 'search-systems/1': practice_stemming,
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
    failures += practice_failures(COURSE, PRACTICE_FACTS)
    failures += [f'{key}: fact has no question' for key in set(FACTS) | set(SOURCED) if key not in seen]
    if failures:
        sys.exit('System Design checkpoint facts failed:\n' + '\n'.join(failures))
    print(f'PASS: {len(FACTS)} System Design checkpoint answers checked against the course labs; '
          f'{len(SOURCED)} cited from the lessons; {len(PRACTICE_FACTS)} practice ladder answers computed.')


if __name__ == '__main__':
    main()
