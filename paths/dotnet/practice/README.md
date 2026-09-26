# C# and .NET practice projects

These three source files are complete replacements for generated Program.cs files. The project files are generated with the SDK, so no additional package is needed. They were tested with .NET SDK 9.0.318. Use a currently supported patched SDK; the learning path recommends .NET 10 LTS. To target .NET 10, change `-f net9.0` to `-f net10.0` in the commands. No .NET 10-only feature is used in these files, but the .NET 10 build was not verified here.

Download foundation.cs, task-api.cs, acceptance.cs and this README into one directory. Run the following commands from that directory. `Copy-Item` replaces only the freshly generated Program.cs files; choose new project names if those directories already contain your work.

## Foundation project

```powershell
dotnet new console -n Foundation -f net9.0
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
dotnet new web -n PracticeApi -f net9.0
Copy-Item ./task-api.cs ./PracticeApi/Program.cs
dotnet run --project ./PracticeApi --urls http://127.0.0.1:5086
```

In another terminal in the download directory:

```powershell
dotnet new console -n Acceptance -f net9.0
Copy-Item ./acceptance.cs ./Acceptance/Program.cs
dotnet run --project ./Acceptance -- http://127.0.0.1:5086
```

Expected: `PASS: 11 HTTP acceptance assertions.` The acceptance process throws and exits nonzero when an assertion fails. Tests create uniquely named tasks without deleting existing records. Stopping and restarting the memory server resets all data.

The API has validated title lengths, bounded ID-ordered pages, immutable task snapshots, synchronized state changes, version conflicts, structured problem responses, logs and a low-cardinality completion counter. Metrics require an external listener/exporter to observe them; no monitoring backend is configured. The `/health` route reports process responsiveness and memory storage, not database readiness.

This is a local, unauthenticated, memory-only learning baseline. Keep it bound to loopback. It does not claim durability, user isolation, distributed coordination or production readiness. The completion endpoint returns 200 with updated state; the earlier foundation API lesson used 204, so do not combine their acceptance contracts.

## Intermediate assessment extension

Replace the store with an EF Core SQLite implementation and a scoped context. Use compatible provider/tool versions for your target framework, add reviewed migrations, and retain the HTTP behavior. Add a real persistent concurrency token. Test restart persistence and a rollback from a new context. EF Core needs package restore; this extension is not included in the package-free baseline and was not run here.

## Advanced assessment extension

Configure real authentication and task ownership, enforce read/write policies, propagate request cancellation through database work, separate readiness from liveness, collect logs and metrics, and publish a release build. Add denial tests with a fake principal only inside a test host, then verify real token validation in staging. Measure a bounded list query under repeatable load and write a migration/rollback runbook. These extensions are assessed in the path; the baseline is a reference starting point, not their finished solution.

No installation, deployment, identity-provider setup or migration is performed by opening these files.
