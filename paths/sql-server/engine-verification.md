# SQL Server execution evidence — 27 September 2026

Executed against local SQL Server 2025 Express, build 17.0.1000.7, using Windows
authentication and sqlcmd. This is evidence for the listed fixtures on that build,
not certification of all lesson snippets, other engine versions or production use.

| Experiment | Observed result |
| --- | --- |
| Dirty versus committed read | B observed uncommitted 150, then waited for A's rollback and read 100. |
| Lost update | B wrote 120; A's stale update left 110, losing B's increment. |
| Atomic increment | Both increments survived; final value 130. |
| Deadlock | A was victim 1205; B committed both rows at 120. |
| Transaction cleanup | Both sessions finished each scenario with zero open transactions. |
| Decimal normalization | 1.004 became 1.00; 1.005 became 1.01. Invalid text, blank and negative input were rejected. |
| Foundation fixture | Five orders totalled 390; six payments totalled 285; matched 265 plus orphan 20; net outstanding 125. Temporary DELETE was rolled back. |
| Import and replay | Six raw rows: three accepted, one duplicate, one orphan, one invalid. First import inserted three; replay inserted zero; ledger total 215, outstanding 175. |
| Query Store | Ten successful measured executions captured; two stored plans observed. Actual plans showed five clustered index scans before the index and five index seeks after it. |
| Logical reads | Measured COUNT queries used 288 reads before and 2 after the index. Index-construction reads were excluded from this comparison. This tiny-fixture observation is not a promised speedup. |
| Negative control | Omitting the measured workload caused the new capture assertion to fail with error 51406. |
| Database cleanup | The dedicated disposable database was removed and its absence verified. No existing user database was changed. |

The two-session harness started B only after observing A in its scheduled WAITFOR
pause. Foundation/import scripts used the same connection, with only their
LearningNotebook database context redirected to tempdb; all their data objects
remained local temporary tables. The advanced lab used its dedicated disposable
database. Actual execution plans were captured with STATISTICS XML, alongside
STATISTICS IO/TIME and Query Store plan/runtime records.

## Defect found and corrected

The original Query Store lookup compared exact source text. The engine stored an
automatically parameterized form, so the report returned no workload plans. Its
text-only existence check could also match its own inspection query.

The corrected lab executes dbo.LabReadQueryFixture and filters Query Store by that
module's object_id. It requires at least ten successful captured runtime executions,
which the inspection query cannot satisfy. The temporary lab procedure and index
are removed after reporting. A deliberate missing-workload run proves the assertion
rejects absent evidence.

Reference: [Microsoft sys.query_store_query — object_id and parameterization](https://learn.microsoft.com/en-us/sql/relational-databases/system-catalog-views/sys-query-store-query-transact-sql?view=sql-server-ver17).

Crash recovery, real least-privilege roles, migrations, rowversion write races and
all optional lesson extensions were not tested here. This run used an administrative
training connection; it does not establish a production permissions model.
