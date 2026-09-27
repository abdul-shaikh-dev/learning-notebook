r"""Opt-in SQL Server regression; only connection-local temporary tables in tempdb.

Run: python tests/sql-conflicts.py --server .\SQLEXPRESS
Requires sqlcmd on PATH and Windows authentication to an authorized training server.
No databases or permanent tables are created, altered or removed.
"""
import argparse
import json
from pathlib import Path
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]

def script(root):
    setup = (root / 'paths/sql-server/setup.sql').read_text(encoding='utf-8')
    # Use only the published temporary-table fixture, after its database setup.
    fixture = setup.split('SET NOCOUNT ON;', 1)[1]
    advanced = (root / 'paths/sql-server/advanced-lab.sql').read_text(encoding='utf-8')
    advanced = advanced.replace("IF DB_NAME()<>N'LearningNotebook' THROW 51300,'Select LearningNotebook and run setup.sql first.',1;", '')
    solution = (root / 'paths/sql-server/advanced-solutions.sql').read_text(encoding='utf-8')
    prefix = 'SET NOCOUNT ON;\n' + fixture + '\nGO\n' + advanced + '\nGO\n'
    chunks = [prefix, solution, "IF (SELECT COUNT(*) FROM #LNEventLedger)<>3 OR (SELECT SUM(Amount) FROM #LNEventLedger)<>215 THROW 51500,'Baseline import failed',1;", 'GO', solution, "IF @Inserted<>0 THROW 51501,'Replay inserted duplicates',1;", 'GO']
    cases = [
        ('trailing space', "(1,N'P',101,N'100.00'),(2,N'P',101,N'100.00 ')", 'conflict', 0),
        ('leading space', "(1,N'P',101,N'100.00'),(2,N'P',101,N' 100.00')", 'conflict', 0),
        ('equivalent amount', "(1,N'P',101,N'100.00'),(2,N'P',101,N'100.0')", 'conflict', 0),
        ('same length distinct bytes', "(1,N'P',101,N'bad'),(2,N'P',101,N'BAD')", 'conflict', 0),
        ('different order', "(1,N'P',101,N'100.00'),(2,N'P',102,N'100.00')", 'conflict', 0),
        ('exact replay', "(1,N'P',101,N'100.00'),(2,N'P',101,N'100.00')", 'duplicate', 1),
    ]
    for name, values, disposition, ledger in cases:
        chunks += [f'DELETE FROM #LNRawEvents; DELETE FROM #LNEventLedger; INSERT #LNRawEvents VALUES {values};', 'GO', solution]
        expected = 2 if disposition == 'conflict' else 1
        chunks += [f"IF (SELECT COUNT(*) FROM #LNClassifiedEvents WHERE Disposition='{disposition}')<>{expected} THROW 51502,'Wrong classification: {name}',1;", f"IF (SELECT COUNT(*) FROM #LNEventLedger)<>{ledger} THROW 51503,'Wrong ledger count: {name}',1;", 'GO']
    # Both lesson and capstone answer keys must contain the same classifier.
    classifier = solution[solution.index(';WITH RawTyped'):solution.index('SELECT RawRowId')]
    curriculum = json.loads((root / 'paths/sql-server/path.json').read_text(encoding='utf-8'))
    def strings(value):
        if isinstance(value, str): yield value
        elif isinstance(value, dict):
            for item in value.values(): yield from strings(item)
        elif isinstance(value, list):
            for item in value: yield from strings(item)
    assert sum(classifier in value for value in strings(curriculum)) == 2, 'SQL answer keys diverged'
    chunks.append("PRINT 'PASS: baseline, replay and six byte-exact SQL classification cases';")
    return '\n'.join(chunks)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--server', required=True)
    parser.add_argument('--sqlcmd', default=shutil.which('sqlcmd'))
    args = parser.parse_args()
    if not args.sqlcmd: parser.error('sqlcmd is required')
    with tempfile.TemporaryDirectory(prefix='notebook-sql-conflicts-') as folder:
        file = Path(folder) / 'verify.sql'
        file.write_text(script(ROOT), encoding='utf-8')
        result = subprocess.run([args.sqlcmd, '-S', args.server, '-E', '-d', 'tempdb', '-l', '5', '-t', '30', '-b', '-f', '65001', '-i', str(file)], text=True, capture_output=True, timeout=90)
        if result.returncode:
            print(result.stdout, result.stderr)
            raise SystemExit(result.returncode)
        print(next(line.strip() for line in result.stdout.splitlines() if line.startswith('PASS:')))
