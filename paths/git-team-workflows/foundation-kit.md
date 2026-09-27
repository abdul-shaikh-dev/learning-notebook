# Three-state snapshot investigation

Run the foundation fixture and explain precisely which note version is in the working tree, index and commit.

## Run from the extracted folder

```
python -B sandbox.py --stage foundation
```

Expected: JSON reports staged_snapshot two and ignored_untracked true; owned temporary repositories removed.

## Implement and submit

1. Run the complete foundation fixture in its own temporary root.
2. Predict ordinary and cached diffs for one -> staged two -> unstaged three.
3. Verify committed contents independently with git show.
4. Show that an untracked synthetic config file is ignored without claiming history erasure.

## Reference approach

Use sandbox.py --stage foundation. The fixture commits one, stages two, edits three and commits the index; HEAD contains two and the working file three. It then restores the generated file, adds an ignore rule, and verifies the synthetic local.env stays untracked. Record git_version and observed assertions; do not claim tests/builds or remote policy were exercised.

## Evidence rubric

- The two diff baselines and committed snapshot are correct.
- No existing repository or global config is changed.
- Ignore evidence uses check-ignore and ls-files.
- Report separates mechanical checks from release verification.
