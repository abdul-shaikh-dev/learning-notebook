"""Check the AI Agents, Agent Harnesses, Application Security and Observability explorers against their labs."""
from pathlib import Path
import json
import sys

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
for folder in ("ai-agents", "agent-harnesses/practice", "application-security", "observability-performance/practice"):
    sys.path.insert(0, str(ROOT / "paths" / folder))

from workshop import ScriptedSource, run  # noqa: E402
from harness_workshop import FakeStore, IntentConflict, UncertainOutcome, digest  # noqa: E402
from security_lab import DOCUMENTS, Principal, authorized  # noqa: E402
from telemetry import percentile  # noqa: E402


def scenarios(course, lesson):
    visual = json.loads((ROOT / "paths" / course / "visuals.json").read_text(encoding="utf-8"))[lesson]
    return {s["id"]: s["steps"] for s in visual["scenarios"]}


def rows(step, caption):
    return next(t["rows"] for t in step["tables"] if t["caption"] == caption)


def check(condition, message):
    if not condition:
        raise AssertionError(message)


def agent_budget():
    """run() with max_steps=3 stops as budget_exhausted after the three searches the scenario draws."""
    last = scenarios("ai-agents", "loop")["budget"][-1]
    proposals, [[budget, status]] = rows(last, "Proposals"), rows(last, "Run")
    script = [{"kind": "tool", "name": "search_lessons", "args": {"query": p.split(": ", 1)[1]}} for _, p, _ in proposals]
    script.append({"kind": "tool", "name": "search_lessons", "args": {"query": "never asked"}})
    result = run(ScriptedSource(script), max_steps=int(budget))
    check(result.status == status == "budget_exhausted", "agent: status " + result.status)
    hits = [e["hits"] for e in result.events if e["event"] == "tool_succeeded"]
    check(hits == [0 if r == "no hits" else 1 for _, _, r in proposals], f"agent: hits {hits}")
    check([e["id"] for e in result.evidence] == ["SQL-07"] and result.answer == "", "agent: one piece of evidence, no answer")
    unbounded = scenarios("ai-agents", "loop")["unbounded"][-1]
    check([p for _, p, _ in rows(unbounded, "Proposals")] == [p for _, p, _ in proposals] * 2, "agent: the unbounded loop repeats the same searches")


def operation_ids():
    """FakeStore keeps one note for a retried key, rejects a changed intent and writes again for a new key."""
    steps = scenarios("agent-harnesses", "idempotent-effects")
    args = {"lesson_id": "L1", "text": "Review index tradeoffs"}
    key = lambda call: ("learner-a", "run-1", call)
    fingerprint = digest({"action": args})

    def first_save():
        store = FakeStore()
        store.lose_reply_once = True
        try:
            store.save(key("C2"), fingerprint, "learner-a", args)
        except UncertainOutcome:
            pass
        else:
            raise AssertionError("harness: the reply should be lost")
        return store

    def table(store):
        return ([[n, note["text"]] for n, note in store.notes.items()],
                [[k[2], r["note_id"]] for k, r in store.receipts.items()])

    def expect(store, step, where):
        check(table(store) == (rows(step, "Notes"), rows(step, "Receipts")), f"harness {where}: {table(store)}")

    store = first_save()
    expect(store, steps["same-id"][0], "lost reply")
    check(store.save(key("C2"), fingerprint, "learner-a", args)["note_id"] == "N1", "harness: retry returns N1")
    expect(store, steps["same-id"][1], "same-ID retry")
    try:
        store.save(key("C2"), digest({"action": {**args, "text": "changed"}}), "learner-a", {**args, "text": "changed"})
    except IntentConflict:
        pass
    else:
        raise AssertionError("harness: changed intent should conflict")
    expect(store, steps["same-id"][2], "changed intent")
    check(store.effect_count == 1, "harness: one effect for one ID")

    store = first_save()
    check(store.save(key("C3"), fingerprint, "learner-a", args)["note_id"] == "N2", "harness: new ID writes N2")
    expect(store, steps["new-id"][1], "new-ID retry")
    check(store.effect_count == 2, "harness: a new ID duplicates the effect")


def object_authorization():
    """authorized() allows Alice's own document and refuses b (another owner) and c (another tenant)."""
    for name, steps in scenarios("application-security", "authorization-ownership").items():
        for step in steps:
            [[who, path, action]] = rows(step, "Request")
            subject, tenant, role = who.split("/")
            document = DOCUMENTS[path.rsplit("/", 1)[1]]
            allowed = authorized(Principal(subject, tenant, role), document, action) if name == "checked" else True
            code = next(n["detail"] for n in step["nodes"] if n["id"] == "response")[:3]
            check(code == ("200" if allowed else "404"), f"security {name} {path}: {code}")
            check(rows(step, "documents")[0][:3] == ["a", "red", "alice"], "security: fixture rows match the lab")


def tail_latency():
    """The lab's nearest-rank percentile gives p95 60 and 150 ms; the means are 42 and 33 ms."""
    last = scenarios("observability-performance", "latency-percentiles")["p95"][-1]
    for release, mean, p95 in (("A", 42, 60), ("B", 33, 150)):
        values = [int(ms) for ms, count in rows(last, f"Release {release} (ms)") for _ in range(int(count))]
        check(len(values) == 20 and sum(values) / len(values) == mean and percentile(values, .95) == p95,
              f"latency {release}: mean {sum(values) / len(values)}, p95 {percentile(values, .95)}")
    text = " ".join(s["explanation"] for s in scenarios("observability-performance", "latency-percentiles")["p95"])
    check(all(f in text for f in ("42 ms", "60 ms", "33 ms", "150 ms")), "latency: the explanations state the lab's figures")


for fact in (agent_budget, operation_ids, object_authorization, tail_latency):
    fact()
print("PASS: AI Agents, Agent Harnesses, Application Security and Observability explorers match their labs.")
