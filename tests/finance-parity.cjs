// Feature checklist for the move of Financial foundations onto the shared course page (issue #70):
// every lesson, quiz, diagram, explainer, advanced section, reference, glossary entry, source record and
// practice activity of the original reader has a home, old links still arrive, and saved reading carries over.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');process.chdir(root);
const {FINANCE_LEGACY:F}=require('../assets/js/finance-legacy.js');
const paths=require('../scripts/manifest.cjs').readPaths(),p=paths.find(x=>x.id==='financial-foundations');

// path.json, glossary.json and diagrams.json are the only copy of the lessons; the studio content files hold labs,
// the case, module practice, the practice population and the trade journey. This section was checked field by field
// against the original reader's content files before they were removed.
const c={document:{addEventListener(){}},window:{addEventListener(){}}};vm.createContext(c);
for(const f of ['exercises','journey','activities'])vm.runInContext(fs.readFileSync('paths/financial-foundations/content/'+f+'.js','utf8').replace(/^const /gm,'var '),c);
for(const k of ['LABS','TRADE_JOURNEY','EXERCISES'])c[k]=JSON.parse(JSON.stringify(c[k]));
c.VISUAL_STORIES=vm.runInNewContext('('+fs.readFileSync('paths/financial-foundations/runtime/visual-stories.js','utf8').match(/^const VISUAL_STORIES\s*=\s*(\[[\s\S]*?\]);$/m)[1]+')');
for(const f of ['curriculum','starter','foundations','advanced','source-register','diagrams'])assert.ok(!fs.existsSync('paths/financial-foundations/content/'+f+'.js'),'No second copy of the lessons: '+f);

// Lessons: six introductions, eight explainers and eighteen main lessons, in reading order, under the old ids' new names.
const byId=new Map(p.lessons.map(l=>[l.id,l]));
assert.equal(p.status,'ready');assert.ok(!p.href,'The shared course page is the reader');
assert.deepEqual(p.lessons.map(l=>l.id),[...F.start,...Object.values(F.foundations),...F.main]);
assert.deepEqual(p.stages.map(s=>s.id),['start','foundation-explainers',...Object.values(F.stages)]);
const titles=l=>l.sections.map(s=>s.title);
F.start.forEach(id=>{const l=byId.get(id);assert.equal(l.stage,'start');assert.ok(l.takeaway&&l.minutes&&l.quiz,id);assert.deepEqual(titles(l),['The idea','A concrete example','Connect it to work'],id);assert.ok(l.sections[1].example,id);assert.ok(l.references.length,id);});
Object.values(F.foundations).forEach(id=>{const l=byId.get(id);assert.equal(l.stage,'foundation-explainers');assert.deepEqual(titles(l),['Explanation','Worked example'],id);assert.ok(l.sections[1].example,id);
 assert.ok(l.exercise.prompt.startsWith('Try explaining: ')&&l.exercise.solution,id);assert.ok(!l.quiz,id);assert.ok(l.references.length,id);});
const mains=F.main.map(id=>byId.get(id));
mains.forEach((l,i)=>{assert.ok(Object.values(F.stages).includes(l.stage),l.id);assert.ok(l.takeaway&&l.minutes&&l.quiz,l.id);assert.ok(l.title.startsWith((15+i)+'. '),l.id);
 assert.deepEqual(titles(l).slice(0,5),['The concept','Worked example: '+l.sections[1].title.slice(16),'Go deeper','Data & systems','Common trap'],l.id);assert.ok(l.sections[1].example&&l.sections[1].exampleNote,l.id);
 // References: each source with its paragraph pointer and register check date.
 for(const r of l.references){const s=p.sources.find(s=>s.url===r.url);assert.ok(s,l.id+': '+r.url);assert.equal(r.reviewed,s.checked);assert.ok(r.section,l.id);}
 // Studio activities: the related lab on every main lesson.
 assert.ok(l.activities.some(a=>a.href.startsWith('course.html#labs/')),l.id);});
