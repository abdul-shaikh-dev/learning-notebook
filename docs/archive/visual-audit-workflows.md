# Workflow visual audit

Baseline: c31e47e. Reviewed all lesson sections, examples, practice prompts/solutions/checks and stage-project requirements in the five owned paths, plus the teaching/practice Markdown listed below. Source wording, commands and historical verification notes remain unchanged. Diagrams supplement the lesson text via lesson IDs; shared rendering/catalog integration is owned by the primary agent.

Disposition unit: one lesson. Converted means a new conceptual visual; already visual means its existing lesson visual was retained; retain code or prose includes compact tables, literal protocols, commands and explanations where another visual would duplicate existing teaching or weaken precision. Practice duplicates are explicitly mapped below rather than counted twice.

## ai-agents

Reviewed 24 lessons: 7 converted, 1 already visual, 16 retain code or prose.

| Lesson ID | Disposition | Reason / visual |
|---|---|---|
| vocabulary | retain code or prose | Existing loop already shows the same proposal/application/tool scenario; vocabulary remains readable prose. |
| workflow | converted | Choose the control structure the task needs |
| context | retain code or prose | Keep bounded context-package fields and character/token distinction as a readable inventory. |
| instructions | converted | Evidence cannot grant a new capability |
| tools | retain code or prose | Keep exact input/output/effect contract as text. |
| loop | already visual | Existing interactive nodes/edges/steps visual retained. |
| state | retain code or prose | Keep authoritative state dictionary and assertions as executable-shaped examples. |
| grounding | retain code or prose | Keep supported/inferred/unknown claim comparison as prose; citation membership is not entailment. |
| arguments | retain code or prose | Keep validator code and rejected-value cases. |
| outputs | retain code or prose | Keep exact output shapes and bounds. |
| retrieval | converted | Retrieve evidence, then evaluate its use |
| memory | retain code or prose | Keep provenance/retention preference inventory. |
| planning | converted | Revise a plan when evidence changes the next action |
| clarification | retain code or prose | Keep concrete wording choices; planning visual already shows needs-input transition. |
| approval | converted | Match approval to the concrete report action |
| failures | retain code or prose | Keep compact failure-class/next-action table; harness retry and reconciliation visuals cover the recovery sequence. |
| budgets | retain code or prose | Keep policy numbers and units as an inventory. |
| injection | retain code or prose | Instructions visual shows the same untrusted-source-to-executor denial boundary; retain distinct containment-test limitations. |
| datasets | retain code or prose | Keep per-case acceptance criteria and separate score dimensions. |
| traces | retain code or prose | Keep actual trace examples as inspectable event text; loop visual covers execution order. |
| judges | converted | Combine exact checks with calibrated semantic review |
| multiagent | converted | Reconcile bounded worker evidence |
| deployment | retain code or prose | Keep release bundle identifiers and rollback limits as a checklist. |
| live-integration | retain code or prose | Keep provider-specific opt-in protocol checklist; no unexecuted live system is implied. |

Teaching/practice Markdown read: `paths/ai-agents/provider-evaluation-lab.md`, `paths/ai-agents/provider-integration-exercise.md`, `paths/ai-agents/README.md`.

## agent-harnesses

Reviewed 24 lessons: 9 converted, 0 already visual, 15 retain code or prose.

| Lesson ID | Disposition | Reason / visual |
|---|---|---|
| runtime-boundary | converted | Keep proposal control separate from tool execution |
| task-contract | retain code or prose | Keep trusted configuration inventory; runtime-boundary visual places its authority. |
| state-machine | converted | Waiting and uncertainty are separate run states |
| state-context | retain code or prose | Keep owner/trust/retention comparison as prose inventory. |
| registry | retain code or prose | Keep tool contracts and unknown-name example; runtime diagram already separates dispatch checks. |
| schema | retain code or prose | Keep accepted/rejected JSON and bounded-contract caveats. |
| authorization | retain code or prose | Approval visual includes current policy recheck; retain object entitlement details as prose. |
| events | retain code or prose | Keep event sequence as actual audit vocabulary; it is useful evidence rather than another diagram. |
| budgets | retain code or prose | Keep exact counter examples and checkpoint accounting; checkpoint visual shows preservation. |
| approval | converted | Review exact intent and recheck current authority |
| deadlines | retain code or prose | Keep remaining-time accounting and cooperative/hard-limit distinction. |
| retries | retain code or prose | Keep compact error-class branches and nine-attempt arithmetic; idempotent-effects visual explains uncertain-write recovery. |
| idempotent-effects | converted | A lost response requires receipt reconciliation |
| checkpoints | converted | Restore state without restoring approval authority |
| context-lifecycle | retain code or prose | Keep typed context inventory and summary caveats. |
| injection | retain code or prose | Runtime boundary and AI instruction visuals already show denied proposals; retain containment/model-robustness distinction. |
| isolation | converted | Draw a separate compute boundary |
| concurrency | converted | Reject writes from a stale lease owner |
| replay | converted | Historical replay and live resume have different effects |
| audit | retain code or prose | Keep allowlisted event shape and retention/metric-label guidance. |
| evaluation | retain code or prose | Keep separate runtime/quality/robustness/E2E evidence matrix. |
| release | retain code or prose | Keep controlled rollout checklist and version bundle; no actual deployment claimed. |
| operations | converted | Investigate an uncertain save before another effect |
| capstone | retain code or prose | Keep implemented/unimplemented evidence inventory; runtime and recovery diagrams cover the architecture. |

