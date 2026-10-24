const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={};ctx.window=ctx;vm.createContext(ctx);
for(const f of ['concrete-scenes','scenes-dsa','scenes-apps','scenes-infra','scenes-patterns','scenes-data'])vm.runInContext(fs.readFileSync('assets/js/'+f+'.js','utf8'),ctx);
ctx.escapeText=ctx.NotebookScenes.escape;
vm.runInContext(fs.readFileSync('assets/js/learning-tools.js','utf8'),ctx);
let lessons=0,frames=0;
for(const p of require('../scripts/manifest.cjs').readPaths())for(const l of (Array.isArray(p.lessons)?p.lessons:[])){if(!l.visual)continue;lessons++;
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
assert.equal(lessons,30);assert.equal(frames,184);console.log('PASS: 30 concrete scenes, 184 snapshot renders, preserved explanations/details and unique print IDs.');
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
