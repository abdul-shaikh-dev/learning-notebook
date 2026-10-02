# SQL Server & T-SQL practice

Read the twenty-four lessons in Learning Notebook. The browser is a reader, not a SQL engine.

1. Connect SSMS to a local/training SQL Server instance.
2. Read and run `setup.sql`. It creates LearningNotebook only if absent, then populates session-local temporary tables. No permanent table or existing database is dropped.
3. Keep the same query window open. Run individual lesson exercises there, or append `solutions.sql` in the same window. A separately opened file/window may have a separate connection.
4. For a fresh fixture open a new query window and run setup. Re-running setup in an existing session does not duplicate its rows or reset edits.

All data is fictional and amounts use one unspecified currency. Four customers, five orders totalling 390, and six payments totalling 285. Known-order payments 265 plus orphan 20 reconcile to 285. Net outstanding is 125, consisting of underpayment 10, missing payment 120 and overpayment 5.

The staged orphan is intentional. SQL Server does not enforce foreign keys on temporary tables; setup includes an explicit order/customer relationship check. Production design should use permanent constraints and a governed staging process.

Solutions include a DELETE demonstration only against a dedicated temporary work copy and roll it back. Procedure/index demonstrations in the reader are optional and affect only session-local objects. Run transaction demonstrations without an existing transaction.

Verification: the foundation and import fixtures were executed on SQL Server 2025 Express 17.0.1000.7 on 27 September 2026. See engine-verification.md for observed results, the temporary database-context adaptation and limits. Microsoft Learn references are listed in path.json and the reader.


## Three assessed stages

The first twelve lesson IDs are preserved as Foundations. Six Intermediate and six Advanced lessons add modelling, APPLY/set comparison, precise window frames, indexing/statistics, procedure ownership, incremental loads, Query Store, optimistic concurrency, deadlocks, permissions, migrations and the import capstone.

Each stage includes exit criteria and a project with requirements, rubric and a worked solution. Completing a lesson is not proof of independent competence: produce the required outputs and explain your choices.

## Advanced synthetic import

After setup.sql, run advanced-lab.sql and advanced-solutions.sql in the **same query session**. Run the solution twice without resetting that session. It modifies only temporary objects. No permanent application schema, permissions, database settings or Query Store plans are changed.

This is a separate dataset from the foundation payments. Six raw rows reconcile as three accepted, one exact duplicate, one orphan and one invalid amount. First run inserts three events totalling 215; replay inserts zero. Five known orders total 390 and net outstanding is 175.

The conflict policy is deliberately conservative: different amount strings under one key are quarantined, even if they could parse to an equal amount. Valid amounts are converted to decimal(12,2), including scale rounding; strict source-scale validation would be an additional requirement. Conflicts discovered after a prior accepted import require a governed correction/reversal process; quarantine does not remove earlier ledger history.

The reader's Query Store queries are read-only and can require permissions. The deadlock schedule and retry solution are reasoning/pseudocode, not scripts to induce blocking. Cross-session concurrency needs a trainer-provisioned shared sandbox: local temporary tables do not test that behavior.

The dedicated concurrency and Query Store labs were also executed on SQL Server 2025 Express; engine-verification.md records the results and the Query Store lookup defect corrected during testing. Crash recovery, production permissions, migrations and optional extensions remain separate verification work.

## Opt-in advanced engine practice

Read concurrency-lab.md before changing the setup opt-in flag. It provides an isolated disposable database, separate A/B schedules for isolation, lost updates and deadlocks, a Query Store before/after index lab, assertions and guarded cleanup. Run only one selected numbered session block at a time. Recorded execution evidence is in engine-verification.md; record your own engine/build/settings when repeating it. Run rounding-lab.sql separately to see raw 1.004/1.005 become 1.00/1.01 under the deliberate accepted rounding policy.

## Maintainer regression check

From the repository root, run `python -B tests/sql-conflicts.py --server .\SQLEXPRESS`
against an authorized local training instance with Windows authentication and
`sqlcmd` on PATH. This check uses connection-local temporary tables in `tempdb`;
it does not create or change permanent databases/tables. It checks baseline import,
idempotent replay, and raw amount text differences including trailing spaces.
The amount comparison uses byte length and bytes, avoiding collation and padding
rules that would make ordinary SQL string equality too permissive for this policy.

## Optional permanent-schema extension

Read `schema-permissions-lab.md` before running `schema-permissions-lab.sql` in a disposable database. It adds a real foreign key, a repeatable nullable-column expand/backfill and a read-only role. A separate limited user is needed to observe write denial. Use `schema-permissions-cleanup.sql` only after confirming object ownership. These permanent objects are separate from the main session-local fixtures.


## Reference scope and verification limits

Lessons target SQL Server 2019 or later and cite the SQL Server 2025 documentation, version 17.x. Selected downloadable labs ran on SQL Server 2025 Express 17.0.1000.7; engine-verification.md lists the exact coverage. Other snippets were checked against sources but were not executed. Do not assume Azure services use the same default isolation settings.