Teaching/practice Markdown read: `paths/agent-harnesses/practice/architecture-decision.md`, `paths/agent-harnesses/practice/operations-runbook.md`, `paths/agent-harnesses/practice/persisted-run-lab.md`, `paths/agent-harnesses/practice/README.md`.

## application-security

Reviewed 21 lessons: 7 converted, 1 already visual, 13 retain code or prose.

| Lesson ID | Disposition | Reason / visual |
|---|---|---|
| assets-threats | retain code or prose | Keep threat-model worksheet columns and concrete abuse example; authorization visual already shows the actual access boundary. |
| identity-principals | retain code or prose | OIDC identity mapping visual covers verified identity to principal; retain trusted fixture code. |
| authentication-boundary | retain code or prose | Keep credential/recovery failure policy and None fixture code. |
| authorization-ownership | already visual | Existing interactive nodes/edges/steps visual retained. |
| input-contracts | retain code or prose | Keep exact field/type/size and mass-assignment cases. |
| sessions | converted | Rotate, expire and revoke server session state |
| cookies-transport | retain code or prose | Keep exact Set-Cookie syntax and separate attribute caveats. |
| passwords-mfa | retain code or prose | Keep proof/recovery table; no provider ceremony is implemented. |
| csrf | converted | A mutation needs several independent gates |
| xss-context | retain code or prose | Keep exact escaped output and sink-context comparison. |
| sql-injection | retain code or prose | Keep driver binding code and literal query assertions. |
| oauth-roles | converted | Trace code issuance to protected API access |
| oidc-login | converted | Verified identity must be mapped before object policy |
| pkce-state | converted | Correlation and code redemption protect different boundaries |
| token-validation | converted | Token syntax is not trusted API identity |
| secrets | converted | Rotation includes consumers and old-value revocation |
| logging | retain code or prose | Keep exact allowlisted event fields and control-character test. |
| dependencies | retain code or prose | Keep component/advisory/evidence inventory. |
| abuse-limits | retain code or prose | Keep small per-key/window assertion table and worker multiplication caveat. |
| verification | retain code or prose | Keep expected/observed/remaining-boundary evidence matrix. |
| incident-recovery | retain code or prose | Keep mechanism-specific incident runbook; secrets visual supplies rotation sequence. |

Teaching/practice Markdown read: `paths/application-security/advanced-kit.md`, `paths/application-security/foundation-kit.md`, `paths/application-security/identity-provider-lab.md`, `paths/application-security/intermediate-kit.md`, `paths/application-security/README.md`, `paths/application-security/threat-model.md`, `paths/application-security/verification-matrix.md`.

## git-team-workflows

Reviewed 20 lessons: 5 converted, 1 already visual, 14 retain code or prose.

| Lesson ID | Disposition | Reason / visual |
|---|---|---|
| safe-sandbox | retain code or prose | Keep repository-root/status commands and owned-directory safety contract. |
| three-states | already visual | Existing interactive nodes/edges/steps visual retained. |
| inspect-changes | retain code or prose | Keep exact diff commands and baseline distinctions. |
| coherent-commits | retain code or prose | Keep selective-staging/review instructions; three-states already explains the snapshot boundary. |
| ignore-secrets | retain code or prose | Keep ignore commands, tracked-file caveat and real-key revocation advice. |
| history-refs | converted | Read parent relationships separately from branch labels |
| branch-switch | retain code or prose | History/rebase diagrams already show divergent branches; retain exact switch commands and local-edit caveats. |
| restore-staging | retain code or prose | Keep source/destination command semantics; three-states visual supplies the comparison model. |
| merge-integration | retain code or prose | History visual already shows divergent two-parent merge; retain ff-only and clean-text-merge caveats. |
| conflict-resolution | converted | Resolve behavior or deliberately abort the merge |
| remotes-fetch | converted | Fetch updates observations before integration changes HEAD |
| pull-request-review | retain code or prose | Keep review artifact fields and hosting-policy distinction. |
| revert-reset | retain code or prose | Keep reset-mode consequences in prose; no destructive operations illustrated as an automatic workflow. |
| reflog-recovery | retain code or prose | Keep exact inspection/branch commands and local expiry limits. |
| bisect | converted | Use one reliable predicate across historical candidates |
| cherry-pick | retain code or prose | Keep selected-backport dependency checks and command lifecycle. |
| rebase | converted | A new base produces new commit identities |
| stash | retain code or prose | Keep scope options and apply/inspect/drop practice checklist. |
| tags-release | retain code or prose | Keep tag-type commands and artifact/signature distinction. |
| team-release-review | retain code or prose | Keep operation-choice and exact-candidate release record checklist. |

