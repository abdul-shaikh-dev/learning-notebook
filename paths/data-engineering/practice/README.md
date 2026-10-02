# Data Engineering practice

Python 3.11+ with its sqlite3 module; standard library only. Extract the ZIP;
all files are flat in data-engineering-practice. From that folder run:

```
python pipeline_lab.py --demo
python -m unittest -v test_pipeline_lab.py
```

Expected demo: committed; replay; orders=2 total_cents=2000. The demo uses a
temporary database and cleans it automatically. The eleven tests use isolated
temporary directories and real SQLite transactions. They verify replay,
content conflict, a later duplicate causing rollback of earlier new rows and
the run marker, invalid rows preserving state, exact headers, duplicate source
IDs, empty batches, byte/row limits, literal parameter binding and quoted CSV.

For persistent practice in your own extracted folder:

```
python pipeline_lab.py sample_orders.csv practice.db sept-01
python pipeline_lab.py sample_orders.csv practice.db sept-01
```

First run commits; second replays without additional rows. Inspect identifiers,
count and totals using `reconcile`. A successful CLI status alone does not establish that the stored data is correct. Remove **only your
practice.db** after closing the program and reviewing your evidence.

## Contract and projects

CSV headers exactly: order_id, customer_id, occurred_at, amount_cents in that
order. UTF-8, bounded to 256 KiB and 1000 rows, strict field count. IDs use 1–64
ASCII letters/digits/_/-. Source order IDs are unique. Timestamps are valid
UTC instants at whole seconds ending Z. Amount is nonnegative integer cents
represented by 1–12 digits, in one fictional two-decimal currency. No real PII.
Empty header-only input is a valid batch. Refunds/currencies require a new
contract rather than silently accepting negative/mixed-unit values.

1. Foundation: independently write contract.md and a parser. Test quoted CSV,
   malformed headers/amounts/timestamps and an empty batch. Predict totals first.
2. Intermediate: independently build the transactional importer and batch
   fingerprint. Test an existing order appearing after a new row: neither that
   new row nor its marker may commit. Explain exact-byte fingerprint semantics.
3. Advanced: add one chosen extension (versioned currencies, event-day revision
   or historical dimensions), reconcile keys and amounts, and document a
   failure/recovery scenario. Add independent extension tests.

## Integration boundaries

SQLite is the executed baseline. sql-server-bridge.sql is a reviewed optional
T-SQL schema companion; it was **not executed** in this task and includes no
Python adapter. SQL Server needs an external driver, an isolated target,
authentication chosen by you, target-specific transaction/race tests and safe
cleanup. No credentials belong in this public notebook.

The reference assumes one local process and a trusted compatible database.
BEGIN IMMEDIATE and uniqueness coordinate its SQLite writes; production
connectors, concurrent multi-host consumers, CDC, deletion propagation,
Airflow scheduling, streaming lateness, scale and failover remain separate
integration exercises. No power-loss durability claim is made.

Changing the same batch ID's exact input bytes conflicts even if parsed rows
look equivalent. Source and target paths must differ. Schema initialization is
separate from each data/marker transaction; an empty target may be initialized
on a failed first transaction but no business rows/marker are committed.
