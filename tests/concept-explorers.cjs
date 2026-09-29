const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const paths=require('../scripts/manifest.cjs').readPaths();let count=0,steps=0;
const controls={};const context={escapeText:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'),document:{getElementById:id=>controls[id]??=( {innerHTML:'',textContent:'',disabled:false,events:{},addEventListener(t,f){this.events[t]=f;}})}};
vm.createContext(context);vm.runInContext(fs.readFileSync('assets/js/learning-tools.js','utf8'),context);
for(const p of paths)for(const l of (Array.isArray(p.lessons)?p.lessons:[])){if(!l.visual)continue;count++;const v=l.visual;assert(v.title&&v.intro&&v.scope);assert(v.scenarios.length>=2);for(const s of v.scenarios){assert(s.steps.length>=3);for(const step of s.steps){steps++;assert(step.title&&step.explanation);const ids=new Set(step.nodes.map(n=>n.id));assert.equal(ids.size,step.nodes.length);for(const n of step.nodes){assert(n.x>=0&&n.x<=780&&n.y>=0&&n.y<=330);assert(['neutral','active','success','warning'].includes(n.tone));}for(const e of step.edges){assert(ids.has(e.from)&&ids.has(e.to));assert.notEqual(e.from,e.to);}for(const t of step.tables||[])for(const row of t.rows)assert.equal(row.length,t.columns.length);assert(!context.visualFrame(step,'test').includes('NaN'));}}
 context.bindVisualExplorer(l);const c=id=>controls['visual-'+id];assert(c('prev').disabled);assert(c('frame').innerHTML.includes(v.scenarios[0].steps[0].title));for(let i=1;i<v.scenarios[0].steps.length;i++)c('next').events.click();assert(c('next').disabled);c('prev').events.click();assert(!c('next').disabled);c('scenario').events.change({target:{value:'1'}});assert(c('prev').disabled);assert(c('frame').innerHTML.includes(v.scenarios[1].steps[0].title));c('next').events.click();c('reset').events.click();assert(c('prev').disabled);const pack=context.visualExplorerView(l,true);for(const s of v.scenarios)for(const step of s.steps)assert(pack.includes(context.escapeText(step.explanation)));assert(!pack.includes('id="visual-next"'));
}
const dsa=paths.find(p=>p.id==='data-structures-algorithms');for(const s of dsa.lessons.find(l=>l.id==='sorting').visual.scenarios)assert.deepEqual(s.steps.at(-1).nodes.map(n=>n.label),['1','2','3','4']);

const kube=paths.find(p=>p.id==='kubernetes').lessons.find(l=>l.id==='deployments').visual.scenarios[0];
const first=kube.steps[0],second=kube.steps[1],placed=context.visualLayout(first.nodes,first.edges);
assert.equal(placed.positions.a.x,placed.positions.b.x,'replica Pods share one level');
assert(placed.positions.b.x>placed.positions.rs.x,'replica Pods follow ReplicaSet');
assert(context.visualFrame(first,'sibling').includes('visual-level is-pair'));
assert(context.visualFrame(second,'changed',first).includes('is-changed'),'state changes are highlighted');
const lessonHtml=context.visualExplorerView({id:'deployments',visual:paths.find(p=>p.id==='kubernetes').lessons.find(l=>l.id==='deployments').visual});
assert(lessonHtml.indexOf('id="visual-frame"')>lessonHtml.indexOf('class="visual-controls"'));
assert(context.visualFrame(first,'order').indexOf('class="visual-diagram')<context.visualFrame(first,'order').indexOf('class="visual-explanation'),'diagram precedes explanation');
const decorator=paths.find(p=>p.id==='design-patterns').lessons.find(l=>l.id==='decorator').visual.scenarios[0].steps.find(s=>s.edges.some(e=>e.from==='2'&&e.to==='1'));
const cycleLayout=context.visualLayout(decorator.nodes,decorator.edges),cycleMarkup=context.visualFrame(decorator,'cycle');
assert(cycleLayout.positions['2'].x>cycleLayout.positions['1'].x,'feedback edge does not collapse rank');
assert.equal((cycleMarkup.match(/class="visual-edge"/g)||[]).length,decorator.edges.length,'feedback edges are rendered');
assert(!cycleMarkup.includes('NaN'));
const cycleBadgeY=[...cycleMarkup.matchAll(/class="visual-edge-number"><circle cx="[^"]+" cy="([^"]+)"/g)].map(m=>Number(m[1]));
assert(cycleBadgeY.every(y=>y+12<=cycleLayout.height),'feedback badges stay inside the SVG');
const wide={title:'Chain',explanation:'Four linked stages',nodes:[0,1,2,3].map(i=>({id:String(i),label:'Stage '+i,detail:'Detail',tone:'neutral'})),edges:[0,1,2].map(i=>({from:String(i),to:String(i+1),label:'next'}))};
assert(context.visualFrame(wide,'wide').includes('visual-diagram is-wide'),'wide graphs use the readable relationship view');
for(const p of paths)for(const l of (Array.isArray(p.lessons)?p.lessons:[]))if(l.visual)for(const scenario of l.visual.scenarios)for(const step of scenario.steps){const layout=context.visualLayout(step.nodes,step.edges);for(const n of step.nodes){assert(layout.positions[n.id].x+206<=layout.width);assert(layout.positions[n.id].y+90<=layout.height);}}
assert(fs.readFileSync('assets/css/concept-explorer.css','utf8').includes('.visual-scenario{display:none!important}'),'print hides interactive scenario selector');const beforeTable={title:'Rows',explanation:'Before',nodes:[],edges:[],tables:[{caption:'Rows',columns:['Value'],rows:[['A'],['B']]}]};
const afterTable={...beforeTable,tables:[{caption:'Rows',columns:['Value'],rows:[['A'],['C']]}]};
assert.equal((context.visualFrame(afterTable,'rows',beforeTable).match(/<tr class="is-changed">/g)||[]).length,1,'only changed table rows are highlighted');assert.equal(count,27);console.log(`PASS: ${count} visual explorers, ${steps} snapshots, scenario/previous/next/restart boundaries, printable content and sorting results.`);
