# Kubernetes local lab

Prerequisites: complete container/build/runtime boundaries in Delivery & Operations (`delivery-operations`), and use the existing React (`react`), .NET (`dotnet`) and SQL Server (`sql-server`) paths for their application/data concerns. This independent Python/SQLite demo is not that full stack. Use Python 3.11+ for offline checks; no packages/cluster/cloud account are required for them.

```powershell
python -m unittest -v test_release_app.py check_manifests.py
```

Eight service tests and four offline manifest-contract checks cover named local HTTP/storage and selected selector/port/security/namespace/optional-object properties. JSON files parse with standard Python; Kubernetes accepts JSON manifests directly. These checks are not API-schema admission, CNI enforcement, scheduling, storage or probe execution. The service test uses the same code with changed version labels; it does not prove differing-image rollback.

With PowerShell, `./test_lab_guard.ps1` separately executes seven guard behavior cases using a stub kubectl function. It rejects wrong contexts, remote endpoints and unmarked namespace cleanup, and verifies admitted command argument forwarding without starting kubectl or connecting to any cluster.

## Optional dedicated kind cluster (PowerShell)

Install current compatible Docker Engine/Linux containers, kind and kubectl from their official instructions. Record versions and keep kubectl within documented server skew. APIs use stable v1/apps/v1/batch/v1/networking.k8s.io/v1/rbac.authorization.k8s.io/v1/autoscaling/v2/policy/v1; Pod Security is pinned to restricted v1.34, so choose a compatible current supported Kubernetes node image. The author environment had no running Docker daemon/cluster; no cluster deployment was executed during verification.

Review every manifest first. These opt-in commands create only a new named local cluster and namespace. Do not reuse a shared or production context:

```powershell
kind create cluster --name notebook-lab
kubectl config current-context
# Must be kind-notebook-lab; lab.ps1 also requires a loopback API URL.
docker build -t notebook-release:v1 .
kind load docker-image notebook-release:v1 --name notebook-lab
./lab.ps1 -Action Bootstrap
./lab.ps1 -Action Validate
./lab.ps1 -Action Apply
./lab.ps1 -Action Status
```

Bootstrap persists only namespace.json, marked training-owner=notebook. This must precede namespaced server dry-run: a dry-run Namespace alone would not persist and cannot bootstrap later objects. Validate asks the actual local API for admission checks without persisting the workload; Apply persists it and waits for rollout. If rollout fails, inspect the actual boundary rather than disabling probes. All four app endpoints use the local image; imagePullPolicy Never requires the image loaded on the kind nodes.

In a separate terminal after successful rollout:

```powershell
kubectl --context=kind-notebook-lab -n notebook-lab port-forward service/release-demo 8080:8080 --address=127.0.0.1
```

Then call http://127.0.0.1:8080/version, /live and /ready. Read-only root filesystem and a /tmp emptyDir support the numeric non-root user. Each replica has independent scratch notes; use version/health for replicated exercises. This is not shared durable storage or a production web server.

## Focused optional manifests

Every optional operation must retain `--context=kind-notebook-lab -n notebook-lab` and the context/endpoint review. No optional add-on is installed automatically.

- `job.json`: `kubectl --context=kind-notebook-lab -n notebook-lab apply -f job.json`, then wait for Job completion and read its logs before its 300-second TTL. It checks Service DNS/HTTP with no external effects.
- `rbac.json`: viewer can observe Pods/logs, not secrets or mutating workloads. Use reviewed local-admin impersonation tests for allowed and denied rules; a fake impersonation result is not application bearer-token proof.
- `network-policy.json`: optional ingress isolation. Default kind networking does not establish enforcement. Configure a reviewed policy-capable local CNI separately, then compare labelled allowed and unlabelled denied client Pods. Applying the object alone is not a denial test. Port-forward behavior is not a substitute for these Pod-to-Pod tests.
- `storage.json`: a separate PVC and synthetic writer Pod. Requires a default compatible StorageClass/driver; inspect reclaim/ownership behavior. Delete only storage-demo, recreate it and compare /data/message. Do not delete the PVC to test Pod replacement. Local-node data is not disaster recovery.
- `hpa.json`: CPU utilization target 60%, bounds2..4; requires available resource metrics/Metrics Server and CPU requests. Unknown metrics are not proof of scaling. No metrics add-on is bundled.
- `disruption-budget.json`: minAvailable 1 for eligible voluntary eviction; no guarantee against node outages or all Deployment changes.
- `demo-secret.json`: fake-only token, not needed by baseline. Never replace it with real credentials in the public kit.

## Cleanup and evidence

For optional live positive/negative checks of NetworkPolicy, HPA and PVC, follow `optional-enforcement-track.md`. It names CNI, metrics and storage prerequisites, actual commands, expected observations and cleanup. Offline manifest checks do not satisfy that rubric.

Stop port-forward with Ctrl+C. After preserving needed evidence/data, `./lab.ps1 -Action Cleanup` deletes only the marked notebook-lab namespace in the verified local context. Namespace deletion also removes claims and can destroy their local data; decide before invoking. The cluster itself is retained. To remove the dedicated cluster later, explicitly review `kind delete cluster --name notebook-lab`; it destroys local cluster state.

Record API/client/node-image versions, applied/rendered object identities, rollout/probe events, client results and storage contents. Distinguish offline checks, API dry-run and live workload/CNI/storage evidence. Helm/GitOps lessons are render/reconciliation exercises; no chart/controller/CRD is installed by this kit. Production requires real identity, data/backups, network enforcement, telemetry, multiple failure domains, capacity, secure updates and a rehearsed recovery plan.

## Optional mechanism extension

See [mechanism-lab.md](mechanism-lab.md) for `readiness_drill.py`: PASS reports same Pod UID, endpoint unready and unchanged restart count; RESTORED reports Ready again. No cluster is created by this script.

Requirements: Python 3.11+, kubectl, and the existing disposable kind-notebook-lab from README.md with two Ready release-demo Pods.


## Reference scope and verification limits

References cover stable Kubernetes APIs and the official concepts reviewed for these lessons. Their review dates record when applicability was checked. Running a cluster is an optional local exercise; the kit README separately records what was actually executed.
