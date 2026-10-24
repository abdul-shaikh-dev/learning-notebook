const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
process.chdir(process.env.LEARNING_REPO||path.resolve(__dirname,'..'));
const paths=require(path.resolve('scripts/manifest.cjs')).readPaths();
const context={escapeText:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'),document:{getElementById:()=>null}};
context.window=context;context.globalThis=context;vm.createContext(context);
for(const f of ['concrete-scenes','scenes-infra','scenes-apps','scenes-dsa','scenes-patterns','scenes-data','learning-tools'])vm.runInContext(fs.readFileSync(`assets/js/${f}.js`,'utf8'),context);
// A focus key names one drawn element, whole or without its renderer prefix.
const short=v=>v.slice(v.indexOf('-')+1),matches=(k,v)=>v===k||short(v)===k,drawn=html=>[...html.matchAll(/data-motion-node="([^"]+)"/g)].map(m=>m[1]);
const marks=html=>Object.fromEntries([...html.matchAll(/data-motion-node="([^"]+)" data-change="([^"]+)"/g)].map(m=>[short(m[1]),m[2]]));
let focused=0;
for(const p of paths)for(const l of (Array.isArray(p.lessons)?p.lessons:[])){if(!l.visual)continue;
 l.visual.scenarios.forEach((s,si)=>s.steps.forEach((step,i)=>{
  const where=`${p.id}/${l.id}/${s.id}/${i}`,meta={scenario:s,scenarioIndex:si,index:i};
  if(i===0)assert.equal(step.focus,undefined,where+': a scenario opening has nothing to compare against');
  else assert(Array.isArray(step.focus),where+': every later step states its focus, [] when nothing is marked');
  if(step.focusLabel!==undefined)assert(typeof step.focusLabel==='string'&&step.focusLabel.length>0&&step.focusLabel.length<=12&&step.focus?.length,where+': short label with focus');
  if(step.focus===undefined)return;
  assert(Array.isArray(step.focus)&&new Set(step.focus).size===step.focus.length,where+': unique focus keys');
  const keys=drawn(context.NotebookScenes.render(l.id,step,meta));
  for(const k of step.focus)assert.equal(keys.filter(v=>matches(k,v)).length,1,`${where}: focus "${k}" must name exactly one drawn element (drawn: ${keys.join(', ')})`);
  const html=context.visualFrame(step,'focus',s.steps[i-1],l.id,meta),labelled=[...html.matchAll(/data-motion-node="([^"]+)" data-change=/g)].map(m=>m[1]);
  assert.deepEqual(labelled.sort(),keys.filter(v=>step.focus.some(k=>matches(k,v))).sort(),where+': exactly the focused elements are labelled');
  focused+=step.focus.length?1:0;
 }));}
// Steps without authored focus are never labelled.
const sorting=paths.find(p=>p.id==='data-structures-algorithms').lessons.find(l=>l.id==='sorting').visual.scenarios[0];
const {focus:_,...unfocused}=sorting.steps[1];
assert(!context.visualFrame(unfocused,'plain',sorting.steps[0],'sorting',{scenario:sorting,scenarioIndex:0,index:1}).includes('data-change'));
// New, changed and custom labels on concrete steps.
const kube=paths.find(p=>p.id==='kubernetes').lessons,deploy=kube.find(l=>l.id==='deployments').visual.scenarios[0];
assert.deepEqual(marks(context.visualFrame(deploy.steps[1],'k',deploy.steps[0],'deployments',{scenario:deploy,scenarioIndex:0,index:1})),{'controller-rs':'Changed','pod-b':'Changed','pod-c':'New'});
const selector=kube.find(l=>l.id==='services-dns').visual.scenarios[1];
assert.deepEqual(Object.values(marks(context.visualFrame(selector.steps[1],'s',selector.steps[0],'services-dns',{scenario:selector,scenarioIndex:1,index:1}))),['Check','Check','Check']);
// Printed study packs carry the same labels, and the cue never depends on motion.
assert(context.visualExplorerView(kube.find(l=>l.id==='deployments'),true).includes('data-change="New"'),'print pack labels focus');
const css=fs.readFileSync('assets/css/concept-explorer.css','utf8');
assert(css.includes('[data-change]::before{content:attr(data-change)')&&!/prefers-reduced-motion[^}]*\[data-change\]/.test(css),'focus label is static text');
console.log(`PASS: explorer focus on ${focused} steps; keys drawn, first steps unmarked, every later step authored, labels in print and without motion.`);
