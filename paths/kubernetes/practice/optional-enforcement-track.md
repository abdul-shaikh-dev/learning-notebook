# Optional live enforcement track

Run only in the dedicated `kind-notebook-lab` local context. `lab.ps1` guards that context; it does not create the cluster. Requires kubectl, kind, a local container runtime, an **enforcing NetworkPolicy CNI**, Metrics Server or another working resource-metrics API, a default StorageClass, and access to the synthetic client image. Kind's default networking alone is not evidence of NetworkPolicy enforcement. Never apply this to an arbitrary current context.

For a fresh disposable cluster, follow the [Cilium kind installation guide](https://docs.cilium.io/en/stable/installation/kind/) to create a kind config with `disableDefaultCNI: true`, then create it as `kind create cluster --name notebook-lab --config <reviewed-config.yaml>`. Install the documented compatible Cilium release and verify its status **before** `lab.ps1 -Action Bootstrap/Validate/Apply` from README.md. This differs from README.md's basic kind creation command, which uses kindnet and cannot prove policy enforcement. Follow the [Metrics Server installation/compatibility instructions](https://kubernetes-sigs.github.io/metrics-server/) for this cluster; verify `kubectl top pods` before applying HPA. If local kubelet certificates prevent metrics, use only a documented dedicated-local-cluster configuration or mark HPA unexecuted. Confirm the default StorageClass and PVC binding before claiming storage behavior.

Set a guarded kubectl invocation in PowerShell, then run the base lab and apply the existing policy, HPA and storage manifests only after their prerequisites are present:

```powershell
$ctx = 'kind-notebook-lab'
kubectl config current-context
kubectl --context $ctx -n notebook-lab get deploy release-demo
kubectl --context $ctx -n notebook-lab get --raw /apis/metrics.k8s.io/v1beta1/pods
kubectl --context $ctx get storageclass
kubectl --context $ctx apply -f network-policy.json
kubectl --context $ctx -n notebook-lab describe networkpolicy app-ingress
```

For policy evidence, run two disposable clients in the same namespace. The allowed client has the label named by `network-policy.json`; the denied client does not. Wait for both to become Ready, then execute the same command in each:

```powershell
kubectl --context $ctx apply -f policy-clients.json
kubectl --context $ctx -n notebook-lab wait --for=condition=Ready pod/allowed-client pod/denied-client --timeout=120s
kubectl --context $ctx -n notebook-lab exec allowed-client -- curl --max-time 3 -fsS http://release-demo:8080/ready
kubectl --context $ctx -n notebook-lab exec denied-client -- curl --max-time 3 -fsS http://release-demo:8080/ready
```

Expect the allowed request to return `{"ready":true}` and the denied request to fail or time out. If both succeed, stop and investigate the CNI, selector and policy enforcement before drawing a conclusion. A failed denied request alone could also be a DNS or readiness failure; the simultaneous allowed success is the positive control. Record Pod labels and EndpointSlices.

For HPA, first confirm `kubectl --context $ctx -n notebook-lab top pods` returns CPU readings and the Deployment has CPU requests. Apply `hpa.json`; observe `kubectl --context $ctx -n notebook-lab get hpa release-demo -w`. In a separate terminal, choose one release-demo Pod and run `kubectl --context $ctx -n notebook-lab exec <pod-name> -- python -c "import time; end=time.monotonic()+180; exec('while time.monotonic()<end: pass')"`. The process stops itself after 180 seconds even if the client disconnects. Watch actual CPU metrics and desired/current replicas; scaling can take minutes and depends on resource metrics and cluster capacity. Claim demonstrated scale only if metrics and replica changes are observed. The target range is 2–4; record observed values and scale-down delay. This synthetic CPU work does not model useful user traffic.

For PVC behavior, `kubectl --context $ctx apply -f storage.json`; wait for `pvc/lab-data` to bind and `pod/storage-demo` to become Ready. Write a **unique** token with `kubectl --context $ctx -n notebook-lab exec storage-demo -- python -c "from pathlib import Path; import uuid; p=Path('/data/unique'); p.write_text(uuid.uuid4().hex); print(p.read_text())"` and record its output. Delete **only** `pod/storage-demo`, reapply `storage.json`, and read the token with `kubectl --context $ctx -n notebook-lab exec storage-demo -- cat /data/unique`. The exact token must match; the manifest's default `/data/message` can be recreated on a fresh volume and is insufficient evidence. Compare PV/StorageClass/reclaim details; a local disk is not a backup. An unbound claim/Pending Pod is a negative prerequisite, not persistence proof. Do not alter a shared cluster's class.

Cleanup only these optional clients, policy, HPA and storage objects, after saving evidence:

```powershell
kubectl --context $ctx -n notebook-lab delete pod allowed-client denied-client --ignore-not-found
kubectl --context $ctx -n notebook-lab delete networkpolicy app-ingress --ignore-not-found
kubectl --context $ctx -n notebook-lab delete hpa release-demo --ignore-not-found
kubectl --context $ctx -n notebook-lab delete pod storage-demo --ignore-not-found
kubectl --context $ctx -n notebook-lab delete pvc lab-data --ignore-not-found
```

PVC deletion can remove data under the StorageClass reclaim policy; preserve needed evidence first. Record executed commands, positive and negative outputs, CNI/metrics/storage prerequisites and unexecuted cases separately. Sources: [NetworkPolicy](https://kubernetes.io/docs/concepts/services-networking/network-policies/), [HPA](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/), [persistent volumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/).
