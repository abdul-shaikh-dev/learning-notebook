// Feature checklist for the move of Financial foundations onto the shared course page (issue #70):
// every lesson, quiz, diagram, explainer, advanced section, reference, glossary entry, source record and
// practice activity of the original reader has a home, old links still arrive, and saved reading carries over.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');process.chdir(root);
const {FINANCE_LEGACY:F}=require('../assets/js/finance-legacy.js');
const paths=require('../scripts/manifest.cjs').readPaths(),p=paths.find(x=>x.id==='financial-foundations');

// The generated course files match the finance content they come from.
const sync=cp.spawnSync(process.execPath,['scripts/sync-finance-lessons.cjs','--check'],{encoding:'utf8'});assert.equal(sync.status,0,sync.stderr);

const c={document:{addEventListener(){}},window:{addEventListener(){}}};vm.createContext(c);
for(const f of ['curriculum','source-register','starter','foundations','advanced','exercises','journey','activities','diagrams'])vm.runInContext(fs.readFileSync('paths/financial-foundations/content/'+f+'.js','utf8').replace(/^const /gm,'var '),c);
// Plain copies, so comparisons do not depend on the vm realm's arrays.
for(const k of ['STARTER','FOUNDATIONS','LESSONS','ADVANCED','FINANCE_DIAGRAMS','GLOSSARY','STARTER_TERMS','QUICK','SOURCES','SOURCE_REGISTER','LESSON_REFERENCES','LABS','TRADE_JOURNEY','EXERCISES'])c[k]=JSON.parse(JSON.stringify(c[k]));
c.VISUAL_STORIES=vm.runInNewContext('('+fs.readFileSync('paths/financial-foundations/runtime/visual-stories.js','utf8').match(/^const VISUAL_STORIES\s*=\s*(\[[\s\S]*?\]);$/m)[1]+')');

// Lessons: six introductions, eight explainers and eighteen main lessons, in reading order, under the old ids' new names.
const byId=new Map(p.lessons.map(l=>[l.id,l]));
assert.equal(p.status,'ready');assert.ok(!p.href,'The shared course page is the reader');
assert.deepEqual(p.lessons.map(l=>l.id),[...F.start,...c.FOUNDATIONS.map(f=>F.foundations[f.id]),...F.main]);
assert.deepEqual(p.stages.map(s=>s.id),['start','foundation-explainers',...Object.values(F.stages)]);
const text=l=>JSON.stringify(l.sections);
const renumbered=s=>s.replace(/\blesson (\d+)\b/g,(m,n)=>'lesson '+(14+Number(n)));
c.STARTER.forEach((s,i)=>{const l=byId.get(F.start[i]);assert.equal(l.stage,'start');assert.equal(l.takeaway,s.take);assert.equal(l.minutes,s.minutes);
 for(const t of [...s.paragraphs,s.example,s.connection])assert.ok(text(l).includes(JSON.stringify(t).slice(1,-1)),l.id);
 assert.deepEqual(l.quiz,{question:s.quiz.q,options:s.quiz.options,correct:s.quiz.correct,explanation:s.quiz.explain});});
c.FOUNDATIONS.forEach(f=>{const l=byId.get(F.foundations[f.id]);assert.equal(l.stage,'foundation-explainers');
 for(const t of [...f.paragraphs.map(renumbered),f.example])assert.ok(text(l).includes(JSON.stringify(t).slice(1,-1)),l.id);
 assert.equal(l.exercise.prompt,'Try explaining: '+f.check);assert.equal(l.exercise.solution,f.answer);});
c.LESSONS.forEach((m,i)=>{const l=byId.get(F.main[i]);assert.equal(l.stage,F.stages[m.phase]);assert.equal(l.takeaway,m.take);assert.equal(l.minutes,m.minutes);
 for(const t of [m.teaser,...m.body,m.example.text,m.example.explain,m.deep,m.data,m.pitfall].map(renumbered))assert.ok(text(l).includes(JSON.stringify(t).slice(1,-1)),l.id+': '+t.slice(0,40));
 assert.deepEqual(l.quiz,{question:m.quiz.q,options:m.quiz.options,correct:m.quiz.correct,explanation:m.quiz.explain});
 // References: each original source, its paragraph pointer and its register check date.
 assert.deepEqual(l.references.map(r=>r.url),m.sources.map(id=>c.SOURCES.find(s=>s.id===id).url));
 for(const r of l.references){assert.equal(r.section,c.LESSON_REFERENCES[i+1]||'Conceptual foundations; use the sources for context.');assert.equal(r.reviewed,c.SOURCE_REGISTER.find(s=>s.url===r.url).checkedDate);}
 // Related foundation explainers are linked by lesson number.
 for(const f of c.FOUNDATIONS.filter(f=>f.lessons.includes(i+1)))assert.ok(text(l).includes('lesson '+(7+c.FOUNDATIONS.indexOf(f))+' ('+f.title+')'),l.id);});
