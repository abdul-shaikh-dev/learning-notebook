--Run setup.sql first in the same session. These objects are temporary and synthetic.
IF DB_NAME()<>N'LearningNotebook' THROW 51300,'Select LearningNotebook and run setup.sql first.',1;
IF OBJECT_ID('tempdb..#LNOrders') IS NULL THROW 51300,'Run setup.sql in this session.',1;
IF @@TRANCOUNT<>0 THROW 51300,'Finish the existing transaction first.',1;
IF OBJECT_ID('tempdb..#LNRawEvents') IS NULL
BEGIN
 CREATE TABLE #LNRawEvents(RawRowId int NOT NULL PRIMARY KEY,EventId nvarchar(20) NOT NULL,
  OrderId int NOT NULL,AmountText nvarchar(30) NOT NULL);
 INSERT #LNRawEvents VALUES(1,N'E001',101,N'100.00'),(2,N'E001',101,N'100.00'),
 (3,N'E002',103,N'70.00'),(4,N'E003',105,N'45.00'),
 (5,N'E004',999,N'20.00'),(6,N'E005',102,N'bad-amount');
END;
IF OBJECT_ID('tempdb..#LNEventLedger') IS NULL
 CREATE TABLE #LNEventLedger(EventId nvarchar(20) NOT NULL PRIMARY KEY,
 OrderId int NOT NULL,Amount decimal(12,2) NOT NULL CHECK(Amount>=0));
SELECT * FROM #LNRawEvents ORDER BY RawRowId;
--Re-running preserves this session's staged observations and ledger for replay testing.
