const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={};ctx.window=ctx;vm.createContext(ctx);
for(const f of ['concrete-scenes','scenes-dsa','scenes-apps','scenes-infra','scenes-patterns','scenes-data','scenes-engineering'])vm.runInContext(fs.readFileSync('assets/js/'+f+'.js','utf8'),ctx);
ctx.escapeText=ctx.NotebookScenes.escape;
vm.runInContext(fs.readFileSync('assets/js/learning-tools.js','utf8'),ctx);
let lessons=0,frames=0;const visualIds=[];
for(const p of require('../scripts/manifest.cjs').readPaths())for(const l of (Array.isArray(p.lessons)?p.lessons:[])){if(!l.visual)continue;lessons++;visualIds.push(l.id);
assert(ctx.NotebookScenes.keys().includes(l.id),l.id);
for(const [scenarioIndex,scenario] of l.visual.scenarios.entries())for(const [index,step] of scenario.steps.entries()){
const html=ctx.visualFrame(step,l.id+'-'+scenarioIndex+'-'+index,scenario.steps[index-1],l.id,{scenario,scenarioIndex,index});frames++;
assert(html.includes('data-scene="'+l.id+'"'),l.id);assert(!/undefined|NaN/.test(html),l.id);
assert(html.includes(ctx.escapeText(step.explanation)),l.id);
for(const n of step.nodes)assert(html.includes(ctx.escapeText(n.detail)),l.id+': '+n.detail);
const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size,l.id);
}
const pack=ctx.visualExplorerView(l,true);const ids=[...pack.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size,l.id+' print IDs');
}
assert.equal(new Set(visualIds).size,visualIds.length,'explorer lesson IDs are unique, because renderers are registered by lesson ID');
assert.deepEqual([...ctx.NotebookScenes.keys()].filter(k=>!visualIds.includes(k)),[],'every renderer belongs to an explorer lesson');
assert(lessons>=40,'at least 40 explorers; a lower count means some were lost');console.log(`PASS: ${lessons} concrete scenes, ${frames} snapshot renders, a renderer for every explorer, preserved explanations/details and unique print IDs.`);
const all=require('../scripts/manifest.cjs').readPaths();
const rendered=(path,id,scenarioIndex,index)=>{const scenario=all.find(p=>p.id===path).lessons.find(l=>l.id===id).visual.scenarios[scenarioIndex];return ctx.NotebookScenes.render(id,scenario.steps[index],{scenario,scenarioIndex,index,key:'assert'});};
assert(!rendered('react','state',0,0).includes('Called three times'));
assert(!rendered('react','state',0,2).includes('class="scene-apps-update"'),'processed updates leave pending queue');
assert(rendered('design-patterns','strategy',1,0).includes('Awaiting result'));
assert(!rendered('design-patterns','decorator',1,0).includes('<output>A,BC</output>'));
assert(rendered('design-patterns','observer',1,2).includes('<output>0</output>'),'failed first observer does not invoke second');
// Data scenes compute their summaries from the snapshot; the authored text must agree with what is drawn.
const text=html=>html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
const stat=(i,j)=>text(rendered('practical-maths-statistics','mean-median-and-outliers',i,j));
assert(stat(0,0).includes('Mean 10 ms')&&stat(0,1).includes('Mean 28 ms')&&stat(0,1).includes('Median 10 ms'),'an outlier moves the mean, not the median');
assert(stat(1,1).includes('Mean 8 ms')&&stat(1,2).includes('Mean 10 ms')&&stat(1,2).includes('Not measured: E'),'a missing value is not a zero');
const rate=(i,j)=>text(rendered('data-analysis-python','group-and-denominators',i,j));
assert(!rate(0,0).includes('Team A')&&rate(0,1).includes('Team A')&&!rate(0,1).includes('rate 50%'),'groups appear before their aggregates');
assert(rate(0,2).includes('2 tickets · 1 breach · rate 50%')&&rate(0,2).includes('8 tickets · 1 breach · rate 12.5%'));
const groups=all.find(p=>p.id==='data-analysis-python').lessons.find(l=>l.id==='group-and-denominators').visual;
for(const [i,s] of groups.scenarios.entries())for(const [j,step] of s.steps.entries())for(const [team,size,breaches,share] of step.tables?.[0]?.rows||[])assert(rate(i,j).includes(`${size} tickets · ${breaches} breach${breaches==='1'?'':'es'} · rate ${share}`),`${s.id}/${j}: team ${team} summary matches the drawn tickets`);
assert(rate(0,3).includes('2 breaches / 10 tickets = 20%')&&rate(1,1).includes('(50% + 12.5%) / 2 = 31.25%')&&rate(1,2).includes('= 20%'));
const ml=all.find(p=>p.id==='machine-learning-foundations').lessons.find(l=>l.id==='threshold-policy').visual;
for(const [i,s] of ml.scenarios.entries())for(const [j,step] of s.steps.entries()){const html=text(rendered('machine-learning-foundations','threshold-policy',i,j)),counts=step.nodes.find(n=>n.id==='counts').detail,cost=counts.match(/cost (\d+)/)[1];
 for(const k of ['TP','FP','FN','TN'])assert(html.includes(k+' '+counts.match(new RegExp(k+' (\\d+)'))[1]),`${s.id}/${j}: ${k} drawn as authored`);
 assert(html.includes('= '+cost+' ')&&step.tables[1].rows[0][1]===cost,`${s.id}/${j}: cost ${cost}`);
 for(const [name,score,,decision] of step.tables[0].rows)assert.equal(decision==='Flag',Number(score)>=Number(step.tables[1].rows[0][0]),name+': flagged at or above the threshold');}
