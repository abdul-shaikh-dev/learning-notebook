"""Fact checks for the Messaging & Event-Driven Systems checkpoint answers.

Each fact runs the course's SQLite outbox/inbox lab (paths/messaging-events/practice/event_lab.py) or the
course's arithmetic and returns the text of the option its result supports. The script fails if that
differs from the authored correct option. No broker or network is used.
Run with Python 3.14+: python tests/messaging_checkpoint_facts.py
"""
from contextlib import closing
import json
from pathlib import Path
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / 'paths' / 'messaging-events'
sys.path.insert(0, str(COURSE / 'practice'))
sys.path.insert(0, str(Path(__file__).resolve().parent))
from practice_facts import practice_failures  # noqa: E402
from event_lab import connect, consume, create_job, mark_sent, pending, retry_decision, total, validate  # noqa: E402

# Answers that follow from the lesson text rather than lab behaviour.
SOURCED = {
    'cqrs/2': 'A query that requires the command position reports a stale projection, lesson 18',
    'azure-service-bus/2': 'Duplicate detection covers repeated sends, not redelivery after a lock expires, lesson 24',
    'messages-events/2': 'Commands, events and completion, lesson 1',
    'topologies/2': 'Worker and subscriber counts, lesson 2',
    'delivery-semantics/2': 'Atomic SQLite effects, lesson 5',
    'ordering/2': 'Last-value versus ledger projections, lesson 13',
    'stream-replay/2': 'Partition offsets and retention, lesson 16',
    'sagas/2': 'Reconciling uncertain charges, lesson 19',
    'security/2': 'Channel rights and trusted tenancy, lesson 20',
    'broker-choice/2': 'Broker capabilities and operations, lesson 23',
    'launch-review/2': 'Recovery across durable stores, lesson 25',
}
IDENTIFIER = 'ValueError: identifier must be 1-128 characters without surrounding whitespace: '


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


def event(**changes):
    return {'id': 'e-17', 'job_id': 'j-4', 'type': 'ExportRequested', 'version': 1, 'value': 7, **changes}


def memory():
    return closing(connect(':memory:'))


def rows(db, table):
    return db.execute(f'SELECT COUNT(*) FROM {table}').fetchone()[0]


def envelopes():
    result = outcome(lambda: validate(event(correlation_id='c-1')))
    return pick(result, {'ValueError: unexpected or missing envelope fields': 'Raises ValueError: unexpected or missing envelope fields'})


def acceptance():
    with memory() as db:
        first, second = consume(db, 'projection', event()), consume(db, 'projection', event())
        return pick((first, second, total(db, 'projection', 'j-4')), {(True, False, 7): '7: the second consume returns False and changes nothing'})


def consumer_lifecycle():
    with memory() as db:
        crashed = outcome(lambda: consume(db, 'projection', event(), crash=True))
        if not crashed.startswith('RuntimeError'):
            raise AssertionError(f'the injected crash did not happen: {crashed!r}')
        again = consume(db, 'projection', event())
        return pick((again, total(db, 'projection', 'j-4')), {(True, 7): 'True, and the total is 7: the crash rolled back the inbox row'})


def durability():
    with tempfile.TemporaryDirectory() as folder:
        path = Path(folder) / 'events.db'
        with closing(connect(path)) as db:
            create_job(db, 'j-4', 'e-17', 7)
        with closing(connect(path)) as db:
            ids = [e['id'] for e in pending(db)]
    return pick(tuple(ids), {('e-17',): 'The e-17 event, still unsent', (): 'An empty list, because the connection closed'})


def routing():
    with memory() as db:
        consume(db, 'audit', event()); consume(db, 'notifications', event())
        totals = (total(db, 'audit', 'j-4'), total(db, 'notifications', 'j-4'))
    return pick(totals, {(7, 7): '7 for each consumer'})


def idempotent_consumers():
    with memory() as db:
        consume(db, 'projection', event())
        result = outcome(lambda: consume(db, 'projection', event(value=8)))
        unchanged = total(db, 'projection', 'j-4') == 7
    return pick((result, unchanged), {('ValueError: event identity collision', True): 'Raises ValueError: event identity collision'})


def transactional_outbox():
    with memory() as db:
        crashed = outcome(lambda: create_job(db, 'j-4', 'e-17', 7, crash=True))
        if not crashed.startswith('RuntimeError'):
            raise AssertionError(f'the injected crash did not happen: {crashed!r}')
        left = (rows(db, 'jobs'), rows(db, 'outbox'))
    return pick(left, {(0, 0): 'Neither the job row nor the outbox row', (1, 0): 'The job row only', (0, 1): 'The outbox row only'})


def retry_budget():
    return pick(json.dumps(retry_decision(1, False), sort_keys=True), {
        '{"action": "quarantine", "delay": 0}': 'Quarantine at once, because the failure is not transient',
        '{"action": "retry", "delay": 1}': 'Retry after 1 second',
    })


