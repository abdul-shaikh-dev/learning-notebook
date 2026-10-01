"""Manual monotonic spans for real concurrent work; no OpenTelemetry SDK required."""
import json
import time
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier


def experiment(fail_b=False):
    origin, cpu = time.perf_counter(), time.process_time()
    gate = Barrier(2, timeout=3)

    def child(name, delay):
        gate.wait()
        start = time.perf_counter()
        time.sleep(delay)
        # Represent a dependency failure without discarding its measured span.
        return {'name': name, 'start': start - origin,
                'end': time.perf_counter() - origin,
                'status': 'error' if name == 'B' and fail_b else 'ok'}

    with ThreadPoolExecutor(max_workers=2) as workers:
        a = workers.submit(child, 'A', .04)
        b = workers.submit(child, 'B', .08)
        spans = [a.result(timeout=4), b.result(timeout=4)]
    wall = time.perf_counter() - origin
    process_cpu = time.process_time() - cpu
    intervals = sorted((s['start'], s['end']) for s in spans)
    overlap = max(0, min(s['end'] for s in spans) - max(s['start'] for s in spans))
    child_sum = sum(end - start for start, end in intervals)
    covered = child_sum - overlap
    assert all(0 <= s['start'] <= s['end'] <= wall for s in spans)
    assert covered <= wall + 1e-9
    assert [s['status'] for s in spans] == ['ok', 'error' if fail_b else 'ok']
    return {'parent_wall': wall, 'process_cpu': process_cpu, 'spans': spans,
            'overlap': overlap, 'child_sum': child_sum,
            'uncovered_parent_time': wall - covered,
            'latest_finisher': max(spans, key=lambda s: s['end'])['name'],
            'request_status': 'error' if fail_b else 'ok'}


if __name__ == '__main__':
    for failed in [False, True]:
        print(json.dumps(experiment(failed), indent=2))
    print('PASS: nested timeline bounds and error evidence; timings are observations, not thresholds')
