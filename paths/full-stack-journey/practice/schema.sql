-- Execute in your dedicated, empty learning database; never change a shared schema.
SET XACT_ABORT ON;
IF OBJECT_ID(N'dbo.StudyTasks',N'U') IS NULL
CREATE TABLE dbo.StudyTasks (
    Id uniqueidentifier NOT NULL PRIMARY KEY,
    Title nvarchar(120) NOT NULL CHECK(LEN(LTRIM(RTRIM(Title))) BETWEEN 1 AND 120),
    Minutes int NOT NULL CHECK(Minutes BETWEEN 0 AND 1440),
    Done bit NOT NULL,
    Version int NOT NULL CHECK(Version >= 1)
);
