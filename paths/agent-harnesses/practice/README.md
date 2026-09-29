# Agent Harnesses offline workshop

Visual companions in the notebook: [Harness architecture boundary](https://abdul-shaikh-dev.github.io/learning-notebook/index.html#topic/agent-harnesses/runtime-boundary). The original text traces below remain available for offline use.


This is a deterministic runtime-policy workshop with a scripted model and two in-memory fake business tools. No API key or cloud account is required. It makes no network requests, invokes no shell commands and contains no application file-reading or writing tool. Running Python itself loads these source files normally.

## Run it

Place `harness_workshop.py` and `test_harness_workshop.py` in the same folder with Python 3.10 or later installed:

```text
python harness_workshop.py
python -m unittest -v test_harness_workshop.py
```

Some systems use `py` or `python3`. There are no third-party packages.

Expected demo states: `waiting`, then `done` after the demo host explicitly approves the displayed fake note. The confirmed note list contains `N1` and the fake effect count is 1. The script's host approval is intentional for this synthetic demo; never treat it as a real user-approval service.

## Read the architecture

```text
Trusted host configuration
  subject / run ID / allowed resources / current write policy
           |
           v
Harness state machine <------ scripted model proposals
  validate → authorize → exact-intent approval → dispatch
           |                                  |
           |                                  v
           |                        FakeStore (same process)
           |                        lesson reads / note receipts
           v
Metadata events + confirmed note IDs
Trusted checkpoint JSON string (sensitive, not signed)
```

The proposal list takes the place of a model. It does not read the lesson text or decide intelligently. `read_lesson` returns bounded synthetic content. `save_note` stores a note and scoped receipt locally. The fake store can deliberately lose its reply after committing to exercise uncertain outcomes.

`Harness.run()` advances until a final answer, pause or stop. `approve()` is called only by the trusted host and must match the current pending fingerprint. `deny()` and `cancel()` stop dispatch. `reconcile()` looks up an uncertain operation; it never sends a fresh save. `checkpoint()` returns JSON in memory, and `restore()` validates it against host-provided identity, script and current policy.

### Checkpoint versions and result recovery

New checkpoints use schema version 2 and retain the validated final text and stop
reason as well as status and receipts. Completed and stopped runs remain terminal
after restore; displaying their result does not execute another proposal. A final
answer is still model/script text, not proof that a business effect occurred.

Version 1 snapshots remain supported through explicit migration. For a completed
run, the answer is recovered only from the final action at the verified script
position. Earlier stopped snapshots never stored their historical reason, so they
restore with `legacy_checkpoint_reason_unavailable` rather than a guessed cause.
Waiting and uncertain version 1 runs retain their lifecycle/counters and require
the same approval or reconciliation controls. Saving again emits version 2.
Unknown versions, missing version 2 result fields, mismatched final text and
reasons incompatible with a state are rejected. This validation does not make a
snapshot authentic; the trusted-host source requirement still applies.

## Practice one failure at a time

1. Change an action name to an unknown tool and verify zero effects.
2. Add an unexpected argument and verify rejection before dispatch.
3. Propose a lesson outside the allowed set and verify denial.
4. Pause a save, capture the approval fingerprint, change the note text and verify that the old approval fails.
5. Revoke write permission while waiting and verify it is rechecked.
6. Set `store.lose_reply_once = True`, approve a save, observe `uncertain`, then reconcile. Verify exactly one fake effect.
7. Restore a waiting checkpoint into the same fake store. Verify the used step count survives and approval must be supplied again.
8. Use a fake clock to expire the run before dispatch. Do not add sleeping tests.

## What the tests establish

The suite verifies deterministic fixtures for schema/registry rejection, resource policy, approval scope and consumption, revocation, denial/cancellation, proposal budgets, cooperative elapsed checks, bounded read retry, uncertain-effect reconciliation, idempotent fake receipts, checkpoint validation and event minimization. A model-authored final sentence is deliberately not accepted as evidence of a saved note.

The test that puts hostile text in a lesson then scripts an unauthorized proposal proves containment for that proposal. It does not measure a real model's resistance to prompt injection.

## Limits that matter

- **One process and one worker.** FakeStore couples note and receipt in one method but is volatile, unsynchronized and not crash-durable. There is no database transaction, lease, fencing or distributed locking implementation.
- **Trusted host interfaces.** Constructor, mutable policy fields, `approve`, `restore` and the fake store are internal teaching interfaces. An approval digest checks exact intent equality; it is not a signature, bearer authorization credential, reviewer identity or public authentication protocol. Pending state must not be exposed for arbitrary client mutation in a real service.
- **Trusted checkpoint source only.** JSON validation does not authenticate a snapshot. A trusted caller could change counters or receipt references. Production storage needs access control, integrity, confidentiality and atomic version checks. Do not import user/model-authored snapshots as authority.
- **Current host policy on restore.** The host passes the expected run ID, subject and current limits. It must preserve the original budget contract unless an explicit authorized change is recorded; the snapshot does not protect that contract against a malicious host. Approved authority is never serialized.
- **Time semantics.** Elapsed time includes live waiting time before a checkpoint; a captured cumulative duration is restored against a fresh monotonic origin. Offline time between checkpoint and restore does not count in this toy. A real service needs explicit wall-clock expiry, pause rules and crash accounting. An attacker able to replay an old trusted snapshot can also roll back usage without protected durable storage.
- **Cooperative deadlines.** Checks stop future dispatch but cannot interrupt a blocking function. A confirmed effect is retained even if its call consumes the remaining time. Unknown effects remain uncertain through cancellation/expiry until reconciliation; stopping work does not establish rollback.
- **Reconciliation has its own operational needs.** This toy receipt lookup is an in-memory trusted operation. Production recovery requires independently bounded, authorized access and may need an operator when normal task execution is stopped. A missing receipt is unresolved, not proof of no effect.
- **Small bounded contracts.** Character limits are not token, memory or transport-size limits. The scripted fixture and fake store are trusted test inputs. The validator is a small handwritten contract checker, not a complete JSON Schema implementation.
- **Minimized events are not a complete audit service.** Events omit raw note content and raw exception text, but metadata can be sensitive and business state/checkpoints can contain drafts. Production access, retention, redaction and integrity policies remain necessary.
- **No arbitrary code execution.** The registry is not a secure sandbox. Adding `eval`, shell execution or an unrestricted file tool would invalidate the current boundary.
- **No LLM-quality claim.** Passing these tests does not certify model accuracy, task usefulness, production security, cloud cost, external service behavior or a real deployment.

Use the operations runbook and architecture-decision template to design those next boundaries before replacing the fakes.


## Focused optional extension (2026-09-27)

From this practice directory run `python -m unittest test_durable_state.py test_parser_properties.py`. Read the corresponding lesson for evidence limits and extension scope.

## Integrated persisted-run lab

`persisted-run-lab.md` combines SQLite checkpoints, a transactional note/receipt and crash recovery. Run `python -m unittest -v test_persisted_run_lab.py`. This demonstrates a local single-host recovery boundary.
