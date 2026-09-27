# Local recovery and release portfolio

Locate a regression, preserve recovered work, integrate a selected patch and identify a release candidate.

## Run from the extracted folder

```
python -B sandbox.py --stage advanced --workspace-parent .
```

Expected: JSON identifies first bad/recovered commit, safe reverted content, changed rebase identity and annotated tag.

```
python -B -m unittest -v test_sandbox.py
```

Expected: Six test methods pass, including repository-root escape and push rejection.

## Implement and submit

1. Run the advanced fixture and verify the first bad commit with its predicate.
2. Compare targeted revert with the private reset/reflog recovery.
3. Explain the cherry-picked change and rebased topic’s changed identity.
4. Verify the annotated tag object.
5. Produce an offline release record including artifact/hosting checks not executed.

## Reference approach

Use `python -B sandbox.py --stage advanced --workspace-parent .`. It bisects safe/bug history, reverts the bug while preserving unrelated contents, recovers a private committed experiment from reflog, cherry-picks it onto main, rebases a private topic and creates an annotated training tag. Attach the JSON results and a release-review.md with candidate, checks, integration decisions and a separate unexecuted artifact/remote/deployment section.

## Evidence rubric

- Bisect result identifies the known synthetic defect.
- Recovery branches retain the intended committed work.
- History operations are justified by ownership and purpose.
- Release records do not equate a tag with trusted deployment evidence.
