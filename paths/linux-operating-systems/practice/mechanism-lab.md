# Optional mechanism lab

Read the worked lesson, then use this optional lab to try the mechanism yourself.

Requirements: Python 3.11+ inside an existing Linux/WSL distribution with /proc mounted; no sudo.

From the extracted practice folder:

```
python3 linux_fd_drill.py
```

Expected: JSON shows EMFILE reached, before=after_cleanup and reopen=ok; PASS confirms child-only limits. Windows direct execution reports SKIP.

Read `linux_fd_drill.py` to follow the assertion sequence. An assertion failure is evidence
to investigate, not a prompt to weaken the expected outcome. Use the changed case
in the linked lesson to explain why the outcome follows.

## Cleanup and scope

All descriptors belong to the child and are closed in finally; the parent never changes its resource limits. The script writes no files and requires no elevated privilege. Exact counts depend on inherited descriptors. Direct Windows execution is a skip, not Linux evidence; run inside your existing WSL/Linux environment to establish kernel behavior.

## Primary references

Mechanism documentation checked 2026-10-02; execution evidence is separate.

- https://docs.python.org/3/library/resource.html

## Execution availability

Authoring-host WSL inventory contained only Docker Desktop service distributions, not a user Linux distribution. The source was syntax-checked; the Linux kernel drill was not executed. No distribution or service was installed.
