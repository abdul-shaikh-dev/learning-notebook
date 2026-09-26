# Agent harness architecture decision

Status: proposed / accepted / superseded

Owner, date and bundle version:

## Decision to make

Which runtime boundary are we changing? Examples: introducing a real tool adapter, durable checkpoints, authenticated approval, supervised compute or multiple workers. State the user need and why the offline single-worker design is insufficient.

## Trusted and untrusted inputs

Identify authenticated subject, current task scope, model proposals, retrieved content, tool output, checkpoint source and approval source. Draw the boundary that enforces each permission. Do not use a model summary to establish consent or checkpoint authenticity.

## Options and consequences

Compare at least two plausible approaches, including retaining a simple constrained workflow. Describe tool semantics, latency, operational ownership, storage, failure recovery and data exposure. A managed runtime does not eliminate application authorization or responsibility for business effects.

Current official OpenAI documentation distinguishes a managed Agents API harness, an application-owned Agents SDK runner and lower-level Responses integration. Recheck the official runtime guide before implementation; this template pins no model name, price or product availability promise.

## State and effect contract

Define durable run ID, operation ID, schema versions, used budgets, pending actions and receipt references. State which changes are atomic and at which storage boundary. Describe how duplicate delivery and a response lost after commit are resolved. Explain why a checkpoint update alone does not prove a downstream effect happened once.

## Approval contract

Bind subject, tool, exact meaningful arguments, destination and task scope. Define reviewer authentication, expiry, revocation, concurrency, persistence and fresh review rules after recovery. A digest is only an equality aid unless an authenticated protocol protects the decision.

## Concurrency and time

State whether one or multiple workers can own a run. If leases/fencing are used, identify the protected receiver that rejects stale tokens. Compare-and-swap protects checkpoint updates; external effects still need idempotency or another coordination contract.

Define proposal, elapsed, retry and resource budgets. Say whether offline/approval waiting time counts. Monotonic clock origins cannot be serialized as universally meaningful timestamps. Define crash accounting and prevent replaying an old checkpoint from restoring spent budget.

## Isolation, data and telemetry

Specify filesystem, network, CPU, memory, output and lifetime limits if code execution is introduced. Keep secrets and business authority outside untrusted compute where possible. Define data minimization, safe event fields, restricted evidence, retention and deletion. Do not label an in-process function registry a sandbox.

## Verification and unresolved risks

List deterministic policy fixtures, real-adapter tests, concurrency/crash tests, isolation review and separate model-quality evaluation. Mark each executed or planned. Name a failure scenario that could falsify the decision and the owner who will investigate it.

## Rollout, rollback and revisit trigger

Account for mixed versions, old checkpoints, revoked authority and effects already committed. Choose a controlled release scope and an observable trigger to stop or revisit the design. A rollback of code is not compensation for a business effect.

## Example starting decision

Retain the offline single-worker harness as a teaching reference. Before a real adapter, add authenticated host identity and a narrowly scoped adapter contract with receipt lookup. Before multiple workers, add protected durable checkpoint versions and effect idempotency; evaluate fencing at the resource that must reject stale work. Do not add a network-capable generic execution tool merely to make the demo look more capable.
