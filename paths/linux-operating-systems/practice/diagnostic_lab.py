"""Portable OS reasoning lab. No host changes, arbitrary commands or real load."""
from dataclasses import dataclass
import subprocess
import sys

@dataclass(frozen=True)
class Result:
    status: int
    stdout: str
    stderr: str

def run_python(source, arguments=(), timeout=2):
    """Trusted teaching snippets only, direct Python child, bounded example output.

    This is NOT a sandbox: never pass untrusted source. The test snippets emit
    bounded output; arbitrary source could emit unbounded output or descendants.
    """
    if not isinstance(source, str) or len(source) > 4096:
        raise ValueError('source must be a bounded trusted string')
    if not 0 < timeout <= 10:
        raise ValueError('timeout must be positive and at most 10 seconds')
    if len(arguments) > 10 or any(not isinstance(a, str) or len(a) > 256 for a in arguments):
        raise ValueError('arguments exceed teaching bounds')
    value = subprocess.run([sys.executable, '-c', source, *arguments],
                           capture_output=True, text=True, timeout=timeout)
    return Result(value.returncode, value.stdout, value.stderr)

def classify(error):
    if isinstance(error, FileNotFoundError): return 'configuration'
    if isinstance(error, PermissionError): return 'access'
    if isinstance(error, subprocess.TimeoutExpired): return 'lifecycle'
    if isinstance(error, ValueError): return 'application validation'
    return 'unclassified; inspect evidence'

def backlog(arrival_per_second, service_per_second, duration_seconds, initial=0):
    values = (arrival_per_second, service_per_second, duration_seconds, initial)
    if any(type(v) not in (int, float) or v < 0 for v in values):
        raise ValueError('finite nonnegative numeric inputs required')
    import math
    if not all(math.isfinite(v) for v in values):
        raise ValueError('finite nonnegative numeric inputs required')
    return max(0, initial + (arrival_per_second - service_per_second) * duration_seconds)

def demo():
    examples = [('path', FileNotFoundError()), ('permission', PermissionError()),
                ('timeout', subprocess.TimeoutExpired('trusted-child', 0.1)),
                ('bad-row', ValueError())]
    for label, error in examples: print(f'{label} -> {classify(error)}')
    result = run_python('print(42)')
    print(f'child status={result.status} output={result.stdout.strip()}')
    print(f'modeled backlog={backlog(14, 10, 30)}')

if __name__ == '__main__': demo()
