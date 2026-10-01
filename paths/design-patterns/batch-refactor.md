# Refactor a complete export batch

Run `python -m unittest -v test_batch_export.py`. Four test methods apply the same success, ownership, validation, stale-version and storage-failure observations to both implementations.

The workflow accepts exact rows `{id, owner, title}`, a trusted actor string, output kind and expected store version. Input A/1/" One " plus A/2/"Café" yields `One
Café` for lines or `["One", "Café"]` for JSON. One successful batch increments version once and appends count2. A later row belonging to B rejects the entire A batch with no changed snapshot.

Copy the legacy into a new candidate module, change the test import to exercise it and extract one responsibility at a time. The separate reference is a comparison, not the required starting point. No written design template is needed.

Extend with CSV using the standard csv module. Test a title containing comma, quote and newline by reading it back with csv.reader. Keep ownership/version semantics unchanged. This extension is not in the reference.

MemoryStore is a single-threaded in-memory fixture. Its failure occurs before commit. It does not simulate a committed write followed by response loss, durable storage, authenticated identity or distributed transactions.
