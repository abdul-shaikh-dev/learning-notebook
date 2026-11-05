"""Check the engineering and practice concept explorers against their course labs."""
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


for folder in ("cloud-infrastructure/practice", "delivery-operations/practice", "requirements-maintenance/practice"):
    sys.path.append(str(ROOT / "paths" / folder))

import contextlib  # noqa: E402
import io  # noqa: E402
import sqlite3  # noqa: E402
import subprocess  # noqa: E402
import tempfile  # noqa: E402
import infra_lab  # noqa: E402
import legacy_report  # noqa: E402
import report  # noqa: E402
import schema_coexistence  # noqa: E402


def lesson(course, lesson_id):
    path = json.loads((ROOT / "paths" / course / "path.json").read_text(encoding="utf-8"))
    return next(l for l in path["lessons"] if l["id"] == lesson_id)


def generators():
    """The lesson's valid_minutes: one generator object is read once; a fresh call or a list reads again."""
    example = next(s["example"] for s in lesson("python", "iterators-and-generators")["sections"] if s.get("example"))
    scope, out = {}, io.StringIO()
    with contextlib.redirect_stdout(out):
        exec(compile(example, "example", "exec"), scope)
    check(out.getvalue().split("\n")[:3] == ["30", "[]", "[0, 5]"], "generator: the lesson example prints 30, [] and [0, 5]")
    steps = scenarios("python", "iterators-and-generators")
    source = [int(v) for [v] in rows(steps["shared"][0], "Source")]
    valid_minutes = scope["valid_minutes"]
    stream = valid_minutes(source)
    check((sum(stream), list(stream)) == (30, []), "generator: a shared stream gives 30, then []")
    check((sum(valid_minutes(source)), list(valid_minutes(source))) == (30, [10, 20]), "generator: fresh calls give 30 and [10, 20]")


def expected_versions():
    """Program.cs compares the version in the update; replaying the scenario gives 200, 409, 200."""
    program = (ROOT / "paths/full-stack-journey/practice/Program.cs").read_text(encoding="utf-8")
    check("if (old.Version != version) return" in program and "WHERE Id=@id AND Version=@version" in program and "Version=Version+1" in program,
          "conflicts: both stores compare the expected version and increment it")
    acceptance = (ROOT / "paths/full-stack-journey/practice/acceptance.py").read_text(encoding="utf-8")
    check("{'title':'SQL study','minutes':25,'done':True,'version':1}" in acceptance and "[200,409]" in acceptance,
          "conflicts: the acceptance race sends Tab A's save and expects one 200 and one 409")
    for name, expected in (("checked", [200, 409, 200]), ("blind", [200, 200])):
        last = scenarios("full-stack-journey", "conflicts")[name][-1]
        compare = rows(last, "Update")[0][0].endswith("Version=@version")
        version, codes = int(rows(last, "Row read by both tabs")[0][3]), []
        for _, _, _, _, sent in rows(last, "Requests"):
            ok = not compare or int(sent) == version
            codes.append(200 if ok else 409)
            version += ok
        check(codes == expected, f"conflicts {name}: {codes}")


def plan_actions():
    """infra_lab.plan marks the tag change update and the rename replace; simulate_apply needs allow_destroy for it."""
    topology = json.loads((ROOT / "paths/cloud-infrastructure/practice/topology.json").read_text(encoding="utf-8"))["resources"]

    def resources(step, caption):
        out = []
        for id, kind, name, tags in rows(step, caption):
            r = {"id": id, "kind": kind, "name": name, "tags": dict(p.split("=") for p in tags.split(", "))}
            if kind == "storage":
                r = {"id": id, "kind": kind, "name": name, "public_network": False, "tags": r["tags"]}
            out.append(r)
        return out

    steps = scenarios("cloud-infrastructure", "plan-review")
    check(resources(steps["update"][0], "Current") == topology, "plan: the current table is topology.json")
    for name, action in (("update", "update"), ("replace", "replace")):
        last = steps[name][-1]
        current, desired = resources(last, "Current"), resources(last, "Desired")
        check(infra_lab.plan(current, desired) == [{"id": "group", "action": "no-op"}, {"id": "store", "action": action}], f"plan {name}")
    current, desired = resources(steps["replace"][-1], "Current"), resources(steps["replace"][-1], "Desired")
    try:
        infra_lab.simulate_apply(current, desired)
    except ValueError as error:
        check("allow_destroy" in str(error), "plan: the refusal names allow_destroy")
    else:
        raise AssertionError("plan: a replace should need allow_destroy")
    check(infra_lab.simulate_apply(current, desired, allow_destroy=True) == desired, "plan: allowed replace applies")
    infra_lab.simulate_apply(*[resources(steps["update"][-1], c) for c in ("Current", "Desired")])


