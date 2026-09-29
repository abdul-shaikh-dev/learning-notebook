# Optional runnable booking failure lab

Python 3.10+ and SQLite from the Python standard library are sufficient. From this directory run `python -m unittest -v test_booking_lab.py`. Each test creates a disposable database. No server or external notification is involved.

Before running, predict four outcomes for a one-seat workshop: two simultaneous distinct callers; a lost response followed by the same key; a forced failure after decrement; and a relay crash after a notification is published but before the outbox row is marked sent. Then run the tests and inspect `booking_lab.py` against the workbook timelines.

The booking transaction uses `BEGIN IMMEDIATE` so SQLite writers coordinate, and its conditional decrement, booking, caller-scoped key/result and outbox row commit together. The race test starts two separate connections together; one succeeds, one receives sold out. A key replay returns the original booking. Reusing that key for a different workshop conflicts. The injected failure rolls the decrement back. These are local SQLite observations, not a distributed capacity test.

The relay deliberately publishes before marking its row sent. A crash at that point causes the same event ID to be delivered twice after restart. The test consumer deduplicates IDs in memory to demonstrate the rule; a real consumer needs durable deduplication and an external provider's own outcome/reconciliation contract. A crash after the consumer effect but before its receipt remains uncertain.

Extension: add a durable consumer receipt table in a separate SQLite database, then test a restart between receiving and acknowledging the event. Explain which changes can share a transaction and which cannot. Record observed rows, error outcomes and remaining unknowns in the workbook's review packet. Do not claim exactly-once external delivery or production capacity from this exercise.
