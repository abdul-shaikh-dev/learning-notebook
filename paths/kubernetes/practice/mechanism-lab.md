# Optional mechanism lab

This extends the existing course exercise. Read the worked lesson first; run this
only when you want to inspect the actual mechanism. No extra form is required.

Requirements: Python 3.11+, kubectl, and the existing disposable kind-notebook-lab from README.md with two Ready release-demo Pods.

From the extracted practice folder:

```
python readiness_drill.py
```

Expected: PASS reports same Pod UID, endpoint unready and unchanged restart count; RESTORED reports Ready again. No cluster is created by this script.

Read `readiness_drill.py` to follow the assertion sequence. An assertion failure is evidence
to investigate, not a prompt to weaken the expected outcome. Use the changed case
in the linked lesson to explain why the outcome follows.

## Cleanup and scope

The script refuses an existing gate, removes only its own /tmp/not-ready file in finally and waits for recovery. If kubectl/API access fails during cleanup, use the README context guard and remove that gate from the printed/selected lab Pod, then inspect readiness. Interruptions or Pod replacement can prevent recovery; read the error instead of claiming PASS. No cluster deletion is performed. Start with the supplied Service default publishNotReadyAddresses=false. Cluster execution has not been performed on this host for this extension.

## Primary references

Mechanism documentation checked 2026-10-02; execution evidence is separate.

- https://kubernetes.io/docs/concepts/workloads/pods/probes/
- https://kubernetes.io/docs/reference/kubernetes-api/discovery/endpoint-slice-v1/
