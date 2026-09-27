USE LN_Disposable_Concurrency_20260927;
GO
IF DB_NAME()<>N'LN_Disposable_Concurrency_20260927' OR
 OBJECT_ID(N'dbo.LabOwnership',N'U') IS NULL
 THROW 51401,'Dedicated disposable fixture required.',1;
IF NOT EXISTS(SELECT 1 FROM dbo.LabOwnership WHERE Marker='LearningNotebook disposable lab 2026-09-27')
 THROW 51401,'Fixture ownership marker mismatch.',1;
IF @@TRANCOUNT<>0 THROW 51401,'Finish the previous experiment first.',1;
SET XACT_ABORT ON;
SET LOCK_TIMEOUT 30000;
-- Run only after BOTH sessions are idle with no open transaction.
UPDATE dbo.Counter SET Value=100;
IF (SELECT COUNT(*) FROM dbo.Counter WHERE Value=100)<>2
 THROW 51405,'Fixture must contain exactly two reset rows.',1;
SELECT * FROM dbo.Counter ORDER BY Id;
