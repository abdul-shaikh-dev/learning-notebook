# Cloud projects and evidence ledger

## Foundation: responsibility map

Describe the difference between the current static notebook and a hypothetical authenticated React/.NET/SQL application. Identify managed-service responsibilities, Azure scope, network paths, identity roles, data owners and cost categories. Compare a managed app deployment with a VM, and explain whether Kubernetes adds value for the chosen workload.

Reference: static hosting can remain sufficient for a personal read-only notebook. Authenticated writes add backend/data/identity duties. Subscription and tenant require explicit checks. Network, DNS and authorization are independent gates. Managed infrastructure does not own application access rules or guarantee restore success. Price categories need current regional confirmation before spend.

## Intermediate: operation and policy review

Run the 13 local tests. Work out create/no-op/update/replace/destroy examples, and inject a simulated failure without mutating source inventory. Trigger missing tags, public storage and broad-role failures. Inspect main.tf.json and its dependency references. Optional: copy only that template into a separate folder, init and validate with actual provider versions recorded.

Reference: the model is not Terraform. Its name/kind changes are illustrative replacements, not provider schema metadata. local model checks do not enforce Azure policy. Real configuration validation requires initialized providers; it still does not authenticate a working app or deploy resources. Sensitive flags mask display, not state confidentiality. The supplied Azure template deliberately lacks private-endpoint/app connectivity.

## Advanced: deployment, recovery and teardown portfolio

Create an ADR for a future full-stack notebook. Include private/public path assumptions, narrowly scoped deployment/runtime identities, protected state backend design, credential boundaries for CI, real positive/denied tests, resource/data recovery and an explicit cleanup inventory. Include current-price lookup as a future action instead of inventing cost. Draft a reviewed destroy sequence for disposable ownership only.

Reference: validate untrusted pull requests without cloud identity. Credentialed release actions use reviewed artifacts and protected scope. State and application data have separate backup/restore plans. Budget alerts do not stop spending. Restoring a resource definition does not restore rows/blobs. Replacement requires explicit migration; prevent_destroy does not protect a removed block. Teardown can leave external or retained resources, so observe the aftermath.

## Evidence ledger

| Check | Supplied execution boundary | Required remaining evidence |
|---|---|---|
| JSON and teaching plan/policy | Local Python suite | None for this small model; extend tests for new rules |
| AzureRM schema | Optional init/validate | Actual selected provider version and validate output |
| Identity and private networking | Paper design only | Real allowed/denied requests and DNS/path checks |
| Backup and restore | Paper design only | Isolated restoration of synthetic data and measured objectives |
| Cost and teardown | Fictional arithmetic + checklist | Current regional rates, actual inventory and cleanup observations |

Complete each stage by presenting assumptions, observed outputs and unresolved boundaries. This is a learning portfolio, not proof of operating a production cloud system.
