"""Fact checks for the Linux & Operating Systems checkpoint answers.

Each fact runs the course's lab in paths/linux-operating-systems/practice: diagnostic_lab.py's run_python,
classify and backlog, the demo and the test_os_labs.py suite, which are portable. The two descriptor
answers run linux_fd_drill.py, which works only on Linux; on any other platform they are reported as
skipped, not passed, and the summary says so. The three command-line answers run GNU bash, grep, uniq and tar
(on Windows, Git for Windows' bash); without bash they are skipped the same way.
CI runs this script on Linux, so all of them run there.
Each fact returns the text of the option the result supports, and the script fails if that differs from
the authored correct option.
Run with Python 3.14+: python tests/linux_checkpoint_facts.py
"""
from functools import cache
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
from tempfile import TemporaryDirectory

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / 'paths' / 'linux-operating-systems'
PRACTICE = COURSE / 'practice'
sys.path.insert(0, str(PRACTICE))
import diagnostic_lab as lab  # noqa: E402

# Answers that follow from the lesson text rather than lab behaviour.
SOURCED = {
    'signals-and-shutdown/2': 'SIGTERM requests shutdown; SIGKILL prevents cleanup, lesson 12',
    'memory-and-virtual-addresses/2': 'VSZ and RSS typically appear in KiB; confirm your ps manual, lesson 13',
    'threads-scheduling-and-races/2': 'Separate processes need coordination that they can both access, lesson 14',
    'storage-and-durability/2': 'Data reaches userspace buffers, kernel caches and storage at different times, lesson 16',
    'network-observation/2': 'A server on 127.0.0.1 is reachable only on that computer through loopback, lesson 17',
    'services-and-supervision/2': 'Units describe executable, identity, working directory, dependencies and restart policy, lesson 18',
    'namespaces-and-cgroups/2': 'Namespaces give distinct views of process IDs, mounts and networking, lesson 22',
}


class NeedsLinux(Exception):
    """The fact needs the Linux-only descriptor drill."""


def pick(value, table):
    if value not in table:
        raise AssertionError(f'unexpected result {value!r}')
    return table[value]


def raises(action):
    try:
        action()
    except Exception as error:
        return f'Raises {type(error).__name__}: {error}'
    raise AssertionError('no exception raised')


def result(source, *arguments, timeout=2):
    r = lab.run_python(source, arguments, timeout=timeout)
    return r.status, r.stdout, r.stderr


@cache
def drill():
    if sys.platform != 'linux':
        raise NeedsLinux
    run = subprocess.run([sys.executable, '-B', str(PRACTICE / 'linux_fd_drill.py')], cwd=PRACTICE,
                         capture_output=True, text=True, timeout=30, check=True)
    report, verdict = run.stdout.strip().splitlines()
    return json.loads(report), verdict


def bash(script):
    """Run a script with GNU bash and coreutils: Linux, or Git for Windows' bash where installed."""
    program = shutil.which('bash') if sys.platform != 'win32' else r'C:\Program Files\Git\bin\bash.exe'
    if not program or not os.path.exists(program):
        raise NeedsLinux
    with TemporaryDirectory() as folder:
        run = subprocess.run([program, '--noprofile', '--norc', '-c', script], cwd=folder, capture_output=True,
                             text=True, timeout=30, env={**os.environ, 'LC_ALL': 'C'})
    return run.stdout.replace('\r', '')


def text_pipelines():
    return bash("printf 'b\\na\\nb\\n' | uniq | wc -l").strip()


def shell_scripts():
    printed = bash("bash -c 'set -e; false | true; echo reached'; echo \"status $?\"")
    return pick(printed, {'reached\nstatus 0\n': "It prints reached: the pipeline's status is true's 0",
                          'status 1\n': 'The script exits at the pipeline'})


def remote_access_scheduling():
    return bash("mkdir data && printf 'id\\n' > data/a.csv && tar -czf backup.tgz data && tar -tzf backup.tgz | grep csv").strip()


def kernel_and_user_space():
    return pick(result('print(42)'), {(0, '42\n', ''): 'Status 0, stdout 42 with a newline, and empty stderr'})


def paths_and_working_directory():
    before = os.getcwd()
    with TemporaryDirectory(ignore_cleanup_errors=True) as folder:
        try:
            os.chdir(folder)
            printed = result('import os; print(os.getcwd())')[1].strip()
            same = os.path.samefile(printed, folder)
        finally:
            os.chdir(before)
    return pick(same, {True: "The parent's new working directory"})


def safe_file_operations():
    return lab.classify(FileNotFoundError())


def shell_quoting():
    printed = result('import sys; print(sys.argv[1:])', '*.csv')[1].strip()
    return pick(printed, {"['*.csv']": "['*.csv']: no shell expands the pattern"})


def streams_and_pipelines():
    status, out, err = result('import sys; print("careful", file=sys.stderr)')
    return pick((status, out, err), {(0, '', 'careful\n'): 'Status 0, with the warning in stderr'})


def permissions_and_identities():
    return lab.classify(PermissionError())


def processes_and_exit_status():
    return pick(result('raise SystemExit("bad input")'), {(1, '', 'bad input\n'): 'Status 1, with bad input on stderr'})


def environment_and_path():
    previous = os.environ.get('NOTEBOOK_LAB')
    os.environ['NOTEBOOK_LAB'] = 'on'
    try:
        printed = result('import os; print(os.environ.get("NOTEBOOK_LAB", "unset"))')[1].strip()
    finally:
        if previous is None:
            del os.environ['NOTEBOOK_LAB']
        else:
            os.environ['NOTEBOOK_LAB'] = previous
    return pick(printed, {'on': 'on: the child inherits the environment at start'})


