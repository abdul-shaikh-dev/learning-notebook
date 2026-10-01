# One research question, three implementations

Use this optional project after the AI Agents foundations. Work with the three
synthetic import-policy records first. There is no response form to fill in:
change the code, run the case, and explain a surprising result aloud if useful.

## 1. Make the graph work without a model

Use Python 3.11+ in a fresh environment. These are the versions used for the
local verification; they are a reproducibility snapshot, not a claim that later
releases are identical:

```powershell
python -m venv .venv
.venv\Scripts\python -m pip install langgraph==1.2.12 langchain==1.4.3 langchain-openai==1.6.7 deepagents==0.7.21
.venv\Scripts\python -m unittest -v test_local_framework_lab.py
.venv\Scripts\python local_framework_lab.py
```

The graph retrieves evidence, drafts, checks citation membership, and either
finishes or drafts once more. The normal fixture ends `citation_valid` with one
attempt. `volcanoes` produces `no_evidence` without drafting. Two unsupported
citations end `rejected`. Follow the tests before studying every framework API.

Build the routing yourself from the behaviour tests in a scratch copy. Keep
retrieval and the draft callable independent. Then introduce two defects in
turn: always route to drafting, and remove the attempt limit. Identify which
test catches each one. The recursion limit is a last bound, not the application’s
normal missing-evidence result.

**Why the state is shaped this way:** evidence is a mapping of stable IDs to
text; the draft is one current string; attempts is an integer. A failed draft
must not remain accepted merely because an earlier draft contained a valid ID.
The check deliberately permits a false claim with a real citation. One test
demonstrates that limitation: mechanical provenance and factual support differ.

## 2. Substitute your local llama.cpp model

Start your existing server separately. Use its actual listening port and model
ID; the defaults below are examples, not detected machine settings. Begin with
ordinary text generation before testing tool calls.

```powershell
.venv\Scripts\python local_framework_lab.py --mode chain --base-url http://127.0.0.1:8080/v1 --model YOUR_MODEL_ID
.venv\Scripts\python local_framework_lab.py --mode graph --base-url http://127.0.0.1:8080/v1 --model YOUR_MODEL_ID
```

The chain mode makes one model call with retrieved context. The graph mode
allows one revision. Compare the same three questions: a failed import, an
identical batch replay, and an absent subject. Read the evidence and answer;
a status of `citation_valid` alone does not establish a correct answer.

For your 8 GB VRAM setup, start with one request and this tiny corpus. Increase
context only after observing memory use and response quality on your actual
GGUF. Context, quantization and offload settings affect fit; the notebook does
not promise a model size will run on every configuration.

The adapter accepts only literal loopback HTTP addresses, uses a placeholder
API key and disables LangSmith tracing for this process. It does not load your
project documents. If your server requires authentication, adapt credential
loading privately rather than committing a key. Timeouts or invalid content
should be diagnosed before increasing retries.

## 3. Let Deep Agents choose the search

```powershell
.venv\Scripts\python local_framework_lab.py --mode deep --base-url http://127.0.0.1:8080/v1 --model YOUR_MODEL_ID
```

This version supplies `search_records` as a tool. It also receives Deep Agents’
built-in harness tools. The default state-backed file tools are not a grant to
read your disk; no filesystem or execution backend is configured here. Inspect
the printed messages for actual search calls and their returned evidence. A
tool-looking sentence is not a tool invocation. If the model/server cannot
produce compatible tool calls, keep using the explicit graph and treat that
failure as useful capability evidence.

Compare one concrete change: ask for two policies in one answer. Does planning
or delegation improve support, or only add calls? Try an unknown policy and
inspect whether the agent invents an answer. Keep the graph’s deterministic
tests even if the Deep Agents variant seems more fluent.

## 4. Grow one corpus, not three unrelated demos

Replace the synthetic dictionary with a loader for a small documentation folder
only after the above works. Add a filename and stable chunk ID, enforce a byte
limit, and preserve the no-evidence case. Add one outdated document and require
the answer to identify the conflict. Then change retrieval to semantic search
and compare the same questions; ranking quality must be measured separately
from answer wording. The separate local research project can supply the larger
corpus workflow, but this downloadable kit remains self-contained.

## 5. Where Fleet fits

LangSmith Fleet adds a managed workspace and agent-building experience. It is
not a fourth local runtime mode in this script. Without workspace access, use
the completed local app and this small migration exercise: identify the search
tool’s inputs/outputs, the three synthetic records, and who may use the tool.
Decide whether a remote workspace can reach the tool at all. `127.0.0.1` on a
hosted service refers to that service, not your PC.

When workspace access becomes available, configure one synthetic read-only
tool through the workspace’s supported connection mechanism, run the same
three questions, and inspect its trace and permissions. This guide does not
expose a local port or upload private documents. A local script passing tests
does not establish a working Fleet connection.

## Verification and source boundaries

The graph tests execute real LangGraph with scripted drafts. The direct model
and Deep Agents modes require your compatible running server; model quality
and Fleet deployment are separate checks. Package import/agent construction
can succeed even when a model’s tool calling fails.

Official references checked 2 October 2026:

- [LangGraph state, nodes and edges](https://docs.langchain.com/oss/python/langgraph/graph-api)
- [ChatOpenAI integration and custom base URL](https://docs.langchain.com/oss/python/integrations/chat/openai)
- [Deep Agents quickstart](https://docs.langchain.com/oss/python/deepagents/quickstart)
- [LangSmith Fleet](https://www.langchain.com/langsmith/fleet)
