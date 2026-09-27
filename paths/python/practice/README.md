# Python staged practice
Use Python 3.11 or newer. Download all four .py files into one folder. There are no external dependencies.

Run `python foundation_project.py`, `python intermediate_project.py --demo`, `python advanced_project.py --demo --workers 2`, then `python -m unittest -v test_projects.py`.

Rebuild the stage brief before studying its solution. Automated tests check selected contracts; passing them is practice evidence, not certification or a proof of every failure mode.

Intermediate input is a JSON array of objects with topic and minutes. Run `python intermediate_project.py sessions.json`. It only reads input.

Advanced input is JSONL, one object per line with id, topic and minutes. For example:

```json
{"id":"a","topic":"Python","minutes":25}
{"id":"b","topic":"Reading","minutes":10}
```

Run `python advanced_project.py input.jsonl report.json --workers 2`. It replaces report.json only after complete validation. Use a disposable folder. Input must not be the output file.

Limits: 256 KiB input, 1000 records, 2048 bytes per JSONL record, 64-character IDs, 80-character trimmed topics, integer minutes from 0 to 1440, 1–8 workers. JSONL records use LF or CRLF delimiters; one final delimiter is allowed. Unicode separators inside JSON strings remain data. Empty input is an empty batch; blank record lines are errors. Duplicate IDs and JSON object keys are rejected. Saved reports use UTF-8 without unnecessary ASCII escaping and allow up to 1 MiB. The writer checks the exact serialized bytes against the reader's limit before replacing prior output; oversized reports fail without changing that output.

The advanced reference assumes one writer and a trusted local directory. It is not a sandbox, authenticated service or database. Same-directory replacement improves whole-file visibility, but does not certify power-loss durability or prevent lost updates between concurrent writers. Threads are demonstrated for composition; benchmark before using them for CPU-bound validation.

Packaging extension: split the intermediate tool into a package with __init__.py, domain.py and __main__.py; then add pyproject.toml with metadata and a chosen build backend following the official PyPA guide. Test the installed artifact separately. These downloads run as scripts and do not claim a built/published distribution.


## Focused optional extension (2026-09-27)

From this practice directory run `python -m unittest test_async_failure_lab.py`. Read the corresponding lesson for evidence limits and extension scope.

Run `python -m unittest -v test_installed_package.py` for the complete generated wheel exercise. This local build/install test passed on 2026-09-27 with Python 3.14, build 1.4.0 and setuptools 82.0.1; it reports missing pinned tooling as a skip.
