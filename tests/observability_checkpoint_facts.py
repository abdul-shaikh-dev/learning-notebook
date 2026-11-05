"""Fact checks for the Observability & Performance checkpoint answers.

Each fact runs the course's offline labs in paths/observability-performance/practice (the telemetry
analysis, the manual-span experiment, the lookup benchmark functions and the loopback service handler)
and returns the text of the option its result supports. The script fails if that differs from the
authored correct option. The service handler runs on an ephemeral 127.0.0.1 port; no outside network.
Run with Python 3.11+: python tests/observability_checkpoint_facts.py
"""
from contextlib import contextmanager
from http.server import ThreadingHTTPServer
import json
from pathlib import Path
import sys
import threading
import urllib.error
import urllib.request

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / 'paths' / 'observability-performance'
sys.path.insert(0, str(COURSE / 'practice'))
from telemetry import burn_rate, percentile, summary  # noqa: E402
import trace_investigation  # noqa: E402
import benchmark  # noqa: E402
import service  # noqa: E402

# Answers that follow from the lesson text rather than lab behaviour.
SOURCED = {
    'questions-signals/2': 'Start with outcomes; internal metrics explain them, lesson 1',
    'structured-logs/2': 'Bounded route templates rather than raw URLs, lesson 3',
    'metrics-types/2': 'Divide errors by eligible requests in the same window, lesson 4',
    'cardinality/2': 'Three routes, five status classes and four instances: up to 60 series, lesson 9',
    'sampling-retention/2': 'A tail sampler cannot retain a trace it never receives, lesson 13',
    'memory-diagnostics/2': 'Temporary allocation differs from retention beyond intended lifetime, lesson 16',
    'load-models/2': 'Open-loop tests target an arrival rate independently of responses, lesson 17',
    'queues-capacity/2': "Little's law, L = lambda × W, lesson 18",
    'frontend-database/2': 'A fast API does not guarantee fast rendering, lesson 19',
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


def row(status=200, duration=10):
    return {'status': status, 'duration_ms': duration}


@contextmanager
def loopback():
    server = ThreadingHTTPServer(('127.0.0.1', 0), service.Handler)
    server.daemon_threads = True
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield f'http://127.0.0.1:{server.server_address[1]}'
    finally:
        server.shutdown()
        server.server_close()


def get(base, path):
    try:
        with urllib.request.urlopen(base + path, timeout=5) as response:
            return response.status, json.loads(response.read())
    except urllib.error.HTTPError as error:
        with error:
            error.read()
            return error.code, None


def measurement_contract():
    return raises(lambda: percentile([True, 5], 0.5))


def latency_percentiles():
    return str(percentile([10] * 19 + [900], 0.95))


def golden_signals():
    result = summary([row(500, 1)])
    return pick((result['good'], result['bad']), {(0, 1): 'Bad: a fast failure is still an error'})


def trace_spans():
    return trace_investigation.experiment()['latest_finisher']


def context_propagation():
    with loopback() as base:
        return get(base, '/work?n=7')[1]['request_id']


def histogram_buckets():
    on, over = summary([row(200, 100)], 100)['good'], summary([row(200, 101)], 100)['good']
    return pick((on, over), {(1, 0): '100 ms is good; 101 ms is bad', (1, 1): 'Both are good', (0, 0): 'Both are bad'})


def sli_slo_budget():
    return str(summary([])['good_fraction'])


def burn_rate_alerts():
    return number(burn_rate(0.99, 0.995))


def benchmark_design():
    rows = [{'id': i, 'value': i * 3} for i in range(50)]
    index = {r['id']: r['value'] for r in rows}
    return pick((str(benchmark.linear(rows, [99999])), str(outcome(lambda: benchmark.indexed(index, [99999])))),
                {('[None]', '[None]'): 'None from both'})


def profiling():
    result = trace_investigation.experiment()
    return pick(result['process_cpu'] < result['parent_wall'] / 2,
                {True: 'Much smaller: sleeping is waiting, not CPU work'})


def incident_runbook():
    with loopback() as base:
        failed = tuple(n for n in range(1, 11) if get(base, f'/work?n={n}&profile=fail')[0] == 503)
    return pick(failed, {(5, 10): '5 and 10', (10,): 'Only 10', (): 'None of them'})


def telemetry_release():
    with loopback() as base:
        return str(get(base, '/work?n=1&profile=burst')[0])


def foundation_max():
    return str(percentile([100, 1, 3, 2, 4], 1.0))


def foundation_zero():
    return raises(lambda: percentile([5], 0))


def foundation_status():
    return raises(lambda: summary([row(999)]))


def intermediate_burn():
    return number(burn_rate(0.90, 0.99))


def intermediate_full_target():
    return raises(lambda: burn_rate(0.99, 1.0))


def intermediate_fraction():
    rows = [row(503 if n % 5 == 0 else 200) for n in range(1, 21)]
    return number(summary(rows)['good_fraction'])


def advanced_failed_span():
    result = trace_investigation.experiment(fail_b=True)
    b = next(s for s in result['spans'] if s['name'] == 'B')
    return pick((b['status'], result['request_status']), {('error', 'error'): 'It is kept, with status error'})


def advanced_path():
    with loopback() as base:
        return str(get(base, '/metrics')[0])


def advanced_bad_n():
    with loopback() as base:
        return str(get(base, '/work?n=abc')[0])


FACTS = {
    'measurement-contract/2': measurement_contract, 'latency-percentiles/2': latency_percentiles,
    'golden-signals/2': golden_signals, 'trace-spans/2': trace_spans, 'context-propagation/2': context_propagation,
    'histogram-buckets/2': histogram_buckets, 'sli-slo-budget/2': sli_slo_budget,
    'burn-rate-alerts/2': burn_rate_alerts, 'benchmark-design/2': benchmark_design, 'profiling/2': profiling,
    'incident-runbook/2': incident_runbook, 'telemetry-release/2': telemetry_release,
    'stage/foundation/1': foundation_max, 'stage/foundation/2': foundation_zero,
    'stage/foundation/3': foundation_status,
    'stage/intermediate/1': intermediate_burn, 'stage/intermediate/2': intermediate_full_target,
    'stage/intermediate/3': intermediate_fraction,
    'stage/advanced/1': advanced_failed_span, 'stage/advanced/2': advanced_path, 'stage/advanced/3': advanced_bad_n,
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
        sys.exit('Observability & Performance checkpoint facts failed:\n' + '\n'.join(failures))
    print(f'PASS: {len(FACTS)} Observability & Performance checkpoint answers checked against the course labs; '
          f'{len(SOURCED)} cited from the lessons.')


if __name__ == '__main__':
    main()
