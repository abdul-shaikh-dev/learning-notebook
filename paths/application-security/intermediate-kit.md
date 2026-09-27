# Validated content and session defense portfolio

Demonstrate text encoding, SQL parameter binding, session lifecycle and a CSRF decision with negative assertions.

## Run from the extracted folder

```
python -B -m unittest -v test_security_lab.ValidationTests test_security_lab.SessionTests
```

Expected: Five methods pass: content boundaries, HTML encoding, SQLite binding, session lifecycle and CSRF denials.

## Implement and submit

1. Run ValidationTests and SessionTests.
2. Test malformed shapes, exact title boundaries and control characters.
3. Compare encoded HTML text and a literal injection-shaped SQL search.
4. Verify rotation, exact expiry and logout.
5. Reject missing/wrong/cross-session/malformed Unicode CSRF tokens.
6. Write a route contract identifying browser/HTTP tests still needed.

## Reference approach

Use the bounded title parser, HTML text-node encoder and SQLite placeholder binding; do not reuse HTML escaping for other sinks. Control time explicitly for session rotation/expiry/logout. Session tokens are random and CSRF checks fail safely for malformed supplied text. Run the two suites and record expected versus observed results. HTTP route calls, cookie attributes and real browser requests remain separately verified extensions.

## Evidence rubric

- Synthetic attack strings remain data in the documented contexts.
- SQL binding executes against a real in-memory SQLite fixture.
- Expired/revoked sessions and wrong CSRF tokens fail.
- Local methods are not presented as browser or cryptographic integration.
