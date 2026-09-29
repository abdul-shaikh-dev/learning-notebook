/* OPT-IN CLEANUP. Inspect object names and ensure this is your disposable training DB. */
IF DB_NAME() NOT LIKE N'LearningNotebookLab[_]%'
 THROW 51410,'Use the disposable LearningNotebookLab_<suffix> database.',1;
IF OBJECT_ID(N'ln_lab.LabMarker',N'U') IS NULL OR
 NOT EXISTS(SELECT 1 FROM ln_lab.LabMarker WHERE Marker=N'LearningNotebookSchemaPermissionsV1')
 THROW 51411,'This lab does not own the ln_lab schema.',1;
IF OBJECT_ID(N'ln_lab.OrderRecord',N'U') IS NOT NULL DROP TABLE ln_lab.OrderRecord;
IF OBJECT_ID(N'ln_lab.Customer',N'U') IS NOT NULL DROP TABLE ln_lab.Customer;
IF DATABASE_PRINCIPAL_ID(N'ln_lab_reader') IS NOT NULL AND DATABASE_PRINCIPAL_ID(N'ln_lab_probe') IS NOT NULL
 ALTER ROLE ln_lab_reader DROP MEMBER ln_lab_probe;
IF DATABASE_PRINCIPAL_ID(N'ln_lab_probe') IS NOT NULL DROP USER ln_lab_probe;
IF DATABASE_PRINCIPAL_ID(N'ln_lab_reader') IS NOT NULL DROP ROLE ln_lab_reader;
DROP TABLE ln_lab.LabMarker;
IF SCHEMA_ID(N'ln_lab') IS NOT NULL EXEC(N'DROP SCHEMA ln_lab');
