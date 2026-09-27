# Two-developer integration review

Resolve a synthetic conflict and update a local reviewer clone without contacting a server.

## Run from the extracted folder

```
python -B sandbox.py --stage intermediate --workspace-parent .
```

Expected: JSON reports conflict_resolved and fetch_preserved_local_head true; no network or push.

## Implement and submit

1. Run the intermediate fixture’s deliberate conflict, abort and resolution.
2. Explain base/ours/theirs and preserve both fixture intents.
3. Verify a two-parent merge.
4. Observe fetch updating origin/main while HEAD stays unchanged, then integrate with --ff-only.
5. Write an offline pull-request review with candidate identifiers and remaining hosting limits.

## Reference approach

Use `python -B sandbox.py --stage intermediate --workspace-parent .`. The first merge conflict is aborted and main content is asserted; a repeated merge is resolved to main and feature and committed with two parents. A local clone fetches the new release commit while preserving its own HEAD, then fast-forwards. Write review.md describing purpose, exact candidate/base and assertions. No push, PR publication or remote protection is performed.

## Evidence rubric

- Conflict/abort/resolution states are supported by actual outputs.
- The resolved contents preserve both stated intents.
- Fetch and integration are distinguished.
- Review evidence names the candidate and no hosted approval is invented.
