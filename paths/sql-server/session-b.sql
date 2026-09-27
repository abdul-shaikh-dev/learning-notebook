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
-- Run ONE numbered block at a time, matching session A.
-- 1. A has updated 150 but not committed. Dirty read sees 150.
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
IF (SELECT Value FROM dbo.Counter WHERE Id=1)<>150
 THROW 51404,'Start B while A isolation block is paused.',1;
SELECT Value AS DirtyRead_Expected150 FROM dbo.Counter WHERE Id=1;
-- Lock-based READ COMMITTED blocks until A rolls back, then reads 100.
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
IF (SELECT Value FROM dbo.Counter WHERE Id=1)<>100
 THROW 51404,'Expected rolled-back value 100.',1;
SELECT Value AS CommittedRead_Expected100 FROM dbo.Counter WHERE Id=1;
GO
IF DB_NAME()<>N'LN_Disposable_Concurrency_20260927' OR
 OBJECT_ID(N'dbo.LabOwnership',N'U') IS NULL
 THROW 51401,'Dedicated disposable fixture required.',1;
IF NOT EXISTS(SELECT 1 FROM dbo.LabOwnership WHERE Marker='LearningNotebook disposable lab 2026-09-27')
 THROW 51401,'Fixture ownership marker mismatch.',1;
IF @@TRANCOUNT<>0 THROW 51401,'Finish the previous experiment first.',1;
SET XACT_ABORT ON;
SET LOCK_TIMEOUT 30000;
-- 2. Read 100 and write 120 while A pauses. A later writes its stale 110.
DECLARE @Old int;
SELECT @Old=Value FROM dbo.Counter WHERE Id=1;
IF @Old<>100 THROW 51404,'Reset first and follow the lost-update schedule.',1;
UPDATE dbo.Counter WITH (ROWLOCK) SET Value=@Old+20 WHERE Id=1;
SELECT Value AS BIntermediate_Expected120 FROM dbo.Counter WHERE Id=1;
GO
IF DB_NAME()<>N'LN_Disposable_Concurrency_20260927' OR
 OBJECT_ID(N'dbo.LabOwnership',N'U') IS NULL
 THROW 51401,'Dedicated disposable fixture required.',1;
IF NOT EXISTS(SELECT 1 FROM dbo.LabOwnership WHERE Marker='LearningNotebook disposable lab 2026-09-27')
 THROW 51401,'Fixture ownership marker mismatch.',1;
IF @@TRANCOUNT<>0 THROW 51401,'Finish the previous experiment first.',1;
SET XACT_ABORT ON;
SET LOCK_TIMEOUT 30000;
-- 3. This waits for A's transaction, then increments current 110 to 130.
UPDATE dbo.Counter WITH (ROWLOCK) SET Value=Value+20 WHERE Id=1;
IF (SELECT Value FROM dbo.Counter WHERE Id=1)<>130
 THROW 51404,'Expected both atomic increments after reset.',1;
SELECT Value AS AtomicIncrement_Expected130 FROM dbo.Counter WHERE Id=1;
GO
IF DB_NAME()<>N'LN_Disposable_Concurrency_20260927' OR
 OBJECT_ID(N'dbo.LabOwnership',N'U') IS NULL
 THROW 51401,'Dedicated disposable fixture required.',1;
IF NOT EXISTS(SELECT 1 FROM dbo.LabOwnership WHERE Marker='LearningNotebook disposable lab 2026-09-27')
 THROW 51401,'Fixture ownership marker mismatch.',1;
IF @@TRANCOUNT<>0 THROW 51401,'Finish the previous experiment first.',1;
SET XACT_ABORT ON;
SET LOCK_TIMEOUT 30000;
-- 4. B owns row 2 then requests row 1, while A later requests row 2.
SET DEADLOCK_PRIORITY NORMAL;
BEGIN TRY
 BEGIN TRAN;
 UPDATE dbo.Counter WITH (ROWLOCK) SET Value=Value+20 WHERE Id=2;
 UPDATE dbo.Counter WITH (ROWLOCK) SET Value=Value+20 WHERE Id=1;
 COMMIT;
 IF EXISTS(SELECT 1 FROM dbo.Counter WHERE Value<>120)
  THROW 51404,'Expected B only: two rows of 120 after A rollback.',1;
 SELECT * FROM dbo.Counter ORDER BY Id;
END TRY BEGIN CATCH IF XACT_STATE()<>0 ROLLBACK; THROW; END CATCH;
