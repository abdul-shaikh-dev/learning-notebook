# Optional real-provider integration

`provider_scaffold.py` only builds an explicit Responses request and accounts for recorded token usage. Tests use fabricated usage and prove schema construction/arithmetic; they do not prove provider compatibility, task quality or billed cost. No credentials, SDK or live calls are supplied.

Choose a currently supported model and record the documentation review date. Implement a transport in a separate opt-in executable; keep credentials server-side, outside fixtures and logs. Map function calls by call ID, validate arguments again, apply resource authorization, bound observations and return function-call outputs. Handle refusals, incomplete responses, errors and multiple calls explicitly; never dispatch a tool merely because the schema passed. Apply host deadlines and cumulative budgets before each further request.

Run the existing evaluation cases first offline, then a fixed synthetic held-out subset only when the operator opts into spending. Record model identifier, prompt/schema revisions, case ID, outcome rubric, repeated-run variability, latency, raw token usage and a redacted trace. Record current pricing and its date separately. The scaffold's two-rate estimate ignores cached-token discounts, tool charges and other pricing tiers; reconcile actual billing rather than asserting a cap from estimated tokens. Compare deterministic policy tests with real-model outcomes in separate tables.

Optional original readings: [ReAct](https://arxiv.org/abs/2210.03629) for reasoning/action interleaving; [Toolformer](https://arxiv.org/abs/2302.04761) for learned tool-use training; [RAG](https://arxiv.org/abs/2005.11401) for retrieval-augmented generation; [AgentBench](https://arxiv.org/abs/2308.03688) for multi-environment agent evaluation. Compare task, data, metric and limitations; these papers do not establish your application's authorization or today's provider quality.

Protocol source: [OpenAI function calling](https://developers.openai.com/api/docs/guides/function-calling), strict mode and function-call outputs, reviewed 2026-09-27.
