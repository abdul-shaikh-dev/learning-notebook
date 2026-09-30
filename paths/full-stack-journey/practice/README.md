# Full-stack study planner

One flat folder contains the complete React frontend, .NET API, SQL schema,
contract tests and milestone workbook. START-HERE.txt links each stage.

## Tools and first run

Use .NET 10 SDK, Node 24/npm, Python 3.11+, and optionally SQL Server plus sqlcmd/SSMS.
The API has no login and serves synthetic single-user data only on loopback.
The notebook on GitHub Pages is the learning material; Pages cannot host this API.

Terminal A, extracted folder:
```
dotnet run --project Planner.csproj --urls http://127.0.0.1:5087
```
Terminal B, same folder:
```
npm ci --ignore-scripts
npm test
npm run build
npm run dev
```
Visit http://127.0.0.1:5173 . Create SQL study with 25 minutes; mark Complete.
Vite proxies /api to the loopback API, so this route is same-origin in the browser.
Terminal C: `python acceptance.py http://127.0.0.1:5087`.
Expected: a PASS line for validation and concurrent stale writes. It adds synthetic
tasks, so use an owned learning instance. Ctrl+C stops both application terminals.
Memory mode loses tasks on API restart; this is deliberate stage-one behavior.

## SQL Server milestone

Create a NEW dedicated database named NotebookPlannerLab using SSMS. Run schema.sql
in that database. The API deliberately does not create databases or change schemas.
Use the exact server/instance name you used in SSMS (or query SELECT @@SERVERNAME). Replace .\SQLEXPRESS below if yours differs. Stop the API. In PowerShell, set this local learning connection and restart:
```
$env:PlannerConnection='Server=.\SQLEXPRESS;Database=NotebookPlannerLab;Integrated Security=True;Encrypt=True;TrustServerCertificate=True'
dotnet run --project Planner.csproj --urls http://127.0.0.1:5087
```
TrustServerCertificate is only a local self-signed-certificate convenience. A real
deployment requires a verified server certificate, least-privilege credentials and
secret storage. On Linux, export PlannerConnection with your owned SQL endpoint and
appropriate SQL authentication; do not commit passwords. Integrated Windows auth is
not portable to every environment.
Check /health: storage must be sql-server. Repeat acceptance.py, stop/restart API,
and verify tasks remain. SELECT Id,Title,Minutes,Done,Version FROM dbo.StudyTasks in
SSMS confirms persisted values. The UPDATE uses the expected version in its WHERE
clause; two competing version-1 updates cannot both succeed.

## Assessment versus supplied code

The working reference covers create, list, completion, validation, stale conflicts,
request metadata logging and SQL persistence. The workbook asks YOU to add filtering,
verified login/ownership, idempotent create, trace propagation, CI and recovery.
Those are deliberately separate extensions with acceptance criteria, not features
claimed by this reference. No cloud account, real identity provider or paid deployment
is needed for the baseline. Run reference checks before editing, then add your own.

## Cleanup

Stop the API and Vite; clear PlannerConnection in your current shell. Keep or remove
only your dedicated NotebookPlannerLab database after verifying its name and contents
in SSMS. No lesson requires removing an existing database. npm dependencies/build output
can be discarded from your extracted practice folder. Never publish its credentials.
