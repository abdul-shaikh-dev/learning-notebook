# Requirements and maintenance practice

Use Python 3.11 or later. No packages, model, GPU or account are needed. Extract the ZIP and run commands in its folder.

Read CONTRACT.md. Attempt the three projects in projects.md before comparing with report.py. legacy_report.py is deliberately flawed; edit a copy. tickets.csv is fictional and can be copied freely for exercises.

```sh
python legacy_report.py tickets.csv
python report.py tickets.csv
python report.py tickets.csv --status open
python -m unittest -v test_report
```

The legacy result has count 3 and total_minutes 20. The reference default has count 4 and total_minutes 20. The open filter has count 2 and total_minutes 12. All 13 test methods should pass. One deliberately contrasts the broken starter with the reference. Passing these supplied tests verifies the supplied reference, not a separately edited attempt. Point your own acceptance tests at your copy.

For the export exercise, use a disposable output file:

```sh
python report.py tickets.csv --status open --output my-report.json
```

Expect exit 0, empty stdout and a JSON file containing count 2 and total_minutes 12. This replaces my-report.json if it exists. Keep any result you need elsewhere first. Remove only your disposable output when finished. The automated tests create and clean their own temporary folders.

The optional Git history drill uses a disposable repository you create. It is not part of the automated reference suite. This kit tests local file and command behavior, not multi-user service operation or crash recovery.
