# Observability & Performance practice

Requirements: Python 3.11+ standard library, two terminals for interactive load runs. Extract all files into the same folder. No packages, credentials or paid services are needed.

```
python telemetry.test.py
python integration.test.py
python benchmark.py
python -m cProfile -s cumulative benchmark.py
python service.py
```

In another terminal:

```
python load.py --profile healthy
python load.py --profile slow
python load.py --profile fail
```

Stop service.py with Ctrl+C. integration.test.py starts and terminates its own server; do not run it while an interactive server occupies port 8891. The fixed target is loopback and the load is bounded to 20 requests / four workers. Healthy responses intentionally sleep 10 ms; every fifth slow response sleeps 150 ms; every fifth fail response returns 503. Timings are actual elapsed measurements and vary with the machine. A nearest-rank percentile over 20 observations is educational, not a stable production tail estimate.

benchmark.py checks equivalent outputs and times seven warmed repeated lookup batches. It excludes dictionary construction; add a separate end-to-end benchmark before claiming benefit for single-use indexes. It never asserts a universal speedup threshold.

Foundation: define boundaries and interpret percentiles with `python telemetry.test.py AnalysisTests.test_nearest_rank AnalysisTests.test_does_not_mutate AnalysisTests.test_invalid`. Good-event checks follow in the intermediate SLO lessons. Intermediate: compare local distributions, calculate SLO budget use and design bounded labels. Advanced: produce a runbook, measure an optimisation with correctness checks and document pipeline loss/security policy.

Execution scope: standard-library local HTTP, duration analysis, failure injection and lookup timing. OpenTelemetry SDK/collector deployment, real distributed propagation, backend retention, actual alert delivery, cloud infrastructure and production load are learner extensions and are not verified by these scripts.

References are linked per lesson; OpenTelemetry, Prometheus, Google SRE, Python and MDN primary documentation checked 2026-09-30. Recheck versioned APIs before choosing an SDK or monitoring backend.

## Optional mechanism extension

See [mechanism-lab.md](mechanism-lab.md) for `trace_investigation.py`: Two measured JSON timelines, one success and one error, followed by PASS for timeline bounds and error evidence. Timings vary.

Requirements: Python 3.11+ standard library.


## Reference scope and verification limits

The source review dates record checks against the conceptual documentation. The downloadable lab measures behaviour with the Python standard library. It does not use an OpenTelemetry SDK or deploy production monitoring.
