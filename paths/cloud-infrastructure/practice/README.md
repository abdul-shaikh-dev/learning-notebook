# Cloud practice: no resources are provisioned by this kit

Extract all flat files together. Offline baseline requires Python 3.11+ only, with no pip packages, network, Azure identity, Terraform or billing account.

```text
python --version
python infra_lab.py
python -m unittest -v test_infra_lab.py
```

Expected demo: two create operations, two no-op rechecks, fictional_cost_units=24 and network_calls=0. Expected suite: 13 passing tests. Prices are invented arithmetic units, not current Azure rates. The planner models inventory/policy; it is not Terraform, a cloud SDK, a deployment engine or an Azure authorization system. Its replace rule is a teaching rule and must not be generalized to every provider property.

## Optional provider schema check (no apply)

Requires Terraform >=1.6 and <2 plus internet access or an approved provider mirror. Create a separate empty folder, copy ONLY main.tf.json, and run:

```text
terraform version
terraform init -backend=false
terraform validate
```

init downloads the compatible AzureRM provider (~>4.0); it does not provision cloud resources. validate examines configuration/provider schema and does not establish account permissions, name availability, networking, cost or successful deployment. Record actual versions and retain your generated .terraform.lock.hcl privately/in your own project as appropriate. These commands were not included in the local Python execution evidence unless explicitly recorded as separately run. A valid result is expected but not claimed here without the provider-backed run.

The template is a minimal Azure resource group plus storage account. It disables public networking, shared keys and anonymous nested items. It includes NO private endpoint, DNS, application compute, container or runtime identity. Consequently it is intentionally NOT a complete accessible application backend. It grants no real roles and includes no credentials. It requires explicit subscription_id, globally unique storage_name and expires inputs for any separately chosen plan/apply; an expires tag is not automatic deletion. LRS is local redundancy, not cross-region recovery. Private networking and identity integration are learner extensions requiring their own cost/security review.

## Optional real deployment: separate decision, not an automated exercise

Use only a disposable subscription/resource group you own; never use shared work infrastructure. Before ANY plan/apply confirm tenant and subscription, regional service availability, current storage/transaction costs, least-privilege identity, data retention and cleanup ownership. Consult current Azure/HashiCorp docs; no supplied script calls Azure or runs apply/destroy. Budget alerts are not spending caps. Terraform plan may query cloud APIs. Applying this template would create real billable storage and must not be called an offline check.

If you independently choose real provisioning, review every planned operation, record actual state and cloud results, and protect state/plan artifacts. Before cleanup review terraform plan -destroy against the exact isolated scope, preserve only needed synthetic data, then deliberately run terraform destroy. Verify resources and any externally created related objects are gone; account for soft deletion and delayed cost reporting. Do not delete a group that contains anything you did not create for this lab.

## Cleanup and confidentiality

Offline scripts mutate only copied in-memory inventories and leave no resource/state files. Remove the explicitly created optional validation folder when finished after checking it contains no needed data. Do not commit .terraform/, *.tfstate*, saved plans, credentials or provider login caches. No secrets are supplied by the kit.
