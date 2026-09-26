-- Learning Notebook: synthetic, single-currency SQL Server fixture.
-- Run on a local/training SQL Server with permission to create a database.
-- Read first. No existing database is dropped and no permanent table is modified.
-- For a fresh fixture, open a new SSMS query window and run this entire file.
-- Re-running in the same session preserves the existing fixture (no duplicate inserts).
IF DB_ID(N'LearningNotebook') IS NULL
    EXEC(N'CREATE DATABASE LearningNotebook');
GO
USE LearningNotebook;
GO
IF @@TRANCOUNT <> 0 THROW 51000,'Finish the existing transaction before setup.',1;
IF DB_NAME()<>N'LearningNotebook' THROW 51000,'Expected LearningNotebook database.',1;
SET NOCOUNT ON;
IF OBJECT_ID('tempdb..#LNCustomers') IS NULL
BEGIN
 CREATE TABLE #LNCustomers (CustomerId int NOT NULL PRIMARY KEY,
  CustomerName nvarchar(50) NOT NULL, Email nvarchar(100) NULL);
 INSERT #LNCustomers(CustomerId,CustomerName,Email) VALUES
 (1,N'Ada',N'ada@example.test'),(2,N'Ben',NULL),
 (3,N'Chen',N'chen@example.test'),(4,N'Dia',NULL);
END;
IF OBJECT_ID('tempdb..#LNOrders') IS NULL
BEGIN
 CREATE TABLE #LNOrders (OrderId int NOT NULL PRIMARY KEY,CustomerId int NOT NULL,
  OrderDate date NOT NULL,Amount decimal(12,2) NOT NULL CHECK(Amount>=0));
 INSERT #LNOrders(OrderId,CustomerId,OrderDate,Amount) VALUES
 (101,1,'20260101',100),(102,1,'20260102',50),(103,2,'20260102',80),
 (104,2,'20260103',120),(105,3,'20260103',40);
END;
IF OBJECT_ID('tempdb..#LNPayments') IS NULL
BEGIN
 CREATE TABLE #LNPayments (PaymentId int NOT NULL PRIMARY KEY,OrderId int NOT NULL,
  Amount decimal(12,2) NOT NULL CHECK(Amount>=0));
 INSERT #LNPayments(PaymentId,OrderId,Amount) VALUES
 (201,101,60),(202,101,40),(203,102,50),(204,103,70),(205,105,45),(206,999,20);
END;
SELECT DB_NAME() AS CurrentDatabase;
SELECT COUNT(*) AS Orders,SUM(Amount) AS OrderAmount FROM #LNOrders; --5,390
SELECT COUNT(*) AS Payments,SUM(Amount) AS PaymentAmount FROM #LNPayments; --6,285
-- A temp-table FK is not enforced: demonstrate the equivalent validation explicitly.
SELECT o.OrderId AS UnexpectedCustomerReference FROM #LNOrders o
WHERE NOT EXISTS(SELECT 1 FROM #LNCustomers c WHERE c.CustomerId=o.CustomerId); --0 rows
