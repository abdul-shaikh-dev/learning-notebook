-- Close A/B tabs first. Does NOT kill connections or clean other databases.
USE master;
GO
DECLARE @OptIn bit=0;
IF @OptIn<>1 THROW 51407,'Explicitly opt in to deleting this disposable lab.',1;
IF @@TRANCOUNT<>0 THROW 51407,'Finish existing transaction first.',1;
IF DB_ID(N'LN_Disposable_Concurrency_20260927') IS NULL
 THROW 51407,'Lab database absent; nothing to remove.',1;
IF OBJECT_ID(N'LN_Disposable_Concurrency_20260927.dbo.LabOwnership',N'U') IS NULL
 THROW 51407,'No ownership marker; refusing deletion.',1;
IF NOT EXISTS(SELECT 1 FROM LN_Disposable_Concurrency_20260927.dbo.LabOwnership
 WHERE Marker='LearningNotebook disposable lab 2026-09-27')
 THROW 51407,'Ownership mismatch; refusing deletion.',1;
IF EXISTS(SELECT 1 FROM sys.dm_exec_sessions WHERE database_id=DB_ID(N'LN_Disposable_Concurrency_20260927'))
 THROW 51407,'Close every lab connection first; cleanup never kills sessions.',1;
DROP DATABASE LN_Disposable_Concurrency_20260927;
