(function () {
  "use strict";
  const scenes = globalThis.NotebookScenes;
  if (!scenes?.register) return;
  const esc = value => scenes.escape(String(value ?? ""));
  const node = (step, id) => (step.nodes || []).find(item => String(item.id) === String(id));
  const detail = (step, id) => esc(node(step, id)?.detail || "");
  const scenario = meta => typeof meta.scenario === "string" ? meta.scenario : meta.scenario?.id || "";
  const at = meta => Number.isInteger(meta.index) ? meta.index : 0;
  const motion = (id, html, extra = "") => `<div class="scene-infra__motion ${extra}" data-motion-node="infra-${esc(id)}">${html}</div>`;
  const chip = (text, tone = "") => `<span class="scene-infra__chip ${tone}">${esc(text)}</span>`;
  const wrap = (kind, content, caption) => `<figure class="scene-infra scene-infra--${kind}"><div class="scene-infra__art">${content}</div><figcaption>${esc(caption)}</figcaption></figure>`;

  function pod(step, id, version) {
    const entry = node(step, id);
    if (!entry) return "";
    const state = entry.tone || "neutral";
    const isGone = /deleted|gone|scales down|replicas=0/i.test(entry.detail);
    const status = isGone ? "removed" : /not ready/i.test(entry.detail) ? "not ready" : /pending/i.test(entry.detail) ? "pending" : /mismatch/i.test(entry.detail) ? "label mismatch" : /starting|created|scheduled/i.test(entry.detail) ? "starting" : /ready/i.test(entry.detail) ? "ready" : "state below";
    return motion(`pod-${id}`, `<div class="scene-infra__pod-head"><span class="scene-infra__pod-icon" aria-hidden="true">${isGone ? "×" : esc(id.toUpperCase())}</span><span class="scene-infra__pod-title"><strong>${esc(entry.label)}</strong><span class="scene-infra__pod-state">${esc(status)}</span></span>${version ? chip(version) : ""}</div><small>${esc(entry.detail)}</small>`, `scene-infra__pod is-${esc(state)}${isGone ? " is-gone" : ""}`);
  }
  function controller(step, id) {
    const entry = node(step, id);
    if (!entry) return "";
    return motion(`controller-${id}`, `<span class="scene-infra__file-tab">${id === "deploy" ? "deployment.yaml" : "controller status"}</span><strong>${esc(entry.label)}</strong><small>${esc(entry.detail)}</small>`, `scene-infra__controller is-${esc(entry.tone || "neutral")}`);
  }
  scenes.register("deployments", (step, meta) => {
    const pending = scenario(meta) === "pending";
    const pods = ["a", "b", "c"].map(id => pod(step, id)).join("");
    const capacity = node(step, "node") ? motion("eligible-node", `<span class="scene-infra__rack-icon" aria-hidden="true">▤</span><strong>Eligible node</strong><small>${detail(step, "node")}</small>`, "scene-infra__capacity") : "";
    return wrap("kube", `<div class="scene-infra__kube-top">${controller(step, "deploy")}<span class="scene-infra__arrow" aria-hidden="true">→</span>${controller(step, "rs")}</div><div class="scene-infra__kube-cluster"><div class="scene-infra__cluster-label"><strong>Pod identities</strong><small>${pending ? "Scheduling and readiness are separate" : "Replacement creates a new identity"}</small></div><div class="scene-infra__pods">${pods}${capacity}</div></div>`, "Deployment intent, ReplicaSet status, and the distinct Pod identities shown in this step.");
  });

  scenes.register("services-dns", (step, meta) => {
    const selectorMismatch = scenario(meta) === "selector" && at(meta) < 2;
    const endpoint = node(step, "slice");
    const svc = node(step, "svc");
    const routeText = selectorMismatch ? "No matching ready endpoint" : at(meta) === 1 && scenario(meta) === "ready" ? "A remains eligible" : "Ready endpoints eligible";
    return wrap("service", `<div class="scene-infra__request-strip">${motion("client", `<span class="scene-infra__browser-bar">client</span><strong>${esc(node(step, "client")?.label)}</strong><small>${detail(step, "client")}</small>`, "scene-infra__browser")}${motion("dns", `<span class="scene-infra__mini-label">DNS answer</span><strong>release-demo</strong><small>${svc?.detail?.includes("10.96.0.20") ? "10.96.0.20" : "Service name unchanged"}</small>`, "scene-infra__dns")}${motion("service", `<span class="scene-infra__mini-label">ClusterIP Service</span><strong>port 80 → http:8080</strong><small>${esc(svc?.detail)}</small>`, "scene-infra__service")}</div><div class="scene-infra__endpoint-panel">${motion("endpoints", `<span class="scene-infra__mini-label">EndpointSlice · selector app=release-demo</span><strong>${esc(endpoint?.detail)}</strong><small>${esc(routeText)}</small>`, `scene-infra__slice${selectorMismatch ? " is-empty" : ""}`)}<div class="scene-infra__pods">${pod(step, "a")}${pod(step, "b")}</div></div>`, "DNS reaches the Service; selector and readiness determine the eligible Pod endpoints.");
  });

  scenes.register("rolling-updates", (step, meta) => {
    const old = node(step, "old"), next = node(step, "new"), svc = node(step, "svc");
    const stalled = scenario(meta) === "stalled";
    const oldFoot = /replicas=0/i.test(old?.detail || "") ? "scaled to zero" : "known ready version";
    const newFoot = /scales down/i.test(next?.detail || "") ? "candidate removed" : stalled ? "readiness blocks promotion" : "candidate → ready";
    return wrap("rollout", `<div class="scene-infra__rollout-top">${controller(step, "deploy")}<div class="scene-infra__rollout-track" aria-hidden="true"><span class="scene-infra__track-old">v1</span><span class="scene-infra__track-new">v2</span></div></div><div class="scene-infra__version-racks">${motion("version-v1", `<span class="scene-infra__version">v1</span><strong>${esc(old?.label)}</strong><small>${esc(old?.detail)}</small><span class="scene-infra__version-foot">${oldFoot}</span>`, "scene-infra__rack is-old")}${motion("version-v2", `<span class="scene-infra__version">v2</span><strong>${esc(next?.label)}</strong><small>${esc(next?.detail)}</small><span class="scene-infra__version-foot">${newFoot}</span>`, `scene-infra__rack is-new${stalled ? " is-stalled" : ""}`)}</div>${motion("service-route", `<span class="scene-infra__mini-label">Service routing</span><strong>${esc(svc?.detail)}</strong>`, "scene-infra__routing")}`, "The Service follows ready endpoints while the Deployment changes versions.");
  });

  function littleRow(cells, id, cls = "") {
    return motion(id, `<span class="scene-infra__row-cells">${cells.map(cell => `<span>${esc(cell)}</span>`).join("")}</span>`, `scene-infra__data-row is-${cells.length} ${cls}`);
  }
  const rowHeader = columns => `<div class="scene-infra__row-header is-${columns.length}">${columns.map(column => `<span>${esc(column)}</span>`).join("")}</div>`;
  scenes.register("joins-and-grain", (step, meta) => {
    const left = scenario(meta) === "left";
    const stage = at(meta);
    const order104 = stage === 1 && !left ? "is-muted" : "";
    const joined = stage === 0 ? `<span class="scene-infra__join-empty">Choose ${left ? "LEFT" : "INNER"} before matching</span>` : `<div class="scene-infra__joined-rows">${littleRow(["101", "100", "201", "60"], "join-201")}${littleRow(["101", "100", "202", "40"], "join-202")}${left ? littleRow(["104", "120", "NULL", "NULL"], "join-104", "is-null") : ""}</div>`;
    const query = stage === 2 ? "WITH Paid AS (SELECT OrderId, SUM(Amount) AS Paid FROM Payments GROUP BY OrderId) SELECT … FROM Orders LEFT JOIN Paid ON Paid.OrderId = Orders.OrderId" : `SELECT … FROM Orders o ${left ? "LEFT" : "INNER"} JOIN Payments p ON p.OrderId = o.OrderId`;
    const corrected = stage === 2 ? `<div class="scene-infra__corrected"><strong>After: order-grain LEFT report</strong>${rowHeader(["OrderId","Amount","Paid"])}<div class="scene-infra__joined-rows">${littleRow(["101", "100", "100"], "report-101")}${littleRow(["104", "120", "0"], "report-104")}</div></div>` : "";
    return wrap("sql", `<div class="scene-infra__editor"><span class="scene-infra__editor-tab">${stage === 2 ? "order-grain report.sql" : "raw join.sql"}</span><code>${esc(query)}</code></div><div class="scene-infra__join-work"><div class="scene-infra__source"><strong>Orders <small>1 row / order</small></strong>${rowHeader(["OrderId","Amount"])}${littleRow(["101", "100"], "order-101")}${littleRow(["104", "120"], "order-104", order104)}</div><div class="scene-infra__join-symbol" aria-hidden="true">${left ? "⟕" : "⋈"}</div><div class="scene-infra__source"><strong>Payments <small>1 row / payment</small></strong>${rowHeader(["PaymentId","OrderId","Amount"])}${littleRow(["201", "101", "60"], "payment-201")}${littleRow(["202", "101", "40"], "payment-202")}</div></div><div class="scene-infra__result"><div class="scene-infra__result-title"><strong>${stage === 2 ? "Before: raw join at payment-match grain" : "Joined row provenance"}</strong>${chip(stage === 0 ? "before match" : `${left ? 3 : 2} rows`)}</div>${stage > 0 ? rowHeader(["OrderId","Amount","PaymentId","Paid"]) : ""}${joined}${corrected}</div>${stage === 2 ? `<p class="scene-infra__annotation">${detail(step, "0")} · ${detail(step, "1")} · ${detail(step, "2")}</p>` : ""}`, "Order 101 is repeated for both payments in the raw join; the corrected report has one row per order.");
  });

  scenes.register("indexes-and-plans", (step, meta) => {
    const broad = scenario(meta) === "broad", stage = at(meta);
    const pages = Array.from({length: 10}, (_, i) => `<span class="scene-infra__page ${stage === 0 ? "" : broad ? "is-visited" : i === 0 ? "is-selected" : ""}" aria-hidden="true"></span>`).join("");
    const seek = broad ? "Navigation + all 1,000 leaves" : "3 navigation + 2 leaf visits";
    return wrap("index", `<div class="scene-infra__editor"><span class="scene-infra__editor-tab">query.sql</span><code>${broad ? "SELECT … FROM Orders" : "SELECT … FROM Orders WHERE CustomerId = 2"}</code></div><div class="scene-infra__index-plan">${motion("index-root", `<span class="scene-infra__mini-label">covering index</span><strong>CustomerId · OrderDate</strong><small>INCLUDE Amount</small>`, "scene-infra__index-root")}<span class="scene-infra__down" aria-hidden="true">↓</span><div class="scene-infra__leaf-rail"><div class="scene-infra__leaf-heading"><strong>1,000 modeled leaf pages</strong><small>Each tile represents 100 pages for scale; highlighted selective range depicts 2 visits, not two whole tiles.</small></div><div class="scene-infra__pages">${pages}</div></div></div><div class="scene-infra__plan-compare">${motion("seek-candidate", `<strong>Seek candidate</strong><small>${stage === 0 ? "Compare at next step" : seek}</small>`, `scene-infra__plan-option${!broad && stage > 0 ? " is-preferred" : ""}`)}${motion("scan-candidate", `<strong>Scan candidate</strong><small>1,000 leaf visits</small>`, `scene-infra__plan-option${broad && stage > 0 ? " is-preferred" : ""}`)}</div><p class="scene-infra__annotation">${detail(step, "2")}${stage === 2 ? ` · ${detail(step, "0")}` : ""}</p>`, "Compare logical page visits for the modeled workload; an actual plan and row counts remain separate evidence.");
  });

  scenes.register("concurrency-lost-updates", (step, meta) => {
    const guarded = scenario(meta) === "guarded", stage = at(meta);
    const a = node(step, "0"), shared = node(step, "1"), b = node(step, "2");
    const bSql = guarded ? "WHERE Id = 1 AND Revision = 1" : "WHERE Id = 1";
    return wrap("concurrency", `<div class="scene-infra__session-grid">${motion("session-a", `<span class="scene-infra__editor-tab">Session A</span><code>UPDATE … SET Amount = 110,<br> Revision = 2 WHERE Id = 1${guarded ? " AND Revision = 1" : ""}</code><small>${esc(a?.detail)}</small>`, "scene-infra__session")}${motion("shared-row", `<span class="scene-infra__mini-label">shared database row</span><strong>${esc(shared?.detail)}</strong><span class="scene-infra__row-state ${stage === 2 && !guarded ? "is-warning" : ""}">${stage === 0 ? "Both read revision 1" : stage === 1 ? "A committed" : guarded ? "Conflict protected" : "Stale write overwrote A"}</span>`, "scene-infra__shared-row")}${motion("session-b", `<span class="scene-infra__editor-tab">Session B</span><code>UPDATE … SET Amount = 120,<br> Revision = 3 ${bSql}</code><small>${esc(b?.detail)}</small>`, "scene-infra__session")}</div><div class="scene-infra__time-rail"><span>t1 · A reads</span><span>t2 · B reads</span><span class="${stage > 0 ? "is-current" : ""}">t3 · A commits</span><span class="${stage > 1 ? "is-current" : ""}">t4 · B ${stage > 1 ? guarded ? "0 rows" : "1 row" : "attempts"}</span></div>`, "Two sessions share one row; the guarded scenario rejects B's stale revision at t4.");
  });

  scenes.register("network", (step, meta) => {
    const lost = scenario(meta) === "lost-response", stage = at(meta);
    const client = node(step, "client"), api = node(step, "api"), db = node(step, "db"), dns = node(step, "dns"), edge = node(step, "edge");
    return wrap("network", `<div class="scene-infra__journey">${motion("browser", `<span class="scene-infra__browser-bar">◂ ▸ &nbsp; api.example.test</span><strong>Browser request</strong><small>${esc(client?.detail)}</small>`, "scene-infra__browser")}${motion("dns-hop", `<span class="scene-infra__mini-label">DNS</span><strong>${dns ? esc(dns.detail) : "Not detailed in this step"}</strong>`, "scene-infra__hop")}${motion("edge-hop", `<span class="scene-infra__mini-label">HTTPS edge</span><strong>${edge ? esc(edge.detail) : "Not detailed in this step"}</strong>`, "scene-infra__hop")}${motion("api-hop", `<span class="scene-infra__mini-label">API</span><strong>${esc(api?.detail || "Not detailed in this step")}</strong>`, "scene-infra__hop")}${motion("db-row", `<span class="scene-infra__mini-label">database row</span><strong>${esc(db?.detail || "Not detailed in this step")}</strong>`, "scene-infra__db-row")}</div><div class="scene-infra__journey-note">${lost ? stage === 1 ? "Commit happened; reply did not arrive." : stage === 2 ? "Read current state to resolve an uncertain reply." : "One request, outcome pending." : stage === 2 ? "200 received at 220 ms; version 8 persisted." : "500 ms caller deadline governs the journey."}</div>`, "A browser request crosses DNS, HTTPS edge, API authorization, and the database; a lost reply leaves the commit uncertain to the caller.");
  });

  scenes.register("queues", (step, meta) => {
    const duplicate = scenario(meta) === "duplicate", stage = at(meta);
    const queue = node(step, "queue"), worker = node(step, "worker"), store = node(step, "store");
    const acked = /acknowledged/i.test(queue?.detail || "") && !/not acknowledged|unacknowledged/i.test(queue?.detail || "");
    return wrap("queue", `<div class="scene-infra__queue-flow">${motion("queue-lane", `<span class="scene-infra__mini-label">Queue</span><div class="scene-infra__envelope"><span class="scene-infra__stamp">J42</span><strong>Export job</strong><small>${esc(queue?.detail)}</small></div><span class="scene-infra__ack ${acked ? "is-acked" : ""}">${acked ? "ACK recorded" : "ACK pending"}</span>`, "scene-infra__queue-lane")}${motion("worker-lane", `<span class="scene-infra__worker-icon" aria-hidden="true">⚙</span><strong>${esc(worker?.label)}</strong><small>${esc(worker?.detail)}</small>`, `scene-infra__worker-lane${duplicate && stage === 0 ? " is-crashed" : ""}`)}${motion("store-lane", `<span class="scene-infra__mini-label">durable job store</span><div class="scene-infra__store-row"><strong>J42</strong><small>${esc(store?.detail)}</small></div>`, "scene-infra__store-lane")}</div><div class="scene-infra__journey-note">${duplicate ? stage === 0 ? "Effect committed before acknowledgement; a redelivery remains possible." : stage === 1 ? "Redelivery checks J42 before another effect." : "Existing result reused; output count stays one." : stage === 0 ? "Delivery lease is temporary." : stage === 1 ? "Result committed before acknowledgement." : "Acknowledge only after the result exists."}</div>`, "J42 moves through a delivery lease, durable result, and separate acknowledgement.");
  });

  scenes.register("resilience", (step, meta) => {
    const failed = scenario(meta) === "exhausted", stage = at(meta);
    const progress = failed ? [350, 450, 600][stage] : [150, 200, 280][stage];
    const segments = failed ? ["A1 · 150", "wait · 50", "A2 · 150", "wait · 100", `A3 · ${stage === 2 ? "150" : "≤150"}`] : ["A1 · 150", "wait · 50", `A2 · ${stage === 2 ? "80" : "≤150"}`];
    const doneThrough = failed ? [2, 3, 4][stage] : [0, 1, 2][stage];
    const active = stage === 1 ? failed ? 4 : 2 : -1;
    return wrap("retry", `<div class="scene-infra__retry-head">${motion("caller", `<span class="scene-infra__mini-label">caller</span><strong>${detail(step, "client")}</strong>`, "scene-infra__retry-actor")}${motion("retry-owner", `<span class="scene-infra__mini-label">sole retry owner</span><strong>${detail(step, "api")}</strong>`, "scene-infra__retry-actor")}${motion("dependency", `<span class="scene-infra__mini-label">dependency</span><strong>${detail(step, "dep")}</strong>`, "scene-infra__retry-actor")}</div><div class="scene-infra__timeline" role="img" aria-label="Modeled elapsed ${progress} milliseconds of a 600 millisecond deadline"><div class="scene-infra__timeline-scale"><span>0 ms</span><strong>${progress} ms elapsed</strong><span>600 ms deadline</span></div><div class="scene-infra__timeline-bar">${segments.map((s, i) => `<span class="${s.startsWith("wait") ? "is-wait" : "is-attempt"} ${i === active ? "is-active" : i > doneThrough ? "is-future" : ""}">${esc(s)}</span>`).join("")}</div></div><p class="scene-infra__annotation">${failed && stage === 2 ? "Stop at the deadline; a timed-out effect can remain uncertain." : "At most 3 attempts; each capped at 150 ms, including the remaining deadline."}</p>`, "One API retry owner spends a 600 ms end-to-end budget across attempts and waits.");
  });
})();
