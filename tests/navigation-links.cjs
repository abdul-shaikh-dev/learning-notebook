require('./escape-context.cjs');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
process.chdir(process.env.LEARNING_REPO||path.resolve(__dirname,'..'));
const paths=require(path.resolve('scripts/manifest.cjs')).readPaths(),nodes=new Map();
const node=id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',value:'',addEventListener(){},querySelectorAll(){return [];}});return nodes.get(id);};
const ctx={LEARNING_PATHS:paths,document:{getElementById:node,querySelector:node,querySelectorAll:()=>[],addEventListener(){}},window:{addEventListener(){},scrollTo(){}},location:{hash:''},localStorage:{getItem:()=>null,setItem(){}},setTimeout(){},Intl};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('assets/js/library-map.js','utf8')+'\n'+fs.readFileSync('assets/js/learning-tools.js','utf8')+'\n'+fs.readFileSync('assets/js/catalog.js','utf8'),ctx);
let pages=0,links=0;const financeHashes=new Set();
function catalogHash(hash){if(!hash||['#','#main','#search','#backup'].includes(hash))return;const [route,id,item]=hash.slice(1).split('/');const p=paths.find(p=>p.id===id);assert.ok(p,hash);if(route==='resources'){assert.ok(p.resources);if(item)assert.ok(p.resources.tasks.some(t=>t.id===item),hash);}else if(route==='glossary')assert.ok(p.glossary,hash);else{assert.ok(['path','topic','pack'].includes(route)&&Array.isArray(p.lessons),hash);if(route==='topic')assert.ok(p.lessons.some(l=>l.id===item),hash);}}
function audit(html,finance=false){pages++;const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,'Duplicate ID on page');for(const m of html.matchAll(/\bhref="([^"]+)"/g)){links++;const href=m[1].replaceAll('&amp;','&');if(/^(https?:|mailto:|data:)/.test(href))continue;if(href.startsWith('#')){if(finance)financeHashes.add(href);else catalogHash(href);continue;}const [file,hash]=href.split('#');assert.ok(fs.existsSync(file.split('?')[0]),href);if(hash){if(file==='index.html')catalogHash('#'+hash);else if(file==='course.html')financeHashes.add('#'+hash);}}for(const m of html.matchAll(/data-jump="([^"]+)"/g))assert.ok(ids.includes(m[1]),'Missing jump target '+m[1]);}
for(const p of paths.filter(p=>p.status==='ready')){for(const hash of [...(p.glossary?['#glossary/'+p.id]:[]),'#resources/'+p.id,...p.resources.tasks.map(t=>'#resources/'+p.id+'/'+t.id),...(Array.isArray(p.lessons)?['#path/'+p.id,'#pack/'+p.id,...p.lessons.map(l=>'#topic/'+p.id+'/'+l.id)]:[])]){ctx.location.hash=hash;vm.runInContext('renderCatalog()',ctx);audit(node('main').innerHTML);}}
ctx.location.hash='';vm.runInContext('renderCatalog()',ctx);audit(node('main').innerHTML);for(const query of ['',...paths.map(p=>p.title),'no matching course zzz'])audit(vm.runInContext('cards('+JSON.stringify(query)+')',ctx));
audit(fs.readFileSync('index.html','utf8'));
const course=fs.readFileSync('course.html','utf8');audit(course,true);
const finance=vm.createContext({...ctx,URL,document:{...ctx.document,currentScript:{src:"https://example.test/assets/js/notebook-mermaid.js"}}});for(const m of course.matchAll(/<script src="([^"]+)"/g)){const file=m[1].split('?')[0];if(file==='assets/js/escape-text.js')continue;let source=fs.readFileSync(file,'utf8');if(file.endsWith('/app.js'))source=source.split('\ndocument.addEventListener')[0];vm.runInContext(source,finance);}
const data=vm.runInContext('({FINANCE_COURSE,EXERCISES,LABS,CASE_STEPS,TRADE_JOURNEY,VISUAL_STORIES})',finance);
assert.equal(data.FINANCE_COURSE.lessons.length,32,'The studio loads the shared course data');
// Lessons, introductions, foundation explainers, the glossary and sources are on the shared course page (audited above).
const calls=['courseOverview()','practiceView()','practiceView("revision")',...data.EXERCISES.modules.map(l=>`practiceView(${JSON.stringify(l.id)})`),...Object.keys(data.LABS).map(id=>`labsView(${JSON.stringify(id)})`),...data.CASE_STEPS.map((_,i)=>`caseView(${i})`),...data.TRADE_JOURNEY.map(l=>`journeyView(${JSON.stringify(l.id)})`),...data.VISUAL_STORIES.map(s=>s.id).map(id=>`visualView(${JSON.stringify(id)})`)];
for(const call of calls)audit(vm.runInContext(call,finance),true);
const search=vm.runInNewContext(fs.readFileSync('content/search.js','utf8')+';NOTEBOOK_SEARCH').entries;for(const [,,,href] of search)audit('<a href="'+href+'">result</a>');
for(const hash of financeHashes){const [route,id]=hash.slice(1).split('/');if(['main','explore'].includes(route)){assert.ok(!id,hash);continue;}const valid={practice:[...data.EXERCISES.modules.map(l=>l.id),'revision'],labs:Object.keys(data.LABS),case:data.CASE_STEPS.map((_,i)=>String(i)),journey:data.TRADE_JOURNEY.map(l=>l.id),visual:data.VISUAL_STORIES.map(s=>s.id)};assert.ok(valid[route],hash);if(id)assert.ok(valid[route].includes(id),hash);}
for(const p of paths)for(const f of p.resources?.files||[])assert.ok(p.publicFiles.includes(f.href.replace('paths/'+p.id+'/','')), 'File omitted from published inventory: '+f.href);
// #160: courses named in prerequisites and next steps are {path:id|label} references to existing courses, rendered as
// links and as "Recommended before" / "Next" chips; no course is left named as plain text.
let references=0;const ready=new Set(paths.filter(p=>p.status==='ready').map(p=>p.id));
for(const p of paths)for(const field of ['prerequisites','nextSteps'])for(const text of p[field]||[]){
 for(const m of text.matchAll(/\{path:([^}|]*)(?:\|([^}]*))?\}/g)){references++;assert.ok(ready.has(m[1])&&m[1]!==p.id,p.id+' '+field+' names an unknown course: '+m[1]);assert.ok(m[2]===undefined||m[2].trim(),p.id+': empty label');}
 const rest=text.replace(/\{path:[^}]*\}/g,'');assert.ok(!/[{}]/.test(rest),p.id+': malformed course reference in '+text);
 for(const c of paths)if(c.id!==p.id)assert.ok(!rest.includes('('+c.id+')')&&!(c.title.length>8&&rest.includes(c.title))&&!new RegExp('\b'+c.title.split(' ')[0]+' (path|paths)\b').test(rest),p.id+' '+field+' names '+c.title+' without a link: '+text);
 if(/\b(path|paths)\b/.test(rest)&&!/\{path:/.test(text)&&/\b(the|existing|neighboring) [A-Z]/.test(rest))assert.fail(p.id+': a course is named without a link: '+text);}
assert.ok(references>=40,'course references: '+references);
ctx.location.hash='#path/kubernetes';vm.runInContext('renderCatalog()',ctx);
const overview=node('main').innerHTML;
assert.ok(overview.includes('<nav class="course-relations" aria-label="Related courses"><p><span class="course-relations-label">Recommended before</span><a class="course-chip" href="#path/delivery-operations">Delivery &amp; Operations</a>'),'Kubernetes recommends Delivery & Operations first');
assert.ok(overview.includes('first; <a href="#path/react">React</a>, <a href="#path/dotnet">.NET</a>'),'References render as links with their labels');
assert.ok(!overview.includes('{path:'),'No reference marker reaches the page');
console.log(`PASS: ${references} course references link to real courses. ${pages} rendered/search/static entries, ${links} links, ${search.length} search destinations, ${financeHashes.size} finance targets; no missing local/published files, invalid routes, duplicate IDs or missing jump targets.`);
