# Inspect an HTTP boundary

With the course's .NET10 SDK, run `dotnet run --project BoundaryChecks.csproj` from the extracted practice root. It uses only framework libraries; no real URL is contacted because a scripted HttpMessageHandler handles every request. The example.invalid address is synthetic.

Expected final output: `PASS: HTTP adapter success, missing, malformed, failure and cancellation contracts.` Assertions cover route/method, legitimate zero, rejection before sending, missing fields, wrong ID, negative or text minutes,404,503 without retry, and cancellation after an explicit started signal. Any mismatch exits nonzero.

Read SessionClient first, then compare the fake handler boundary with the existing loopback task-api acceptance test. This check includes HttpClient adapter behavior but excludes server routing, transport, authentication and storage. JsonDocument raises JsonException for syntactically invalid JSON; semantic shape/value violations raise FormatException. Extra properties are allowed in this teaching protocol.

Independent extension: add a read-only two-attempt retry policy for503. Check503→200 gives two calls,503→503 gives two and fails,404 gives one, and cancellation stops further attempts. Do not reuse it for writes without an explicit side-effect/reconciliation contract.

The project defaults to net10.0. For a local compatibility experiment, copy these two files into a separate scratch directory and change the copied project target to an installed framework. That is not .NET10 release verification. No package installation or SDK update is required just to read this lesson.
