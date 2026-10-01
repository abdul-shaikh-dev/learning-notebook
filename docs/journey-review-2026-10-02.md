# Selected learning journey review

Reviewed 2 October 2026. This review follows three selected sequences from explanation to practice. It does not establish teaching quality across all 30 paths, and it is not a new factual audit of every lesson.

## Python foundations into problem solving

Read Python lessons 1 through 7 in order, including examples, exercises and worked answers. Then reviewed the ten foundation challenges in Python Problem Solving against the concepts those lessons introduce.

The collections lesson previously included a tuple-unpacking loop before loops were taught. Moved that worked grouping example to the loops lesson, explained unpacking and replaced its unexplained assertion with ordinary output. Added a short `enumerate` example because the first index-finding challenge uses it. The functions lesson now explains the challenge contract, starter placeholders, type annotations, returning rather than printing, and small assertion checks.

The challenge sequence progresses from filtering and appending to maintaining two counters, handling neighbors, remembering duplicates and grouping nested data. Hints expose the required operations without making a written explanation compulsory. Existing constraints and empty-input cases make these first ten problems solvable without external data or packages. Some later foundation challenges require combining several ideas; they are practice extensions rather than direct copies of a lesson example.

Verification: executed 17 example and solution snippets from the seven Python lessons. All executed without errors. Executed all 60 fixed cases for the ten foundation challenge reference functions and checked that arguments remained unchanged. This establishes reference behavior for those cases; it does not measure how long a new learner needs or prove the test corpus covers every possible implementation error.

## SQL joins through reconciliation

Reviewed lessons 3 through 7 and the reconciliation capstone, with the existing fixture and setup instructions. The selected journey is filtering and ordering, join grain, grouping, CTEs, window calculations and an independent two-output reconciliation. It is a selected relational-query sequence, not a review of every intervening database administration topic.

The join exercise supplied a LEFT JOIN starter but answered with NOT EXISTS before subqueries were introduced. The answer now completes the stated starter. Corrected the promise that payment pre-aggregation appeared in the next lesson; grouping is lesson 5 and the combined query is lesson 6. Added an optional combined balance query with five-row and total checks before the capstone. Added CASE syntax before the capstone expects the learner to classify missing, paid, underpaid and overpaid orders. Reconciled contradictory setup text that both denied engine execution and cited prior engine evidence.

Verification: executed the join, grouping, CTE and reconciliation examples and exercise answers, the new CASE example, and the optional combined balance query on local SQL Server Express. The run used `sqlcmd` with Windows authentication against `tempdb`; it created only session-local fixture tables. No persistent database or user table was created or modified. Observed Dia as the only unmatched customer, order counts 2/2/1/0, five reconciled order rows, and one orphan payment. Totals were due 390, matched paid 265, orphan 20 and net outstanding 125. Explicit SQL assertions checked due, matched and orphan totals. The command returned exit code 0.

## System Design correctness through failure handling

Reviewed lessons 15 through 19 in order, their exercises, stage project briefs and the optional booking lab. This sequence assumes the earlier API, queue and database vocabulary. It connects final-seat transactions, idempotent retries, deadlines, admission control and transactional outbox behavior.

The retry lesson explained an end-to-end deadline but only exercised attempt multiplication. Added a worked time budget and a separate practice calculation that deducts elapsed time, backoff and response reserve. The worked answer permits stopping when the remaining budget is too small. Added a combined booking/response-loss/relay-crash prediction and direct test names in the outbox lesson so the reader can connect the abstract discussion with local evidence.

Verification: all 12 existing booking and capacity tests passed. These cover separate connections competing for the last seat, durable booking-key replay, rollback after an injected write failure, duplicate relay delivery, backlog arithmetic and input bounds. The new deadline exercise gives 50 ms after subtracting 700 ms elapsed, 100 ms response reserve and 150 ms backoff from 1,000 ms. This is arithmetic under a stated model, not measured latency. The booking lab uses SQLite and an in-memory consumer deduplication set. It does not prove external email delivery, distributed availability or a combined end-to-end crash scenario.

## References and limits

The edits use the [Python control-flow tutorial](https://docs.python.org/3/tutorial/controlflow.html), [Python assertion reference](https://docs.python.org/3/reference/simple_stmts.html#the-assert-statement), [Microsoft GROUP BY reference](https://learn.microsoft.com/en-us/sql/t-sql/queries/select-group-by-transact-sql?view=sql-server-ver17) and [Microsoft CASE reference](https://learn.microsoft.com/en-us/sql/t-sql/language-elements/case-transact-sql?view=sql-server-ver17). The lesson's existing AWS retries reference redirected to a page without readable body text in the research tool, so this review does not claim a fresh inspection of that article. The added deadline numbers are independently checked arithmetic.

A person learning these topics has not been observed using the revised sequences. Time-to-completion, hint use and transfer to an unfamiliar project remain unknown. Browser coding, progress states and responsive presentation are verified separately in the main implementation task. Historical review records remain unchanged.
