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
-- Dedicated DB only. Run this file once; capture before/after metrics.
IF EXISTS(SELECT 1 FROM sys.database_query_store_options WHERE actual_state_desc<>'READ_WRITE')
 THROW 51406,'Query Store must be READ_WRITE; inspect its readonly_reason.',1;
IF (SELECT COUNT(*) FROM dbo.QueryFixture WHERE Category=1)<>100
 THROW 51406,'Expected exactly 100 matching fixture rows.',1;
SET STATISTICS IO ON;
SET STATISTICS TIME ON;
GO
IF DB_NAME()<>N'LN_Disposable_Concurrency_20260927' OR
 OBJECT_ID(N'dbo.LabOwnership',N'U') IS NULL
 THROW 51401,'Dedicated disposable fixture required.',1;
IF NOT EXISTS(SELECT 1 FROM dbo.LabOwnership WHERE Marker='LearningNotebook disposable lab 2026-09-27')
 THROW 51401,'Fixture ownership marker mismatch.',1;
IF @@TRANCOUNT<>0 THROW 51401,'Finish the previous experiment first.',1;
SET XACT_ABORT ON;
SET LOCK_TIMEOUT 30000;
-- Stable statement text lets Query Store identify the same query before/after index.
SELECT COUNT(*) AS Matches FROM dbo.QueryFixture WHERE Category=1; -- 100
GO 5
IF DB_NAME()<>N'LN_Disposable_Concurrency_20260927' OR
 OBJECT_ID(N'dbo.LabOwnership',N'U') IS NULL
 THROW 51401,'Dedicated disposable fixture required.',1;
IF NOT EXISTS(SELECT 1 FROM dbo.LabOwnership WHERE Marker='LearningNotebook disposable lab 2026-09-27')
 THROW 51401,'Fixture ownership marker mismatch.',1;
IF @@TRANCOUNT<>0 THROW 51401,'Finish the previous experiment first.',1;
SET XACT_ABORT ON;
SET LOCK_TIMEOUT 30000;
EXEC sys.sp_query_store_flush_db;
GO
IF DB_NAME()<>N'LN_Disposable_Concurrency_20260927' OR
 OBJECT_ID(N'dbo.LabOwnership',N'U') IS NULL
 THROW 51401,'Dedicated disposable fixture required.',1;
IF NOT EXISTS(SELECT 1 FROM dbo.LabOwnership WHERE Marker='LearningNotebook disposable lab 2026-09-27')
 THROW 51401,'Fixture ownership marker mismatch.',1;
IF @@TRANCOUNT<>0 THROW 51401,'Finish the previous experiment first.',1;
SET XACT_ABORT ON;
SET LOCK_TIMEOUT 30000;
CREATE INDEX IX_LabQueryFixture_Category ON dbo.QueryFixture(Category);
GO
IF DB_NAME()<>N'LN_Disposable_Concurrency_20260927' OR
 OBJECT_ID(N'dbo.LabOwnership',N'U') IS NULL
 THROW 51401,'Dedicated disposable fixture required.',1;
IF NOT EXISTS(SELECT 1 FROM dbo.LabOwnership WHERE Marker='LearningNotebook disposable lab 2026-09-27')
 THROW 51401,'Fixture ownership marker mismatch.',1;
IF @@TRANCOUNT<>0 THROW 51401,'Finish the previous experiment first.',1;
SET XACT_ABORT ON;
SET LOCK_TIMEOUT 30000;
SELECT COUNT(*) AS Matches FROM dbo.QueryFixture WHERE Category=1; -- 100
GO 5
IF DB_NAME()<>N'LN_Disposable_Concurrency_20260927' OR
 OBJECT_ID(N'dbo.LabOwnership',N'U') IS NULL
 THROW 51401,'Dedicated disposable fixture required.',1;
IF NOT EXISTS(SELECT 1 FROM dbo.LabOwnership WHERE Marker='LearningNotebook disposable lab 2026-09-27')
 THROW 51401,'Fixture ownership marker mismatch.',1;
IF @@TRANCOUNT<>0 THROW 51401,'Finish the previous experiment first.',1;
SET XACT_ABORT ON;
SET LOCK_TIMEOUT 30000;
EXEC sys.sp_query_store_flush_db;
GO
IF DB_NAME()<>N'LN_Disposable_Concurrency_20260927' OR
 OBJECT_ID(N'dbo.LabOwnership',N'U') IS NULL
 THROW 51401,'Dedicated disposable fixture required.',1;
IF NOT EXISTS(SELECT 1 FROM dbo.LabOwnership WHERE Marker='LearningNotebook disposable lab 2026-09-27')
 THROW 51401,'Fixture ownership marker mismatch.',1;
IF @@TRANCOUNT<>0 THROW 51401,'Finish the previous experiment first.',1;
SET XACT_ABORT ON;
SET LOCK_TIMEOUT 30000;
IF NOT EXISTS(SELECT 1 FROM sys.query_store_query_text WHERE query_sql_text LIKE
 N'%SELECT COUNT(*) AS Matches FROM dbo.QueryFixture WHERE Category=1%')
 THROW 51406,'Expected captured statement; inspect capture state and flush again.',1;
SELECT q.query_id,p.plan_id,p.query_plan,r.count_executions,r.avg_duration,
 r.avg_logical_io_reads,i.start_time,i.end_time
FROM sys.query_store_query_text t
JOIN sys.query_store_query q ON q.query_text_id=t.query_text_id
JOIN sys.query_store_plan p ON p.query_id=q.query_id
JOIN sys.query_store_runtime_stats r ON r.plan_id=p.plan_id
JOIN sys.query_store_runtime_stats_interval i ON i.runtime_stats_interval_id=r.runtime_stats_interval_id
WHERE t.query_sql_text LIKE N'%SELECT COUNT(*) AS Matches FROM dbo.QueryFixture WHERE Category=1%'
 AND t.query_sql_text NOT LIKE N'%query_store%'
ORDER BY q.query_id,p.plan_id,i.start_time;
-- Duration is microseconds; logical IO is 8KB page reads, not elapsed time.
-- Multiple runtime rows can describe the active interval: aggregate by plan/interval
-- with execution-count-weighted averages before making comparisons.
SET STATISTICS IO OFF;
SET STATISTICS TIME OFF;
DROP INDEX IX_LabQueryFixture_Category ON dbo.QueryFixture;
