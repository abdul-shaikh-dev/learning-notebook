# System Design practice

Study entirely offline with the workbook and ADR template. No cloud account, credentials or paid service is needed.

For executable calculations, place capacity_calculator.py and test_capacity_calculator.py in one folder with Python 3.10+ installed:

```text
python capacity_calculator.py
python -m unittest -v test_capacity_calculator.py
```

On some systems the executable is py or python 3. The scripts use only the standard library. Import calculator functions into a separate scratch script to vary assumptions; no arguments or files are modified by the default run.

The reference functions cover daily/peak traffic, payload bandwidth, average in-flight work, retained bytes, instance arithmetic, fluid backlog/drain and request-based SLO budgets. Finite numeric inputs and domain bounds are validated. Fractional arithmetic uses ordinary floating point; tiny rounding residue in an error budget is possible. Extremely large values are outside the intended human-scale teaching scenarios.

Important boundaries:

- Decimal GB = 1,000,000,000 bytes; not GiB.
- Little's Law calculation uses consistent long-run means in a stable system; not p 99 or a benchmark.
- Instance calculations assume identical independent capacity and uniform load; shared bottlenecks and burst variance are excluded.
- Backlog arithmetic assumes constant rates. None means a positive backlog cannot drain under the supplied rates.
- Storage excludes backups, transaction logs, compression and temporary space unless modeled separately.
- Error budget counts eligible requests, not downtime minutes.
- Tests verify calculation examples, boundary cases and validation. They do not run a database, distributed system, network load test or security assessment.


## Threat-model extension

Complete `threat-model-worksheet.md` for the booking design. Record planned versus executed tests and repeat after trust-boundary changes.

## Optional booking lab

`booking-lab.md` links a runnable SQLite last-seat race, idempotency replay, injected rollback and outbox relay crash to the workbook timeline. Run `python -m unittest -v test_booking_lab.py`.
