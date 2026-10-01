const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const paths=require('../scripts/manifest.cjs').readPaths();
const nodes=new Map(),store=new Map(),preferences=new Map();
function node(id){if(!nodes.has(id))nodes.set(id,{value:'',innerHTML:'',textContent:'',hidden:false,listeners:{},addEventListener(type,fn){this[type]=fn;(this.listeners[type]??=[]).push(fn);},querySelectorAll(){return [];}});return nodes.get(id);}
const ctx={LEARNING_PATHS:paths,document:{getElementById:node},window:{addEventListener(){},scrollTo(){}},location:{hash:''},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},sessionStorage:{getItem:k=>preferences.get(k)||null,setItem:(k,v)=>preferences.set(k,v)}};
vm.createContext(ctx);vm.runInContext(['library-map','learning-tools','catalog'].map(f=>fs.readFileSync('assets/js/'+f+'.js','utf8')).join('\n'),ctx);
// Exercise both real input listeners, including count/list and map updates.
for(const query of [' Kubernetes ','\tKuBeRnEtEs\n']){
 const input=node('path-search');input.value=query;
 for(const listener of input.listeners.input)listener({target:input});
 assert.ok(node('learning-map').innerHTML.includes('#path/kubernetes'));
 assert.ok(node('path-list').innerHTML.includes('#path/kubernetes'));
 assert.equal(node('path-count').textContent,'1 matching paths · '+paths.length+' total');
}
const input=node('path-search');input.value='   ';
for(const listener of input.listeners.input)listener({target:input});
assert.equal(node('path-count').textContent,paths.length+' paths shown · '+paths.length+' total');
const html=node('main').innerHTML;assert.ok(html.includes('Your learning map'));assert.ok(html.includes(paths.reduce((sum,p)=>sum+(Array.isArray(p.lessons)?p.lessons.length:Number(p.lessons)||0),0)+' lessons'));
for(const p of paths.filter(p=>p.status==='ready'))assert.ok(html.includes(p.href||'#path/'+p.id),p.id);
const buttons=['map','list'].map(view=>({dataset:{libraryView:view},setAttribute(k,v){this[k]=v;},addEventListener(k,v){this[k]=v;}}));
ctx.bindLibraryMap({querySelectorAll:()=>buttons});buttons[1].click();assert.equal(node('learning-map').hidden,true);assert.equal(node('path-list').hidden,false);assert.equal(buttons[1]['aria-pressed'],'true');ctx.bindLibraryMap({querySelectorAll:()=>buttons});assert.equal(node('learning-map').hidden,true,'View preference survives returning');buttons[0].click();assert.equal(node('path-list').hidden,true);
assert.ok(ctx.libraryMap('zz_absent').includes('No matching paths'));assert.ok(!ctx.libraryMap('zz_absent').includes('map-node'));assert.ok(ctx.libraryMap('SQL').includes('#path/sql-server'));
store.set('learning-notebook:path:python:v1',JSON.stringify(['run-a-program','run-a-program','unknown']));assert.equal(ctx.libraryProgress(paths.find(p=>p.id==='python')).done,1);
store.set('valuation-lab-v1',JSON.stringify({done:[1,1,19],starterDone:[1,7]}));assert.equal(ctx.libraryProgress(paths.find(p=>p.id==='financial-foundations')).done,2);
ctx.LEARNING_PATHS.push({id:'new-path',title:'New subject',status:'ready',category:'Other',description:'Future learning',lessons:[]});assert.ok(ctx.libraryMap().includes('#path/new-path'));
console.log('PASS: visual map course coverage, filtering, progress integrity, map/list switching and session preference.');

const roadmap=ctx.libraryMap();
assert.equal((roadmap.match(/class="map-node"/g)||[]).length,paths.filter(p=>p.status==='ready').length,'Each ready course including the new path appears once');
assert.equal((roadmap.match(/marker-end=/g)||[]).length,vm.runInContext('LIBRARY_GRAPHS.reduce((n,g)=>n+g.edges.filter(([a,b])=>LEARNING_PATHS.some(p=>p.id===a&&p.status==="ready")&&LEARNING_PATHS.some(p=>p.id===b&&p.status==="ready")).length,0)',ctx),'All available graph relationships render');
assert.ok(roadmap.includes('aria-label="Course relationships"'),'Relationships have a visible text equivalent');
for(const label of ['Suggested order','Useful background','Alternative direction'])assert.ok(roadmap.includes('<dt>'+label+'</dt>'));
const graph=vm.runInContext('LIBRARY_GRAPHS.find(g=>g.id==="programming")',ctx);
assert(!graph.edges.some(([a,b])=>a==='data-structures-algorithms'&&b==='design-patterns'),'Design patterns does not imply an algorithms prerequisite');
assert(graph.edges.some(([a,b,type])=>a==='python'&&b==='design-patterns'&&type==='alternative'));
assert(roadmap.includes('class="relationship-background" d='));
assert(roadmap.includes('class="relationship-alternative" d='));
assert.ok(!ctx.libraryMap('Python').includes('marker-end='),'Filtering never implies relationships between missing nodes');
assert.equal((ctx.libraryMap('Python').match(/class="map-node"/g)||[]).length,new Set(paths.filter(p=>p.status==='ready'&&[p.title,p.category,p.description].join(' ').toLowerCase().includes('python')).map(p=>p.id)).size);
console.log('PASS: unique roadmap nodes, directed connections, accessible relationship text and filtered graph fallback.');

for(const render of [ctx.cards,ctx.libraryMap]){
 const filtered=render('Python');
 assert(filtered.indexOf('#path/python') < filtered.indexOf('#path/agent-harnesses'),'Exact course title precedes matches in descriptions');
}

// Focusing a route preserves its relationships; search temporarily spans all routes.
node('map-route').value='programming';node('map-route').change();
assert(node('learning-map').innerHTML.includes('#path/python-problem-solving'));
assert(!node('learning-map').innerHTML.includes('#path/sql-server'));
assert.equal(preferences.get('learning-notebook:map-route'),'programming');
input.value='SQL';for(const listener of input.listeners.input)listener({target:input});
assert(node('learning-map').innerHTML.includes('#path/sql-server'));
assert.equal(node('map-route').disabled,true);
input.value='';for(const listener of input.listeners.input)listener({target:input});
assert(!node('learning-map').innerHTML.includes('#path/sql-server'));
assert.equal(node('map-route').disabled,false);
node('map-route').value='independent';node('map-route').change();
assert(node('learning-map').innerHTML.includes('course.html'));
assert(!node('learning-map').innerHTML.includes('#path/python'));
preferences.set('learning-notebook:map-route','invalid');ctx.bindLibraryMap({querySelectorAll:()=>buttons});
assert.equal(node('map-route').value,'all');
console.log('PASS: focused routes, global search, restored selection and invalid preference fallback.');