// Advanced sections keep their text, example and dated evidence.
for(const a of c.ADVANCED){const s=byId.get(F.main[a.lessonId-1]).sections.find(s=>s.title===a.title);assert.ok(s,a.title);assert.deepEqual(s.paragraphs,a.paragraphs.map(renumbered));assert.equal(s.example,a.example);
 assert.deepEqual(s.evidence.map(e=>[e.label,e.url,e.paragraph,e.checked]),a.citations.map(x=>[x.label,x.url,x.paragraph,x.checkedDate||'2026-09-26']));}
// Diagrams: every original diagram is attached to a lesson, with the flow-as-text toggles kept.
const diagrams=p.lessons.filter(l=>l.diagram);for(const [key,d] of Object.entries(c.FINANCE_DIAGRAMS))assert.ok(diagrams.some(l=>l.diagram.title===d.title&&JSON.stringify(l.diagram.nodes)===JSON.stringify(d.nodes)),key);
assert.deepEqual(byId.get(F.main[3]).diagram.textExampleSections,[1]);assert.deepEqual(byId.get(F.start[2]).diagram.textExampleSections,[1]);
// Glossary, formula card, questions, scope notes and plain-language words.
assert.deepEqual(p.glossary.terms.map(t=>[t.term,t.definition]),c.GLOSSARY);assert.deepEqual(p.glossary.plainTerms.map(t=>[t.term,t.definition]),c.STARTER_TERMS);
assert.deepEqual(p.glossary.reference[0].rows,c.QUICK);assert.equal(p.glossary.reference[1].items.length,8);assert.ok(p.glossary.reference[2].items.some(t=>t.startsWith('Publication date is not effective date')));
// Sources keep their notes and every source-register field.
assert.deepEqual(p.sources.map(s=>[s.title,s.url,s.note]),c.SOURCES.map(s=>[s.title,s.url,s.note]));
for(const s of p.sources){const r=c.SOURCE_REGISTER.find(x=>x.url===s.url);assert.deepEqual([s.checked,s.access,s.changeTrigger],[r.checkedDate,r.access,r.changeTrigger]);}
// Practice studio: every lab, visual story, journey stage and practice module is linked from a lesson or the course.
const links=[...p.activities,...p.lessons.flatMap(l=>l.activities||[])].map(a=>a.href);
for(const id of Object.keys(c.LABS))assert.ok(links.includes('course.html#labs/'+id),id);
for(const s of c.VISUAL_STORIES)assert.ok(links.includes('course.html#visual/'+s.id),s.id);
for(const s of c.TRADE_JOURNEY)assert.ok(links.includes('course.html#journey/'+s.id),s.id);
for(const m of c.EXERCISES.modules.filter(m=>m.id!=='integrated-investigations'))assert.ok(links.includes('course.html#practice/'+m.id),m.id);
for(const href of ['course.html#practice','course.html#practice/revision','course.html#case','course.html#labs','handbook.html'])assert.ok(links.includes(href),href);
console.log('PASS: finance course data: 32 lessons, 24 quizzes, '+c.ADVANCED.length+' evidence sections, '+Object.keys(c.FINANCE_DIAGRAMS).length+' diagrams, glossary, source register and every studio activity.');

