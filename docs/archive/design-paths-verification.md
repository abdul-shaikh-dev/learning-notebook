# Design paths verification — 2026-09-26

Added Design Patterns (22 lessons) and System Design (24 lessons). Each has three stages/projects, three interactive traces, lesson exercises/checkpoints, worked references and printable coverage.

## Evidence

- Design Patterns: 25 runnable Python example/solution snippets plus one comment-only diagram checked; 14 workshop behavioral tests passed.
- System Design: calculator demo and seven unittest methods passed, including invalid values, capacity rounding, burst/drain and request-budget arithmetic.
- Shared reader suite: 159 programming/design lessons checked; right/wrong quiz feedback, stage membership, downloadable files, printable lesson solutions and all project references verified.
- Full existing financial and catalog checks passed; portable build produced 61 files.
- Browser review: Design Patterns overview and Strategy trace; phone width 390px without page overflow; System Design overview/downloads and printable pack with 24 worked solutions and three project references.

## Limits

The pattern workshop is sequential and in-memory. Its tests do not prove a real database, concurrency or durable event-delivery contract. The system-design calculator performs stated arithmetic; it is not a load test or production sizing tool. Architecture exercises are reviewable design practice, not executed distributed infrastructure. Source references and assumptions are in each path.
