# Networking & the Web stage projects

Each project is optional. Work through its stage lessons first. Try one changed case before opening the reference.

## Layered request and DNS worksheet

Implement URL-origin comparisons and offline DNS expiry, then explain where an HTTP response fits in the request journey.

Practice:

- Parse scheme/host/default port and reject credentials, fragments and unsupported schemes.
- Store an offline address with TTL and test just before and at expiry using injected time.
- Distinguish a resolved name, an available listener, an HTTP response and readable body bytes. Certificate identity checks follow in the intermediate stage.

Check your result:

- Examples include different scheme and port origins.
- TTL tests do not sleep or access a public resolver.
- The model is labeled incomplete and separate from real DNS.

Reference: Compare origin tuples and DnsCache lookups before and exactly at expiry. Run the two named ProtocolModels tests. The address is documentation-only; no DNS request occurs. Leave retry_allowed for methods-retries in the next stage.

## Loopback HTTP diagnostic client

Run a complete ephemeral local server/client exercise and classify transport, HTTP and body outcomes.

Practice:

- Use the supplied local_server context manager for its loopback port and cleanup; focus on client observations before changing server internals.
- Check GET, HEAD, ETag/304 and a missing route; save redirect policy for the advanced stage.
- Observe synthetic cookie issuance/private denial without claiming real authentication.
- Compare malformed 200 JSON with a 503 status; save the full schema decoder for body-contracts in the advanced stage.
- Permit retries only for the explicit safe-read policy with attempts and time left.

Check your result:

- Status, headers and content are asserted separately.
- HEAD and 304 have no body.
- The fixture owns its port, threads and cleanup.
- Evidence is HTTP/1.1 loopback, with no TLS or browser enforcement claim.

Reference: Use the supplied local_server and fetch helpers to compare GET, HEAD, conditional GET and cookie denial. Run the four selected tests, including the read-retry policy and TLS configuration assertions. The fixed cookie does not authenticate accounts; redirects and stalled responses are revisited in the advanced project.

## Bounded observation and cache review

Validate observations, cache public responses in the model and track retries against a deadline. Explain what the resulting tests establish.

Practice:

- Bound body size and require media type plus exact lesson/version schema.
- Reject private cache insertion and test exact freshness expiry with an injected clock.
- Stop new GET attempts after the attempt budget or overall deadline.
- Record only status/attempt metadata and classify final failure.
- Explain real-TLS, browser/CORS, real-DNS and proxy drills still needed.
- Use the supplied /stall fixture to observe a client timeout, and inspect a 307 before deciding whether to follow it.

Check your result:

- Malformed syntax, incompatible types and wrong media type each reject.
- User-specific output is not placed in the shared model cache.
- Three transient failures cause exactly three calls.
- An exhausted deadline causes no new dispatch.
- Callback timeouts, backoff and complete HTTP caching remain named extensions.

Reference: network_resilience.py implements the observation decoder, private-excluding SharedCache and bounded_get with an injected clock. ResilienceTests checks contract errors, cache expiry and retry counts; ProtocolModels only verifies default TLS settings. The retry callback must itself be bounded and this model has no jitter or production HTTP cache parser.
