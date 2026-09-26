# SQL Server & T-SQL practice

Read the twelve lessons in Learning Notebook. The browser is a reader, not a SQL engine.

1. Connect SSMS to a local/training SQL Server instance.
2. Read and run `setup.sql`. It creates LearningNotebook only if absent, then populates session-local temporary tables. No permanent table or existing database is dropped.
3. Keep the same query window open. Run individual lesson exercises there, or append `solutions.sql` in the same window. A separately opened file/window may have a separate connection.
4. For a fresh fixture open a new query window and run setup. Re-running setup in an existing session does not duplicate its rows or reset edits.

All data is fictional and amounts use one unspecified currency. Four customers, five orders totalling 390, and six payments totalling 285. Known-order payments 265 plus orphan 20 reconcile to 285. Net outstanding is 125, consisting of underpayment 10, missing payment 120 and overpayment 5.

The staged orphan is intentional. SQL Server does not enforce foreign keys on temporary tables; setup includes an explicit order/customer relationship check. Production design should use permanent constraints and a governed staging process.

Solutions include a DELETE demonstration only against a dedicated temporary work copy and roll it back. Procedure/index demonstrations in the reader are optional and affect only session-local objects. Run transaction demonstrations without an existing transaction.

Verification: JSON structure, twelve exercises/quizzes, fixture arithmetic and SQL source review. No installed SQL Server engine was used to execute these examples; expected results are not an engine test report. Microsoft Learn references are listed in path.json and the reader.
