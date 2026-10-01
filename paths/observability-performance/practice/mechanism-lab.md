# Optional mechanism lab

Read the worked lesson, then use this optional lab to try the mechanism yourself.

Requirements: Python 3.11+ standard library.

From the extracted practice folder:

```
python trace_investigation.py
```

Expected: Two measured JSON timelines, one success and one error, followed by PASS for timeline bounds and error evidence. Timings vary.

Read `trace_investigation.py` to follow the assertion sequence. An assertion failure is evidence
to investigate, not a prompt to weaken the expected outcome. Use the changed case
in the linked lesson to explain why the outcome follows.

## Cleanup and scope

Worker threads finish and no service or files remain. The two synthetic dependency operations sleep rather than contact external systems. Manual monotonic spans demonstrate overlap and error evidence; no collector, cross-process tracing or production benchmark is claimed.

## Primary references

Mechanism documentation checked 2026-10-02; execution evidence is separate.

- https://docs.python.org/3/library/time.html

## Execution evidence

Executed on Windows with Python 3.14 on 2026-10-02: every bundled assertion passed. This establishes the described local mechanism, not a production deployment.
