const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={};ctx.window=ctx;vm.createContext(ctx);
for(const f of ['concrete-scenes','scenes-dsa','scenes-apps','scenes-infra','scenes-patterns'])vm.runInContext(fs.readFileSync('assets/js/'+f+'.js','utf8'),ctx);
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
assert.equal(lessons,27);assert.equal(frames,164);console.log('PASS: 27 concrete scenes, 164 snapshot renders, preserved explanations/details and unique print IDs.');
const all=require('../scripts/manifest.cjs').readPaths();
const rendered=(path,id,scenarioIndex,index)=>{const scenario=all.find(p=>p.id===path).lessons.find(l=>l.id===id).visual.scenarios[scenarioIndex];return ctx.NotebookScenes.render(id,scenario.steps[index],{scenario,scenarioIndex,index,key:'assert'});};
assert(!rendered('react','state',0,0).includes('Called three times'));
assert(!rendered('react','state',0,2).includes('class="scene-apps-update"'),'processed updates leave pending queue');
assert(rendered('design-patterns','strategy',1,0).includes('Awaiting result'));
assert(!rendered('design-patterns','decorator',1,0).includes('<output>A,BC</output>'));
assert(rendered('design-patterns','observer',1,2).includes('<output>0</output>'),'failed first observer does not invoke second');
console.log('PASS: pending/result timing and failed observer boundary.');