def dead_letter_replay():
    with memory() as db:
        result = outcome(lambda: consume(db, 'projection', event(version=2)))
        written = rows(db, 'inbox')
    return pick((result, written), {('ValueError: unsupported version', 0): "validate raises 'unsupported version' and no inbox row is written"})


def schemas():
    return pick(outcome(lambda: validate(event(job_id=4))), {IDENTIFIER + 'job_id': 'Raises ValueError: job_id must be a string identifier'})


def backpressure():
    arrival, service, burst, later = 150, 100, 30, 70
    backlog = (arrival - service) * burst
    return f'{backlog // (service - later)} seconds'


def observability():
    with memory() as db:
        completed = sum(consume(db, 'projection', event()) for _ in range(2))
    return str(completed)


def failure_tests():
    with memory() as db:
        result = outcome(lambda: mark_sent(db, 'e-99'))
        inserted = rows(db, 'outbox')
    return pick((result, inserted), {('ValueError: unknown outbox event', 0): 'Raises ValueError: unknown outbox event'})


def foundation_whitespace():
    return pick(outcome(lambda: validate(event(id=' e-17'))), {IDENTIFIER + 'id': 'Raises ValueError: identifiers must not have surrounding whitespace'})


def foundation_repeat_create():
    with memory() as db:
        create_job(db, 'j-4', 'e-17', 7)
        second = outcome(lambda: create_job(db, 'j-4', 'e-17', 7))
        counts = (rows(db, 'jobs'), rows(db, 'outbox'))
    if second != event():
        raise AssertionError(f'the repeated create returned {second!r}')
    return pick(counts, {(1, 1): 'One job row and one outbox row', (2, 2): 'Two of each'})


def foundation_type():
    return pick(outcome(lambda: validate(event(type='ExportCompleted'))), {'ValueError: unsupported type': 'Raises ValueError: unsupported type'})


def intermediate_limit():
    return pick(json.dumps(retry_decision(3, True), sort_keys=True), {
        '{"action": "quarantine", "delay": 0}': 'Quarantine: the attempt budget is used up',
        '{"action": "retry", "delay": 4}': 'Retry after 4 seconds',
    })


def intermediate_waits():
    decisions = [retry_decision(attempt, True, max_attempts=4) for attempt in (1, 2, 3)]
    if any(d['action'] != 'retry' for d in decisions):
        raise AssertionError(f'expected three retries: {decisions!r}')
    wait = sum(d['delay'] for d in decisions)
    return pick((wait, wait > 5), {(7, True): '7 seconds, which already exceeds the 5-second expiry'})


def intermediate_unsent():
    with tempfile.TemporaryDirectory() as folder:
        path = Path(folder) / 'events.db'
        with closing(connect(path)) as db:
            published = create_job(db, 'j-4', 'e-17', 7)
            consume(db, 'projection', pending(db)[0])  # published and applied; the relay crashes before mark_sent
        with closing(connect(path)) as db:
            again = pending(db)
            applied = total(db, 'projection', 'j-4')
    return pick((again == [published], applied), {(True, 7): 'e-17, so it will be published again'})


def advanced_bound():
    result = outcome(lambda: validate(event(value=2 ** 63)))
    return pick(result, {'ValueError: value must be a nonnegative SQLite signed-64-bit integer': 'Raises ValueError: the value must fit a signed 64-bit SQLite integer'})


def advanced_rebuild():
    with memory() as db:
        consume(db, 'projection', event())
        rebuilt = consume(db, 'projection-v2', event())
        totals = (total(db, 'projection-v2', 'j-4'), total(db, 'projection', 'j-4'))
    return pick((rebuilt, totals), {(True, (7, 7)): 'It returns True; projection-v2 totals 7 and projection is unchanged'})


def advanced_same_job():
    with memory() as db:
        consume(db, 'projection', event()); consume(db, 'projection', event(id='e-18', value=5))
        return str(total(db, 'projection', 'j-4'))



def event_sourcing():
    stream, results = ['e1', 'e2', 'e3'], []
    for writer in ('a', 'b'):              # both writers expect version 3
        if len(stream) == 3:
            stream.append(writer)
            results.append('ok')
        else:
            results.append('conflict')
    return pick(tuple(results), {('ok', 'conflict'): 'The first succeeds; the second is rejected as a concurrency conflict'})


FACTS = {
    'event-sourcing/2': event_sourcing,
    'envelopes/2': envelopes, 'acceptance/2': acceptance, 'consumer-lifecycle/2': consumer_lifecycle,
    'durability/2': durability, 'routing/2': routing, 'idempotent-consumers/2': idempotent_consumers,
    'transactional-outbox/2': transactional_outbox, 'retry-budget/2': retry_budget,
    'dead-letter-replay/2': dead_letter_replay, 'schemas/2': schemas, 'backpressure/2': backpressure,
    'observability/2': observability, 'failure-tests/2': failure_tests,
    'stage/foundation/1': foundation_whitespace, 'stage/foundation/2': foundation_repeat_create,
    'stage/foundation/3': foundation_type,
    'stage/intermediate/1': intermediate_limit, 'stage/intermediate/2': intermediate_waits,
    'stage/intermediate/3': intermediate_unsent,
    'stage/advanced/1': advanced_bound, 'stage/advanced/2': advanced_rebuild, 'stage/advanced/3': advanced_same_job,
}


