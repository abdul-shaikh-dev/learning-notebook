# Optional mechanism lab

Read the worked lesson, then use this optional lab to try the mechanism yourself.

Requirements: Python 3.11+ with SQLite 3.35+; standard library only.

From the extracted practice folder:

```
python schema_coexistence.py
```

Expected: PASS confirms coexistence, late old write, dual-write/backfill and expected old-reader failure after DROP.

Read `schema_coexistence.py` to follow the assertion sequence. An assertion failure is evidence
to investigate, not a prompt to weaken the expected outcome. Use the changed case
in the linked lesson to explain why the outcome follows.

## Cleanup and scope

A fresh temporary SQLite file is used and closed before directory removal. No existing release_app data is touched. The contraction deliberately breaks the old SELECT as an expected assertion. This is real SQLite migration behavior, not SQL Server locking, EF deployment or a production cutover test.

## Primary references

Mechanism documentation checked 2026-10-02; execution evidence is separate.

- https://www.sqlite.org/lang_altertable.html

## Execution evidence

Executed on Windows with Python 3.14 on 2026-10-02: every bundled assertion passed. This establishes the described local mechanism, not a production deployment.
