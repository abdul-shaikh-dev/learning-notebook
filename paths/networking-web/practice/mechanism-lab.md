# Optional mechanism lab

Read the worked lesson, then use this optional lab to try the mechanism yourself.

Requirements: Python 3.11+ standard library; permission to bind an ephemeral loopback TCP port.

From the extracted practice folder:

```
python tcp_framing.py
```

Expected: PASS covers valid split/coalesced UTF-8 frames, empty EOF, truncated EOF and the 64-byte frame limit.

Read `tcp_framing.py` to follow the assertion sequence. An assertion failure is evidence
to investigate, not a prompt to weaken the expected outcome. Use the changed case
in the linked lesson to explain why the outcome follows.

## Cleanup and scope

Sockets and worker threads close on success or failure; no server remains running and no files are written. Reads/connection acceptance have three-second bounds. The newline parser is a teaching protocol, not HTTP framing or a production streaming implementation.

## Primary references

Mechanism documentation checked 2026-10-02; execution evidence is separate.

- https://docs.python.org/3/library/socket.html

## Execution evidence

Executed on Windows with Python 3.14 on 2026-10-02: every bundled assertion passed. This establishes the described local mechanism, not a production deployment.