def expand_contract():
    """schema_coexistence.drill passes; contracting before the late write is backfilled loses it and breaks old readers."""
    with contextlib.redirect_stdout(io.StringIO()) as out:
        schema_coexistence.drill()
    check(out.getvalue().startswith("PASS"), "schema: the lab's drill passes")
    with tempfile.TemporaryDirectory() as folder:
        db = sqlite3.connect(str(Path(folder) / "notes.db"))
        db.execute("CREATE TABLE notes(id INTEGER PRIMARY KEY, title TEXT NOT NULL)")
        db.execute("INSERT INTO notes(title) VALUES ('first')")
        db.execute("ALTER TABLE notes ADD COLUMN label TEXT")
        db.execute("UPDATE notes SET label=title WHERE label IS NULL")
        db.execute("INSERT INTO notes(title) VALUES ('late old write')")
        db.execute("ALTER TABLE notes DROP COLUMN title")
        stored = db.execute("SELECT id, label FROM notes ORDER BY id").fetchall()
        expected = [[int(i), None if v == "NULL" else v] for i, v in rows(scenarios("delivery-operations", "schema-evolution")["early"][-1], "notes")]
        check([list(r) for r in stored] == expected, f"schema early: {stored}")
        try:
            schema_coexistence.old_reader(db)
        except sqlite3.OperationalError as error:
            check("no such column" in str(error), "schema: old reader error")
        else:
            raise AssertionError("schema: old reader should fail after DROP")
        db.close()


def contrast_ratios():
    """contrast.cjs gives each pair's ratio as the explanations state it, cut to two decimals."""
    pairs, texts = [], []
    for steps in scenarios("ui-accessibility", "contrast-colour").values():
        for step in steps:
            texts.append(step["explanation"])
            pairs += [(fg, bg) for _, _, fg, bg, _ in rows(step, "Colour pairs")]
    script = "const {contrast}=require(process.argv[1]);console.log(JSON.stringify(JSON.parse(process.argv[2]).map(([a,b])=>Math.floor(contrast(a,b)*100)/100)))"
    result = subprocess.run(["node", "-e", script, str(ROOT / "paths/ui-accessibility/practice/contrast.cjs"), json.dumps(sorted(set(pairs)))],
                            capture_output=True, text=True, check=True)
    ratios = dict(zip(sorted(set(pairs)), json.loads(result.stdout)))
    joined = " ".join(texts)
    for (fg, bg), ratio in ratios.items():
        check(f"#{fg}" in joined and f"{ratio:.2f}:1" in joined, f"contrast #{fg}: {ratio:.2f}:1 stated")
    check(ratios[("777777", "ffffff")] < 4.5 <= ratios[("767676", "ffffff")], "contrast: 777777 fails and 767676 passes 4.5:1")


def characterization_counts():
    """legacy_report drops ticket A; report counts it; both total 20 minutes over the kit's tickets.csv."""
    csv_path = ROOT / "paths/requirements-maintenance/practice/tickets.csv"
    steps = scenarios("requirements-maintenance", "characterization")
    check([list(map(str, (t.id, t.status, t.minutes))) for t in report.read_tickets(csv_path)] == rows(steps["targeted"][0], "tickets.csv"),
          "characterization: the table is tickets.csv")
    check(legacy_report.summarize_file(csv_path) == {"count": 3, "total_minutes": 20}, "characterization: legacy output")
    check(report.summarize(report.read_tickets(csv_path)) == {"count": 4, "total_minutes": 20}, "characterization: fixed output")


for fact in (agent_budget, operation_ids, object_authorization, tail_latency,
             generators, expected_versions, plan_actions, expand_contract, contrast_ratios, characterization_counts):
    fact()
print("PASS: AI Agents, Agent Harnesses, Application Security, Observability, Python, Full Stack, Cloud, Delivery, "
      "UI & Accessibility and Requirements explorers match their labs.")
