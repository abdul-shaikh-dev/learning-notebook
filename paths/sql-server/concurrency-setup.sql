-- OPT IN ONLY: dedicated disposable database, SQL Server 2019+ training instance.
-- Set @OptIn=1 after reading concurrency-lab.md. Never reuse an existing DB.
USE master;
DECLARE @OptIn bit = 0;
IF @OptIn <> 1 THROW 51400,'Read concurrency-lab.md and explicitly opt in.',1;
IF @@TRANCOUNT <> 0 THROW 51400,'Finish the existing transaction.',1;
IF DB_ID(N'LN_Disposable_Concurrency_20260927') IS NOT NULL
 THROW 51400,'Database already exists; refusing to reuse or overwrite it.',1;
EXEC(N'CREATE DATABASE LN_Disposable_Concurrency_20260927');
IF DB_ID(N'LN_Disposable_Concurrency_20260927') IS NULL
 THROW 51400,'Creation failed; stopping without touching any existing database.',1;
EXEC(N'ALTER DATABASE LN_Disposable_Concurrency_20260927 SET READ_COMMITTED_SNAPSHOT OFF');
EXEC(N'ALTER DATABASE LN_Disposable_Concurrency_20260927 SET ALLOW_SNAPSHOT_ISOLATION ON');
EXEC(N'ALTER DATABASE LN_Disposable_Concurrency_20260927 SET QUERY_STORE = ON
 (OPERATION_MODE = READ_WRITE, QUERY_CAPTURE_MODE = ALL, MAX_STORAGE_SIZE_MB = 32,
 INTERVAL_LENGTH_MINUTES = 1)');
EXEC(N'USE LN_Disposable_Concurrency_20260927;
IF DB_NAME()<>N''LN_Disposable_Concurrency_20260927''
 THROW 51400,''Dedicated database context required.'',1;
CREATE TABLE dbo.LabOwnership(Marker varchar(80) NOT NULL PRIMARY KEY);
INSERT dbo.LabOwnership VALUES(''LearningNotebook disposable lab 2026-09-27'');
CREATE TABLE dbo.Counter(Id int NOT NULL PRIMARY KEY, Value int NOT NULL);
INSERT dbo.Counter VALUES(1,100),(2,100);
CREATE TABLE dbo.QueryFixture(Id int NOT NULL PRIMARY KEY, Category int NOT NULL, Padding char(200) NOT NULL);
;WITH Numbers AS (SELECT TOP(10000) ROW_NUMBER() OVER(ORDER BY (SELECT NULL)) n
 FROM sys.all_objects a CROSS JOIN sys.all_objects b)
INSERT dbo.QueryFixture SELECT n,CASE WHEN n<=9900 THEN 0 ELSE 1 END,REPLICATE(''x'',200) FROM Numbers;
SELECT DB_NAME() AS DatabaseName,@@VERSION AS EngineVersion;
');