assert.deepEqual(ml.scenarios.map(s=>s.steps.map(step=>step.tables[1].rows[0][1])),[['5','4','1','5'],['5','1','1']],'validation picks 0.3; retuning on the test hides the miss');
console.log('PASS: pending/result timing, failed observer boundary, and computed mean/median, group rates and threshold costs.');
// Replay, TTL, rebase and inbox scenes: what is drawn follows the authored snapshot.
const replay=(i,j)=>text(rendered('data-engineering','idempotency-and-replay',i,j));
assert(replay(0,0).includes('2 rows · 2,000 cents')&&replay(0,2).includes('2 rows · 2,000 cents')&&!replay(0,2).includes('duplicate'),'replay and conflict add no orders');
assert(replay(1,1).includes('4 rows · 4,000 cents · 2 duplicates'),'an append-only re-run doubles the orders');
const dns=(i,j)=>rendered('networking-web','dns-cache',i,j);
assert(dns(0,1).includes('--at:49.9')&&dns(0,1).includes('cached until t=15')&&dns(0,2).includes('>expired<')&&dns(0,3).includes('cached until t=20'),'the clock and expiry come from the snapshot');
const git=(i,j)=>text(rendered('git-team-workflows','rebase',i,j));
assert(git(0,1).includes('T1′ e5f6a7b on M1')&&!git(0,0).includes('teammate')&&git(1,2).includes('Merge 9a8b7c6 T2 + T1′'),'replayed commits name their new parent');
const inbox=(i,j)=>text(rendered('messaging-events','idempotent-consumers',i,j));
assert(inbox(0,1).includes('total 7')&&inbox(1,2).includes('total 14'),'the inbox keeps one effect; the memory set does not');
console.log('PASS: replay row counts, TTL expiry on the clock, rebased parents and inbox totals are drawn from each snapshot.');
// Engineering scenes: budgets, operation IDs, authorization, clocks, percentiles and permission bits are computed from each snapshot.
const scenario=(path,id)=>all.find(p=>p.id===path).lessons.find(l=>l.id===id).visual.scenarios;
const drawn=(path,id)=>scenario(path,id).map((s,i)=>s.steps.map((_,j)=>text(rendered(path,id,i,j))));
const loop=drawn('ai-agents','loop');
assert(loop[0][0].includes('1 of 3 proposals used')&&loop[0][2].includes('3 of 3 proposals used · 0 left')&&loop[0][2].includes('status: budget_exhausted')&&!loop[0][2].includes('6.'),'the budget stops the run after three proposals');
assert(loop[1][2].includes('6 proposals · no limit')&&loop[1][3].includes('status: running')&&loop[1].every(t=>t.includes('Evidence observed: SQL-07')),'the unbounded loop keeps calling without new evidence');
const ops=drawn('agent-harnesses','idempotent-effects');
assert.deepEqual(ops.map(s=>s.map(t=>t.match(/(\d) notes? for 1 intent/)[1])),[['1','1','1'],['1','2','2']],'the same ID keeps one note; a new ID writes a second');
for(const [i,s] of scenario('application-security','authorization-ownership').entries())for(const [j,step] of s.steps.entries()){const code=text(rendered('application-security','authorization-ownership',i,j)).match(/(200|404) (OK|unavailable)/)[1];assert(step.nodes.find(n=>n.id==='response').detail.startsWith(code),`${s.id}/${j}: drawn ${code} matches the response`);}
const clock=drawn('testing-debugging','flaky-tests');
assert.deepEqual(clock.map(s=>s.map(t=>t.match(/test (passes|fails)/)[1])),[['passes','fails','passes'],['passes','passes','passes']],'the wall clock flips the result; the injected clock does not');
assert(clock[1][1].includes('At 1030 s the token is expired'),'expiry is exclusive: now < issued + ttl');
const tail=drawn('observability-performance','latency-percentiles');
for(const t of [tail[0][2],tail[1][2]])assert(/Release A · 20 requests.*Mean 42 ms p95 \(rank 19 of 20\) 60 ms.*Release B · 20 requests.*Mean 33 ms p95 \(rank 19 of 20\) 150 ms/.test(t),'mean and nearest-rank p95 for both releases');
const perm=drawn('linux-operating-systems','permissions-and-identities');
assert(perm[0][1].includes('bo can read /srv/reports/q3.csv')&&perm[0][2].includes('Permission denied at /srv/reports/q3.csv')&&perm[0][0].includes('group bits r-x: traverse allowed'),'750/640: group can enter and read, not write');
assert(perm[1].every(t=>t.includes('Permission denied at /srv/reports'))&&perm[1][2].includes('not reached'),'700: denied at the directory, whatever the file mode');
console.log('PASS: agent budget, operation IDs, object authorization, injected clock, p95 and permission bits are drawn from each snapshot.');
