# Optional real identity-provider integration

This exercise is opt-in learner work, separate from the offline baseline. Use only an authorized training tenant/application and your own synthetic accounts. It requires the chosen provider's current official setup instructions and a maintained OIDC/client and API validator library for the actual framework. Do not target other users or services. Do not write a fake JWT signature/verifier to make the evidence look complete.

## Record the setup before running the lab

Record provider and training issuer, framework/library versions, client type (public or confidential), exact permitted redirect URI, document API audience, requested least scopes, supported authorization-code flow with PKCE S256, and the principal mapping. Record configuration names, never secret values. A confidential client's credential remains server-side. Choose the provider's documented HTTPS development arrangement; any permitted loopback exception must match that provider/library's official instructions. Avoid broad wildcard redirects and do not put a confidential secret in browser code.

Use library-managed discovery and trusted key configuration, redirect/correlation handling, code redemption, token validation and session establishment. For the client validate the ID token under OIDC Core; for the API validate its documented access-token format/issuer/audience/lifetime/purpose. Opaque tokens use the documented provider mechanism. Treat decoded claims as untrusted until validation succeeds. Map issuer+subject to an internal account/tenant, then call the object-policy boundary. The offline Principal constructor is a test seam, not an identity adapter.

## Required test matrix

| Case | Expected boundary | Evidence |
|---|---|---|
| Fresh code + matching PKCE/correlation, legitimate owner | valid identity and permitted document read | sanitized library outcome + HTTP result |
| Valid identity, another owner/tenant | object policy denies without private contents | route denial and unchanged state |
| Wrong issuer or audience | validator rejects | case ID + categorized outcome, no token |
| Expired token or tampered signature | validator rejects | case ID + outcome |
| Wrong token purpose/disallowed algorithm | validator rejects per configured contract | case ID + library configuration/version |
| Reused authorization code/wrong verifier | server/library rejects redemption | sanitized provider outcome |
| Mismatched callback state / OIDC nonce where required | client/library rejects correlation | sanitized outcome |
| Provider-supported key rotation | validator follows documented trusted-key refresh policy | before/after key ID only + outcomes |
| Logout/account revocation | old sessions/tokens behave under documented provider/API policy | note self-contained token revocation limits |

Establish expected outcomes before running. Generate malformed cases only against the selected training app through supported test tooling. Record observed HTTP/library outcomes and whether a test could actually be executed; do not substitute a dictionary of invented claims for crypto verification. Minimize tokens/credential exposure in terminal output, reports, recordings and logs.

## Completion and cleanup

Document browser cookie/CSRF route integration separately, including HTTPS attributes, state-changing methods and denied mutations. Revoke temporary client credentials and sessions and remove only the training application/resources you created under your authorization. Follow the provider’s documented cleanup; preserve sanitized evidence. A library/provider setup that cannot run stays unexecuted, with the precise prerequisite stated. This course does not provision a provider, pin a universal adapter package or certify a deployment.
