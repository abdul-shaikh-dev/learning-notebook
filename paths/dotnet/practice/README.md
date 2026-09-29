# C# and .NET practice projects

These three source files are complete replacements for generated Program.cs files. The project files are generated with the SDK, so no additional package is needed. .NET 10 is the target used by the repository verification script and release workflow. Use a currently supported patched .NET 10 SDK. The package-free sources were originally checked with SDK 9.0.318; release verification now targets net10.0.

Download foundation.cs, task-api.cs, acceptance.cs and this README into one directory. Run the following commands from that directory. `Copy-Item` replaces only the freshly generated Program.cs files; choose new project names if those directories already contain your work.

## Foundation project

```powershell
dotnet new console -n Foundation -f net10.0
Copy-Item ./foundation.cs ./Foundation/Program.cs
dotnet run --project ./Foundation
```

Expected output:

```text
2: Practice
3: Review
PASS: 4 foundation assertions.
```

Extend it with a lookup method and an explicit missing-task result. Keep title validation in the constructor and show that an empty collection is handled without throwing.

## Intermediate API baseline

```powershell
dotnet new web -n PracticeApi -f net10.0
Copy-Item ./task-api.cs ./PracticeApi/Program.cs
dotnet run --project ./PracticeApi --urls http://127.0.0.1:5086
```

In another terminal in the download directory:

```powershell
dotnet new console -n Acceptance -f net10.0
Copy-Item ./acceptance.cs ./Acceptance/Program.cs
dotnet run --project ./Acceptance -- http://127.0.0.1:5086
```

Expected: `PASS: 11 HTTP acceptance assertions.` The acceptance process throws and exits nonzero when an assertion fails. Tests create uniquely named tasks without deleting existing records. Stopping and restarting the memory server resets all data.

The API has validated title lengths, bounded ID-ordered pages, immutable task snapshots, synchronized state changes, version conflicts, structured problem responses, logs and a low-cardinality completion counter. Metrics require an external listener/exporter to observe them; no monitoring backend is configured. The `/health` route reports process responsiveness and memory storage, not database readiness.

This is a local, unauthenticated, memory-only learning baseline. Keep it bound to loopback. It does not claim durability, user isolation, distributed coordination or production readiness. The completion endpoint returns 200 with updated state; the earlier foundation API lesson used 204, so do not combine their acceptance contracts.

## Intermediate assessment extension

Replace the store with an EF Core SQLite implementation and a scoped context. Use compatible provider/tool versions for your target framework, add reviewed migrations, and retain the HTTP behavior. Add a real persistent concurrency token. Test restart persistence and a rollback from a new context. EF Core needs package restore; the guided executable below supplies a separate package-based scaffold. Migration generation and review remain learner work.

## Advanced assessment extension

Configure real authentication and task ownership, enforce read/write policies, propagate request cancellation through database work, separate readiness from liveness, collect logs and metrics, and publish a release build. Add denial tests with a fake principal only inside a test host, then verify real token validation in staging. Measure a bounded list query under repeatable load and write a migration/rollback runbook. These extensions are assessed in the path; the baseline is a reference starting point, not their finished solution.

No installation, deployment, identity-provider setup or migration is performed by opening these files.

## Guided SQLite and authorization test host

Download PersistenceChecks.csproj, persistence-api.cs and persistence-checks.cs beside this guide. Run:

```powershell
dotnet run --project ./PersistenceChecks.csproj -c Release
```

The project pins EF Core SQLite and ASP.NET Core TestHost 10.0.9 for .NET 10. The native SQLite dependency is explicitly pinned to SQLitePCLRaw.lib.e_sqlite3 3.53.3 to avoid the older transitive native-library vulnerability flagged by NuGet restore. It runs 15 assertions against a temporary disk SQLite database and in-process HTTP server: blank input; anonymous 401; authenticated permission denial 403; owner creation/read/write; cross-owner read/write denial; stale HTTP version; host restart persistence; failed second audit write and fresh-context verification of both task and audit tables; competing-context version conflict; and pre-canceled database query. The printed count is the executed evidence. It deletes its own temporary database after the host closes. Package restore requires NuGet access. Recheck patched package versions together when upgrading.

The fake header identity exists only in persistence-checks.cs, which creates a Testing host. It does not validate tokens, signatures, issuer, audience, expiration or identity-provider integration. This proves policy/ownership decisions for known principals, not real authentication security. No secrets or remote service are required. Replace that host setup with real bearer authentication in a separately configured staging application, then test expired/wrong issuer/wrong audience tokens before production.

This is a focused guided extension, not a drop-in replacement preserving every endpoint in task-api.cs. It uses EnsureCreated solely for a fresh disposable test database, not migrations or production startup. Next: generate/review migrations in a separate project; add bounded owner-filtered lists; preserve the baseline HTTP contract; test malformed inputs and overlapping HTTP writes; add readiness, logging, load evidence and a migration/rollback runbook. The pre-canceled query checks token propagation, not timing or interruption of an already running database operation. SQLite evidence applies to SQLite and does not establish behavior of another production provider.

## Guided path from the memory API to the advanced service

1. Complete the SQL Server foundation lessons on table grain, primary/foreign keys, joins and transactions before changing the store. Use `paths/sql-server/README.md` and `setup.sql` for that relational vocabulary; the SQLite scaffold here uses the same concepts with a different provider.
2. Run the memory API and its HTTP acceptance client. Record the contract: title validation, paging, version conflicts and restart loss. Run `PersistenceChecks.csproj` separately. Its task/audit test now saves the task, fails the second audit write on a unique key, rolls back, and queries both tables from a new context.
3. Replace the memory store in a copy of the API, add migrations, and retain the same HTTP assertions. Test a fresh database upgrade and an existing database upgrade. `EnsureCreated` in the disposable scaffold is not a migration.
4. Add owner checks and policies at every read and write. Keep the fake header principal in the test host only. Capture anonymous, denied, cross-owner and stale-write responses, plus restart and rollback evidence.
5. For the advanced hand-in, show the exact code and output for cancellation, readiness, bounded lists, logs/metrics, a release build, migration review and rollback procedure. Mark real token validation and production load as unverified until exercised in staging.

Sources: [EF Core transactions](https://learn.microsoft.com/en-us/ef/core/saving/transactions), [EF Core migrations](https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/).
