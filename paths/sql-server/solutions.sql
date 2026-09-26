-- Run setup.sql first in this same session. Original synthetic fixture stays unchanged.
USE LearningNotebook;
GO
IF OBJECT_ID('tempdb..#LNOrders') IS NULL THROW 51000,'Run setup.sql in this session first.',1;
IF @@TRANCOUNT<>0 THROW 51000,'Finish your existing transaction first.',1;
GO

-- 1. Connect to a database and read a result
-- Expected: Four rows: 1 Ada, 2 Ben, 3 Chen, 4 Dia. | Column names are explicit; ordering is requested.
SELECT CustomerId, CustomerName FROM #LNCustomers ORDER BY CustomerId;
GO

-- 2. Choose types, keys and missing-value rules
-- Expected: Ada and Chen, in that order. | The predicate uses IS NOT NULL, not <> NULL.
SELECT CustomerName FROM #LNCustomers WHERE Email IS NOT NULL ORDER BY CustomerId;
GO

-- 3. Filter, calculate and sort deliberately
-- Expected: 104 =120.00 followed by101 =100.00. | Ordering makes TOP meaningful and deterministic for tied amounts.
SELECT TOP (2) OrderId, Amount FROM #LNOrders ORDER BY Amount DESC, OrderId;
GO

-- 4. Join without losing or multiplying records
-- Expected: Only4/Dia. | A LEFT JOIN with WHERE o.OrderId IS NULL is also correct.
SELECT c.CustomerId, c.CustomerName FROM #LNCustomers c
WHERE NOT EXISTS (SELECT 1 FROM #LNOrders o WHERE o.CustomerId=c.CustomerId)
ORDER BY c.CustomerId;
GO

-- 5. Aggregate at a stated grain
-- Expected: Counts1:2,2:2,3:1,4:0. | Counts sum to5; customer population stays4.
SELECT c.CustomerId, COUNT(o.OrderId) AS Orders
FROM #LNCustomers c LEFT JOIN #LNOrders o ON o.CustomerId=c.CustomerId
GROUP BY c.CustomerId ORDER BY c.CustomerId;
GO

-- 6. Use CTEs and subqueries to name intermediate ideas
-- Expected: 206,999,20.00 is the single orphan. | The unknown payment is reported, not silently joined away.
SELECT p.PaymentId,p.OrderId,p.Amount FROM #LNPayments p
WHERE NOT EXISTS (SELECT 1 FROM #LNOrders o WHERE o.OrderId=p.OrderId)
ORDER BY p.PaymentId;
GO

-- 7. Rank rows and compute running totals
-- Expected: 1/102,2/104,3/105. | Dia is absent because she has no order; include her only through a separate population join.
;WITH Ranked AS (SELECT CustomerId,OrderId,ROW_NUMBER() OVER (PARTITION BY CustomerId ORDER BY OrderDate DESC,OrderId DESC) AS rn FROM #LNOrders)
SELECT CustomerId,OrderId FROM Ranked WHERE rn=1 ORDER BY CustomerId;
GO

-- 8. Use parameters and stored procedures
-- Expected: 101/100.00 and104/120.00. | @Minimum is declared and supplied separately from statement text.
EXEC sys.sp_executesql N'SELECT OrderId,Amount FROM #LNOrders WHERE Amount>=@Minimum ORDER BY OrderId;', N'@Minimum decimal(12,2)', @Minimum=90;
GO

-- 9. Stage work and practise safe data changes
-- Expected: DeletedRows=1; RemainingRows=5. | The original #LNOrders still contains all five rows.
IF @@TRANCOUNT<>0 THROW 51000,'Finish your existing transaction first.',1;
IF OBJECT_ID('tempdb..#LNExerciseWork') IS NOT NULL DROP TABLE #LNExerciseWork;
SELECT OrderId,Amount INTO #LNExerciseWork FROM #LNOrders;
BEGIN TRAN;
DELETE FROM #LNExerciseWork WHERE OrderId=105;
SELECT @@ROWCOUNT AS DeletedRows;
ROLLBACK;
SELECT COUNT(*) AS RemainingRows FROM #LNExerciseWork;
GO

-- 10. Make a unit of work atomic and consider concurrency
-- Expected: One row for LearningNotebook; exact flag values depend on setup and are not assumed. | Explain statement-level versioning when READ_COMMITTED_SNAPSHOT is enabled.
SELECT name,is_read_committed_snapshot_on,snapshot_isolation_state_desc FROM sys.databases WHERE name=DB_NAME();
GO

-- 11. Read a plan before tuning a query
-- Expected: 101,102,103,104,105. | No function is applied to OrderDate; no speed improvement is claimed from this tiny fixture.
SELECT OrderId FROM #LNOrders WHERE OrderDate>='20260101' AND OrderDate<'20270101' ORDER BY OrderId;
GO

-- 12. Build an order-to-payment reconciliation
-- Expected: Exactly5 order rows and1 orphan row. | Due390, matched paid265, net outstanding125. | Status counts:paid2,underpaid1,missing1,overpaid1. | All payment amounts285 = matched265 + orphan20. | A duplicate-event policy is described without silently using DISTINCT on monetary values.
;WITH Paid AS (
 SELECT OrderId,COUNT(*) AS PaymentCount,SUM(Amount) AS PaidAmount
 FROM #LNPayments GROUP BY OrderId
)
SELECT o.OrderId,o.Amount AS Due,COALESCE(p.PaidAmount,0) AS Paid,
 o.Amount-COALESCE(p.PaidAmount,0) AS Outstanding,
 CASE WHEN p.OrderId IS NULL THEN 'missing'
      WHEN p.PaidAmount=o.Amount THEN 'paid'
      WHEN p.PaidAmount<o.Amount THEN 'underpaid'
      ELSE 'overpaid' END AS Status
FROM #LNOrders o LEFT JOIN Paid p ON p.OrderId=o.OrderId
ORDER BY o.OrderId;
SELECT p.PaymentId,p.OrderId,p.Amount FROM #LNPayments p
WHERE NOT EXISTS (SELECT 1 FROM #LNOrders o WHERE o.OrderId=p.OrderId)
ORDER BY p.PaymentId;
GO
