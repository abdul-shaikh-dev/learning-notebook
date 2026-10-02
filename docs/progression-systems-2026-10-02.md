# Systems learning progression review

Reviewed 2026-10-02. Scope: eight paths, 182 lessons and their exercises/answers, 24 stage projects, prerequisite statements and resource mappings. This is a progression and practice-readiness review. It does not claim a controlled learner study or a new complete factual certification of every external platform detail.

Each stage practice card now links to the final lesson in its stage rather than presenting the opening lesson as sufficient preparation. IDs, lesson order and stage membership are unchanged. Practice remains optional; no response fields, scores or completion gates were added.

## Networking & the Web

Reviewed 24 lessons, 3 projects and 3 practice cards.

Foundation demanded a retry policy before methods-retries, and every stage launched all three reference modules. The foundation now covers origin/TTL only, with two specific tests. Intermediate adds read retry, HTTP semantics and settings-only TLS checks; redirect/stall work is advanced. encoding now starts with actual UTF-8 bytes before asking for the later decoder. retry-budgets supplies explicit attempt counts instead of leaving the multiplication inputs implicit. The current project workbook matches the new sequence.

Changed lesson IDs: `encoding`, `retry-budgets`.

Full reviewed sequence: `request-journey`, `addresses-ports`, `dns`, `dns-cache`, `transport`, `urls-origins`, `encoding`, `http-message`, `status`, `methods-retries`, `tls`, `certificates`, `cookies`, `browser-boundaries`, `cache`, `validators`, `redirects`, `proxies`, `timeouts`, `retry-budgets`, `body-contracts`, `diagnostics`, `protocol-evolution`, `network-review`.

## Linux & Operating Systems

Reviewed 22 lessons, 3 projects and 3 practice cards.

The permission exercise asked for 640 without teaching digit construction. Added 4/2/1 arithmetic and contrasting 600/750 examples. process-lifetimes previously jumped from one trusted child to untrusted descendant containment. Its main practice now changes a tiny child, predicts status and streams, and distinguishes TimeoutExpired. Containment remains a later extension. Python kit prerequisites now name functions, lists, exceptions and context managers.

Changed lesson IDs: `permissions-and-identities`, `process-lifetimes`.

Full reviewed sequence: `kernel-and-user-space`, `paths-and-working-directory`, `safe-file-operations`, `shell-quoting`, `streams-and-pipelines`, `permissions-and-identities`, `processes-and-exit-status`, `environment-and-path`, `process-lifetimes`, `signals-and-shutdown`, `memory-and-virtual-addresses`, `threads-scheduling-and-races`, `file-descriptors-and-leaks`, `storage-and-durability`, `network-observation`, `services-and-supervision`, `logs-and-evidence`, `resource-limits`, `namespaces-and-cgroups`, `security-and-packages`, `incident-diagnosis`, `operating-systems-capstone`.

## Cloud & Infrastructure as Code

Reviewed 22 lessons, 3 projects and 3 practice cards.

The first architecture decision asked for an ADR without defining it or supplying enough workload constraints. Added a 20-learner synthetic scenario, maintenance constraint, two choices, cost categories and a reversal trigger. networking now mutates the loaded inventory in memory and invokes validate directly, avoiding ambiguous instructions to change a fixture then run tests that might construct their own fixtures.

Changed lesson IDs: `requirements`, `networking`.

Full reviewed sequence: `cloud-contract`, `azure-scope`, `requirements`, `networking`, `identity`, `iac-model`, `provider-init`, `variables`, `dependencies`, `state`, `plan-review`, `lifecycle`, `modules`, `drift-import`, `policy`, `secrets`, `cost-control`, `deployment-pipeline`, `infra-tests`, `resilience`, `cleanup`, `launch-review`.

## Delivery & Operations

Reviewed 24 lessons, 3 projects and 3 practice cards.

The entry requirements made three other language/database paths appear necessary for the independent Python baseline. They now belong explicitly to the optional full-stack track, including its intermediate project. test-gates introduces /live, /ready and smoke checks before the foundation project uses them. environments now supplies a concrete staging-to-production misconfiguration and names the four boundaries. Removed advanced SLO arithmetic from the foundation command card.

Changed lesson IDs: `environments`, `test-gates`.

Full reviewed sequence: `release-contract`, `environments`, `source-release`, `reproducible-builds`, `test-gates`, `containers`, `docker-build`, `runtime-configuration`, `secrets`, `web-topology`, `schema-evolution`, `ci-pipeline`, `artifact-promotion`, `health-contracts`, `deployment-strategies`, `rollback`, `structured-logs`, `metrics`, `slos`, `load-testing`, `backups`, `restore-drill`, `incident-response`, `release-review`.

## Kubernetes

Reviewed 24 lessons, 3 projects and 3 practice cards.

local-context showed Validate immediately after cluster creation, although Validate needs an existing namespace. Its example now states the README sequence with Bootstrap before Validate and Apply. objects-labels adds an executable offline defect/recovery exercise with the exact test and edit location. services-dns walks through the three port fields and explains EndpointSlice records before the project asks learners to inspect them.

Changed lesson IDs: `local-context`, `objects-labels`, `services-dns`.

Full reviewed sequence: `cluster-model`, `control-plane`, `local-context`, `objects-labels`, `pods`, `deployments`, `services-dns`, `configmaps`, `secrets`, `probes`, `resources`, `rolling-updates`, `scheduling`, `network-policy`, `rbac`, `pod-security`, `persistent-storage`, `jobs`, `autoscaling`, `disruptions`, `helm`, `gitops`, `troubleshooting`, `backup-production`.

