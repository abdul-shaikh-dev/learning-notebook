# Verification record — 2026-09-30

Executed locally on Windows / Python 3.14.0:

- `python telemetry.test.py`: 7 checks passed (nearest rank, nonmutation, invalid values, unknown empty data, good-event boundary/failed-fast outcomes, burn rate, status validation).
- `python integration.test.py`: real loopback HTTP check passed for 200/503 outcomes and the injected slow response. Its child server was terminated after the run.
- `python benchmark.py`: equivalent outputs checked for 5,000 records and 1,001 queries. Seven lookup-only batches measured; one run had linear median about 87.3ms and indexed median about 0.030ms. Index construction is excluded; these numbers are environment-specific.
- `python -m cProfile -s cumulative benchmark.py`: executed; linear lookup generator dominated the captured workload. Profiled timings were not used as the benchmark claim.
- Three actual four-worker/20-request loopback load runs were executed and the server stopped. Healthy profile p95 about 104.9ms, slow profile p95 about 151.5ms, fail profile p95 about 94.9ms. Each run had 20 observations; fail returned four 503s. The healthy profile still had four measured durations over the illustrative 100ms threshold, demonstrating why intentional service delay is not the complete client duration and a profile name is not an SLO guarantee. Slow profile lowered achieved throughput in this closed-loop test.

No production database, OpenTelemetry SDK/collector, real distributed context, backend retention, alert delivery or production-capacity test was executed. The duration estimator is nearest rank; 20 observations do not establish a stable population tail. Local sleeping fault injection is not proof of a real dependency root cause.
