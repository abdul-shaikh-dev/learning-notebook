# AI agents: offline practice

Visual companions in the notebook: [Agent loop and execution boundary](https://abdul-shaikh-dev.github.io/learning-notebook/index.html#topic/ai-agents/loop). The original text traces below remain available for offline use.


This 24-lesson path starts with AI vocabulary, then develops tool boundaries,
state, grounding, failure handling and evaluation. It does not call a model.

## Run the workshop

Download `workshop.py` and `test_workshop.py` into the same folder. Use Python
3.11+ and only the standard library:

```text
python workshop.py
python -m unittest -v test_workshop.py
```

The demonstration prints a completed result citing SQL-07. The 23 tests cover
accepted and rejected inputs, allowlisting, observation bounds, clarification,
exhaustion, tool/source failures, conflicting evidence and citation membership.
No credentials, package installation, cloud provisioning or network access is
needed. These are local application tests, not measured model evaluations.

## What is real and what is simulated?

| Component | Implemented here | Not established here |
|---|---|---|
| Decision source | Prepared proposals from `ScriptedSource` | Language understanding or planning |
| Search | Lexical matching over three synthetic public records | Embeddings, production retrieval quality or authorization integration |
| Executor | One allowlisted `search_lessons` operation | Arbitrary tool execution or an OS sandbox |
| Validation | Exact fields, bounded strings, result shapes and citation IDs | Semantic truth, source trustworthiness or complete security |
| State | One run's accepted evidence and event summaries | Durable recovery or cross-user memory |
| Budget | Maximum proposal count | Wall-clock deadline, cancellation or live token accounting |
| Approval | Unknown tools and extra approval fields rejected | A production authenticated approval service |
| Evaluation | Deterministic mechanics and a case-design starter | Real model success rate, latency, cost or injection robustness |

## Follow the boundary

```text
prepared proposal (or a future real model adapter)
                 |
                 v
         trusted proposal validator
                 |
       allowed tool and arguments?
           /              \
         yes              no -> invalid / denied
          |
     search_lessons
          |
   validate bounded observation
          |
   accepted evidence in run state
          |
    next proposal or terminal result
```

Terminal statuses have different meanings:

- `completed`: a bounded final answer cited observed IDs. This does **not**
  establish that its claims are supported. One test deliberately demonstrates
  an unsupported answer passing the mechanical citation check.
- `needs_input`: a clarification question; no dependent work continues.
- `incomplete`: the script explicitly reports insufficient evidence.
- `invalid`: malformed proposal, arguments or final answer.
- `denied`: an unknown tool request was blocked before execution.
- `failed`: the decision source or tool failed, or evidence violated its contract.
- `budget_exhausted`: no terminal proposal arrived within the allowed count.

The executor records event types rather than raw exception text. This reduces
one leakage path; it is not a general log-redaction guarantee. Returned evidence
and answers can still contain source text and need privacy controls in a real
application. The local collection is synthetic and public.

## Three projects

1. Trace a successful lookup and a missing-evidence case. Label proposals,
   execution evidence and final claims. Explain why a script is not a model.
2. Add invalid and unauthorized requests. Prove they cannot reach the tool.
   Design a hypothetical approval flow without adding external actions.
3. Expand `evaluation_cases.json` into a release review: task criteria,
   deterministic checks, semantic rubric, held-out data, judge calibration,
   version bundle, gradual release and rollback limits.

The online path and printable study pack include full requirements, rubrics and
worked design solutions. Try the brief before comparing with the reference.

## Evaluation starter

`evaluation_cases.json` is a **design dataset**, not an automated judge or a
claimed live-model benchmark. It separates task expectations from executable
scripted mechanics. Do not label a scripted result as an AI accuracy score.

For a future live run, retain the task and acceptance criteria, collect actual
model outputs and executed actions, then score each dimension. Check citations
and prohibited actions mechanically. Review semantic support with a clear
rubric and calibrated human/model judgments. Keep some independently authored
cases held out; do not repeatedly tune on the entire reported test set.

## Optional live integration checklist

Official OpenAI documentation checked **26 September 2026** distinguishes:

- **Agents API:** a managed Codex harness operated by OpenAI.
- **Agents SDK:** a runner in your application, with application-owned runtime
  integration, storage and approvals.
- **Responses API:** direct model integration with application control of the
  surrounding loop and tool handling.

Choose the runtime based on which responsibilities your application needs to control. Read the
current runtime-specific protocol for state, tool calls/results, incomplete
responses, refusals, errors and cleanup before writing an adapter. No untested
live API code or model-name recommendation is provided here.

Keep credentials server-side. Enforce caller identity and record access in
tools. Limit destinations and capabilities. Preserve external text as untrusted
evidence, not privileged instructions. Bind any required approval to the user,
concrete action, payload and destination. Implement deadlines, cancellation,
usage accounting and uncertainty handling before enabling external effects.

Then run real-model evaluations, inspect task failures and privacy risks, and
deploy with a compatible version bundle and rollback plan. A prompt change,
model configuration change, tool schema change or retrieval-data change can all
affect behavior.

## Sources and scope

- [OpenAI agents runtime comparison](https://developers.openai.com/api/docs/guides/agents)
- [OpenAI function calling](https://developers.openai.com/api/docs/guides/function-calling)
- [OpenAI agent safety guidance](https://developers.openai.com/api/docs/guides/agent-builder-safety)
- [OpenAI evaluation principles](https://developers.openai.com/api/docs/guides/evaluation-best-practices)

The safety and evaluation pages include product deprecation notices. This
course draws on their general engineering principles and does not recommend
starting a new Agent Builder or hosted Evals integration. Verify current product
availability and lifecycle separately if choosing a hosted evaluation product.

The material is advanced application-design practice, not an exhaustive AI
research course, professional certification or production security assessment.

Text limits apply to raw supplied strings before trimming. They do not bound a
network request before parsing; a live transport needs its own byte-size limit.


## Focused optional extension (2026-09-27)

From this practice directory run `python -m unittest test_provider_scaffold.py`. Read the corresponding lesson for evidence limits and extension scope.

## Optional measured provider sample

See `provider-evaluation-lab.md`. Run `python -m unittest -v test_provider_eval.py` offline, then inspect `python provider_eval.py --model YOUR_SUPPORTED_MODEL`. Live requests require `--live` and a locally supplied API key.


## Reference scope and verification limits

The sources explain the cited mechanisms. Examples and design advice are original to this notebook. The review checked that each reference applies to its lesson; it did not execute every source example or verify a production or live-provider integration.
