/* OPT-IN ONLY. Use a disposable training database where you have schema/role rights.
   Run this file twice: create/seed, then replay. Do not run in a production DB. */
SET XACT_ABORT ON;
IF DB_NAME() NOT LIKE N'LearningNotebookLab[_]%'
 THROW 51410,'Use a disposable database named LearningNotebookLab_<suffix>.',1;
-- Refuse to adopt another exercise's schema or principals.
IF SCHEMA_ID(N'ln_lab') IS NOT NULL AND OBJECT_ID(N'ln_lab.LabMarker',N'U') IS NULL
 THROW 51411,'ln_lab schema exists without this lab marker.',1;
IF OBJECT_ID(N'ln_lab.LabMarker',N'U') IS NOT NULL
 EXEC(N'IF (SELECT COUNT(*) FROM ln_lab.LabMarker)<>1 OR
  NOT EXISTS(SELECT 1 FROM ln_lab.LabMarker WHERE Marker=N''LearningNotebookSchemaPermissionsV1'')
  THROW 51413,''Unexpected lab marker contents.'',1;');
IF SCHEMA_ID(N'ln_lab') IS NULL AND
 (DATABASE_PRINCIPAL_ID(N'ln_lab_reader') IS NOT NULL OR DATABASE_PRINCIPAL_ID(N'ln_lab_probe') IS NOT NULL)
 THROW 51412,'Lab role or user name already exists.',1;
IF SCHEMA_ID(N'ln_lab') IS NULL EXEC(N'CREATE SCHEMA ln_lab');
IF OBJECT_ID(N'ln_lab.LabMarker',N'U') IS NULL
 CREATE TABLE ln_lab.LabMarker(Marker nvarchar(50) NOT NULL PRIMARY KEY);
IF NOT EXISTS(SELECT 1 FROM ln_lab.LabMarker WHERE Marker=N'LearningNotebookSchemaPermissionsV1')
 INSERT ln_lab.LabMarker(Marker) VALUES(N'LearningNotebookSchemaPermissionsV1');

IF OBJECT_ID(N'ln_lab.Customer',N'U') IS NULL
 CREATE TABLE ln_lab.Customer(CustomerId int NOT NULL CONSTRAINT PK_ln_customer PRIMARY KEY, Name nvarchar(80) NOT NULL);
IF OBJECT_ID(N'ln_lab.OrderRecord',N'U') IS NULL
 CREATE TABLE ln_lab.OrderRecord(OrderId int NOT NULL CONSTRAINT PK_ln_order PRIMARY KEY,
 CustomerId int NOT NULL, Amount decimal(12,2) NOT NULL,
 CONSTRAINT FK_ln_order_customer FOREIGN KEY(CustomerId) REFERENCES ln_lab.Customer(CustomerId),
 CONSTRAINT CK_ln_order_amount CHECK(Amount>=0));
BEGIN TRAN;
 IF NOT EXISTS(SELECT 1 FROM ln_lab.Customer WHERE CustomerId=1)
  INSERT ln_lab.Customer(CustomerId,Name) VALUES(1,N'Ada');
 IF NOT EXISTS(SELECT 1 FROM ln_lab.OrderRecord WHERE OrderId=101)
  INSERT ln_lab.OrderRecord(OrderId,CustomerId,Amount) VALUES(101,1,100.00);
COMMIT;
SELECT c.CustomerId,c.Name,o.OrderId,o.Amount
FROM ln_lab.Customer c LEFT JOIN ln_lab.OrderRecord o ON o.CustomerId=c.CustomerId;
-- Expected: one Ada / 101 / 100.00 row after both runs.
-- Negative FK check. Error is expected; catch it and verify no orphan row exists.
BEGIN TRY
 INSERT ln_lab.OrderRecord(OrderId,CustomerId,Amount) VALUES(999,999,1.00);
 THROW 51400,'Foreign key did not reject orphan',1;
END TRY
BEGIN CATCH
 IF ERROR_NUMBER()<>547 THROW;
 SELECT ERROR_NUMBER() AS ExpectedForeignKeyError;
END CATCH;
IF EXISTS(SELECT 1 FROM ln_lab.OrderRecord WHERE OrderId=999)
 THROW 51401,'Orphan persisted',1;
-- Expand migration: add nullable field first so old inserts continue to work.
IF COL_LENGTH(N'ln_lab.OrderRecord',N'SourceCode') IS NULL
 ALTER TABLE ln_lab.OrderRecord ADD SourceCode nvarchar(20) NULL;
UPDATE ln_lab.OrderRecord SET SourceCode=N'legacy' WHERE SourceCode IS NULL;
SELECT COUNT(*) AS MissingSourceCode FROM ln_lab.OrderRecord WHERE SourceCode IS NULL; -- 0
-- Optional later contract step (only after every writer supports it):
-- ALTER TABLE ln_lab.OrderRecord ALTER COLUMN SourceCode nvarchar(20) NOT NULL;
-- A contained database user without a login keeps the denial test local to this DB.
IF DATABASE_PRINCIPAL_ID(N'ln_lab_reader') IS NULL CREATE ROLE ln_lab_reader;
IF DATABASE_PRINCIPAL_ID(N'ln_lab_probe') IS NULL CREATE USER ln_lab_probe WITHOUT LOGIN;
IF IS_ROLEMEMBER(N'ln_lab_reader',N'ln_lab_probe')<>1 ALTER ROLE ln_lab_reader ADD MEMBER ln_lab_probe;
GRANT SELECT ON SCHEMA::ln_lab TO ln_lab_reader;
EXECUTE AS USER=N'ln_lab_probe';
BEGIN TRY
 SELECT COUNT(*) AS VisibleOrders FROM ln_lab.OrderRecord; -- 1
 INSERT ln_lab.OrderRecord(OrderId,CustomerId,Amount) VALUES(998,1,1.00);
 REVERT;
 THROW 51402,'Limited user unexpectedly inserted an order',1;
END TRY
BEGIN CATCH
 DECLARE @PermissionError int=ERROR_NUMBER();
 IF USER_NAME()=N'ln_lab_probe' REVERT;
 IF @PermissionError<>229 THROW;
 SELECT @PermissionError AS ExpectedPermissionError;
END CATCH;
IF EXISTS(SELECT 1 FROM ln_lab.OrderRecord WHERE OrderId=998)
 THROW 51403,'Denied order persisted',1;