# Practice ladder answers that are numbers or program output: each fact computes values that the
# step's solution must state. Steps not listed here are judged against their checks only.
def practice_inbox_crash():
    with memory() as db:
        crashed = outcome(lambda: consume(db, 'audit', event(), crash=True))
        assert crashed.startswith('RuntimeError'), crashed
        again = consume(db, 'audit', event())
        return [f'returns `{again}`', f'{rows(db, "inbox")} inbox row and a total of {total(db, "audit", "j-4")}']


def practice_inbox_pruned():
    with memory() as db:
        consume(db, 'audit', event())
        with db:
            db.execute("DELETE FROM inbox WHERE consumer='audit' AND id='e-17'")  # retention pruned the key
        assert consume(db, 'audit', event()) is True
        return [f'the total becomes {total(db, "audit", "j-4")}']


def practice_last_value():
    stored = 3
    for version in (5, 4):
        stored = max(stored, version)
    return [f'ends at version {stored}']


def practice_ledger():
    amounts, arrivals = {1: 2, 2: 5, 3: 3}, (1, 3, 2)
    applied, buffered, balance = 0, {}, 0
    for version in arrivals:
        buffered[version] = amounts[version]
        while applied + 1 in buffered:
            applied += 1
            balance += buffered.pop(applied)
    dropped = sum(amounts[v] for v in (1, 3))
    return [f'2 + 5 + 3 = {balance}', f'2 + 3 = {dropped}']


def _credit_stream():
    return [('2026-09-01', 10), ('2026-09-05', -4), ('2026-09-10', 5), ('2026-09-12', -3)]


def practice_fold():
    events = _credit_stream()
    on = sum(amount for day, amount in events if day <= '2026-09-07')
    return [f'10 − 4 = {on}', f'10 − 4 + 5 − 3 = {sum(a for _, a in events)}']


def practice_three_writers():
    stream = [10]
    for spend in (8, 3, 1):
        expected = 1                        # every writer read version 1
        while True:
            if len(stream) != expected:     # conflict: reload and decide again
                expected = len(stream)
                continue
            if sum(stream) - spend < 0:
                break                       # rejected by the invariant
            stream.append(-spend)
            break
    return [f'the final balance is {sum(stream)}, at version {len(stream)}']


def practice_snapshot():
    events, every = 12_345, 1_000
    latest = events // every * every
    return [f'at event {latest:,}', f'the {events - latest} events after it']


def _cqrs(crash_before_position=False):
    events, state = [('learner-7', 10), ('learner-7', -3), ('learner-7', 5)], {'position': 0, 'balance': 0}
    saved = 0
    while saved < len(events):
        state['balance'] += events[saved][1]
        if crash_before_position and saved == 1:
            crash_before_position = False   # crash: the balance kept the update, the position did not
            continue
        saved += 1
    return state['balance'], len(events)


def practice_cqrs_query():
    events = [10, -3, 5]
    position = len(events)
    projected = sum(events[:2])
    return [f'returns position {position}', f'position 2 with a balance of 10 − 3 = {projected}',
            f"'stale (projection at 2, need {position})'", f'the balance is {sum(events)}']


def practice_cqrs_crash():
    wrong, _ = _cqrs(crash_before_position=True)
    right, _ = _cqrs()
    return [f'10 − 3 − 3 + 5 = {wrong} instead of {right}']


PRACTICE_FACTS = {
    'idempotent-consumers/1': practice_inbox_crash, 'idempotent-consumers/2': practice_inbox_pruned,
    'ordering/1': practice_last_value, 'ordering/2': practice_ledger,
    'event-sourcing/1': practice_fold, 'event-sourcing/2': practice_three_writers, 'event-sourcing/3': practice_snapshot,
    'cqrs/1': practice_cqrs_query, 'cqrs/2': practice_cqrs_crash,
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
            failures.append(f'{key}: no fact check and no cited source'); continue
        try:
            answer = FACTS[key]()
        except Exception as error:  # report every failing fact, not just the first
            failures.append(f'{key}: {error}'); continue
        if answer != q['options'][q['correct']]:
            failures.append(f'{key}: the lab supports {answer!r}, the question marks {q["options"][q["correct"]]!r}')
    failures += practice_failures(COURSE, PRACTICE_FACTS)
    failures += [f'{key}: fact has no question' for key in set(FACTS) | set(SOURCED) if key not in seen]
    if failures:
        sys.exit('Messaging checkpoint facts failed:\n' + '\n'.join(failures))
    print(f'PASS: {len(FACTS)} Messaging checkpoint answers checked against the course lab; {len(SOURCED)} cited from the lessons; '
          f'{len(PRACTICE_FACTS)} practice ladder answers computed.')


if __name__ == '__main__':
    main()
