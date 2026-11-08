"""Fact checks for the Testing & Debugging checkpoint answers.

Each fact runs the course's offline labs in paths/testing-debugging/practice (the parser and importer,
the version store, the diagnosis lab, the cursor candidate and reference, and the branch-coverage
subject) and returns the text of the option its result supports. The script fails if that differs from
the authored correct option. Files are written only to temporary folders; no network is used.
Run with Python 3.14+: python tests/testing_debugging_checkpoint_facts.py
"""
import ast
import asyncio
import json
from pathlib import Path
import subprocess
import sys
from tempfile import TemporaryDirectory
import threading
import unittest

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / 'paths' / 'testing-debugging'
PRACTICE = COURSE / 'practice'
sys.path.insert(0, str(PRACTICE))
import testing_foundation as foundation  # noqa: E402
from testing_integration import import_batch  # noqa: E402
from testing_concurrency import Conflict, VersionStore, diagnostic_event  # noqa: E402
import diagnosis_lab  # noqa: E402
import cursor_candidate  # noqa: E402
import cursor_reference  # noqa: E402
import cursor_checks  # noqa: E402
import branch_subject  # noqa: E402

# Answers that follow from the lesson text rather than lab behaviour.
SOURCED = {
    'debugger/2': 'next runs a call; step enters it, lesson 10',
    'end-to-end-tests/2': 'Report retried passes as flaky and fix or quarantine them, lesson 21',
    'fixtures/2': 'Register cleanup immediately after acquiring a resource, lesson 5',
    'strategy/2': 'A real CLI subprocess covers argument parsing and exit status, lesson 11',
    'test-data/2': 'Add a new fixture or document a migration; keep historical captures, lesson 18',
    'flaky-tests/2': 'A join timeout detects an unfinished worker and does not terminate it, lesson 20',
    'release-evidence/2': 'A passing runner can still skip tests or collect the wrong module, lesson 25',
    'debug-report/2': 'A multi-worker service needs coordination at its real storage boundary, lesson 26',
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
    """'Raises Type: message' for an exception, for options phrased that way."""
    return 'Raises ' + outcome(action)


def record(id='a', minutes=5):
    return json.dumps({'id': id, 'minutes': minutes})


def contracts():
    return raises(lambda: foundation.parse_record('{"id":"a","minutes":5,"note":"x"}'))


def first_test():
    return str(foundation.total_minutes([]))


def boundaries():
    accepted = [m for m in (-1, 0, 1440, 1441) if not str(outcome(lambda: foundation.parse_record(record(minutes=m)))).startswith('ValueError')]
    return pick(tuple(accepted), {(0, 1440): '0 and 1440', (0,): '0 only', (-1, 0, 1440): '-1, 0 and 1440'})


def failures():
    with TemporaryDirectory() as folder:
        target = Path(folder) / 'report.json'
        error = outcome(lambda: import_batch([record(), '{bad'], target))
        return pick((error.split(':')[0], target.exists()), {('ValueError', False): 'Nothing: it is never created'})


def tracebacks():
    try:
        foundation.parse_record('{bad')
    except ValueError as error:
        return pick((str(error), type(error.__cause__).__name__),
                    {('invalid JSON', 'JSONDecodeError'): 'A json.JSONDecodeError'})
    raise AssertionError('parse_record accepted invalid JSON')


def reproduce():
    return str(diagnosis_lab.inclusive_total_mutant([4, 8, 16], 1))


def hypotheses():
    result = foundation.buggy_minutes(True)
    return pick((result is True,), {(True,): 'True, without raising'})


def mocks():
    def failing_replace(source, destination):
        raise OSError('synthetic replace failure')
    with TemporaryDirectory() as folder:
        error = outcome(lambda: import_batch([record()], Path(folder) / 'report.json', replace=failing_replace))
        left = sorted(p.name for p in Path(folder).iterdir())
        return pick((error.split(':')[0], tuple(left)), {('OSError', ()): 'Nothing: the temporary file is removed'})


def contracts_adapters():
    return raises(lambda: foundation.parse_record('{"id":"a","minutes":5.0}'))


def integration_files():
    with TemporaryDirectory() as folder:
        target = Path(folder) / 'report.json'
        import_batch([record('a', 7), record('b', 5)], target)
        data = json.loads(target.read_text(encoding='utf-8'))
        return pick((data.get('total'), data.get('schema_version')), {(12, 1): 'total 12, with schema_version 1'})


def walk(page, rows, size):
    got, cursor = [], None
    for _ in range(len(rows) + 1):
        batch, cursor = page(list(reversed(rows)), cursor, size)
        if not batch:
            return got
        got.extend(batch)
    raise AssertionError('cursor did not terminate')


def properties():
    rows = [{'time': i // 3, 'id': str(i).zfill(2)} for i in range(17)]
    want = sorted(rows, key=lambda row: (row['time'], row['id']))
    return pick(all(walk(cursor_reference.page, rows, size) == want for size in (1, 2, 3, 5, 100)),
                {True: 'Yes, for every size'})


def passes(page, test):
    original = cursor_checks.page
    cursor_checks.page = page
    try:
        result = unittest.TestResult()
        cursor_checks.CursorContract(test).run(result)
        return result.wasSuccessful()
    finally:
        cursor_checks.page = original


def regressions():
    test = 'test_no_skipped_ties_across_pages'
    return pick((passes(cursor_candidate.page, test), passes(cursor_reference.page, test)),
                {(False, True): 'It fails on the candidate and passes on the reference',
                 (True, True): 'It passes on both', (False, False): 'It fails on both'})


def coverage():
    code = branch_subject.label.__code__
    executed = set()

    def tracer(frame, event, arg):
        if frame.f_code is code and event == 'line':
            executed.add(frame.f_lineno)
        return tracer
    sys.settrace(tracer)
    try:
        result = unittest.TestResult()
        unittest.defaultTestLoader.loadTestsFromName('test_branch_lab.PositiveOnly').run(result)
    finally:
        sys.settrace(None)
    tree = ast.parse((PRACTICE / 'branch_subject.py').read_text(encoding='utf-8'))
    label = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == 'label')
    statements = {n.lineno for n in ast.walk(label) if isinstance(n, ast.stmt) and n is not label}
    return pick((result.wasSuccessful(), executed == statements),
                {(True, True): 'All of them, though the minutes <= 0 branch is never taken'})


def race(store):
    barrier, results = threading.Barrier(2, timeout=5), []

    def worker(minutes):
        barrier.wait()
        results.append(outcome(lambda: store.update(0, minutes)))
    threads = [threading.Thread(target=worker, args=(m,)) for m in (8, 9)]
    for t in threads:
        t.start()
    for t in threads:
        t.join(5)
    if any(t.is_alive() for t in threads):
        raise AssertionError('a worker did not finish')
    return sorted(map(str, results))


def concurrency():
    return pick(tuple(race(VersionStore())), {('1', 'Conflict: stale version'):
                                              'One gets version 1, the other gets Conflict: stale version'})


def cancelled_events():
    async def scenario():
        started, release, events = asyncio.Event(), asyncio.Event(), []
        task = asyncio.create_task(diagnosis_lab.collect_once(started, release, events))
        await started.wait()
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            return events
        raise AssertionError('task was not cancelled')
    return asyncio.run(scenario())


def async_debugging():
    return str(cancelled_events())


def observability():
    return raises(lambda: diagnostic_event('case-3', 'timeout', 5))


def performance():
    original = diagnosis_lab.indexed_lookup
    diagnosis_lab.indexed_lookup = lambda rows, wanted: [None for _ in wanted]
    try:
        error = outcome(lambda: diagnosis_lab.benchmark(size=20, queries=5, samples=1))
    finally:
        diagnosis_lab.indexed_lookup = original
    return pick(error.split(':')[0], {'AssertionError': 'Raises AssertionError before timing it'})


def cli_route():
    run = subprocess.run([sys.executable, '-B', 'testing_integration.py'], cwd=PRACTICE,
                         capture_output=True, text=True, timeout=30, check=True)
    return run.stdout.strip()


def foundation_duplicate():
    return raises(lambda: foundation.parse_record('{"id":"a","id":"b","minutes":1}'))


def foundation_bool():
    return raises(lambda: foundation.parse_record('{"id":"a","minutes":true}'))


def foundation_stop():
    return raises(lambda: diagnosis_lab.inclusive_total([4, 8, 16], 3))


def intermediate_duplicate_id():
    with TemporaryDirectory() as folder:
        target = Path(folder) / 'report.json'
        error = outcome(lambda: import_batch([record('a', 1), record('a', 2)], target))
        return pick((error, target.exists()), {('ValueError: duplicate record id', False):
                                               'ValueError: duplicate record id, and no file is written'})


def intermediate_candidate_ties():
    rows = [{'time': 5, 'id': 'c'}, {'time': 5, 'id': 'a'}, {'time': 5, 'id': 'b'}, {'time': 6, 'id': 'd'}]
    first, cursor = cursor_candidate.page(rows, limit=2)
    second, _ = cursor_candidate.page(rows, cursor, 2)
    return pick(tuple(r['id'] for r in first + second), {('a', 'b', 'd'): 'a, b, d: c is skipped',
                                                         ('a', 'b', 'c', 'd'): 'a, b, c, d'})


def intermediate_oversized():
    with TemporaryDirectory() as folder:
        lines = [record(f'r{i}', 1) for i in range(1001)]
        return pick(outcome(lambda: import_batch(lines, Path(folder) / 'report.json')),
                    {'ValueError: batch exceeds 1000 rows': 'ValueError: batch exceeds 1000 rows'})


def advanced_sequential():
    store = VersionStore()
    store.update(0, 8)
    store.update(1, 9)
    return str(store.read())


def advanced_released():
    async def scenario():
        started, release, events = asyncio.Event(), asyncio.Event(), []
        task = asyncio.create_task(diagnosis_lab.collect_once(started, release, events))
        await started.wait()
        release.set()
        return await task, events
    value, events = asyncio.run(scenario())
    return f'{value}, with {events}'


def advanced_copies():
    def leaks(page):
        rows = [{'time': 5, 'id': 'a'}]
        result, _ = page(rows)
        result[0]['id'] = 'changed'
        return rows[0]['id'] == 'changed'
    return pick((leaks(cursor_reference.page), leaks(cursor_candidate.page)),
                {(False, True): 'Not for the reference; yes for the candidate', (False, False): 'No for both',
                 (True, True): 'Yes for both'})


def test_driven_development():
    class FirstTest(unittest.TestCase):
        def test_hours_and_minutes(self):
            def parse_minutes(text):
                raise NotImplementedError
            self.assertEqual(parse_minutes('1h30m'), 90)
    result = unittest.TestResult()
    FirstTest('test_hours_and_minutes').run(result)
    return pick((len(result.errors), len(result.failures)),
                {(1, 0): 'As an error (E), because an exception other than an assertion failure was raised',
                 (0, 1): 'As a failure (F)'})


FACTS = {
    'test-driven-development/2': test_driven_development,
    'contracts/2': contracts, 'first-test/2': first_test, 'boundaries/2': boundaries, 'failures/2': failures,
    'tracebacks/2': tracebacks, 'reproduce/2': reproduce, 'hypotheses/2': hypotheses, 'mocks/2': mocks,
    'contracts-adapters/2': contracts_adapters, 'integration-files/2': integration_files,
    'properties/2': properties, 'regressions/2': regressions, 'coverage/2': coverage,
    'concurrency/2': concurrency, 'async-debugging/2': async_debugging, 'observability/2': observability,
    'performance/2': performance, 'cli-route/2': cli_route,
    'stage/foundation/1': foundation_duplicate, 'stage/foundation/2': foundation_bool,
    'stage/foundation/3': foundation_stop,
    'stage/intermediate/1': intermediate_duplicate_id, 'stage/intermediate/2': intermediate_candidate_ties,
    'stage/intermediate/3': intermediate_oversized,
    'stage/advanced/1': advanced_sequential, 'stage/advanced/2': advanced_released, 'stage/advanced/3': advanced_copies,
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
        sys.exit('Testing & Debugging checkpoint facts failed:\n' + '\n'.join(failures))
    print(f'PASS: {len(FACTS)} Testing & Debugging checkpoint answers checked against the course labs; '
          f'{len(SOURCED)} cited from the lessons.')


if __name__ == '__main__':
    main()
