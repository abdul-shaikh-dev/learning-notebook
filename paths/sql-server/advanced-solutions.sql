--Prerequisite: setup.sql then advanced-lab.sql in this same session.
--Single-session educational loader; not a proof of production concurrency safety.
IF OBJECT_ID('tempdb..#LNRawEvents') IS NULL OR OBJECT_ID('tempdb..#LNEventLedger') IS NULL
 THROW 51300,'Run setup.sql and advanced-lab.sql first.',1;
IF @@TRANCOUNT<>0 THROW 51300,'Finish the existing transaction first.',1;
IF OBJECT_ID('tempdb..#LNClassifiedEvents') IS NOT NULL DROP TABLE #LNClassifiedEvents;
;WITH RawTyped AS (
 SELECT r.*,TRY_CONVERT(decimal(12,2),NULLIF(LTRIM(RTRIM(AmountText)),N'')) AS ParsedAmount
 FROM #LNRawEvents r
), Ranked AS (
 SELECT t.*,ROW_NUMBER() OVER(PARTITION BY t.EventId ORDER BY t.RawRowId) AS rn,
 CASE WHEN EXISTS (
  SELECT 1 FROM #LNRawEvents other WHERE other.EventId=t.EventId
  AND (other.OrderId<>t.OrderId
   OR DATALENGTH(other.AmountText)<>DATALENGTH(t.AmountText)
   OR CONVERT(varbinary(60),other.AmountText)<>CONVERT(varbinary(60),t.AmountText))
 ) THEN 1 ELSE 0 END AS HasConflict
 FROM RawTyped t
)
SELECT r.*,
 CASE WHEN HasConflict=1 THEN 'conflict'
      WHEN rn>1 THEN 'duplicate'
      WHEN ParsedAmount IS NULL OR ParsedAmount<0 THEN 'invalid'
      WHEN o.OrderId IS NULL THEN 'orphan'
      ELSE 'accepted' END AS Disposition
INTO #LNClassifiedEvents
FROM Ranked r LEFT JOIN #LNOrders o ON o.OrderId=r.OrderId;
SELECT RawRowId,EventId,OrderId,AmountText,ParsedAmount AS NormalizedAmount,Disposition FROM #LNClassifiedEvents ORDER BY RawRowId;
--Conservative conflict policy: differently formatted payload strings also require review.
--Compare byte length and bytes: SQL string equality can ignore trailing spaces.
--varbinary(60) covers the complete nvarchar(30) AmountText fixture column.
--TRY_CONVERT rounds valid extra decimal places; the lab accepts this scale conversion.
--A strict source-scale contract would require a separate precision check before acceptance.
SET XACT_ABORT ON;
DECLARE @Inserted int;
BEGIN TRY
 BEGIN TRAN;
 IF EXISTS(SELECT 1 FROM #LNClassifiedEvents s JOIN #LNEventLedger t ON t.EventId=s.EventId
  WHERE s.Disposition='accepted' AND (s.OrderId<>t.OrderId OR s.ParsedAmount<>t.Amount))
  THROW 51301,'Accepted event conflicts with the existing ledger.',1;
 INSERT #LNEventLedger(EventId,OrderId,Amount)
 SELECT s.EventId,s.OrderId,s.ParsedAmount FROM #LNClassifiedEvents s
 WHERE s.Disposition='accepted' AND NOT EXISTS(SELECT 1 FROM #LNEventLedger t WHERE t.EventId=s.EventId);
 SET @Inserted=@@ROWCOUNT;
 COMMIT;
END TRY
BEGIN CATCH
 IF XACT_STATE()<>0 ROLLBACK;
 THROW;
END CATCH;
SELECT @Inserted AS InsertedNow; --3 first pass;0 replay
SELECT Disposition,COUNT(*) AS RawRows FROM #LNClassifiedEvents GROUP BY Disposition ORDER BY Disposition;
SELECT COUNT(*) AS LedgerEvents,SUM(Amount) AS LedgerAmount FROM #LNEventLedger; --3/215
;WITH Paid AS(SELECT OrderId,SUM(Amount) AS PaidAmount FROM #LNEventLedger GROUP BY OrderId)
SELECT o.OrderId,o.Amount AS Due,COALESCE(p.PaidAmount,0) AS Paid,
 o.Amount-COALESCE(p.PaidAmount,0) AS Outstanding,
 CASE WHEN p.OrderId IS NULL THEN 'missing' WHEN o.Amount=p.PaidAmount THEN 'paid'
 WHEN o.Amount>p.PaidAmount THEN 'underpaid' ELSE 'overpaid' END AS Status
FROM #LNOrders o LEFT JOIN Paid p ON p.OrderId=o.OrderId ORDER BY o.OrderId;
--Five rows:101 paid0;102 missing50;103 underpaid10;104 missing120;105 overpaid-5.
--Due390;paid215;net outstanding175. Raw row counts6=accepted3+duplicate1+invalid1+orphan1.
