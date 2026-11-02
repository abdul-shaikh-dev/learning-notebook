r"""Fact checks for the SQL Server & T-SQL checkpoint answers, run on a real SQL Server.

Each fact is a T-SQL batch that runs after the course's own fixture (setup.sql, and for the capstone
advanced-lab.sql and advanced-solutions.sql) and prints its result. The script maps that result to the
option it supports and fails if that differs from the authored correct option.
Only connection-local temporary tables in tempdb are used; no database or permanent table is changed.

Run: python tests/sql_checkpoint_facts.py --server .\SQLEXPRESS
Requires sqlcmd on PATH and Windows authentication to an authorized training server.
For a disposable container use SQL authentication: --user sa --trust-server-certificate,
with the password in the SQLCMDPASSWORD environment variable (never on the command line).
"""
import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / 'paths' / 'sql-server'

# Answers that follow from the lesson text rather than engine behaviour.
SOURCED = {
    'indexes-and-plans/2': 'Concept, lesson 11',
    'index-selectivity-statistics/2': 'Model, lesson 16',
    'plan-regressions-query-store/2': 'Example, lesson 19',
}

# key: (T-SQL that sets @a, {printed result: option text}). A table of None means the result is the option text.
FACTS = {
    'connect-and-read/2': ("SET @a = (SELECT COUNT(DISTINCT CustomerId) FROM #LNOrders);", None),
    'types-keys-null/2': ("SET @a = (SELECT COUNT(*) FROM #LNCustomers WHERE Email IS NULL);", None),
    'select-filter-sort/2': ("SET @a = 5/2;", None),
    'joins-and-grain/2': ("SET @a = (SELECT SUM(o.Amount) FROM #LNOrders o JOIN #LNPayments p ON p.OrderId = o.OrderId);",
                          {'370.00': '370', '390.00': '390', '285.00': '285'}),
    'group-and-reconcile/2': ("SET @a = (SELECT COUNT(*) FROM (SELECT CustomerId, SUM(Amount) AS Total FROM #LNOrders GROUP BY CustomerId) g);", None),
    'cte-and-subquery/2': ("SET @a = (SELECT COUNT(*) FROM #LNOrders WHERE OrderId NOT IN (101, NULL));", None),
    'window-functions/2': (""";WITH r AS (SELECT CustomerId, OrderId,
 ROW_NUMBER() OVER (PARTITION BY CustomerId ORDER BY OrderDate DESC, OrderId DESC) AS rn FROM #LNOrders)
SELECT @a = OrderId FROM r WHERE CustomerId = 1 AND rn = 1;""", None),
    'parameters-procedures/2': ("""DECLARE @count int;
EXEC sys.sp_executesql N'SELECT @count = COUNT(*) FROM #LNCustomers WHERE CustomerName = @Name',
 N'@Name nvarchar(50), @count int OUTPUT', @Name = N''' OR 1=1 --', @count = @count OUTPUT;
SET @a = @count;""", {'0': '0: the whole value is compared as a name', '4': '4: the condition becomes always true'}),
    'temporary-staging/2': ("""SELECT * INTO #FStaging FROM #LNOrders;
UPDATE #FStaging SET Amount = Amount + 1 WHERE CustomerId = 1;
PRINT 'staging update done';
SET @a = @@ROWCOUNT;
DROP TABLE #FStaging;""", None),
    'transactions-isolation/2': ("""CREATE TABLE #FXact (Id int PRIMARY KEY);
INSERT #FXact VALUES (1);
SET XACT_ABORT ON;
BEGIN TRY
 BEGIN TRAN; INSERT #FXact VALUES (1); COMMIT;
END TRY
BEGIN CATCH
 SET @a = XACT_STATE();
 IF XACT_STATE() <> 0 ROLLBACK;
END CATCH;
SET XACT_ABORT OFF;
DROP TABLE #FXact;""", {'-1': '-1: the transaction cannot commit and must be rolled back', '1': '1: the transaction can still commit', '0': '0: there is no transaction'}),
    'reconciliation-capstone/2': (""";WITH Paid AS (SELECT OrderId, SUM(Amount) AS PaidAmount FROM #LNPayments GROUP BY OrderId)
SELECT @a = CONCAT(o.OrderId, N', by ', CAST(p.PaidAmount - o.Amount AS int))
FROM #LNOrders o JOIN Paid p ON p.OrderId = o.OrderId WHERE p.PaidAmount > o.Amount;
IF (SELECT COUNT(*) FROM #LNOrders o JOIN (SELECT OrderId, SUM(Amount) AS PaidAmount FROM #LNPayments GROUP BY OrderId) p
    ON p.OrderId = o.OrderId WHERE p.PaidAmount > o.Amount) <> 1 SET @a = N'more than one overpaid order';""", None),
    'schema-contracts/2': ("SET @a = COALESCE(CONVERT(nvarchar(20), TRY_CONVERT(decimal(12,2), N'1.005')), N'NULL');", None),
    'sets-and-apply/2': ("SET @a = (SELECT COUNT(*) FROM (SELECT CustomerId FROM #LNOrders UNION SELECT CustomerId FROM #LNCustomers) u);", None),
    'window-frames-and-gaps/2': (""";WITH l AS (SELECT OrderId, LAG(Amount) OVER (ORDER BY OrderDate, OrderId) AS Previous FROM #LNOrders)
SELECT @a = COALESCE(CONVERT(nvarchar(20), Previous), N'NULL') FROM l WHERE OrderId = 101;""", None),
    'procedure-transaction-contracts/2': ("""SELECT * INTO #FContract FROM #LNOrders;
DECLARE @rows int, @error int = 0;
BEGIN TRY UPDATE #FContract SET Amount = Amount + 1 WHERE OrderId = 999; SET @rows = @@ROWCOUNT; END TRY
BEGIN CATCH SET @error = ERROR_NUMBER(); END CATCH;
SET @a = CONCAT(N'error ', @error, N', rows ', @rows, N', count ', (SELECT COUNT(*) FROM #FContract));
DROP TABLE #FContract;""", {'error 0, rows 0, count 5': 'No error is raised, and @@ROWCOUNT is 0'}),
    'incremental-load-contracts/2': ("""CREATE TABLE #FTarget (EventId nvarchar(10) PRIMARY KEY, Amount int NOT NULL);
DECLARE @batch TABLE (EventId nvarchar(10), Amount int);
INSERT @batch VALUES (N'E1', 10), (N'E2', 20);
INSERT #FTarget SELECT b.EventId, b.Amount FROM @batch b WHERE NOT EXISTS (SELECT 1 FROM #FTarget t WHERE t.EventId = b.EventId);
UPDATE @batch SET Amount = 11 WHERE EventId = N'E1';
INSERT #FTarget SELECT b.EventId, b.Amount FROM @batch b WHERE NOT EXISTS (SELECT 1 FROM #FTarget t WHERE t.EventId = b.EventId);
SET @a = CONCAT((SELECT SUM(Amount) FROM #FTarget), N' with E1 = ', (SELECT Amount FROM #FTarget WHERE EventId = N'E1'));
DROP TABLE #FTarget;""", {'30 with E1 = 10': '30: the changed E1 is skipped without any warning'}),
    'concurrency-lost-updates/2': ("""CREATE TABLE #FVersioned (Id int PRIMARY KEY, Amount int NOT NULL, Revision int NOT NULL);
INSERT #FVersioned VALUES (1, 110, 2);
DECLARE @rows int, @error int = 0;
BEGIN TRY UPDATE #FVersioned SET Amount = 120, Revision = Revision + 1 WHERE Id = 1 AND Revision = 1; SET @rows = @@ROWCOUNT; END TRY
BEGIN CATCH SET @error = ERROR_NUMBER(); END CATCH;
SET @a = CONCAT(N'error ', @error, N', rows ', @rows, N', amount ', (SELECT Amount FROM #FVersioned));
DROP TABLE #FVersioned;""", {'error 0, rows 0, amount 110': '0, which the caller must treat as a conflict'}),
    'deadlocks-retries/2': ("""SET @a = CASE WHEN (SELECT text FROM sys.messages WHERE message_id = 1205 AND language_id = 1033) LIKE N'%chosen as the deadlock victim%'
 AND (SELECT text FROM sys.messages WHERE message_id = 1222 AND language_id = 1033) LIKE N'%Lock request time out%' THEN N'1205' ELSE N'unexpected' END;""", None),
    'least-privilege-dynamic-sql/2': ("SET @a = QUOTENAME(N'a]b');", None),
    'migrations-and-release/2': ("""CREATE TABLE #FMigrate (Id int PRIMARY KEY, Note nvarchar(20) NULL);
INSERT #FMigrate VALUES (1, N'filled'), (2, NULL);
DECLARE @error int = 0;
BEGIN TRY ALTER TABLE #FMigrate ALTER COLUMN Note nvarchar(20) NOT NULL; END TRY
BEGIN CATCH SET @error = ERROR_NUMBER(); END CATCH;
SET @a = CONCAT(N'error ', @error, N', nullable ', COLUMNPROPERTY(OBJECT_ID('tempdb..#FMigrate'), 'Note', 'AllowsNull'));
DROP TABLE #FMigrate;""", {'error 515, nullable 1': 'Fails with error 515, leaving the column nullable', 'error 0, nullable 0': 'Succeeds and fills the NULL with an empty string'}),
    'stage/foundation/1': ("SET @a = CONCAT((SELECT COUNT(*) FROM #LNCustomers), N' and ', (SELECT COUNT(Email) FROM #LNCustomers));", None),
    'stage/foundation/2': ("SET @a = (SELECT COUNT(*) FROM (SELECT CustomerId FROM #LNOrders GROUP BY CustomerId HAVING COUNT(*) > 1) g);", None),
    'stage/foundation/3': ("""SET @a = (SELECT COUNT(*) FROM #LNCustomers c WHERE EXISTS (
 SELECT 1 FROM #LNOrders o JOIN #LNPayments p ON p.OrderId = o.OrderId WHERE o.CustomerId = c.CustomerId));""", None),
    'stage/intermediate/1': ("""SET @a = (SELECT STRING_AGG(CONVERT(nvarchar(10), CustomerId), N',') FROM
 (SELECT CustomerId FROM #LNCustomers EXCEPT SELECT CustomerId FROM #LNOrders) e);""", {'4': 'Only customer 4'}),
    'stage/intermediate/2': (""";WITH w AS (SELECT OrderId, SUM(Amount) OVER (ORDER BY OrderDate, OrderId ROWS BETWEEN 1 PRECEDING AND CURRENT ROW) AS TwoRow FROM #LNOrders)
SELECT @a = CONVERT(nvarchar(20), CAST(TwoRow AS int)) FROM w WHERE OrderId = 105;""", None),
    'stage/intermediate/3': ("SET @a = CONCAT(CAST(12.345 AS decimal(12,2)) * 3, N' and ', CAST(12.345 * 3 AS decimal(12,2)));", None),
    'stage/advanced/1': ("SET @a = COALESCE(CONVERT(nvarchar(20), TRY_CONVERT(int, N'')), N'NULL');", None),
    'stage/advanced/2': ("""IF @@TRANCOUNT <> 0 THROW 51600, 'Fact needs no open transaction.', 1;
BEGIN TRAN; BEGIN TRAN;
IF @@TRANCOUNT <> 2 THROW 51601, 'Expected two nested levels.', 1;
ROLLBACK;
SET @a = @@TRANCOUNT;""", None),
    'stage/advanced/3': ("""CREATE TABLE #FRowversion (Id int PRIMARY KEY, Amount int NOT NULL, Version rowversion);
INSERT #FRowversion (Id, Amount) VALUES (1, 100);
DECLARE @before binary(8) = (SELECT Version FROM #FRowversion);
UPDATE #FRowversion SET Amount = 110 WHERE Id = 1;
SET @a = CASE WHEN (SELECT Version FROM #FRowversion) > @before THEN N'greater' WHEN (SELECT Version FROM #FRowversion) = @before THEN N'same' ELSE N'other' END;
DROP TABLE #FRowversion;""", {'greater': 'It is greater: every change gets a new, higher value', 'same': 'It is the same, because only another column changed'}),
    # Runs last: the capstone solution leaves SET XACT_ABORT ON for the session.
    'advanced-import-capstone/2': ("SET @a = (SELECT COUNT(*) FROM #LNClassifiedEvents WHERE Disposition = 'duplicate');", None),
}


