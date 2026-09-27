# Git and team workflows: offline practice

Requirements: Python 3.11+ and Git 2.28+ on PATH. Tested locally using Python 3.14 and Git 2.55.0.windows.5; CI should also run Python 3.11 on Linux. Extract all files into one folder; run commands there.

```
python -B sandbox.py --stage all
python -B -m unittest -v test_sandbox.py
```

The generator/verifier creates only fresh `ln-git-owned-*` temporary directories and operates inside them. It isolates global/system Git configuration and hooks, passes synthetic identity per command and contacts no network remote. Its clone/fetch uses its own local source repository; no push is implemented. Reset/restore/merge/rebase act only on generated synthetic work. The temporary directories are removed on normal context exit, including assertion failure; no existing checkout is cleaned. Files elsewhere, user/global config, commits in the course repository and hosting accounts are untouched.

Read foundation-kit.md, intermediate-kit.md and advanced-kit.md in order. The returned JSON records actual assertions and the installed Git version. Each run creates new repositories; commit identifiers need not match another run because metadata can differ. No credentials are needed. The lesson command snippets are examples for an owned disposable repository, not instructions to discard user work. Do not copy destructive fixture operations into an existing project.

The local tests establish staging, conflicts, fetch, recovery and history behavior; hosted PR permissions, review enforcement, signed-tag trust, release artifacts and production deployment require separate authorized evidence. Keep those claims labeled unexecuted. `release-review.md` is a reusable blank record, not a published release.