// Related foundation explainers are linked from the main lessons they prepare for.
for(const [i,id] of Object.values(F.foundations).entries()){const f=byId.get(id);assert.ok(mains.some(l=>l.sections.some(s=>s.title==='Related foundations'&&s.paragraphs[0].includes('lesson '+(7+i)+' ('+f.title.replace(/^\d+\. /,'')+')'))),id);}
// Advanced sections keep their text, example and dated evidence.
const evidence=mains.flatMap(l=>l.sections).filter(s=>s.evidence);assert.equal(evidence.length,7);
for(const s of evidence){assert.ok(s.paragraphs.length,s.title);for(const e of s.evidence)assert.ok(e.label&&e.url.startsWith('https://')&&e.paragraph&&e.checked&&e.status,s.title);}
// Diagrams: nine maps attached to ten lessons, with the flow-as-text toggles kept.
const diagrams=p.lessons.filter(l=>l.diagram);assert.equal(diagrams.length,10);assert.equal(new Set(diagrams.map(l=>l.diagram.title)).size,9);
assert.deepEqual(byId.get(F.main[3]).diagram.textExampleSections,[1]);assert.deepEqual(byId.get(F.start[2]).diagram.textExampleSections,[1]);
// Glossary, formula card, questions, scope notes and plain-language words.
assert.equal(p.glossary.terms.length,67);assert.equal(p.glossary.plainTerms.length,22);
assert.equal(p.glossary.reference[0].rows.length,9);assert.equal(p.glossary.reference[1].items.length,8);assert.ok(p.glossary.reference[2].items.some(t=>t.startsWith('Publication date is not effective date')));
// Sources keep their notes and every source-register field.
assert.equal(p.sources.length,15);for(const s of p.sources)assert.ok(s.title&&s.url&&s.note&&s.edition&&s.checked&&s.access&&s.changeTrigger,s.title);
// Practice studio: every lab, visual story, journey stage and practice module is linked from a lesson or the course.
const links=[...p.activities,...p.lessons.flatMap(l=>l.activities||[])].map(a=>a.href);
for(const id of Object.keys(c.LABS))assert.ok(links.includes('course.html#labs/'+id),id);
for(const s of c.VISUAL_STORIES)assert.ok(links.includes('course.html#visual/'+s.id),s.id);
for(const s of c.TRADE_JOURNEY)assert.ok(links.includes('course.html#journey/'+s.id),s.id);
for(const m of c.EXERCISES.modules.filter(m=>m.id!=='integrated-investigations'))assert.ok(links.includes('course.html#practice/'+m.id),m.id);
for(const href of ['course.html#practice','course.html#practice/revision','course.html#case','course.html#labs','handbook.html'])assert.ok(links.includes(href),href);
console.log('PASS: finance course data: 32 lessons, '+p.lessons.filter(l=>l.quiz).length+' quizzes, '+evidence.length+' evidence sections, 9 diagrams, glossary, source register and every studio activity; no second copy of the lessons.');

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
for(const id of Object.keys(F.foundations))assert.ok(byId.has(F.route('foundations',id).split('/').pop()),id);
assert.equal(F.route('labs','bond'),null,'Studio routes stay in the studio');
show('#lesson/3');assert.equal(replaced.at(-1),'#topic/financial-foundations/'+F.main[2]);show('#reference');assert.equal(replaced.at(-1),'#glossary/financial-foundations');show('#labs/ipv');assert.equal(replaced.at(-1),'course.html#labs/ipv');
// The studio page loads the link map before its app, and the notebook page before its router.
for(const file of ['course.html','index.html']){const page=fs.readFileSync(file,'utf8');assert.ok(page.indexOf('assets/js/finance-legacy.js')>-1&&page.indexOf('assets/js/finance-legacy.js')<page.indexOf(file==='course.html'?'runtime/app.js':'assets/js/catalog.js'),file);}
// The handbook and studio read the lessons from the shared course data, loaded after its register, plus the studio content.
for(const page of ['handbook.html','course.html']){const html=fs.readFileSync(page,'utf8'),at=f=>html.indexOf(f+'?');
 assert.ok(at('paths/financial-foundations/runtime/course-data.js')>-1&&at('paths/financial-foundations/runtime/course-data.js')<at('content/courses/financial-foundations.js'),page+': course data');
 for(const f of ['exercises','activities','lab-guides','practice-data','journey'])assert.ok(at('paths/financial-foundations/content/'+f+'.js')>-1,page+' still loads '+f);}
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
