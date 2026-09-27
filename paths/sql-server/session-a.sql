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
-- Run ONE numbered block at a time, as scheduled in concurrency-lab.md.
-- 1. Isolation: start A, then B block 1 during A's 15-second pause.
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
BEGIN TRY
 BEGIN TRAN;
 UPDATE dbo.Counter WITH (ROWLOCK) SET Value=150 WHERE Id=1;
 SELECT 'A uncommitted; start B isolation now' AS Step;
 WAITFOR DELAY '00:00:15';
 ROLLBACK;
END TRY BEGIN CATCH IF XACT_STATE()<>0 ROLLBACK; THROW; END CATCH;
GO
IF DB_NAME()<>N'LN_Disposable_Concurrency_20260927' OR
 OBJECT_ID(N'dbo.LabOwnership',N'U') IS NULL
 THROW 51401,'Dedicated disposable fixture required.',1;
IF NOT EXISTS(SELECT 1 FROM dbo.LabOwnership WHERE Marker='LearningNotebook disposable lab 2026-09-27')
 THROW 51401,'Fixture ownership marker mismatch.',1;
IF @@TRANCOUNT<>0 THROW 51401,'Finish the previous experiment first.',1;
SET XACT_ABORT ON;
SET LOCK_TIMEOUT 30000;
-- 2. Lost update: reset first; run A, then B block 2 during pause.
DECLARE @Old int;
SELECT @Old=Value FROM dbo.Counter WHERE Id=1;
SELECT 'A read old value; start B lost-update now' AS Step,@Old AS OldValue;
WAITFOR DELAY '00:00:15';
UPDATE dbo.Counter WITH (ROWLOCK) SET Value=@Old+10 WHERE Id=1;
IF (SELECT Value FROM dbo.Counter WHERE Id=1)<>110
 THROW 51402,'Unexpected lost-update schedule; reset and follow schedule.',1;
SELECT Value AS LostUpdateActual_Expected110_Not130 FROM dbo.Counter WHERE Id=1;
GO
IF DB_NAME()<>N'LN_Disposable_Concurrency_20260927' OR
 OBJECT_ID(N'dbo.LabOwnership',N'U') IS NULL
 THROW 51401,'Dedicated disposable fixture required.',1;
IF NOT EXISTS(SELECT 1 FROM dbo.LabOwnership WHERE Marker='LearningNotebook disposable lab 2026-09-27')
 THROW 51401,'Fixture ownership marker mismatch.',1;
IF @@TRANCOUNT<>0 THROW 51401,'Finish the previous experiment first.',1;
SET XACT_ABORT ON;
SET LOCK_TIMEOUT 30000;
-- 3. Atomic increment remedy: reset first, start A then B block 3.
BEGIN TRY
 BEGIN TRAN;
 UPDATE dbo.Counter WITH (ROWLOCK) SET Value=Value+10 WHERE Id=1;
 SELECT 'A holds update lock; start B atomic increment now' AS Step;
 WAITFOR DELAY '00:00:15';
 COMMIT;
END TRY BEGIN CATCH IF XACT_STATE()<>0 ROLLBACK; THROW; END CATCH;
GO
IF DB_NAME()<>N'LN_Disposable_Concurrency_20260927' OR
 OBJECT_ID(N'dbo.LabOwnership',N'U') IS NULL
 THROW 51401,'Dedicated disposable fixture required.',1;
IF NOT EXISTS(SELECT 1 FROM dbo.LabOwnership WHERE Marker='LearningNotebook disposable lab 2026-09-27')
 THROW 51401,'Fixture ownership marker mismatch.',1;
IF @@TRANCOUNT<>0 THROW 51401,'Finish the previous experiment first.',1;
SET XACT_ABORT ON;
SET LOCK_TIMEOUT 30000;
-- 4. Deadlock: reset first, start A then B block 4 promptly.
SET DEADLOCK_PRIORITY LOW; -- A is the expected victim (error 1205).
BEGIN TRY
 BEGIN TRAN;
 UPDATE dbo.Counter WITH (ROWLOCK) SET Value=Value+10 WHERE Id=1;
 SELECT 'A owns row 1; start B deadlock now' AS Step;
 WAITFOR DELAY '00:00:15';
 UPDATE dbo.Counter WITH (ROWLOCK) SET Value=Value+10 WHERE Id=2;
 COMMIT;
 THROW 51403,'No deadlock: interleaving missed; reset and repeat.',1;
END TRY
BEGIN CATCH
 IF XACT_STATE()<>0 ROLLBACK;
 IF ERROR_NUMBER()<>1205 THROW;
 SELECT ERROR_NUMBER() AS ExpectedDeadlockVictim1205,@@TRANCOUNT AS OpenTransactions_Expected0;
END CATCH;
SET DEADLOCK_PRIORITY NORMAL;
