const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const paths=require('../scripts/manifest.cjs').readPaths().filter(p=>Array.isArray(p.lessons));
const nodes=new Map(),saved=new Map();
const node=id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',addEventListener(t,fn){this[t]=fn;},querySelectorAll(){return [];}});return nodes.get(id);};
const ctx={LEARNING_PATHS:paths,document:{getElementById:node},location:{hash:''},window:{addEventListener(){},scrollTo(){}},localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('assets/js/learning-tools.js','utf8')+'\n'+fs.readFileSync('assets/js/catalog.js','utf8'),ctx);const escapeText=vm.runInContext('escapeText',ctx);
// One action records only the current lesson and moves forward without requiring a quiz.
const p=paths.find(p=>p.id==='python'),first=p.lessons[0],key='learning-notebook:path:python:v1';
ctx.location.hash='#topic/python/'+first.id;ctx.renderCatalog();
assert(!saved.has(key),'Opening a lesson does not complete it');
node('read-next').click();assert.equal(ctx.location.hash,'#topic/python/'+p.lessons[1].id);assert.deepEqual(JSON.parse(saved.get(key)),[first.id]);
ctx.location.hash='#topic/python/'+first.id;ctx.renderCatalog();node('read-next').click();assert.deepEqual(JSON.parse(saved.get(key)),[first.id],'Re-reading never duplicates progress');
ctx.location.hash='#topic/python/'+p.lessons.at(-1).id;ctx.renderCatalog();node('read-next').click();assert.equal(ctx.location.hash,'#path/python');
ctx.location.hash='#topic/python/'+p.lessons[2].id;ctx.renderCatalog();ctx.localStorage.setItem=()=>{throw Error('unavailable');};node('read-next').click();assert.equal(ctx.location.hash,'#topic/python/'+p.lessons[2].id);assert.match(node('save-status').textContent,/could not be saved/);ctx.localStorage.setItem=(k,v)=>saved.set(k,v);
let diagrams=0,visuals=0;
for(const p of paths){
 ctx.location.hash='#path/'+p.id;ctx.renderCatalog();const overview=node('main').innerHTML;
 assert(!overview.includes('class="stage-jumps"'),p.id+' has one stage navigation');
 assert(!overview.includes('atlas-visual-shelf'),p.id+' avoids a duplicate lesson directory');
 assert(overview.includes('<h2>What you will learn</h2>'));
 for(const l of p.lessons){
  if(l.diagram){diagrams++;const html=ctx.diagramView(l);assert(html.includes('<section class="walkthrough-reading">'));assert(!html.includes('<summary>Read all diagram steps'));for(const step of l.diagram.steps)assert(html.includes(escapeText(step.explanation)));}
  if(l.visual){visuals++;const html=ctx.visualExplorerView(l);assert(html.includes('id="visual-walkthrough"'));for(const step of l.visual.scenarios[0].steps)assert(html.includes(escapeText(step.explanation)));}
  const t=ctx.taskForLesson(p,l);const kit=ctx.taskKit(p,t,true);assert(!kit.startsWith('<details'));assert(kit.includes(p.resources.bundle.href));assert(kit.includes('#resources/'+p.id+'/'+t.id));
 }
}
const finance=fs.readFileSync('paths/financial-foundations/runtime/app.js','utf8');
const fn=finance.slice(finance.indexOf('function lessonBody'),finance.indexOf('function moduleList'));
const fctx={};vm.createContext(fctx);vm.runInContext(fn,fctx);const body=fctx.lessonBody({id:1,take:'Idea',body:['Concept'],example:{title:'Example',text:'Numbers',explain:'Explanation'},deep:'Mechanism',data:'Records',pitfall:'Trap'});
assert(body.includes('<section id="deeper">'));assert(body.includes('<section id="systems">'));assert(!body.includes('<details id="deeper"'));
for(const p of paths)for(const l of p.lessons)for(const s of l.sections)if(s.example)assert.notEqual(s.example,l.exercise?.solution,p.id+'/'+l.id+' teaches with a different example before its exercise');
const saveCode=finance.slice(finance.indexOf('function save()'),finance.indexOf('function progress()'));
const recovery={localStorage:{setItem(){throw Error('blocked');}}};vm.createContext(recovery);vm.runInContext("const KEY='test';let state={},storageOK=true;function progress(){}\n"+saveCode,recovery);recovery.save();assert.equal(vm.runInContext('storageOK',recovery),false);recovery.localStorage.setItem=()=>{};recovery.save();assert.equal(vm.runInContext('storageOK',recovery),true);
console.log(`PASS: reading continuation, storage failure, ${paths.length} course overviews, ${diagrams} visible diagram narratives, ${visuals} readable motion scenarios and direct task links.`);

for(const p of paths)for(const l of p.lessons)if(l.diagram){
 const screen=ctx.diagramView(l),print=ctx.diagramView(l,true);
 assert.match(screen,/<details class="mermaid-text" data-diagram-alternative>/,'Screen alternative starts collapsed');
 assert(!print.includes('<summary>Full diagram description'),'Print does not hide the alternative in a disclosure');
}
// The lesson leads with its title: one compact course menu, a reading bar and a named next step.
{const l=p.lessons[2];ctx.location.hash='#topic/python/'+l.id;ctx.renderCatalog();const html=node('main').innerHTML,article=html.slice(html.indexOf('<article class="reading">'));
 assert(!article.includes('class="course-tools"'),'No row of course buttons above the lesson');
 assert(article.indexOf('<details class="course-menu">')<article.indexOf('<h1>'),'The course menu sits on the meta line before the title');
 assert.equal((html.match(/class="course-menu"/g)||[]).length,1,'One course control');
 const menu=article.slice(article.indexOf('<details class="course-menu">'),article.indexOf('</details>')+10);
 for(const href of ['#path/python','offline.html?course=python',...p.lessons.map(item=>'#topic/python/'+item.id)])assert(menu.includes('href="'+href+'"'),'Menu links '+href);
 assert(menu.includes('aria-current="page">'+escapeText(l.title)),'Menu marks the current lesson');
 for(const [i] of l.sections.entries())assert(menu.includes('data-jump="lesson-section-'+i+'"'),'Menu lists each section for narrow screens');
 assert(html.startsWith('<div class="reading-progress" aria-hidden="true"><span></span></div>'),'Decorative reading bar');
 assert(article.includes('Read &amp; continue')||article.includes('Read & continue'));
 assert(article.includes('<small class="next-title">Next: '+escapeText(p.lessons[3].title)+'</small>'),'The main next step names the next lesson');
 ctx.location.hash='#topic/python/'+p.lessons.at(-1).id;ctx.renderCatalog();assert(!node('main').innerHTML.includes('next-title'),'The last lesson has no next title');}
console.log('PASS: lesson pages lead with the title, one course menu with sections and lessons, a decorative reading bar and a named next lesson.');
