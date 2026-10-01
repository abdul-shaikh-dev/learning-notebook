# Optional mechanism lab

Read the worked lesson, then use this optional lab to try the mechanism yourself.

Requirements: Python 3.11+ and an existing Terraform 1.4+ CLI.

From the extracted practice folder:

```
python terraform_plan_drill.py
```

Expected: Four PASS plan lines: create/2, no-op/0, update/2, delete-create/2. Only initial built-in local state is applied; no cloud provider runs.

Read `terraform_plan_drill.py` to follow the assertion sequence. An assertion failure is evidence
to investigate, not a prompt to weaken the expected outcome. Use the changed case
in the linked lesson to explain why the outcome follows.

## Cleanup and scope

The script creates its own fresh temporary directory and removes that directory on exit. Built-in terraform_data has no external object to destroy. It strips inherited TF_* CLI overrides. It never reads an existing workspace or uses a cloud provider. Only the create plan is applied; changed plans are inspected only. The existing main.tf.json remains a separate training configuration. Terraform CLI integration has not been run on this authoring host (CLI absent).

## Primary references

Mechanism documentation checked 2026-10-02; execution evidence is separate.

- https://developer.hashicorp.com/terraform/language/resources/terraform-data
- https://developer.hashicorp.com/terraform/cli/commands/plan
