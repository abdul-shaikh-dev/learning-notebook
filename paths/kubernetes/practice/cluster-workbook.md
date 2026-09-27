# Cluster evidence workbook

## Foundation object trace
Draw Deployment→ReplicaSet→Pod and Service→ready EndpointSlices. Record desired versus available counts; map Pending, unavailable local image and HTTP readiness failure to their separate boundaries. Compare selector/label/port values in workload.json. Record the dedicated context and loopback server before any optional cluster operation.

## Intermediate controlled drills
1. Explain startup /live versus readiness /ready. In the opted-in lab, choose an actual Pod and create /tmp/not-ready with a reviewed exec command; observe ready 503 / live 200 and removal from ready eligibility, then remove that exact gate and observe recovery.
2. Build/load a separately changed compatible local image v2. Update the desired Pod template, capture old/new ReplicaSet identities and ready counts, then restore a compatible prior image. The supplied Python tests only simulate labels; record whether distinct images were actually run.
3. Apply optional RBAC only after reviewing scope; verify a Pod read is allowed and Secret read is denied using the local identity/impersonation mechanism.
4. For NetworkPolicy, record the enforcing CNI and actual allowed/denied Pod client results. If no enforcing plugin is installed, mark this reviewed only.

## Advanced selected operational evidence
Storage: inspect class/access/reclaim/permissions; retain a known synthetic file after Pod replacement; separately plan off-cluster backup/restore.
Job: record version-check completion, bounded failure and logs; explain why external effects still need idempotency.
HPA: record resource metrics and CPU requests, actual observed scale and 2..4 bounds; don't claim scale from apply alone.
Disruption: separate voluntary eviction, rolling template updates and abrupt node failure. Explain what minAvailable 1 protects.
Helm: generate your own chart folder; lint/render without installation, then compare labels/ports/probes to the baseline contract.
GitOps: draw desired-state source → reconciler→API and a drift/revert timeline. No controller installation is required for the paper exercise.
Recovery: inventory Git state, protected secret references, etcd state, PVC backing stores and external databases separately. Define supported backup/restore and business assertions for each.

Reference conclusions: Service DNS can resolve with no healthy endpoints; ConfigMap environment updates need new process instances; RWO is a node access mode, not an exclusive one-Pod transaction lock; a PDB does not fix two replicas on one failed node; etcd restore does not restore external SQL rows. Final packet includes executed observations, planned experiments and production gaps without claiming local kind is a production platform.
