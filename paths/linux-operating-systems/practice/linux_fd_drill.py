"""Exhaust only a disposable child process's descriptor budget on Linux/WSL."""
import errno
import json
import os
import subprocess
import sys


def child():
    import resource
    before = len(os.listdir('/proc/self/fd'))
    soft, hard = resource.getrlimit(resource.RLIMIT_NOFILE)
    limit = 32 if hard == resource.RLIM_INFINITY else min(32, hard)
    resource.setrlimit(resource.RLIMIT_NOFILE, (limit, hard))
    handles = []
    try:
        while True:
            try:
                handles.append(os.open('/dev/null', os.O_RDONLY))
            except OSError as error:
                assert error.errno == errno.EMFILE, error
                break
    finally:
        for descriptor in handles:
            os.close(descriptor)
    after = len(os.listdir('/proc/self/fd'))
    assert after == before, (before, after)
    descriptor = os.open('/dev/null', os.O_RDONLY)
    os.close(descriptor)
    print(json.dumps({'soft_limit': limit, 'opened_until_EMFILE': len(handles),
                      'before': before, 'after_cleanup': after, 'reopen': 'ok'}))


if __name__ == '__main__':
    if sys.platform != 'linux':
        raise SystemExit('SKIP: run python3 linux_fd_drill.py inside an existing Linux/WSL distribution')
    if '--child' in sys.argv:
        child()
    else:
        result = subprocess.run([sys.executable, __file__, '--child'],
                                text=True, capture_output=True, timeout=10, check=True)
        print(result.stdout.strip())
        print('PASS: child-only EMFILE, descriptor recovery; parent limits unchanged')
