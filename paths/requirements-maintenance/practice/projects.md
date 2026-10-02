# Maintenance projects

Work on a copy. The briefs below are optional stage practice; lesson exercises can be attempted independently.

## Understand the requested change

Investigate the supplied legacy command and write a short, testable change brief.

- Reproduce the zero-minute count error with a minimal input.
- Trace the record from CSV parsing to summary.
- Specify default, filtered, empty and rejected-input outcomes.
- Separate required behavior from deferred ideas.

### Compare after your attempt

Trace the truthiness branch, preserve the default keys and all-status selection, and request a count of 1 for a zero-minute ticket. Use the examples in CONTRACT.md; state strict validation as a new explicit policy.

## Make a compatible repair

Implement the count repair, input validation and optional status filter in your own copy.

- Count zero-minute records.
- Validate all rows before selecting a status.
- Preserve default JSON output and test stderr/exit behavior.
- Show a regression test that distinguishes the broken starter.

### Compare after your attempt

Parse complete validated Ticket records, filter only after parsing and count selected records directly. Compare the default fixture (4,20) and open selection (2,12). Use subprocess tests for the public command, not just summary unit tests.

## Deliver and maintain the change

Add local file export, demonstrate failure preservation and write a short recovery and compatibility note.

- Write the complete result before replacing a destination.
- Test invalid input and injected replacement failure against existing bytes.
- Demonstrate default CLI compatibility and temporary-file cleanup.
- Explain single-writer and crash-recovery limits, then handle one changed requirement.

### Compare after your attempt

Create the temporary file beside the destination, close it and call os.replace only after validation and serialization. Clean up on failure. Keep an explicit backup if successful replacement must be reversible. Plan archived status as a separate changed-case exercise.

## Changed requirements

1. Add an archived status. Write the default and selected expectations first.
2. A caller rejects extra JSON keys. Explain how that changes an output-extension proposal.
3. Two processes may write one report. Identify which single-writer assumption no longer holds; do not claim the reference solves it.
4. A zero-byte input is reported as an empty valid dataset. Decide whether that agrees with CONTRACT.md and add the smallest distinguishing test.

Your short handoff should say what changed, which caller behavior stayed compatible, which commands you ran and what remains unverified. No lengthy response form is required.
