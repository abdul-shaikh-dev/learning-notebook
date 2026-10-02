# Refactor a complete export batch

Run `python -m unittest -v test_batch_export.py`. Four test methods apply the same success, ownership, validation, stale-version and storage-failure observations to both implementations.

The workflow accepts rows with exactly `id`, `owner` and `title`, a trusted actor string, an output kind and the expected store version. For owner A, use row 1 with title " One " and row 2 with title "Café". The lines format puts `One` and `Café` on separate lines. The JSON format returns `["One", "Café"]`. One successful batch increments the version once and appends a count of 2. A later row belonging to B rejects the entire A batch with no changed snapshot.

Copy the legacy into a new candidate module, change the test import to exercise it and extract one responsibility at a time. The separate reference is a comparison, not the required starting point. No written design template is needed.

Extend with CSV using the standard csv module. Test a title containing comma, quote and newline by reading it back with csv.reader. Keep ownership/version semantics unchanged. This extension is not in the reference.

MemoryStore is a single-threaded in-memory fixture. Its failure occurs before commit. It does not simulate a committed write followed by response loss, durable storage, authenticated identity or distributed transactions.
