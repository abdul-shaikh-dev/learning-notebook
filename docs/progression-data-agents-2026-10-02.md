# Teaching progression review: data, agents and team engineering

Reviewed 2 October 2026. Scope: 160 lessons across seven paths, including their explanations, examples, exercises and worked answers, stage projects, entry requirements and resource-task ordering. Existing advanced extensions remain available. This is a teaching sequence review, not a new comprehensive factual certification or learner study.

| Path | Lessons reviewed | Changed lesson IDs | Gap corrected |
| --- | ---: | --- | --- |
| SQL Server | 24 | connect-and-read; parameters-procedures; advanced-import-capstone | The first exercise required SELECT syntax before teaching it. Dynamic SQL practice required sp_executesql before showing parameter declaration syntax. The capstone jumped to a large classifier/loader; it now builds parsing, classification and loading separately. Foundation/intermediate resource panels no longer list the whole advanced concurrency kit, and attempts precede worked answers. |
| Data Engineering | 22 | csv-and-encoding; batch-loading; idempotency-and-replay | The foundation parser required a byte bound taught much later. Added an executable one-extra-byte read and separate row-bound explanation. The importer now explains tuple shape, placeholders and schema setup before replay logic. A changed-format CSV case makes exact-byte identity testable. Stage prerequisite links now name relevant preparation. |
| Messaging and Events | 22 | consumer-lifecycle; envelopes; failure-tests | Lesson 6 required an optional live broker before teaching the inbox. The exercise now has a complete local reasoning route, with broker practice deferred until after inbox mechanics. Explicitly separated production metadata from the strict five-field lab envelope. Added a two-consumer/changed-payload transfer case. |
| AI Agents | 24 | state; loop; datasets | An early state lesson jumped into an optional framework installation. It now traces state directly and points to lesson 24 for executable graph setup. Added a complete changed Python script and one-step budget variation. Evaluation practice distinguishes held-out questions and scripted runtime evidence from actual model outputs. |
| Agent Harnesses | 24 | events; checkpoints | Foundation asked learners to build a loop budget while showing the later write/approval demo. Added a one-read to bounded-loop sequence and three focused reference tests. Restore practice now starts in memory before adding the durable adapter. |
| Git Team Workflows | 20 | three-states; team-release-review | The completed script had already removed the intermediate state learners were asked to inspect. Added an independent four/five staging experiment in the retained fixture. Supplied concrete scenarios for the final operation-choice exercise instead of leaving their details unstated. |
| Testing and Debugging | 24 | first-test; reproduce; concurrency | Learners were asked to write unittest code after pseudocode only. Added a complete class/import/runner example. Duplicate-key parser requirements now introduce object_pairs_hook. The thread exercise explains Thread, Barrier, Lock and join before combining them. Foundation practice now runs only foundation cases instead of displaying every advanced command. |

No lesson IDs, stage boundaries or established runtime contracts changed. Foundation resource lists retain modules imported by their shared test modules even when those modules are used primarily in later stages. No mandatory response forms or new scoring was added.

## Verification

Executed existing relevant suites on this checkout using Python 3.14, with bytecode writes disabled:

- Testing and Debugging: 10 tests.
- Agent Harnesses: 29 tests.
- AI Agents: 23 tests.
- Data Engineering: 15 tests across pipeline and revision labs.
- Messaging: 12 tests.
- Git: 8 tests across sandbox and semantic-merge labs. These create only owned disposable local repositories.

All 97 tests passed. Independently executed the new unittest example, duplicate-key observation, scripted completed and budget-exhausted agent variants, and byte-bound examples at 262144 and 262145 bytes. Expected outcomes matched. Resource IDs and links remain canonical; the parent integration pass handles full notebook validation and generated artifacts.

New SQL SELECT and sp_executesql examples were checked against fixture names and expected order IDs. No SQL Server session was executed in this review. Historical engine evidence is unchanged. Optional brokers, provider calls, framework integrations and distributed recovery were not exercised. Passing reference tests does not establish that every learner can complete the projects independently.
