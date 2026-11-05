"""Fact checks for the Requirements & software maintenance checkpoint answers.

Each fact runs the course's lab in paths/requirements-maintenance/practice: the flawed legacy_report.py,
the reference report.py (in process and as a command), and its test_report.py suite. Inputs are written to
a temporary directory, so the shipped tickets.csv is only read. Each fact returns the text of the option
the result supports, and the script fails if that differs from the authored correct option.
Run with Python 3.11+: python tests/requirements_maintenance_checkpoint_facts.py
"""
import ast
import json
from pathlib import Path
import subprocess
import sys
from tempfile import TemporaryDirectory

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / 'paths' / 'requirements-maintenance'
PRACTICE = COURSE / 'practice'
FIXTURE = PRACTICE / 'tickets.csv'
sys.path.insert(0, str(PRACTICE))
import legacy_report  # noqa: E402
import report  # noqa: E402

# Answers that follow from the lesson text rather than lab behaviour.
SOURCED = {
    'change-history/2': 'A build failure unrelated to the target behavior cannot be treated as evidence, lesson 16',
}

HEADER = 'id,status,minutes\n'


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


def with_file(rows, action, header=HEADER):
    with TemporaryDirectory(ignore_cleanup_errors=True) as folder:
        path = Path(folder) / 'tickets.csv'
        path.write_text(header + rows, encoding='utf-8')
        return action(path)


def legacy(rows):
    return with_file(rows, lambda p: outcome(lambda: legacy_report.summarize_file(p)))


def reference(rows, status=None):
    return with_file(rows, lambda p: outcome(lambda: report.summarize(report.read_tickets(p), status)))


def cli(*args, cwd=PRACTICE):
    return subprocess.run([sys.executable, '-B', str(PRACTICE / 'report.py'), *map(str, args)],
                          cwd=cwd, capture_output=True, text=True, timeout=30)


def request_outcome():
    return cli(FIXTURE).stdout.strip()


def acceptance_examples():
    return with_file('A,open,4\nB,open,0\n', lambda p: cli(p, '--status', 'closed').stdout.strip())


def scope_decisions():
    return raises(lambda: with_file('A,archived,4\n', report.read_tickets))


def reproduce_environment():
    return str(legacy('A,open,0\n'))


def trace_code():
    result = legacy('A,open,0\nB,open,7\n')
    return pick((result['count'], result['total_minutes']), {(1, 7): '1, although there are 2 tickets'})


def characterization():
    return pick(tuple(legacy('A,open,-1\n').values()), {(1, -1): 'Counts it, giving total_minutes -1'})


def first_project():
    return pick(tuple(legacy('A,open, 5\n').values()), {(1, 5): "It is counted as 5, because int() ignores surrounding spaces"})


def regression_first():
    run = subprocess.run([sys.executable, '-B', '-m', 'unittest', 'test_report'], cwd=PRACTICE,
                         capture_output=True, text=True, timeout=120)
    ran = next(line for line in run.stderr.splitlines() if line.startswith('Ran '))
    return pick((ran.split()[1], run.returncode, run.stderr.rstrip().endswith('OK')),
                {('13', 0, True): '13 tests, none failing'})


def validation_boundary():
    run = with_file('A,open,12\nB,closed,-1\n', lambda p: cli(p, '--status', 'open'))
    return pick((run.returncode, run.stdout, 'row 3' in run.stderr),
                {(2, '', True): 'Exit 2 with a diagnostic naming row 3, although that row is not selected'})


def change_location():
    tickets = report.read_tickets(FIXTURE)
    return raises(lambda: report.summarize(tickets, 'missing'))


def boundary_cases():
    minutes = with_file('A,open,0001\n', report.read_tickets)[0].minutes
    return pick(minutes, {1: 'It is accepted as 1: leading zeroes are allowed within four digits'})


def cli_compatibility():
    run = cli(FIXTURE)
    return pick((run.returncode, run.stderr), {(0, ''): 'Exit 0 and empty stderr'})


def focused_review():
    return outcome(lambda: with_file('A,open,1,extra\n', report.read_tickets))


def repair_project():
    return cli(FIXTURE, '--status', 'cancelled').stdout.strip()


def safe_file_update():
    with TemporaryDirectory(ignore_cleanup_errors=True) as folder:
        target = Path(folder) / 'report.json'
        target.write_bytes(b'KEEP')

        def fail(source, destination):
            raise OSError('simulated replacement error')
        error = outcome(lambda: report.write_report(target, '{}', replace=fail))
        left = (error.split(':')[0], target.read_bytes(), len(list(Path(folder).glob('.report-*.tmp'))))
    return pick(left, {('OSError', b'KEEP', 0): 'The old report bytes, and no .report-*.tmp file'})


