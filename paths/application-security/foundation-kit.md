# Private-document authorization contract

Verify tenant/owner/action decisions and narrow update shapes on synthetic records.

## Run from the extracted folder

```
python -B -m unittest -v test_security_lab.AuthorizationTests
```

Expected: Two methods pass: permission matrix/default denial and allowed-field/copy boundaries.

## Optional practice

1. Run the AuthorizationTests suite.
2. Explain the already-authenticated Principal boundary.
3. Build an owner/nonowner/tenant/role/action matrix including unknown and anonymous cases.
4. Reject owner/role fields in update bodies.
5. Complete the threat-model worksheet for read and update.

## Reference approach

Use Principal only as trusted fixture context. The policy requires a matching tenant and either ownership or read-only reader permission; unknown actions deny. read_document returns a copy and the same outward unavailable error for denied/missing. parse_update accepts only title. Run AuthorizationTests, record the matrix and extend a copy with a new explicitly tested action.

## Evidence rubric

- Cross-owner and cross-tenant reads are denied without private data.
- Unknown actions default to denial.
- Privilege fields cannot be mass-assigned.
- The report does not call synthetic principals real authentication.
