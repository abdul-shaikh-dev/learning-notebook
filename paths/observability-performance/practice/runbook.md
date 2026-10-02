# Local investigation runbook

The learner running this experiment owns the test. It targets only 127.0.0.1:8891 and sends 20 requests through four closed-loop workers. Each request has a 3-second client timeout. No credentials or external services are involved.

1. Run analysis tests and the loopback integration test.
2. Start service.py. In another terminal run load.py --profile healthy and record elapsed seconds, achieved requests/s, p50/p95, counts and rows.
3. Run --profile slow. Every fifth numbered request sleeps about 150 ms instead of 10 ms. Compare the distribution; OS scheduling may add noise.
4. Run --profile fail. Every fifth request returns 503; verify four failed requests of 20. Failed requests are counted even when fast.
5. Recovery: rerun healthy and compare the same sample model. Stop service with Ctrl+C.
6. Record environment, commands, observed outputs and limitations. No real database, distributed context, collector, exporter, paging system or production capacity was exercised.

When no data is available, reliability is unknown. Do not report it as 100%. Investigate unavailable local service errors separately from HTTP 503 outcomes. Do not copy this bounded demonstration into an uncontrolled production load test.