def compatibility_change():
    keys = tuple(json.loads(cli(FIXTURE).stdout))
    return pick(keys, {('count', 'total_minutes'): 'Exactly count and total_minutes'})


def dependency_change():
    tree = ast.parse((PRACTICE / 'report.py').read_text(encoding='utf-8'))
    names = {a.name.split('.')[0] for n in ast.walk(tree) if isinstance(n, ast.Import) for a in n.names}
    names |= {n.module.split('.')[0] for n in ast.walk(tree) if isinstance(n, ast.ImportFrom)}
    third_party = names - sys.stdlib_module_names
    return pick(len(third_party), {0: 'None: it uses only the standard library'})


def operational_check():
    with TemporaryDirectory(ignore_cleanup_errors=True) as folder:
        target = Path(folder) / 'report.json'
        run = cli(FIXTURE, '--output', target)
        written = json.loads(target.read_text(encoding='utf-8'))
    return pick((run.returncode, run.stdout, written['count']), {(0, '', 4): 'Nothing: the JSON goes to the file'})


def rollback_plan():
    def same(path):
        before = path.read_bytes()
        run = cli(path, '--output', path)
        return run.returncode, path.read_bytes() == before
    return pick(with_file('A,open,1\n', same), {(2, True): 'Exit 2, and the input file is unchanged'})


def maintenance_capstone():
    error = raises(lambda: with_file('', report.read_tickets, header=''))
    return pick(error, {'Raises ValueError: header must be id,status,minutes':
                        'Raises ValueError, because the required header is missing'})


def foundation_legacy_fixture():
    return json.dumps(legacy_report.summarize_file(FIXTURE))


def foundation_legacy_text():
    return 'Raises ' + legacy('A,open,abc\n')


def foundation_legacy_status():
    return pick(tuple(legacy('A,archived,4\n').values()), {(1, 4): 'It counts the row: the starter never reads status'})


def intermediate_digits():
    return raises(lambda: with_file('A,open,00000\n', report.read_tickets))


def intermediate_padded():
    return raises(lambda: with_file(' A,open,1\n', report.read_tickets))


def intermediate_duplicate():
    error = outcome(lambda: with_file('A,open,1\nA,closed,2\n', report.read_tickets))
    return error.split(': ')[1]


def advanced_missing_dir():
    with TemporaryDirectory(ignore_cleanup_errors=True) as folder:
        run = cli(FIXTURE, '--output', Path(folder) / 'missing' / 'out.json')
        leftovers = len(list(Path(folder).rglob('.report-*.tmp')))
    return pick((run.returncode, run.stdout, leftovers), {(2, '', 0): 'Exit 2, with no temporary file left behind'})


def advanced_blank_lines():
    return str(reference('\nA,open,2\n\n'))


def advanced_newline():
    with TemporaryDirectory(ignore_cleanup_errors=True) as folder:
        target = Path(folder) / 'report.json'
        report.write_report(target, '{}')
        data = target.read_bytes()
    return pick(data, {b'{}\n': '{} followed by a newline'})


FACTS = {
    'request-outcome/2': request_outcome, 'acceptance-examples/2': acceptance_examples,
    'scope-decisions/2': scope_decisions, 'reproduce-environment/2': reproduce_environment,
    'trace-code/2': trace_code, 'characterization/2': characterization, 'first-project/2': first_project,
    'regression-first/2': regression_first, 'validation-boundary/2': validation_boundary,
    'change-location/2': change_location, 'boundary-cases/2': boundary_cases,
    'cli-compatibility/2': cli_compatibility, 'focused-review/2': focused_review,
    'repair-project/2': repair_project, 'safe-file-update/2': safe_file_update,
    'compatibility-change/2': compatibility_change, 'dependency-change/2': dependency_change,
    'operational-check/2': operational_check, 'rollback-plan/2': rollback_plan,
    'maintenance-capstone/2': maintenance_capstone,
    'stage/foundation/1': foundation_legacy_fixture, 'stage/foundation/2': foundation_legacy_text,
    'stage/foundation/3': foundation_legacy_status,
    'stage/intermediate/1': intermediate_digits, 'stage/intermediate/2': intermediate_padded,
    'stage/intermediate/3': intermediate_duplicate,
    'stage/advanced/1': advanced_missing_dir, 'stage/advanced/2': advanced_blank_lines,
    'stage/advanced/3': advanced_newline,
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
        sys.exit('Requirements & software maintenance checkpoint facts failed:\n' + '\n'.join(failures))
    print(f'PASS: {len(FACTS)} Requirements & software maintenance checkpoint answers checked against the course labs; '
          f'{len(SOURCED)} cited from the lessons.')


if __name__ == '__main__':
    main()