def process_lifetimes():
    try:
        lab.run_python('import time; time.sleep(5)', timeout=0.2)
    except subprocess.TimeoutExpired as error:
        return pick(lab.classify(error), {'lifecycle': 'TimeoutExpired is raised, labelled lifecycle'})
    raise AssertionError('the child was not timed out')


def file_descriptors_and_leaks():
    report, verdict = drill()
    return pick((report['before'] == report['after_cleanup'], report['reopen'], verdict.startswith('PASS')),
                {(True, 'ok', True): 'They are equal, and opening one more then succeeds'})


def logs_and_evidence():
    return lab.classify(RuntimeError())


def resource_limits():
    return pick(lab.backlog(8, 10, 60, 120), {0: '0: the queue drains and never goes negative'})


def security_and_packages():
    return raises(lambda: lab.run_python('x' * 5000))


def incident_diagnosis():
    return lab.classify(ValueError())


def operating_systems_capstone():
    run = subprocess.run([sys.executable, '-B', '-m', 'unittest', 'test_os_labs'], cwd=PRACTICE,
                         capture_output=True, text=True, timeout=60)
    ran = next(line for line in run.stderr.splitlines() if line.startswith('Ran '))
    drill_in_suite = 'linux_fd_drill' in (PRACTICE / 'test_os_labs.py').read_text(encoding='utf-8')
    return pick((ran.split()[1], run.returncode, drill_in_suite),
                {('8', 0, False): '8 portable tests; the Linux descriptor drill is separate'})


def foundation_bool():
    return raises(lambda: lab.backlog(True, 10, 1))


def foundation_timeout():
    return raises(lambda: lab.run_python('pass', timeout=11))


def foundation_arguments():
    return raises(lambda: lab.run_python('pass', ('a',) * 11))


def intermediate_demo():
    run = subprocess.run([sys.executable, '-B', 'diagnostic_lab.py'], cwd=PRACTICE, capture_output=True,
                         text=True, timeout=30, check=True)
    return run.stdout.strip().splitlines()[-1]


def intermediate_silent_exit():
    return pick(result('import sys; sys.exit(3)'), {(3, '', ''): 'Status 3, with empty stdout and stderr'})


def intermediate_steady():
    return pick(lab.backlog(10, 10, 60, 5), {5: '5: arrivals match service, so the queue stays as it was'})


def advanced_emfile():
    report, verdict = drill()
    source = (PRACTICE / 'linux_fd_drill.py').read_text(encoding='utf-8')
    return pick(('opened_until_EMFILE' in report, 'assert error.errno == errno.EMFILE' in source, verdict.startswith('PASS')),
                {(True, True, True): 'EMFILE: too many open files for the process'})


def advanced_infinite():
    return raises(lambda: lab.backlog(float('inf'), 10, 1))


def advanced_called_process():
    return lab.classify(subprocess.CalledProcessError(1, 'child'))


FACTS = {
    'kernel-and-user-space/2': kernel_and_user_space, 'paths-and-working-directory/2': paths_and_working_directory,
    'safe-file-operations/2': safe_file_operations, 'shell-quoting/2': shell_quoting,
    'streams-and-pipelines/2': streams_and_pipelines, 'permissions-and-identities/2': permissions_and_identities,
    'processes-and-exit-status/2': processes_and_exit_status, 'environment-and-path/2': environment_and_path,
    'process-lifetimes/2': process_lifetimes, 'file-descriptors-and-leaks/2': file_descriptors_and_leaks,
    'logs-and-evidence/2': logs_and_evidence, 'resource-limits/2': resource_limits,
    'security-and-packages/2': security_and_packages, 'incident-diagnosis/2': incident_diagnosis,
    'operating-systems-capstone/2': operating_systems_capstone,
    'text-pipelines/2': text_pipelines, 'shell-scripts/2': shell_scripts,
    'remote-access-scheduling/2': remote_access_scheduling,
    'stage/foundation/1': foundation_bool, 'stage/foundation/2': foundation_timeout,
    'stage/foundation/3': foundation_arguments,
    'stage/intermediate/1': intermediate_demo, 'stage/intermediate/2': intermediate_silent_exit,
    'stage/intermediate/3': intermediate_steady,
    'stage/advanced/1': advanced_emfile, 'stage/advanced/2': advanced_infinite,
    'stage/advanced/3': advanced_called_process,
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
    seen, failures, skipped = set(), [], []
    for key, q in questions():
        seen.add(key)
        if key in SOURCED:
            continue
        if key not in FACTS:
            failures.append(f'{key}: no fact check and no cited source')
            continue
        try:
            answer = FACTS[key]()
        except NeedsLinux:
            skipped.append(key)
            continue
        except Exception as error:  # report every failing fact, not just the first
            failures.append(f'{key}: {error}')
            continue
        if answer != q['options'][q['correct']]:
            failures.append(f'{key}: the lab supports {answer!r}, the question marks {q["options"][q["correct"]]!r}')
    failures += [f'{key}: fact has no question' for key in set(FACTS) | set(SOURCED) if key not in seen]
    if failures:
        sys.exit('Linux & Operating Systems checkpoint facts failed:\n' + '\n'.join(failures))
    checked = len(FACTS) - len(skipped)
    note = f'; SKIPPED {len(skipped)} that need Linux ({", ".join(skipped)})' if skipped else ''
    print(f'PASS: {checked} Linux & Operating Systems checkpoint answers checked against the course labs; '
          f'{len(SOURCED)} cited from the lessons{note}.')


if __name__ == '__main__':
    main()