Teaching/practice Markdown read: `paths/git-team-workflows/advanced-kit.md`, `paths/git-team-workflows/foundation-kit.md`, `paths/git-team-workflows/intermediate-kit.md`, `paths/git-team-workflows/README.md`, `paths/git-team-workflows/release-review.md`.

## testing-debugging

Reviewed 24 lessons: 5 converted, 2 already visual, 17 retain code or prose.

| Lesson ID | Disposition | Reason / visual |
|---|---|---|
| contracts | retain code or prose | Keep small accepted/rejected input table. |
| first-test | retain code or prose | Keep arrange/act/assert example and independent literal expectation. |
| boundaries | retain code or prose | Keep endpoint/type acceptance table. |
| failures | retain code or prose | Keep exact exception and absent-effect assertions; existing integration visual covers preservation. |
| fixtures | retain code or prose | Keep context-manager code and owned cleanup contract. |
| tracebacks | retain code or prose | Keep traceback frames and chained exception text directly inspectable. |
| reproduce | converted | Reduction must preserve the failure condition |
| hypotheses | converted | Make a prediction that an observation can disprove |
| strategy | converted | Choose test scope for the observable risk |
| mocks | retain code or prose | Keep injected callback code; existing integration visual shows replacement failure. |
| contracts-adapters | retain code or prose | Keep literal malformed JSON and compatibility-table exercise. |
| integration-files | already visual | Existing interactive nodes/edges/steps visual retained. |
| properties | retain code or prose | Keep metamorphic equations and nonzero counterexample. |
| regressions | retain code or prose | Keep old/fixed assertion comparison; hypotheses visual explains discriminating diagnosis. |
| coverage | converted | A reached line can still miss a discriminating boundary |
| test-data | retain code or prose | Keep fixture provenance fields and historical snapshot caveat. |
| concurrency | already visual | Existing interactive nodes/edges/steps visual retained. |
| flaky-tests | retain code or prose | Existing concurrency and new async visuals cover controlled synchronization; retain diagnostic run-order checklist. |
| async-debugging | converted | Cancel after acquisition and observe cleanup |
| observability | retain code or prose | Keep allowlisted event JSON. |
| performance | retain code or prose | Keep dimensions/sample reporting and separate benchmark instructions; no universal timing diagram needed. |
| release-evidence | retain code or prose | Keep command/test-count/scope evidence record. |
| debug-report | retain code or prose | Keep diagnosis handoff fields; reproduction/hypotheses visuals cover the investigation sequence. |
| cli-route | retain code or prose | Keep actual command/output/exit examples; strategy visual locates complete command scope. |

Teaching/practice Markdown read: `paths/testing-debugging/practice/diagnosis-workbook.md`, `paths/testing-debugging/practice/project-workbook.md`, `paths/testing-debugging/practice/README.md`.

## Practice candidate mapping

- AI foundation project arrow chain and README executor ASCII: already visual in `loop` and new `instructions`; do not duplicate the same loop. Advanced evaluation checklist remains precise prose; new `judges` shows the semantic/exact-check relationship.
- Harness README control/dispatch ASCII: converted in `runtime-boundary`. State transitions: `state-machine`. Response-loss timeline and persisted-run lab: `idempotent-effects`, `checkpoints`, `operations`. ADR optional-compute and stale-owner concepts: `isolation`, `concurrency`. The SQLite lab remains explicitly single-host; its two commits are not portrayed as one transaction.
- Security threat-model worksheet read/update arrows: authorization visual already covers tenant/object boundary; retain worksheet columns. Identity-provider flow: `oauth-roles`, `oidc-login`, `pkce-state`, `token-validation`; these remain conceptual opt-in integration designs. Mutation contract: `csrf`. Rotation lifecycle: `secrets`. Verification matrices retain expected/observed separation.
- Git foundation project one/staged two/edited three: already visual in `three-states`. Intermediate conflict/fetch walkthrough: `history-refs`, `conflict-resolution`, `remotes-fetch`. Advanced bisect/rebase sequences: `bisect`, `rebase`. Literal commands, release-review record and operation-choice checklists stay text.
- Testing diagnosis workbook cancellation ASCII: `async-debugging`; diagnosis slice investigation: `hypotheses`; branch comparison: `coverage`. Existing importer/concurrency diagrams already cover project-workbook state flows. Debugger commands, benchmark measurements and evidence-note fields remain text.

## Counts and verification

113 lesson dispositions: 33 converted, 5 already visual, 75 retain code or prose. Every diagram has 4–8 nodes, labeled edges, 3–5 steps, valid node/edge references and a lesson ID present in its path. Existing diagrams were retained without semantic changes. Twenty-two non-executable original-flow examples are marked with textExampleSections; executable code, commands and arithmetic fixtures remain expanded. No path.json, generated catalog, shared renderer, practice files or historical evidence were edited.

Remaining integration boundary: the primary agent must rebuild the catalog and visually verify Mermaid rendering through the shared renderer. No live provider, remote repository, deployment, authentication ceremony or security incident was executed by this audit.
