const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const paths=require('../scripts/manifest.cjs').readPaths();
let tasks=0,diagrams=0;
for(const p of paths.filter(p=>p.status==='ready')){
 const kit=p.resources;assert.ok(kit,p.id+' task kit');
 const ids=new Set(kit.files.map(f=>f.id));assert.equal(ids.size,kit.files.length);
 for(const f of kit.files){assert.ok(fs.existsSync(f.href));assert.ok(f.description&&f.role);}
 for(const t of kit.tasks){tasks++;assert.ok(t.steps.length);assert.ok(t.fileIds.length);t.fileIds.forEach(id=>assert.ok(ids.has(id)));for(const c of t.commands)assert.ok(c.command&&c.expected);}
 if(!Array.isArray(p.lessons))continue;
 for(const l of p.lessons){assert.ok(kit.tasks.some(t=>t.id===kit.lessonTasks[l.id]),p.id+'/'+l.id+' kit mapping');const d=l.diagram;if(!d)continue;diagrams++;const nodes=new Set(d.nodes.map(n=>n.id));assert.equal(nodes.size,d.nodes.length);assert.ok(d.title&&d.summary&&d.steps.length);for(const n of d.nodes)assert.ok(n.label&&n.description);for(const e of d.edges){assert.ok(nodes.has(e.from)&&nodes.has(e.to));assert.ok(e.label);}for(const s of d.steps){assert.ok(s.title&&s.explanation);s.activeNodes.forEach(n=>assert.ok(nodes.has(n)));s.activeEdges.forEach(i=>assert.ok(Number.isInteger(i)&&d.edges[i]));}}
}
const elements=new Map(),stored=new Map();
const element=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',addEventListener(type,fn){this[type]=fn;},querySelectorAll(){return [];}});return elements.get(id);};
const context={LEARNING_PATHS:paths,document:{getElementById:element},location:{hash:'#resources/python/foundation'},window:{addEventListener(){},scrollTo(){}},localStorage:{getItem:k=>stored.get(k)||null,setItem:(k,v)=>stored.set(k,v)}};
vm.createContext(context);vm.runInContext(fs.readFileSync('assets/js/learning-tools.js','utf8')+'\n'+fs.readFileSync('assets/js/catalog.js','utf8'),context);
for(const p of paths.filter(p=>p.status==='ready'))for(const t of p.resources.tasks){context.location.hash='#resources/'+p.id+'/'+t.id;vm.runInContext('renderCatalog()',context);const html=element('main').innerHTML;assert.ok(html.includes(p.resources.bundle.href));for(const f of p.resources.files.filter(f=>t.fileIds.includes(f.id)))assert.ok(html.includes(f.href));assert.ok(html.includes('Expected:')||t.commands.length===0);}
// Simple diagrams are explained once, without step controls.
context.location.hash='#topic/python/values-and-names';context.renderCatalog();
assert.ok(element('main').innerHTML.includes('Stage project:'));
assert.ok(element('main').innerHTML.includes('How it works'));
assert.ok(!element('main').innerHTML.includes('id="diagram-next"'));
// More involved diagrams keep an opt-in walkthrough with working boundaries.
const complexPath=paths.find(p=>Array.isArray(p.lessons)&&p.lessons.some(l=>l.diagram&&context.diagramHasSteps(l.diagram)));
const complexLesson=complexPath.lessons.find(l=>l.diagram&&context.diagramHasSteps(l.diagram));
const controls={open:true,addEventListener(type,fn){this[type]=fn;}};
element('main').querySelector=()=>controls;
context.location.hash='#topic/'+complexPath.id+'/'+complexLesson.id;context.renderCatalog();controls.toggle();
assert.ok(element('diagram-prev').disabled);element('diagram-next').click();
assert.ok(element('diagram-step').innerHTML.includes('Step 2 of'));assert.equal(element('diagram-prev').disabled,false);
context.location.hash='#topic/python/values-and-names';context.renderCatalog();
context.location.hash='';vm.runInContext('renderCatalog()',context);assert.ok(element('main').innerHTML.includes('Continue 2. Values'));element('path-search').input({target:{value:'Python'}});const count=paths.filter(p=>[p.title,p.category,p.description].join(' ').toLowerCase().includes('python')).length;assert.equal(element('path-count').textContent,`${count} matching paths · ${paths.length} total`);
console.log(`PASS: ${tasks} task routes, ${diagrams} diagram relationships, step controls, resume and live search counts.`);

for(const p of paths.filter(p=>p.status==='ready'&&Array.isArray(p.lessons)&&!p.href)){
 context.location.hash='#path/'+p.id;context.renderCatalog();
 assert.ok(element('main').innerHTML.includes('class="course-current" aria-current="page">Course overview'),p.id+' overview marks current page');
 assert.ok(!element('main').innerHTML.includes('<a href="#path/'+p.id+'">Course overview</a>'),p.id+' overview avoids a misleading self-link');
 context.location.hash='#topic/'+p.id+'/'+p.lessons[0].id;context.renderCatalog();
 assert.ok(element('main').innerHTML.includes('<a href="#path/'+p.id+'">Course overview</a>'),p.id+' lesson retains working overview link');
 assert.ok(!element('main').innerHTML.includes('class="course-current"'),p.id+' lesson is not the overview');
}
console.log('PASS: course overviews identify the current page; lessons link back to their overview.');
