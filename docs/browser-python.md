# Browser Python practice

The 30 Python Problem Solving challenges have a plain text editor, Run tests, Stop and a code download. Drafts and not-started/attempted/solved status are stored separately from reading progress. They participate in the existing preview-and-merge progress backup. Local entries win merge conflicts. Editing code changes its status to attempted; users may update status after local practice. A solved status is personal tracking, not a certificate or hidden-judge result.

Each attempt runs in a fresh worker using the pinned, self-hosted Pyodide 0.28.2 core distribution. It executes real CPython against the same cases.json as the terminal runner, checks exact return types and preserves inputs. It catches Python exceptions including SystemExit. The host terminates the worker after five seconds of execution, on Stop, and when leaving the lesson. Runtime startup has a separate 60-second timeout. Results from an old worker cannot update another lesson. Printed output is suppressed to avoid unbounded output buffers.

The first browser run fetches approximately 12 MB of runtime assets from this notebook's own host. Runtime files live with the course, outside the global offline shell. Saving Python Problem Solving in Offline & install includes the runtime, cases and lessons in the existing hash-verified course download. No external package installation is implemented. No account, API key, LLM or execution server is needed. The worker is an isolation mechanism for responsiveness, not a security boundary for hostile code; Python's JavaScript bridge exists. The notebook itself does not send draft code to a remote judge.

Source URLs and SHA-256 hashes for the unmodified runtime binaries are in runtime/provenance.json; the upstream license is beside them. Runtime integration follows the [Pyodide worker documentation](https://pyodide.org/en/0.28.2/usage/webworker.html) and [self-hosting documentation](https://pyodide.org/en/0.28.2/usage/downloading-and-deploying.html). Future updates must refresh the files, provenance and license together and rerun the actual WebAssembly checks.

Verification commands:

```
node verify.cjs
node tests/browser-python.cjs
python scripts/sync-problem-solving.py --check
python scripts/build-bundles.py --check
node scripts/build-pages.cjs
```

The WebAssembly test executes all 30 references and rejects wrong values, types, input mutation, missing functions, syntax errors and SystemExit. UI tests cover state, stopping, stale results, navigation cleanup and storage failures. Browser checks additionally exercise real runs, timeout recovery, saved drafts, responsive controls and the offline course download. A finite case set does not prove arbitrary solution correctness or asymptotic efficiency.

Verified on 2 October 2026: saved the complete course on a separate local preview origin, stopped that HTTP server, opened the cached lesson and ran a correct solution successfully. An infinite loop on the regular preview stopped after five seconds and a subsequent correct attempt passed. Drafts survived reload, solved status appeared in the course overview while reading stayed at zero, and controls were inspected in light/dark modes on desktop and tablet. The mobile viewport was checked separately for overflow and reachable controls.