def fixture():
    setup = (COURSE / 'setup.sql').read_text(encoding='utf-8')
    # Use only the published temporary-table fixture, after its database setup.
    return 'SET NOCOUNT ON;\n' + setup.split('SET NOCOUNT ON;', 1)[1]


def capstone():
    advanced = (COURSE / 'advanced-lab.sql').read_text(encoding='utf-8')
    advanced = advanced.replace("IF DB_NAME()<>N'LearningNotebook' THROW 51300,'Select LearningNotebook and run setup.sql first.',1;", '')
    return advanced + '\nGO\n' + (COURSE / 'advanced-solutions.sql').read_text(encoding='utf-8')


def script():
    chunks = [fixture(), 'GO']
    for key, (body, _) in FACTS.items():
        if key == 'advanced-import-capstone/2':
            chunks += [capstone(), 'GO']
        chunks += [f"DECLARE @a nvarchar(400);\n{body}\nPRINT CONCAT(N'FACT|{key}|', @a);", 'GO']
    return '\n'.join(chunks) + '\n'


def questions():
    data = json.loads((COURSE / 'checkpoints.json').read_text(encoding='utf-8'))
    for lesson, items in data['lessons'].items():
        for i, q in enumerate(items):
            yield f'{lesson}/{i + 2}', q
    for stage, items in data['stages'].items():
        for i, q in enumerate(items):
            yield f'stage/{stage}/{i + 1}', q


