# Three-state snapshot investigation

Run the foundation fixture and explain precisely which note version is in the working tree, index and commit.

## Run from the extracted folder

```
python -B sandbox.py --stage foundation --workspace-parent .
```

Expected: JSON reports staged_snapshot two and ignored_untracked true; fresh owned child retained for inspection; JSON gives its absolute path.

## Try it yourself

1. Run the complete foundation fixture in its new directory created and kept by the fixture.
2. Predict both diffs when the commit contains one, the staged file contains two and the working file contains three.
3. Verify committed contents independently with git show.
4. Use check-ignore and ls-files to confirm that the practice config file is ignored and untracked.

## Reference approach

Use `python -B sandbox.py --stage foundation --workspace-parent .`. The fixture commits one, stages two, edits three and commits the index. At the staged commit HEAD contains two and the working file three; evidence.json preserves both diffs. The completed repository has restored the working file to two, and keeps all commits available for independent git show. It then restores the generated file, adds an ignore rule, and verifies the synthetic local.env stays untracked. Record git_version and observed assertions; do not claim tests/builds or remote policy were exercised.

## Check your result

- The two diff baselines and committed snapshot are correct.
- No existing repository or global config is changed.
- Ignore evidence uses check-ignore and ls-files.
- Report separates mechanical checks from release verification.