// Shared page: lesson, glossary and printed pack carry the finance features.
const nodes=new Map(),store=new Map();const node=id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',value:'',addEventListener(){},querySelectorAll(){return [];}});return nodes.get(id);};
const replaced=[];const ctx={LEARNING_PATHS:paths,FINANCE_LEGACY:F,document:{getElementById:node},location:{hash:'',replace:url=>replaced.push(url)},window:{addEventListener(){},scrollTo(){}},localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('assets/js/learning-tools.js','utf8')+'\n'+fs.readFileSync('assets/js/catalog.js','utf8'),ctx);
const show=hash=>{ctx.location.hash=hash;vm.runInContext('renderCatalog()',ctx);return node('main').innerHTML;};
let html=show('#topic/financial-foundations/'+F.main[0]);
for(const want of ['Lesson 15 of 32 · 8 min','The concept','Worked example: One position, four different numbers','Go deeper','Data &amp; systems','Common trap','Related foundations','See this idea in motion: A trade becomes a position','Explore the related lab: Bond value','Follow one trade: Build the position','Apply this module','Words for this lesson','Check your understanding','Sources & version notes for this lesson'])assert.ok(html.includes(want),want);
assert.ok(html.includes('<a href="course.html#labs/bond">'),'Studio links open the studio');
html=show('#topic/financial-foundations/'+F.main[1]);assert.ok(html.includes('Evidence for this section')&&html.includes('Choose the market before measuring the price'),'Advanced section with evidence');
html=show('#topic/financial-foundations/'+F.main[3]);assert.ok(html.includes('View this flow as a diagram')&&html.includes('id="lesson-diagram"'),'Diagram with its flow text alternative');
html=show('#glossary/financial-foundations');for(const want of ['Formula card','Questions worth asking at work','Scope and limits','Plain-language words'])assert.ok(html.includes(want),want);
html=show('#path/financial-foundations');for(const want of ['Practice studio','Follow one trade','Complete printable handbook','Source register: editions, checks and review triggers'])assert.ok(html.includes(want),want);
html=show('#pack/financial-foundations');assert.equal((html.match(/<article id="pack-(?!glossary)/g)||[]).length,32);for(const want of ['id="pack-glossary"','Evidence for this section','Practice studio','handbook.html'])assert.ok(html.includes(want),want);
console.log('PASS: shared course page shows finance lessons with diagrams, evidence, word help and studio links; glossary, overview and printed pack.');

// Old links: every lesson, introduction and explainer address of the original reader reaches its new lesson.
for(let n=1;n<=18;n++)assert.ok(byId.has(F.route('lesson',String(n)).split('/').pop()),'lesson '+n);
for(let n=1;n<=6;n++)assert.ok(byId.has(F.route('start',String(n)).split('/').pop()),'start '+n);
for(const f of c.FOUNDATIONS)assert.ok(byId.has(F.route('foundations',f.id).split('/').pop()),f.id);
assert.equal(F.route('labs','bond'),null,'Studio routes stay in the studio');
show('#lesson/3');assert.equal(replaced.at(-1),'#topic/financial-foundations/'+F.main[2]);show('#reference');assert.equal(replaced.at(-1),'#glossary/financial-foundations');show('#labs/ipv');assert.equal(replaced.at(-1),'course.html#labs/ipv');
// The studio page loads the link map before its app, and the notebook page before its router.
for(const file of ['course.html','index.html']){const page=fs.readFileSync(file,'utf8');assert.ok(page.indexOf('assets/js/finance-legacy.js')>-1&&page.indexOf('assets/js/finance-legacy.js')<page.indexOf(file==='course.html'?'runtime/app.js':'assets/js/catalog.js'),file);}
for(const f of ['curriculum','starter','foundations','advanced','source-register','exercises','activities','lab-guides','practice-data','journey'])assert.ok(fs.readFileSync('handbook.html','utf8').includes('content/'+f+'.js'),'Handbook still prints '+f);
console.log('PASS: old lesson, introduction, explainer and reference links reach the shared page; studio links stay; the handbook keeps its content.');

// Saved reading from the old reader joins the shared reading list once and is not re-added after being cleared.
const mem=new Map([['valuation-lab-v1',JSON.stringify({done:[1,3,3,19,'x'],starterDone:[2],answers:{1:2},last:3,study:{foundations:{practised:true,checked:true}}})],['learning-notebook:path:financial-foundations:v1',JSON.stringify([F.main[0],'kept'])]]);
const storage={getItem:k=>mem.get(k)??null,setItem:(k,v)=>mem.set(k,v)};
assert.equal(F.migrate(storage),true);
assert.deepEqual(JSON.parse(mem.get('learning-notebook:path:financial-foundations:v1')),[F.main[0],'kept',F.start[1],F.main[2]]);
assert.deepEqual(JSON.parse(mem.get('valuation-lab-v1')),{done:[],starterDone:[],answers:{1:2},last:3,study:{foundations:{practised:true,checked:true}}});
mem.set('learning-notebook:path:financial-foundations:v1','[]');assert.equal(F.migrate(storage),false);assert.equal(mem.get('learning-notebook:path:financial-foundations:v1'),'[]','A lesson marked unread stays unread');
for(const bad of [null,'{bad','[]','{"done":"x"}'])assert.equal(F.migrate({getItem:()=>bad,setItem(){throw Error('no write expected');}}),false);
assert.equal(F.migrate({getItem(){throw Error('blocked');}}),false,'Blocked storage is left alone');
console.log('PASS: old finance reading progress moves to the shared reading list once; practice status and quiz answers stay.');
