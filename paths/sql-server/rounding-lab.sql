-- Standalone session-local fixture; no database/table changes outside this session.
DECLARE @Raw TABLE(RawAmount nvarchar(30));
INSERT @Raw VALUES(N'1.004'),(N'1.005'),(N'bad-amount'),(N'-1.00'),(N'');
SELECT RawAmount,TRY_CONVERT(decimal(12,2),NULLIF(LTRIM(RTRIM(RawAmount)),N'')) AS NormalizedAmount,
 CASE WHEN TRY_CONVERT(decimal(12,2),NULLIF(LTRIM(RTRIM(RawAmount)),N'')) IS NULL
 OR TRY_CONVERT(decimal(12,2),NULLIF(LTRIM(RTRIM(RawAmount)),N''))<0
 THEN 'rejected' ELSE 'accepted scale conversion' END AS Policy
FROM @Raw;
IF TRY_CONVERT(decimal(12,2),N'1.004')<>1.00 OR TRY_CONVERT(decimal(12,2),N'1.005')<>1.01
 THROW 51408,'Unexpected rounding behavior.',1;
-- Acceptance means normalization, not preservation of source precision.
