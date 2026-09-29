# React + .NET + SQL release walkthrough

Visual companions in the notebook: [Browser, proxy, API and database topology](https://abdul-shaikh-dev.github.io/learning-notebook/index.html#topic/delivery-operations/web-topology). The original text traces below remain available for offline use.


This integration exercise uses your implementations from `react`, `dotnet` and `sql-server`. The complete stack is learner-built. The separate release_app.py kit runs immediately with standard Python; it is not evidence that this stack is deployed or authenticated.

## Topology and prerequisites

Browser HTTPS → reverse proxy/static host → React dist files
Browser /api/* → reverse proxy → ASP.NET Core API :8080
API → private SQL Server database using a restricted runtime identity
Separate migration runner → same database using reviewed schema permissions

Use synthetic data, a dedicated staging database and loopback publishing for local containers. Choose same-origin /api routing or explicitly review CORS/cookie/token policies for distinct origins. The database has no browser-facing port. Configure TLS/forwarded-header trust in the chosen proxy; do not accept arbitrary client-supplied forwarded headers.

## 1. Build the actual frontend

Extract the React kit into `integration/react`; run:

```powershell
cd ./integration/react
npm ci
npm test
npm run build
```

Record Node/npm versions, lockfile, commit and the output file hashes. The stock React kit uses a local demo Loader and needs a real /api adapter plus runtime validation and error handling for this integration. Implement and test it before asserting browser-to-server behavior. Its default query-parameter route needs no nested SPA path fallback; if you add path routes, configure only UI paths to return the shell and keep API error statuses intact.

## 2. Create/publish the API

From `integration/api`, download task-api.cs from the .NET kit as the initial source:

```powershell
dotnet new web -n PracticeApi -f net10.0
Copy-Item ./task-api.cs ./PracticeApi/Program.cs
dotnet build ./PracticeApi -c Release
dotnet publish ./PracticeApi -c Release -o ./out
```

The initial API is memory-only and unauthenticated. Complete the .NET persistent store/auth assessment: SQL Server EF provider or parameterized SQL, scoped context/service, persistent concurrency token, owner filtering, cancellation and real bearer validation. Retain the HTTP acceptance contract and add database integration/denial tests against the actual provider. The SQLite TestHost extension is a useful bridge but does not establish SQL Server isolation or real-token validation.

Create a Dockerfile in this separate `integration/api` folder:

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY out/ ./
ENV ASPNETCORE_URLS=http://+:8080
USER app
EXPOSE 8080
ENTRYPOINT ["dotnet", "PracticeApi.dll"]
```

Then `docker build -t notebook-api:reviewed-local .`. Review/pin the verified base digest and confirm non-root runtime permissions. This sample image is a runtime packaging example, not the repository's Python Dockerfile.

## 3. Review database/configuration and migration

Use a dedicated SQL Server database provisioned through your local/staging administration workflow. Container use requires explicit license acceptance and locally supplied administrator credentials; do not paste them into this document. The API should use a separate identity limited to necessary reads/writes. SQL Server schema permissions belong to a reviewed migration identity, not the normal API.

For a .NET project with EF Core SQL Server, matching EF/tool versions and reviewed migrations:

```powershell
dotnet ef migrations script --idempotent --project ./PracticeApi --output ./artifacts/migrations.sql
```

Create the artifacts directory first. Inspect SQL, locks, expected starting/ending schema and rollback implications. Apply only to the named staging database using an approved database tool/identity. This idempotent-script example is SQL Server-specific; SQLite does not provide the same facility. Test old/new API versions against the expanded schema, backfill synthetic data and leave destructive contraction for a later release after compatibility evidence.

Map your implemented API configuration key (for example ConnectionStrings__Tasks) to a private runtime secret reference. Setting an environment variable on the stock memory-only API does not magically implement persistence. Configure actual issuer/audience/trusted keys through the chosen identity provider and prove accepted, expired and wrong-audience behavior in staging. Never ship these credentials in Vite environment values: those values appear in client assets.

## 4. Deploy a candidate and prove the user journey

Package the exact checked React dist and API image; record their digest/source/config/schema association. Start the candidate behind the staging proxy with database access on the private network. Probe process liveness and true database readiness; then perform this synthetic flow:

1. Load the React screen from the staging origin and inspect the API destination.
2. Create a uniquely named note/task through the real adapter; record returned ID/version.
3. Read/update as its owner; assert another user cannot read/write it.
4. Reload the UI/direct link and verify durable server state.
5. Restart the API and repeat the read from a fresh connection.
6. Send a stale version and check the intended conflict status.
7. Compare release-attributed errors/latency over a declared eligible-request window.

If the candidate is not ready, fails ownership or loses state, stop promotion. Do not turn off probes/tests to complete the walkthrough. Record environment, timestamps and actual requests/results without credentials.

## 5. Rollback, restore and incident drills

Retain the prior React build/API image and compatible schema. Switch routing back to those exact approved artifacts, then repeat known-record/ownership smoke checks. This is actual artifact rollback evidence only when different artifacts were run; changing a version label alone is simulation.

Separately capture a supported SQL Server backup chain appropriate to the recovery model. Restore it into a new isolated database, run integrity/schema checks and verify synthetic record values through a compatible API. Measure restore time and missing-write interval; plan controlled cutover/reconciliation. Reverting a binary does not restore dropped columns or recover transactions after the snapshot.

For an incident drill, simulate a reviewed staging dependency/configuration failure, stop further rollout, assign lead, record observations, choose a compatible rollback or dependency fix, and verify user recovery. Close with one falsifiable improvement and its owner.

Primary references: Microsoft .NET container tutorial https://learn.microsoft.com/en-us/dotnet/core/docker/build-container ; EF migrations https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/applying ; trusted proxies https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/proxy-load-balancer?view=aspnetcore-10.0 ; SQL recovery https://learn.microsoft.com/en-us/sql/relational-databases/backup-restore/restore-and-recovery-overview-sql-server?view=sql-server-ver17 . Applicability reviewed 2026-09-27; this runbook was inspected, not executed as a full stack.