## Observability & Performance

Reviewed 21 lessons, 3 projects and 3 practice cards.

Foundation commands ran SLO analysis, a server and benchmarking before those lessons. They now select the three percentile checks. The intermediate card separates server and client terminals and includes healthy, slow and fail commands. histogram-buckets adds a cumulative-count example and makes the inclusive threshold explicit. profiling explains ncalls/tottime/cumtime before learners interpret cProfile output. Prerequisites match the Python measurement kit instead of implying a required UI lab.

Changed lesson IDs: `histogram-buckets`, `profiling`.

Full reviewed sequence: `questions-signals`, `measurement-contract`, `structured-logs`, `metrics-types`, `latency-percentiles`, `golden-signals`, `trace-spans`, `context-propagation`, `cardinality`, `histogram-buckets`, `sli-slo-budget`, `burn-rate-alerts`, `sampling-retention`, `benchmark-design`, `profiling`, `memory-diagnostics`, `load-models`, `queues-capacity`, `frontend-database`, `incident-runbook`, `telemetry-release`.

## System Design

Reviewed 24 lessons, 3 projects and 3 practice cards.

The intermediate transaction/idempotency project did not expose the existing booking kit until the advanced stage. It now links those files and three focused race/replay/rollback tests. transactions explains which assertions connect to its timeline, reserving relay delivery for outbox. network supplies two possible lost-response outcomes and introduces operation identity as a contract before later implementation lessons.

Changed lesson IDs: `network`, `transactions`.

Full reviewed sequence: `requirements`, `slos`, `workload`, `latency`, `network`, `api-contracts`, `data-model`, `indexes-storage`, `scaling`, `cache`, `queues`, `replication`, `consistency-cap`, `partitioning`, `transactions`, `idempotency`, `resilience`, `backpressure`, `outbox`, `observability`, `security`, `recovery`, `evolution`, `design-review`.

## Application Security

Reviewed 21 lessons, 3 projects and 3 practice cards.

First-stage exercises jumped directly to new delete policy, description schemas and concurrent idle expiry. They now predict the supplied permission matrix, exact title boundaries and session expiry/rotation/logout, with feature extensions optional afterward. assets-threats starts with one concrete foreign update instead of requiring an as-yet-untaught login design. Intermediate resources now expose the synthetic flow-binding and loopback route tests where their lessons use them. Current kit instructions distinguish tested HTTP policy from untested browser/IdP behavior and remove submission framing.

Changed lesson IDs: `assets-threats`, `authorization-ownership`, `input-contracts`, `sessions`.

Full reviewed sequence: `assets-threats`, `identity-principals`, `authentication-boundary`, `authorization-ownership`, `input-contracts`, `sessions`, `cookies-transport`, `passwords-mfa`, `csrf`, `xss-context`, `sql-injection`, `oauth-roles`, `oidc-login`, `pkce-state`, `token-validation`, `secrets`, `logging`, `dependencies`, `abuse-limits`, `verification`, `incident-recovery`.

## Verification

All suites ran on the local Windows Python runtime with standard-library dependencies. These are current results, separate from older verification notes retained in the kits.

| Path | Command, from its kit folder | Result |
|---|---|---|
| Networking | `python -B -m unittest -v test_network_labs.py` | 15 passed |
| Linux | `python -B -m unittest -v test_os_labs.py` | 8 passed |
| Cloud | `python -B -m unittest -v test_infra_lab.py` | 13 passed |
| Delivery | `python -B -m unittest -v test_release_app.py test_release_tools.py test_distinct_artifact_drill.py` | 16 passed |
| Kubernetes | `python -B -m unittest -v test_release_app.py check_manifests.py` | 12 passed, no cluster |
| Observability | `python -B telemetry.test.py AnalysisTests.test_nearest_rank AnalysisTests.test_does_not_mutate AnalysisTests.test_invalid` | 3 selected foundation tests passed |
| System Design | `python -B -m unittest -v test_capacity_calculator.py test_booking_lab.py` | 12 passed |
| Application Security | `python -B -m unittest -v test_security_lab.py test_security_http.py` | 10 passed |
| Application Security | `python -B login_flow_lab.py` | 3 passed |

Additional direct checks reproduced the new UTF-8 lengths and rejection, child status 2 with separated streams, public-storage model rejection without altering topology.json, all stated authorization/title/session outcomes, and cumulative histogram counts. A temporary copy of the Kubernetes kit failed its selector test after the specified Service-only edit and passed after restoration. The source kit remained unchanged. Stable lesson IDs/stages and every new practice prerequisite/file mapping were checked.

No Linux kernel lab, cloud account, Terraform provider deployment, Docker build, Kubernetes cluster, browser cookie integration, identity-provider login or telemetry collector was run for this review. The code behavior remains scoped to the named local tests. The primary agent handles catalog/bundle generation and notebook-wide checks after all path edits finish.

## Primary references for added explanations

- [GNU chmod manual](https://man7.org/linux/man-pages/man1/chmod.1.html): numeric permission values.
- [Python subprocess](https://docs.python.org/3/library/subprocess.html): CompletedProcess, default check behavior and timeout exception.
- [Python profilers](https://docs.python.org/3/library/profile.html): ncalls, tottime and cumtime.
- [Kubernetes Service](https://kubernetes.io/docs/concepts/services-networking/service/): named target ports and endpoints.
- [Prometheus histograms](https://prometheus.io/docs/practices/histograms/): cumulative classic buckets and count-based threshold ratios.

These sources were checked on 2026-10-02. Other additions are original exercises based on the existing documented fixture contracts, not new provider guarantees.
