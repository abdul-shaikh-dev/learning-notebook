# Delivery and operations lab

Start with the existing JavaScript/TypeScript/React (`react`), C#/.NET (`dotnet`) and SQL Server (`sql-server`) paths as appropriate. This kit supplies an independent Python/SQLite stand-in plus a concrete integration runbook for those three technologies. It does not supply a completed persistent/authenticated .NET API or a production hosting system.

## Executed local boundary

Python 3.11 or newer, standard library only. Extract all files together into a fresh practice folder:

```powershell
python -m unittest -v test_release_app.py test_release_tools.py test_distinct_artifact_drill.py
python release_tools.py slo --total 10000 --errors 12 --target 0.999
python release_tools.py digest release_app.py
python release_app.py --port 8080 --db notes.db --version v1 --ready-file not-ready
```

Tests create random loopback ports and temporary databases and remove them afterward. Manual server execution creates notes.db in this folder and preserves it. In a second terminal:

```powershell
Invoke-RestMethod http://127.0.0.1:8080/version
Invoke-RestMethod http://127.0.0.1:8080/ready
Invoke-RestMethod http://127.0.0.1:8080/notes -Method Post -ContentType application/json -Body '{"title":"synthetic release note"}'
Invoke-RestMethod http://127.0.0.1:8080/notes
python release_tools.py load http://127.0.0.1:8080/version --count 50
python release_tools.py backup notes.db snapshot-1.db
```

Create the file `not-ready` in this practice folder to make /ready return 503; /live continues returning 200. Remove that exact file to recover. Stop the server with Ctrl+C before replacing its database or release. Service tests cover health distinction, validation/parameterization, simulated release-label restart/rollback with unchanged code/schema, independent backup records, safe payload omission in logs/metrics and missing routes. Helper tests cover budget inputs/math, hashes, redirect refusal and nearest-rank sample percentile. The test suite does not build different binary versions.

Run `python distinct_artifact_drill.py` for a guided separate-source-artifact exercise without Docker. It makes a reviewed one-line v2 change in a temporary copy of `release_app.py`, records different SHA-256 hashes, runs v1/v2/v1 as separate processes against the same SQLite file, holds v2 at readiness 503 before admitting user traffic, and checks the retained note after rollback. The JSON reports a note-read SLI whose denominator includes only the three admitted `/notes` reads. Inspect the script and output before claiming completion; it does not measure production traffic or schema rollback.

## Optional Docker exercise

Docker Engine with Linux containers and image download access is required. No daemon was started by this path's verification. From this extracted folder:

```powershell
docker build -t notebook-release:v1 .
docker run --rm --name notebook-release-lab -p 127.0.0.1:8080:8080 notebook-release:v1
# Another terminal:
docker inspect notebook-release-lab --format '{{.Config.User}}'
docker inspect notebook-release-lab --format '{{.State.Health.Status}}'
Invoke-RestMethod http://127.0.0.1:8080/version
docker stop notebook-release-lab
```

Expect user 10001:10001; readiness must become healthy after startup. Docker tests execute in a build stage; the runtime copies only the app. The /tmp database is disposable with this run command. Add a separately reviewed writable volume and prove its permissions/replacement behavior before claiming persistence. Resolve/pin a verified base-image digest as an assessment extension; the readable python:3.13-slim tag is mutable.

For a container rollout, build each reviewed source tree into its own image, record immutable image IDs/digests, run health and user smoke gates, then roll back to the retained v1 image against compatible data. Keep container evidence distinct from the Python process drill.

## Evidence and limitations

The Python server is unauthenticated and uses http.server, which is not a production web server. Keep it on loopback or the dedicated local cluster. /metrics is JSON counters including health/metrics traffic, not a production exporter or eligible-user SLI. The load helper disables proxies/redirects, rejects credentials/fragments and limits each response read to 64 KiB; its focused test proves a redirect target is not visited. It is bounded sequential closed-loop timing, not a capacity benchmark. Backup restores are synthetic SQLite checks, not SQL Server recovery or off-host disaster recovery. Real TLS, secrets, identity, collectors, proxies and deploy/rollback tooling remain integration work.

ci-example.yaml is an opt-in learning workflow template for a new repository with these files at root. It checks and uploads source files only, has no deployment credentials and was not installed or run by opening this kit. Its current official action tags are readable; production use pins independently verified commit SHAs, applies upgrades and checks runner compatibility. Consult the linked official action repositories when enabling it.

## Optional mechanism extension

See [mechanism-lab.md](mechanism-lab.md) for `schema_coexistence.py`: PASS confirms coexistence, late old write, dual-write/backfill and expected old-reader failure after DROP.

Requirements: Python 3.11+ with SQLite 3.35+; standard library only.
