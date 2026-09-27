# Networking & the Web stage projects

Attempt each project before reading its reference. Record expected/observed results and a limitation for each important claim.


## Layered request and DNS worksheet

Implement and explain URL-origin policy, offline DNS expiry and a bounded read-retry decision.


Requirements:
- Parse scheme/host/default port and reject credentials, fragments and unsupported schemes.
- Store an offline address with TTL and test just before and at expiry using injected time.
- Distinguish DNS answers, listener availability, HTTPS identity and application body success.
- Permit retries only for the explicit safe-read policy with attempts and time left.


Rubric:
- Examples include different scheme and port origins.
- TTL tests do not sleep or access a public resolver.
- The model is labeled incomplete and separate from real DNS.
- POST is not repeated without an explicit operation contract.


Reference solution:
network_foundation.py implements the origin tuple, injected-time DnsCache and retry_allowed. ProtocolModels verifies normalization, rejection, exact TTL expiry and attempt policy. The example address is documentation-only and no DNS query is performed.


## Loopback HTTP diagnostic client

Run a complete ephemeral local server/client exercise and classify transport, HTTP and body outcomes.


Requirements:
- Bind only 127.0.0.1 on port zero and close resources on failure.
- Check GET, HEAD, ETag/304, relative 307 redirect and missing route.
- Observe synthetic cookie issuance/private denial without claiming real authentication.
- Reject malformed 200 JSON and classify 503.
- Use a readiness Event and delayed response to observe a real bounded client read timeout.


Rubric:
- Status, headers and content are asserted separately.
- HEAD and 304 have no body.
- Redirects are observed and not followed without policy.
- The fixture owns its port, threads and cleanup.
- Evidence is HTTP/1.1 loopback, with no TLS or browser enforcement claim.


Reference solution:
network_http.py supplies the complete server, bounded fetch and context-managed cleanup. LoopbackHttp exercises actual socket exchanges, including a blocked response released on cleanup. The cookie is fixed synthetic data; no credential service or real TLS exists.


## Bounded observation and cache review

Compose strict observation validation, public-only model caching and deadline-aware retry accounting, then defend what was measured.


Requirements:
- Bound body size and require media type plus exact lesson/version schema.
- Reject private cache insertion and test exact freshness expiry with an injected clock.
- Stop new GET attempts after the attempt budget or overall deadline.
- Record only status/attempt metadata and classify final failure.
- Explain real-TLS, browser/CORS, real-DNS and proxy drills still needed.


Rubric:
- Malformed syntax, incompatible types and wrong media type each reject.
- User-specific output is not placed in the shared model cache.
- Three transient failures cause exactly three calls.
- An exhausted deadline causes no new dispatch.
- Callback timeouts, backoff and complete HTTP caching remain named extensions.


Reference solution:
network_resilience.py implements the observation decoder, private-excluding SharedCache and bounded_get with an injected clock. ResilienceTests checks contract errors, cache expiry and retry counts; ProtocolModels only verifies default TLS settings. The retry callback must itself be bounded and this model has no jitter or production HTTP cache parser.


## Evidence note template

Revision/runtime: …
Command/fixture: …
Expected behavior: …
Observed result: …
Cause/fix or hypothesis: …
Unexecuted boundaries and next falsifying experiment: …
