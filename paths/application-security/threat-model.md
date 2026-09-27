# Threat-model worksheet

For each workflow fill one row:

| Asset | Entry point | Trust boundary | Abuse case | Control | Verification | Observed result / limit |
|---|---|---|---|---|---|---|
| Bob private document | document read | request -> trusted principal -> stored object | Alice guesses b | tenant/owner/action policy | foreign read denied without payload | fill after execution |
| Document ownership | title update | body -> allowed fields -> mutation | caller adds owner/role | exact field allowlist + authorization | extra fields denied before state change | fill after execution |
| Account access | login/recovery | browser -> authentication adapter | repeated guesses or weak recovery | provider credential/MFA/recovery policy + abuse controls | real-provider negative cases | unexecuted in local baseline |

Add actors, dependencies and alternate endpoints. State where trusted identity is produced, which data can change concurrently, who may deploy the control, and what the control cannot establish. Keep credentials and private payloads out of this worksheet.
