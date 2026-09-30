"""Bounded single-process SQLite ETL reference. Python 3.11+, no packages.

Four-field CSV, nonnegative integer cents, UTC Z timestamps, exact-byte batch
fingerprints. Transaction coordinates orders and run marker. Not a live SQL
Server adapter, orchestrator, streaming engine or power-loss certification.
"""
import argparse
import csv
from datetime import datetime, timezone
import hashlib
import io
from pathlib import Path
import re
import sqlite3
from tempfile import TemporaryDirectory

FIELDS=['order_id','customer_id','occurred_at','amount_cents']
MAX_BYTES=262144
MAX_ROWS=1000
SCHEMA="""
CREATE TABLE IF NOT EXISTS runs (
    batch_id TEXT PRIMARY KEY, fingerprint TEXT NOT NULL, row_count INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS orders (
    order_id TEXT PRIMARY KEY, customer_id TEXT NOT NULL,
    occurred_at TEXT NOT NULL, amount_cents INTEGER NOT NULL CHECK(amount_cents >= 0));
"""

def identifier(value):
    if not isinstance(value,str) or not re.fullmatch(r'[A-Za-z0-9_-]{1,64}',value):
        raise ValueError('identifier contract')
    return value

def read_batch(source):
    with Path(source).open('rb') as stream: raw=stream.read(MAX_BYTES+1)
    if len(raw)>MAX_BYTES: raise ValueError('batch exceeds byte limit')
    text=raw.decode('utf-8')
    reader=csv.DictReader(io.StringIO(text,newline=''),strict=True)
    if reader.fieldnames != FIELDS: raise ValueError('exact ordered headers required')
    records=[]
    seen=set()
    for number,row in enumerate(reader,start=1):
        if number>MAX_ROWS: raise ValueError('batch exceeds row limit')
        if set(row)!=set(FIELDS) or any(v is None for v in row.values()):
            raise ValueError('row field count')
        order=identifier(row['order_id']); customer=identifier(row['customer_id'])
        if order in seen: raise ValueError('duplicate order in source')
        seen.add(order)
        value=row['amount_cents']
        if not re.fullmatch(r'[0-9]{1,12}',value): raise ValueError('amount contract')
        amount=int(value)
        instant=row['occurred_at']
        if not re.fullmatch(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z',instant):
            raise ValueError('UTC seconds timestamp required')
        parsed=datetime.fromisoformat(instant.replace('Z','+00:00'))
        if parsed.utcoffset()!=timezone.utc.utcoffset(parsed): raise ValueError('UTC required')
        records.append((order,customer,instant,amount))
    return records,hashlib.sha256(raw).hexdigest()

def import_csv(source,database,batch_id):
    batch_id=identifier(batch_id)
    if Path(source).resolve()==Path(database).resolve():
        raise ValueError('source and target must be different paths')
    records,fingerprint=read_batch(source)
    connection=sqlite3.connect(database,timeout=2)
    try:
        # Schema initialization is separate; this single-process lab assumes a
        # trusted compatible database. Data/marker transaction is explicit.
        connection.executescript(SCHEMA)
        with connection:
            connection.execute('BEGIN IMMEDIATE')
            existing=connection.execute('SELECT fingerprint FROM runs WHERE batch_id=?',(batch_id,)).fetchone()
            if existing:
                if existing[0]!=fingerprint: raise ValueError('batch identity conflicts with payload')
                return 'replay'
            connection.executemany('INSERT INTO orders VALUES (?,?,?,?)',records)
            connection.execute('INSERT INTO runs VALUES (?,?,?)',(batch_id,fingerprint,len(records)))
        return 'committed'
    finally: connection.close()

def reconcile(database):
    connection=sqlite3.connect(database)
    try:
        count,total=connection.execute('SELECT COUNT(*),COALESCE(SUM(amount_cents),0) FROM orders').fetchone()
        ids=[r[0] for r in connection.execute('SELECT order_id FROM orders ORDER BY order_id')]
        days=list(connection.execute('SELECT substr(occurred_at,1,10),SUM(amount_cents) FROM orders GROUP BY substr(occurred_at,1,10) ORDER BY 1'))
        return {'orders':count,'total_cents':total,'ids':ids,'utc_days':days}
    finally: connection.close()

def demo():
    source=Path(__file__).with_name('sample_orders.csv')
    with TemporaryDirectory() as folder:
        database=Path(folder)/'practice.db'
        print(import_csv(source,database,'sept-01'))
        print(import_csv(source,database,'sept-01'))
        result=reconcile(database)
        print(f'orders={result["orders"]} total_cents={result["total_cents"]}')

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--demo',action='store_true')
    parser.add_argument('source',nargs='?',type=Path)
    parser.add_argument('database',nargs='?',type=Path)
    parser.add_argument('batch_id',nargs='?')
    args=parser.parse_args()
    if args.demo and any((args.source,args.database,args.batch_id)): parser.error('choose demo or three arguments')
    if not args.demo and not all((args.source,args.database,args.batch_id)): parser.error('provide source database batch_id')
    try:
        if args.demo: demo()
        else:
            print(import_csv(args.source,args.database,args.batch_id))
            print(reconcile(args.database))
        return 0
    except (OSError,ValueError,csv.Error,sqlite3.Error) as error:
        import sys
        # Deliberately omit source rows and driver detail from shared output.
        print(f'import failed: {type(error).__name__}; inspect the contract and local evidence',file=sys.stderr)
        return 1

if __name__=='__main__': raise SystemExit(main())