def run(args):
    login = ['-U', args.user] if args.user else ['-E']
    with tempfile.TemporaryDirectory(prefix='notebook-sql-facts-') as folder:
        file = Path(folder) / 'facts.sql'
        file.write_text(script(), encoding='utf-8')
        # Windows sqlcmd needs the UTF-8 code page named; Linux sqlcmd reads UTF-8 already.
        result = subprocess.run([args.sqlcmd, '-S', args.server, *login, *(['-C'] if args.trust_server_certificate else []),
                                 '-d', 'tempdb', '-l', '5', '-t', '30', '-b', *(['-f', '65001'] if os.name == 'nt' else []), '-i', str(file)],
                                text=True, encoding='utf-8', capture_output=True, timeout=120)
    if result.returncode:
        sys.exit(f'sqlcmd failed with exit code {result.returncode}:\n{result.stdout}\n{result.stderr}')
    printed = {}
    for line in result.stdout.splitlines():
        if line.startswith('FACT|'):
            _, key, value = line.rstrip().split('|', 2)
            printed[key] = value
    return printed


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--server', required=True)
    parser.add_argument('--sqlcmd', default=shutil.which('sqlcmd'))
    parser.add_argument('--user', help='SQL login; sqlcmd reads its password from SQLCMDPASSWORD')
    parser.add_argument('--trust-server-certificate', action='store_true', help='accept a self-signed certificate, as a local container uses')
    args = parser.parse_args()
    if not args.sqlcmd: parser.error('sqlcmd is required')
    if args.user and not os.environ.get('SQLCMDPASSWORD'): parser.error('set SQLCMDPASSWORD for --user')
    printed = run(args)
    seen, failures = set(), []
    for key, q in questions():
        seen.add(key)
        if key in SOURCED:
            continue
        if key not in FACTS:
            failures.append(f'{key}: no fact check and no cited source'); continue
        if key not in printed:
            failures.append(f'{key}: the fact printed no result'); continue
        table = FACTS[key][1]
        answer = printed[key] if table is None else table.get(printed[key])
        if answer is None:
            failures.append(f'{key}: unexpected result {printed[key]!r}')
        elif answer != q['options'][q['correct']]:
            failures.append(f'{key}: SQL Server supports {answer!r}, the question marks {q["options"][q["correct"]]!r}')
    failures += [f'{key}: fact has no question' for key in set(FACTS) | set(SOURCED) if key not in seen]
    if failures:
        sys.exit('SQL Server checkpoint facts failed:\n' + '\n'.join(failures))
    print(f'PASS: {len(FACTS)} SQL Server checkpoint answers checked against a real SQL Server; {len(SOURCED)} cited from the lessons.')


if __name__ == '__main__':
    main()
