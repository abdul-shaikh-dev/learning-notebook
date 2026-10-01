# Linux & Operating Systems practice

Python 3.11+ standard library only. Extract the ZIP: all files are flat inside
linux-operating-systems-practice. Use `python`, `py`, or `python3` consistently
for your installation. Run from that folder:

```
python diagnostic_lab.py
python -m unittest -v test_os_labs.py
```

Expected demo: path -> configuration; permission -> access; timeout -> lifecycle;
bad-row -> application validation; child status=0 output=42; modeled backlog=120.
The eight tests check actual direct-child status, separated streams, literal
argument boundaries, timeout, invalid teaching bounds, diagnostic classification,
and modeled backlog growth/drain. Tests use the current interpreter only.

## Projects

1. Foundation: build an evidence notebook using working directory, literal paths,
   argument boundaries, stdout/stderr and statuses. Predict first; run trusted
   snippets; record interpreter version and differences from your prediction.
2. Intermediate: implement your own bounded trusted-child runner. Preserve a
   nonzero status, keep diagnostics separate, and test a deadline. Add a test
   proving invalid timeout values do not launch a child.
3. Advanced: create an importer incident report with timeline, evidence,
   hypothesis, minimal fix and recovery check. Compare a path/configuration
   failure against a row-validation failure. Complete optional Linux observations
   only if an existing disposable Linux environment is available.

## Truthful limits and cleanup

run_python executes **trusted** Python source: it is not an untrusted-code sandbox.
Its supplied snippets emit tiny fixed outputs and do not create grandchildren.
capture_output is not a generic bounded-output solution. timeout does not prove
cleanup of descendants or cancellation of business effects. The queue formula
is a constant-rate arithmetic model, not a scheduler/load test. Classification
uses constructed exceptions; it is not evidence of real Linux permission faults.
Linux-only commands are not executed by the portable suite. No sudo, installation,
service edits, arbitrary process termination or network access is required.
No persistent files are created by the portable demo/tests.

Record which platform commands you actually executed. Production security,
kernel resource limits and crash durability remain independent integration work.

## Optional mechanism extension

See [mechanism-lab.md](mechanism-lab.md) for `linux_fd_drill.py`: JSON shows EMFILE reached, before=after_cleanup and reopen=ok; PASS confirms child-only limits. Windows direct execution reports SKIP.

Requirements: Python 3.11+ inside an existing Linux/WSL distribution with /proc mounted; no sudo.
