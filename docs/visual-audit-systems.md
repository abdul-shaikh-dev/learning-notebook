# Systems visual audit

Baseline: c31e47e. Scope: all 120 lesson section paragraphs, examples, exercises and teaching/practice Markdown in five paths. Existing diagrams and concrete explorers were checked before selecting additions. Executable SQL/Python/CLI examples remain intact; graphs supplement their relationship, decision or process explanation. No runtime/provider claims are introduced.

## sql-server

Reviewed 24 lesson IDs. Added 5 diagrams.

| Lesson ID | Candidate decision |
|---|---|
| connect-and-read | Retain exact example and prose: SQL Server stores the data; a query tool sends instructions to it. |
| types-keys-null | Retain exact example and prose: A schema expresses what each value means and which rows are valid. |
| select-filter-sort | Retain exact example and prose: A query needs explicit predicates, units and ordering. |
| joins-and-grain | Already visual: existing diagram/explorer retained |
| group-and-reconcile | Retain exact example and prose: GROUP BY collapses rows; WHERE and HAVING filter different stages. |
| cte-and-subquery | Converted: Reduce payment grain before joining |
| window-functions | Retain exact example and prose: A window calculation retains detail rows while looking across related rows. |
| parameters-procedures | Retain exact example and prose: Pass data as typed parameters; keep SQL text separate from values. |
| temporary-staging | Retain exact example and prose: Temporary tables store intermediate rows; changes still need a clear scope. |
| transactions-isolation | Already visual: existing diagram/explorer retained |
| indexes-and-plans | Already visual: existing diagram/explorer retained |
| reconciliation-capstone | Converted: Reconcile orders without hiding orphans |
| schema-contracts | Retain exact example and prose: A schema is a business contract; precision, identity and time are part of correctness. |
| sets-and-apply | Retain exact example and prose: Set comparison, existence and per-row selection express different questions. |
| window-frames-and-gaps | Retain exact example and prose: A moving window is defined by rows or values; it is not automatically a time interval. |
| index-selectivity-statistics | Retain exact example and prose: An index proposal needs a workload, a predicate contract and measured evidence. |
| procedure-transaction-contracts | Retain executable procedure: @@ROWCOUNT, owned-transaction rejection, CATCH rollback and THROW must remain inspectable as SQL; the rollback graph already covers atomic failure. |
| incremental-load-contracts | Retain executable replay SQL: the intentionally skipped E1 payload conflict is a limitation exposed in code; advanced-import-capstone supplies the richer classification graph. |
| plan-regressions-query-store | Retain exact example and prose: Compare like-for-like workload evidence before deciding that a plan change caused a slowdown. |
| concurrency-lost-updates | Already visual: existing diagram/explorer retained |
| deadlocks-retries | Converted: Two sessions form a wait cycle |
| least-privilege-dynamic-sql | Retain exact example and prose: Parameterization prevents one class of injection; authorization limits what a caller may do. |
| migrations-and-release | Converted: Expand before contracting a schema |
| advanced-import-capstone | Converted: Classify raw events before ledger loading |

## system-design

Reviewed 24 lesson IDs. Added 7 diagrams.

| Lesson ID | Candidate decision |
|---|---|
| requirements | Retain exact example and prose: A design is an argument that a system can meet explicit needs under stated constraints. |
| slos | Retain exact example and prose: Define reliability from a user action and a measurement window. |
| workload | Retain exact example and prose: Capacity estimates are explicit hypotheses that measurements must refine. |
| latency | Retain exact example and prose: Averages, percentiles and concurrency answer different questions. |
| network | Already visual: existing diagram/explorer retained |
| api-contracts | Retain request/response contract: exact booleans, expectedVersion, conflict and validation outcomes should stay beside the HTTP example. |
| data-model | Retain schema contract: composite business identity and field definitions are clearer in the exact relation listing than a generic component flow. |
| indexes-storage | Retain exact example and prose: An index buys read efficiency with write, space and maintenance costs. |
| scaling | Retain capacity arithmetic: utilization factor, upward rounding and one-instance-loss reserve must be recomputable; no measured capacity or deployment guarantee is implied. |
| cache | Converted: Cache-aside read and origin-load fallback |
| queues | Already visual: existing diagram/explorer retained |
| replication | Converted: A follower can read an older saved version |
| consistency-cap | Retain policy comparison: the two isolated seat authorities require explicit sacrificed behavior and technical CAP definitions, not a misleading ordinary request-flow diagram. |
| partitioning | Retain keyed comparison: user_id and workshop_id have different locality, scatter/gather and hot-key costs; this is an access-pattern tradeoff rather than a single pipeline. |
| transactions | Converted: Reserve the final seat in one atomic unit |
| idempotency | Already visual: existing diagram/explorer retained |
| resilience | Already visual: existing diagram/explorer retained |
| backpressure | Retain exact example and prose: A bounded system decides what to reject before resources are exhausted. |
| outbox | Converted: Local transaction, relay and duplicate delivery |
| observability | Retain evidence investigation: trace timing and DB waits support a hypothesis, not a causal flow proven by correlation. |
| security | Converted: Evaluate record ownership at the server |
| recovery | Converted: Measure recovery point and service restoration separately |
| evolution | Converted: Migrate readers and writers before removing fields |
| design-review | Retain exact example and prose: A good design exposes assumptions and proposes tests that could prove it wrong. |

