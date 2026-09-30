-- Optional design companion. NOT executed by the local Python suite.
-- Review and run only in your own isolated notebook SQL Server database.
-- No CREATE DATABASE, DROP, live credentials or production changes here.
-- DATETIME2 is UTC by application contract; it does not enforce timezone.
CREATE TABLE dbo.NotebookImportRuns (
    batch_id VARCHAR(64) NOT NULL PRIMARY KEY,
    fingerprint CHAR(64) NOT NULL,
    row_count INT NOT NULL CHECK (row_count >= 0)
);
CREATE TABLE dbo.NotebookOrders (
    order_id VARCHAR(64) NOT NULL PRIMARY KEY,
    customer_id VARCHAR(64) NOT NULL,
    occurred_at_utc DATETIME2(0) NOT NULL,
    amount_cents BIGINT NOT NULL CHECK (amount_cents >= 0)
);
-- Adapter exercise: use a reviewed Python SQL Server driver and parameterized
-- inserts. Coordinate run lookup/uniqueness, order writes and run marker in ONE
-- transaction. Test same-batch replay, conflict and late-row duplicate rollback.
-- Query expected sample results: 2, 2000 and IDs o1/o2.
SELECT COUNT_BIG(*) AS orders, SUM(amount_cents) AS total_cents FROM dbo.NotebookOrders;
SELECT order_id FROM dbo.NotebookOrders ORDER BY order_id;
-- Cleanup only your dedicated practice database via your normal reviewed
-- administration workflow after exporting evidence; do not run on shared data.
