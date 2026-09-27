# Release evidence workbook

## Foundation: observable local service
Record Python/tool versions and the exact 12 test outcomes. Draw source→tests→artifact→config→process→user request. List the loopback/data boundaries and one invariant. Capture /version, /live, /ready and a synthetic note create/read. Explain what the checksum does and does not prove.

## Intermediate: candidate and rollback
Record Docker availability; if absent, mark commands reviewed only. If opted in, build the actual Dockerfile, inspect user/health, run v1 and a separately changed compatible v2 image, record image identity and smoke results. Classify application/config/schema changes and state rollback feasibility. Complete the React/.NET/SQL integration plan separately; never label the Python stand-in as the full stack.

## Advanced: operational packet
SLI: eligible events, good outcome, source, window, target and release attribution.
Workload: environment, arrival model, payload, dataset, count/concurrency, errors and latency samples.
Recovery: snapshot identity/time, isolation target, integrity/business assertions, observed recovery duration and missing writes.
Incident: time→observation→decision→effect; separate observed cause from hypothesis.
Release record: source, artifact digest, config revision, schema range, gate, prior artifact, recovery owner.

Reference arithmetic: 10,000 requests at 99.9% allows10 bad;12bad leaves -2 and burns1.2× budget. Counter interval from 100/2 to 220/5 is 120 requests and 3 bad, giving 2 requests/s and 2.5% bad over 60 seconds. A snapshot containing A before B was written restores A, not B. The same-code v1/v2 label restart test proves only unchanged-schema persistence; actual differing-artifact rollback is a separate exercise.

For each claim write: mechanism; named executed check; observed result; environment/runtime; untested boundary; next experiment. Completion means reviewable practice evidence, not production certification.