## kubernetes

Reviewed 24 lesson IDs. Added 8 diagrams.

| Lesson ID | Candidate decision |
|---|---|
| cluster-model | Retain exact example and prose: Kubernetes coordinates container workloads through declarative API objects and controllers. |
| control-plane | Already visual: existing diagram/explorer retained |
| local-context | Retain exact example and prose: kubectl uses a kubeconfig context to choose cluster and identity, so a valid command can affect the wrong environment. |
| objects-labels | Converted: Selectors connect a Service to eligible Pods |
| pods | Converted: Pod replacement creates a new scratch lifetime |
| deployments | Already visual: existing diagram/explorer retained |
| services-dns | Already visual: existing diagram/explorer retained |
| configmaps | Converted: Environment config changes need new processes |
| secrets | Retain exact example and prose: A Kubernetes Secret separates confidential configuration from ordinary application manifests, but base64 encoding is not encryption. |
| probes | Converted: Readiness and liveness choose different actions |
| resources | Retain CPU/memory comparison: scheduler requests, CPU throttling and memory termination are different mechanisms, with explicit teaching units. |
| rolling-updates | Already visual: existing diagram/explorer retained |
| scheduling | Retain exact example and prose: Scheduling combines resource fit with placement constraints. |
| network-policy | Retain allowed/denied matrix: positive and negative traffic tests plus enforcing-CNI prerequisites carry more evidence than an arrow that could imply verified isolation. |
| rbac | Converted: Bindings connect an API identity to scoped rules |
| pod-security | Retain exact example and prose: Pod security settings restrict process privileges and filesystem capabilities. |
| persistent-storage | Converted: Pod and claim deletion have different consequences |
| jobs | Retain exact example and prose: A Job manages work intended to finish, unlike a continuously serving Deployment. |
| autoscaling | Retain exact example and prose: HorizontalPodAutoscaler changes replica count based on configured metrics. |
| disruptions | Retain eviction comparison: healthy counts and voluntary/involuntary boundaries explain PDB scope; existing rollout explorer covers a different mechanism. |
| helm | Retain exact example and prose: Helm packages parameterized manifests as charts. |
| gitops | Converted: Repository desired state can overwrite manual drift |
| troubleshooting | Retain exact example and prose: Troubleshooting follows the failed boundary: API rejection, Pending scheduling, container startup, readiness, Service routing, policy or application/data behavior. |
| backup-production | Converted: Platform recovery and application data are distinct |

## networking-web

Reviewed 24 lesson IDs. Added 8 diagrams.

| Lesson ID | Candidate decision |
|---|---|
| request-journey | Already visual: existing diagram/explorer retained |
| addresses-ports | Retain exact example and prose: An address identifies a network destination and a port selects a transport endpoint. |
| dns | Retain exact example and prose: DNS relates names to typed records; a name can have more than one address and resolution can involve caching and delegation. |
| dns-cache | Converted: An exact TTL boundary requires fresh resolution |
| transport | Retain exact example and prose: TCP exposes an ordered byte stream while a connection is healthy; one write is not promised to equal one read. |
| urls-origins | Retain exact example and prose: A URL contains scheme, authority, path, query and sometimes a fragment. |
| encoding | Retain exact example and prose: A response body arrives as bytes. |
| http-message | Retain exact example and prose: An HTTP request has a method and target plus fields and optional content. |
| status | Retain exact example and prose: Status codes describe HTTP response semantics. |
| methods-retries | Retain exact example and prose: A safe method requests a read-oriented operation according to HTTP semantics; idempotency concerns the intended effect of repeating a request. |
| tls | Retain exact example and prose: TLS authenticates peers under its configuration and protects transport confidentiality and integrity. |
| certificates | Retain exact example and prose: Certificate trust is configured by a client's trust roots and verification policy. |
| cookies | Converted: Synthetic cookie issuance and replay |
| browser-boundaries | Converted: CORS controls browser response exposure |
| cache | Retain exact example and prose: An HTTP cache can store a response and decide when it is fresh enough to reuse under the applicable rules. |
| validators | Converted: 304 reuses an existing representation |
| redirects | Converted: Reapply policy at every redirect hop |
| proxies | Converted: Proxy timeout does not establish origin rollback |
| timeouts | Already visual: existing diagram/explorer retained |
| retry-budgets | Converted: Check attempt and time budgets before dispatch |
| body-contracts | Converted: Validate more than HTTP success |
| diagnostics | Retain exact example and prose: A good network diagnosis reports which stage completed, what failed and the relevant bounded metadata. |
| protocol-evolution | Retain exact example and prose: HTTP/1.1, HTTP/2 and HTTP/3 carry related HTTP semantics through different wire protocols and transports. |
| network-review | Retain exact example and prose: The final project combines URL policy, observed HTTP semantics, validated bodies, public-cache isolation and bounded reads. |

