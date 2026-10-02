# Local recovery and release practice

Locate a regression, preserve recovered work, integrate a selected patch and identify a release candidate.

## Run from the extracted folder

```
python -B sandbox.py --stage advanced --workspace-parent .
```

Expected: JSON identifies first bad/recovered commit, safe reverted content, changed rebase identity and annotated tag.

```
python -B -m unittest -v test_sandbox.py
```

Expected: Seven test methods pass, including local review revision, repository-root escape and push rejection.

## Try it yourself

1. Run the advanced fixture and verify the first bad commit with its predicate.
2. Compare targeted revert with the private reset/reflog recovery.
3. Explain the cherry-picked change and rebased topic's changed identity.
4. Verify the annotated tag object.
5. Explain which commit you would release and which checks support that choice. Use release-review.md for an optional longer note.
6. Run `python -B review_roleplay.py --workspace-parent .`; inspect reviewer feedback, revised candidate and second review then explain what changed between reviews.

## Reference approach

Use `python -B sandbox.py --stage advanced --workspace-parent .`. It bisects safe/bug history, reverts the bug while preserving unrelated contents, recovers a private committed experiment from reflog, cherry-picks it onto main, rebases a private topic and creates an annotated training tag. Inspect the JSON results and explain why the recovered commit and release candidate are the ones you intended. Use release-review.md if you want to keep a longer note.

## Check your result

- Bisect result identifies the known synthetic defect.
- Recovery branches retain the intended committed work.
- History operations are justified by ownership and purpose.
- Release records do not equate a tag with trusted deployment evidence.
