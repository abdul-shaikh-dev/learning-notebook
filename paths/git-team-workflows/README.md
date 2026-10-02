# Git and team workflows: offline practice

Requirements: Python 3.11+ and Git 2.28+ on PATH. Tested locally using Python 3.14 and Git 2.55.0.windows.5; CI should also run Python 3.11 on Linux. Extract all files into one folder; run commands there.

```
python -B sandbox.py --stage all --workspace-parent .
python -B -m unittest -v test_sandbox.py
```

Learner commands create a fresh `ln-git-owned-*` child under the existing `--workspace-parent` directory. JSON reports the absolute workspace and repository paths; `evidence.json` in that child retains every Git command/output, snapshot diffs, candidate/base identifiers and ref graphs. Inspect these repositories after the command returns. The generator/verifier operates only inside fresh owned directories. It isolates global/system Git configuration and hooks, passes synthetic identity per command and contacts no network remote. Its clone/fetch uses its own local source repository; no push is implemented. Reset/restore/merge/rebase act only on generated synthetic work. Omit `--workspace-parent` to run the automated temporary verifier, which removes its own temporary directory on context exit, including assertion failure. Retained learner children are never automatically deleted, even on failure; no existing checkout is cleaned. Files elsewhere, user/global config, commits in the course repository and hosting accounts are untouched.

Read foundation-kit.md, intermediate-kit.md and advanced-kit.md in order. The returned JSON records actual assertions and the installed Git version. Each run creates new repositories; commit identifiers need not match another run because metadata can differ. No credentials are needed. The lesson command snippets are examples for an owned disposable repository, not instructions to discard user work. Do not copy destructive fixture operations into an existing project.

For local two-role review practice, run `python -B review_roleplay.py --workspace-parent .`. It creates a fresh owned child with an author repository, local reviewer clone, blocking feedback, a revised candidate commit and reviewer reinspection. Compare the base, first candidate and revised candidate in `review-evidence.json`; branch protection and hosted approval remain unexecuted.

The local tests establish staging, conflicts, fetch, recovery and history behavior; hosted PR permissions, review enforcement, signed-tag trust, release artifacts and production deployment require separate authorized evidence. Keep those claims labeled unexecuted. `release-review.md` is a reusable blank record, not a published release.

For independent inspection, substitute the JSON repository path in `git -C "<repository>" show HEAD:notes.txt` (foundation), `git -C "<repository>" show <merge_commit>` (intermediate), or `git -C "<repository>" show v0.1-training` (advanced). Use `git -C "<repository>" log --all --graph --decorate --oneline` for refs. Intermediate fetch/conflict states and foundation diffs captured before restore are recorded in evidence.json because the fixture has already completed those transitions. Compare the recorded candidate against base with `git -C "<repository>" diff <base_commit> <candidate_commit>`. Each invocation creates a separate child; remove only the reported child manually after saving your evidence. The program has no cleanup command and never adopts or deletes an existing directory.