## delivery-operations

Reviewed 24 lesson IDs. Added 8 diagrams.

| Lesson ID | Candidate decision |
|---|---|
| release-contract | Converted: A release passes several different evidence gates |
| environments | Retain exact example and prose: An environment is a set of endpoints, identities, data and configuration. |
| source-release | Retain exact example and prose: A source commit identifies code, an artifact digest identifies bytes, and a deployed release identifies what is running with a particular configuration. |
| reproducible-builds | Retain exact example and prose: A repeatable build controls source, runtime, dependency graph and build inputs. |
| test-gates | Retain exact example and prose: A useful gate rejects a candidate for a reason tied to user risk. |
| containers | Retain exact example and prose: An image is a packaged filesystem and launch configuration. |
| docker-build | Retain exact example and prose: A multi-stage Dockerfile can run tests with test sources present and copy only runtime files into the final image. |
| runtime-configuration | Retain exact example and prose: Build configuration affects produced bytes; runtime configuration supplies deployment values such as bind address and release label. |
| secrets | Retain exact example and prose: A secret is a value whose disclosure grants access or reveals protected data. |
| web-topology | Converted: Separate browser, API and database responsibilities |
| schema-evolution | Converted: Keep old and new readers compatible |
| ci-pipeline | Converted: Separate contributor checks from privileged promotion |
| artifact-promotion | Converted: Promote the bytes tied to test evidence |
| health-contracts | Already visual: existing diagram/explorer retained |
| deployment-strategies | Retain exact example and prose: A rolling deployment mixes old and new instances, blue/green keeps two environments, and a canary exposes a smaller population to a candidate. |
| rollback | Converted: Compatible data permits the simulated label rollback |
| structured-logs | Retain exact example and prose: Logs explain a specific event; metrics aggregate behavior. |
| metrics | Retain exact example and prose: Counters measure cumulative events, gauges describe a current level, and histograms retain a distribution useful for latency. |
| slos | Retain exact example and prose: An SLI is a measured fraction or distribution; an SLO is its target over a defined window. |
| load-testing | Retain exact example and prose: A load result belongs to its workload, environment and dataset. |
| backups | Retain exact example and prose: A backup is a recoverable copy, not simply a file that exists. |
| restore-drill | Converted: Restore known data before switching traffic |
| incident-response | Converted: Stabilize, investigate and verify recovery |
| release-review | Retain exact example and prose: A reviewable release packet connects the user invariant to artifact identity, compatible schema, config/security boundaries, rollout gates and recovery evidence. |

## Coverage and limits

36 additions selected by teaching value (SQL 5, system design 7, Kubernetes 8, networking 8, delivery 8). Existing lesson diagrams/explorers were preserved. Practice workbooks/runbooks repeat the selected request, release, selector, drift, booking/outbox and restore relationships, so the lesson diagrams serve those candidates without duplicating executable artifacts. Threat-model/ADR/review worksheets remain tables or prose so ownership, evidence and residual-risk fields stay explicit. Resource citations and historical verification records are retained. Browser/CORS, certificates, enforcement, metrics, storage recovery and production traffic remain separately stated optional experiments; drawing a diagram does not mark them executed.

Validation checks JSON parsing, lesson-key existence, unique node IDs, edge endpoints, step-node references and edge-index bounds. Rendering/integration validation is performed by the coordinating agent.

## Text-flow disclosure mapping

Added textExampleSections to 31 covered, purely textual lesson-flow examples (section index 1). Executable SQL, CLI commands, conceptual SQL, config snippets and arithmetic remain outside this mapping. Existing network/queue, deployment/Service/rolling and resilience explorers retain their concrete trace interaction; their textual flow examples remain companion teaching content.

Standalone companion candidates: system-design/practice/design-workbook.md “Explain every arrow” ASCII topology (network/cache/outbox/queues diagrams); kubernetes/practice/cluster-workbook.md foundation trace and GitOps/recovery arrows (control-plane/objects-labels/gitops/backup-production); delivery-operations/practice/integration-runbook.md “Topology and prerequisites” (web-topology); delivery-operations/practice/release-workbook.md foundation source-to-user sequence (release-contract). Their commands and evidence worksheets remain intact. Optional enforcement and browser drills retain concrete command sequences and allowed/denied evidence tables.

Remaining examples retained deliberately: transport chunk-size arithmetic, origin tuples, HTTP GET/HEAD/status comparisons, TLS assertions, cache numeric expiry, request-budget multiplication, disruption/resource/scaling arithmetic, scheduling constraint comparison, NetworkPolicy allowed/denied matrix, API contracts, schema field lists, review/evidence packets. These are executable/configuration contracts, comparisons or calculations rather than missing multi-stage diagrams.
