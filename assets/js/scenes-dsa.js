(function () {
  'use strict';

  const scenes = window.NotebookScenes;
  if (!scenes || typeof scenes.register !== 'function') return;
  const esc = scenes.escape;
  const list = value => Array.isArray(value) ? value : [];
  const safe = value => esc(String(value == null ? '' : value));
  const attr = value => safe(value).replace(/`/g, '&#96;');
  const rowValue = (step, name) => {
    for (const table of list(step.tables)) {
      for (const row of list(table.rows)) {
        if (String(row[0]).toLowerCase() === name.toLowerCase()) return String(row[1]);
      }
    }
    return '';
  };
  const nodeById = (step, id) => list(step.nodes).find(node => String(node.id) === String(id));
  const motion = (prefix, label) => ` data-motion-node="${attr(prefix + '-' + label)}"`;
  const parts = value => String(value || '').split(/\s*(?:→|,)\s*/).filter(Boolean);
  const markerId = (meta, kind) => `scene-dsa-${kind}-${String(meta && meta.key || 'frame').replace(/[^a-zA-Z0-9_-]/g, '-')}`;

  function stacksQueues(step, meta) {
    const isStack = /stack/i.test(String(meta.scenario && meta.scenario.label || ''));
    const kind = isStack ? 'Stack' : 'Queue';
    const nodes = list(step.nodes);
    const removed = nodes.find(node => /removed/i.test(node.detail));
    const waiting = nodes.filter(node => /arrived|waiting/i.test(node.detail));
    const order = nodes.find(node => node.label === 'Departure order');
    const departure = order ? parts(order.detail) : (removed ? [removed.label] : []);
    const lane = waiting.map(node => `<div class="scene-dsa-item"${motion('sq', node.label)}><strong>${safe(node.label)}</strong><span>${safe(node.detail)}</span></div>`).join('');
    const departed = departure.map((value, index) => `<span class="scene-dsa-departed"${motion('sq', value)}><b>${safe(value)}</b><small>${index + 1}</small></span>`).join('');
    return `<div class="scene-dsa scene-dsa-sq ${isStack ? 'is-stack' : 'is-queue'}" aria-label="${kind} state"><div class="scene-dsa-work"><div class="scene-dsa-lane-head"><strong>${kind}</strong><span>${isStack ? 'pop from top ↑' : 'dequeue at front →'}</span></div><div class="scene-dsa-lane">${lane || '<span class="scene-dsa-empty">Empty</span>'}</div><div class="scene-dsa-lane-foot">${isStack ? 'bottom' : 'front'}${!isStack ? ' <span>back</span>' : ''}</div></div><div class="scene-dsa-out"><strong>Departed</strong><div class="scene-dsa-departures">${departed || '<span class="scene-dsa-placeholder">None yet</span>'}</div></div></div>`;
  }

  function sorting(step) {
    const nodes = list(step.nodes);
    const values = nodes.map(node => Number(node.label));
    const maximum = Math.max(1, ...values.filter(Number.isFinite).map(Math.abs));
    return `<div class="scene-dsa scene-dsa-sort" aria-label="Array state"><div class="scene-dsa-sort-track">${nodes.map((node, index) => {
      const value = Number(node.label);
      const height = Number.isFinite(value) ? Math.max(18, Math.abs(value) / maximum * 100) : 40;
      const sorted = /sorted prefix/i.test(node.detail);
      return `<div class="scene-dsa-sort-slot"><div class="scene-dsa-sort-tile ${sorted ? 'is-sorted' : ''}" style="--bar-height:${height}%"${motion('sort-value', node.label)}><b>${safe(node.label)}</b><span class="scene-dsa-sort-bar"></span></div><span class="scene-dsa-index">[${index}]</span></div>`;
    }).join('')}</div><div class="scene-dsa-sort-legend"><span class="is-sorted"></span> Sorted prefix <span class="is-pending"></span> Unprocessed</div></div>`;
  }

  function linked(step, meta) {
    const nodes = list(step.nodes);
    const labels = nodes.map(node => node.label);
    const inserting = labels.includes('X');
    const connected = list(step.edges).some(edge => nodeById(step, edge.from)?.label === 'A' && nodeById(step, edge.to)?.label === 'X');
    const arrow = markerId(meta, 'link-arrow');
    const coords = inserting && !connected ? { A: [85, 95], B: [370, 95], X: [85, 235] } : { A: [85, 95], X: [370, 95], B: [655, 95], C: [655, 95] };
    if (!inserting) { coords.A = [85, 95]; coords.B = [370, 95]; coords.C = [655, 95]; }
    const edgeSvg = list(step.edges).map(edge => {
      const from = nodeById(step, edge.from)?.label;
      const to = nodeById(step, edge.to)?.label;
      if (!coords[from] || !coords[to]) return '';
      const [x1, y1] = coords[from], [x2, y2] = coords[to];
      const startX = x1 + 92, endX = x2 - 92;
      const curve = y1 === y2 ? `M ${startX} ${y1} L ${endX} ${y2}` : `M ${startX} ${y1} C ${startX + 70} ${y1}, ${endX + 70} ${y2}, ${endX} ${y2}`;
      return `<path class="scene-dsa-link" d="${curve}" marker-end="url(#${arrow})"/>`;
    }).join('');
    const boxes = nodes.map(node => {
      const [x, y] = coords[node.label] || [85, 95];
      const next = list(step.edges).find(edge => String(edge.from) === String(node.id));
      const nextLabel = next ? nodeById(step, next.to)?.label : (/tail|next is null/i.test(node.detail) ? 'null' : '?');
      const cursor = /cursor/i.test(node.detail);
      return `<g class="scene-dsa-linked-node ${cursor ? 'is-current' : ''}" transform="translate(${x - 88} ${y - 38})"${motion('linked', node.label)}><rect x="0" y="0" width="176" height="76" rx="9"/><path d="M 100 0 V 76"/><text x="12" y="16" class="scene-dsa-field">value</text><text x="112" y="16" class="scene-dsa-field">next</text><text x="50" y="51" text-anchor="middle" class="scene-dsa-node-value">${safe(node.label)}</text><text x="138" y="51" text-anchor="middle" class="scene-dsa-next-value">${safe(nextLabel)}</text></g><text x="${x}" y="${y + 61}" text-anchor="middle" class="scene-dsa-node-note">${safe(node.detail)}</text>`;
    }).join('');
    return `<div class="scene-dsa scene-dsa-linked-scene"><div class="scene-dsa-svg-wrap" role="region" tabindex="0" aria-label="Linked list connections; scroll across to follow pointers"><svg class="scene-dsa-linked" viewBox="0 0 760 315" aria-hidden="true"><defs><marker id="${arrow}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M 0 0 L 8 4 L 0 8 z"/></marker></defs><text x="4" y="30" class="scene-dsa-pointer-label">head →</text>${edgeSvg}${boxes}</svg></div><span class="scene-dsa-scroll-cue">Swipe or scroll across to follow the connections</span>${inserting && !list(step.edges).some(edge => nodeById(step, edge.from)?.label === 'X') ? '<span class="scene-dsa-unknown">? = next reference unspecified in this snapshot</span>' : ''}</div>`;
  }

  function diagram(step, meta, type) {
    const nodes = list(step.nodes);
    const base = type === 'bst' ? list(meta.scenario?.steps?.[0]?.nodes) : nodes;
    const source = type === 'bst' && base.length > nodes.length ? base : nodes;
    const edges = type === 'bst' && source === base ? list(meta.scenario?.steps?.[0]?.edges) : list(step.edges);
    const pos = type === 'graph' ? { A: [100, 90], B: [370, 90], C: [640, 90] } : type === 'bst' ? { '8': [370, 58], '3': [205, 166], '10': [540, 166], '6': [285, 275] } : { A: [370, 58], B: [205, 190], C: [535, 190] };
    const arrow = markerId(meta, 'graph-arrow');
    const edgeMarkup = edges.map(edge => {
      const a = source.find(n => String(n.id) === String(edge.from));
      const b = source.find(n => String(n.id) === String(edge.to));
      if (!a || !b || !pos[a.label] || !pos[b.label]) return '';
      const [x1, y1] = pos[a.label], [x2, y2] = pos[b.label];
      const path = type === 'graph' ? `M ${x1 + 34} ${y1} L ${x2 - 34} ${y2}` : `M ${x1} ${y1 + 32} L ${x2} ${y2 - 32}`;
      const edgeName = type === 'graph' ? '' : `<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 7}" text-anchor="middle" class="scene-dsa-edge-label">${safe(edge.label)}</text>`;
      return `<path class="scene-dsa-connection" d="${path}"${type === 'graph' ? ` marker-end="url(#${arrow})"` : ''}/>${edgeName}`;
    }).join('');
    const nodeMarkup = source.map(node => {
      const state = nodes.find(current => current.label === node.label);
      const detail = state?.detail || node.detail;
      const compared = type === 'bst' && step.title === `Compare with ${node.label}`;
      const calling = type === 'recursion' && meta.index < 2 && node.label === 'A';
      const current = /current comparison|matches target|cursor here|queued|start|discovered; parent/i.test(detail) || compared || calling;
      const done = /visited|expanded|complete|left call complete/i.test(detail);
      const muted = /undiscovered|skipped|unreachable/i.test(detail) || !state;
      const [x, y] = pos[node.label] || [370, 58];
      return `<g class="scene-dsa-circle-node ${current ? 'is-current' : ''} ${done ? 'is-done' : ''} ${muted ? 'is-muted' : ''}" transform="translate(${x} ${y})"${motion(type, node.label)}><circle r="30"/><text text-anchor="middle" dominant-baseline="central" class="scene-dsa-circle-value">${safe(node.label)}</text></g><text x="${x}" y="${y + 53}" text-anchor="middle" class="scene-dsa-node-note">${safe(detail)}</text>`;
    }).join('');
    const queue = type === 'graph' ? rowValue(step, 'Queue') : '';
    const output = type === 'recursion' ? (rowValue(step, 'Emitted') || rowValue(step, 'Final order')) : '';
    const track = type === 'graph' ? `<div class="scene-dsa-state-rail"><span>Queue</span>${queue ? parts(queue).map(value => `<b${motion('queue', value)}>${safe(value)}</b>`).join('') : '<em>empty</em>'}</div>` : type === 'recursion' ? `<div class="scene-dsa-state-rail"><span>Emitted</span>${output && output !== 'none' ? parts(output).map(value => `<b${motion('emitted', value)}>${safe(value)}</b>`).join('') : '<em>none yet</em>'}</div>` : `<div class="scene-dsa-state-rail"><span>Search</span><b>${safe(step.title)}</b></div>`;
    return `<div class="scene-dsa scene-dsa-${type}"><div class="scene-dsa-svg-wrap" role="region" tabindex="0" aria-label="${type === 'graph' ? 'Graph' : 'Tree'} connections; scroll across to follow connections"><svg viewBox="0 0 740 ${type === 'graph' ? 195 : 350}" role="img" aria-label="${type === 'graph' ? 'Graph' : 'Tree'} state">${type === 'graph' ? `<defs><marker id="${arrow}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M 0 0 L 8 4 L 0 8 z"/></marker></defs>` : ''}${edgeMarkup}${nodeMarkup}</svg></div><span class="scene-dsa-scroll-cue">Swipe or scroll across to follow the connections</span>${track}</div>`;
  }

  scenes.register('stacks-queues', stacksQueues);
  scenes.register('sorting', sorting);
  scenes.register('linked-nodes', linked);
  scenes.register('graphs', (step, meta) => diagram(step, meta, 'graph'));
  scenes.register('recursion', (step, meta) => diagram(step, meta, 'recursion'));
  scenes.register('binary-search-tree', (step, meta) => diagram(step, meta, 'bst'));
})();
