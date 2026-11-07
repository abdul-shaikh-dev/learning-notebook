// Builds the standard Financial foundations course (path.json lessons, glossary.json, diagrams.json)
// from the finance content files the practice studio and printable handbook also read.
// Run after editing paths/financial-foundations/content/*.js; --check fails when the files are stale.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),base=path.join(root,'paths/financial-foundations');
const {FINANCE_LEGACY}=require('../assets/js/finance-legacy.js');

function content(){
 const c={document:{addEventListener(){}},window:{addEventListener(){}}};vm.createContext(c);
 for(const f of ['curriculum','source-register','starter','foundations','advanced','exercises','journey','activities','diagrams'])vm.runInContext(fs.readFileSync(path.join(base,'content',f+'.js'),'utf8').replace(/^const /gm,'var '),c,{filename:f+'.js'});
 // Visual story metadata only; the story code itself stays in the studio.
 const stories=fs.readFileSync(path.join(base,'runtime/visual-stories.js'),'utf8').match(/^const VISUAL_STORIES\s*=\s*(\[[\s\S]*?\]);$/m);
 c.VISUAL_STORIES=vm.runInNewContext('('+stories[1]+')');
 return c;
}
// Lesson order: six introductions, eight foundation explainers, then the eighteen main lessons.
const START=6,FOUNDATION=8,mainNumber=n=>START+FOUNDATION+n;
const renumber=text=>text.replace(/\blesson (\d+)\b/g,(m,n)=>'lesson '+mainNumber(Number(n))).replace(/\blessons (\d+)–(\d+)\b/g,(m,a,b)=>'lessons '+mainNumber(Number(a))+'–'+mainNumber(Number(b)));
const STUDIO='course.html';

function build(c){
 const ids=FINANCE_LEGACY;
 const register=id=>c.SOURCE_REGISTER.find(r=>r.id===id);
 const ref=(sourceId,section)=>{const s=c.SOURCES.find(x=>x.id===sourceId);return {title:s.title,url:s.url,section,reviewed:register(sourceId).checkedDate,scope:s.note};};
 const DEFAULT_SECTION='Conceptual foundations; use the sources for context.';
 const mainRefs=n=>{const l=c.LESSONS[n-1];return l.sources.map(id=>ref(id,c.LESSON_REFERENCES[n]||DEFAULT_SECTION));};
 const introScope=' This introduction uses synthetic everyday examples; the source is the formal reference for the main lesson it prepares you for.';
 const quiz=q=>({question:q.q,options:q.options,correct:q.correct,explanation:q.explain});
 const story=n=>c.VISUAL_STORIES.find(s=>s.lessons.includes(n));
 const module=n=>c.EXERCISES.modules.find(m=>m.lessonIds.includes(n));
 const lessons=[];
 // 1. Start from zero.
 c.STARTER.forEach((l,i)=>{const next=i===4?4:1;lessons.push({id:ids.start[i],title:`${i+1}. ${l.title}`,stage:'start',takeaway:l.take,minutes:l.minutes,
  sections:[{title:'The idea',paragraphs:l.paragraphs.map(renumber)},{title:'A concrete example',paragraphs:[],example:l.example,exampleFormat:'text'},{title:'Connect it to work',paragraphs:[renumber(l.connection)]}],
  quiz:quiz(l.quiz),references:mainRefs(next).map(r=>({...r,scope:r.scope+introScope}))});});
 // 2. Foundation explainers: the explanation prompt becomes the lesson exercise.
 c.FOUNDATIONS.forEach((f,i)=>{const seen=new Set(),references=[];for(const n of f.lessons)for(const r of mainRefs(n))if(!seen.has(r.url)){seen.add(r.url);references.push(r);}
  const task=f.resourceTask||(['daily-pnl','curve-repricing'].includes(f.id)?'daily-pnl-and-curves':null);
  lessons.push({id:ids.foundations[f.id],title:`${START+i+1}. ${f.title}`,stage:'foundation-explainers',takeaway:`Background for ${f.lessons.map(n=>'lesson '+mainNumber(n)).join(', ').replace(/, ([^,]*)$/,' and $1')}.`,
  sections:[{title:'Explanation',paragraphs:f.paragraphs.map(renumber)},{title:'Worked example',paragraphs:[],example:f.example,exampleFormat:'text'}],
  exercise:{prompt:'Try explaining: '+f.check,solution:f.answer,solutionFormat:'prose'},
  references,...(task?{activities:[{title:'Open the worked extension and its files',href:'index.html#resources/financial-foundations/'+task}]}:{})});});
 // 3. Main lessons: concept, worked example, technical detail, then any advanced sections with their evidence.
 c.LESSONS.forEach((l,i)=>{const n=i+1,foundations=c.FOUNDATIONS.filter(f=>f.lessons.includes(n)),s=story(n),journey=c.TRADE_JOURNEY.filter(j=>j.lesson===n),m=module(n);
  const sections=[{title:'The concept',paragraphs:[renumber(l.teaser),...l.body.map(renumber)]},{title:'Worked example: '+l.example.title,paragraphs:[],example:l.example.text,exampleFormat:'text',exampleNote:renumber(l.example.explain)},
   {title:'Go deeper',paragraphs:[renumber(l.deep)]},{title:'Data & systems',paragraphs:[renumber(l.data)]},{title:'Common trap',paragraphs:[renumber(l.pitfall)]}];
  if(foundations.length)sections.push({title:'Related foundations',paragraphs:['Need the background first? Read '+foundations.map(f=>`lesson ${START+c.FOUNDATIONS.indexOf(f)+1} (${f.title})`).join(' and ')+'.']});
  for(const a of c.ADVANCED.filter(a=>a.lessonId===n))sections.push({title:a.title,paragraphs:a.paragraphs.map(renumber),...(a.example?{example:a.example,exampleFormat:'text'}:{}),evidence:a.citations.map(x=>({label:x.label,url:x.url,...(x.paragraph?{paragraph:x.paragraph}:{}),checked:x.checkedDate||'2026-09-26',status:x.status||'Referenced edition; check effective rules for implementation.'}))});
  const activities=[...(s?[{title:'See this idea in motion: '+s.title,href:STUDIO+'#visual/'+s.id}]:[]),{title:'Explore the related lab: '+c.LABS[l.lab].name,href:STUDIO+'#labs/'+l.lab},...journey.map(j=>({title:'Follow one trade: '+j.label,href:STUDIO+'#journey/'+j.id})),{title:'Apply this module: calculate, explain and investigate ('+m.title+')',href:STUDIO+'#practice/'+m.id}];
  lessons.push({id:ids.main[i],title:`${mainNumber(n)}. ${l.title}`,stage:ids.stages[l.phase],takeaway:l.take,minutes:l.minutes,sections,quiz:quiz(l.quiz),references:mainRefs(n),activities});});
 const goals={'Foundations':'Understand how a contract and market inputs become a value.','Valuation control':'Challenge the mark, investigate exceptions and explain adjustments.','Fair value hierarchy':'Assess observability and explain the Level 1 / 2 / 3 decision.','Prudent valuation':'Distinguish remaining uncertainty, AVAs and the capital effect.','Working knowledge':'Trace the data and explain a complete month-end result.'};
 const stages=[{id:'start',title:'Start from zero',description:'No trading knowledge needed. Six short introductions follow one fictional bank from a simple purchase to the records and checks around it.',exitCriteria:['Tell a trade, a position, a price, a value and P&L apart.','Place a position in its legal entity, desk and book.','Read one trade record field by field.']},
  {id:'foundation-explainers',title:'Foundation explainers',description:'Short bridges between everyday examples and the technical lessons. Read these whenever a term feels abstract.',exitCriteria:['Draw a bond as a timeline of payments.','Translate an input move into money.','Reconcile a day of P&L, including cash and FX.']},
  ...Object.entries(goals).map(([phase,goal])=>({id:ids.stages[phase],title:phase,description:goal,exitCriteria:[goal]}))];
 return {lessons,stages};
}
function glossary(c){
 const questions=['What valuation date, currency, unit and price convention is this number using?','Which population and source snapshots produced it?','Is this an observed price, a model input, a value, a reserve balance or a movement?','What is independently verified, and what remains unverified?','Is the amount gross, booked, incremental or after aggregation?','Which same-source adjustment has already been captured?','What evidence supports the hierarchy classification?','Which entity, jurisdiction, policy version and effective date apply?'];
 return {title:'Find the term. Check the units.',intro:'A desk reference for the language, formulas and distinctions used throughout the guide.',placeholder:'Try: clean, AVA, notional, sensitivity…',
  terms:c.GLOSSARY.map(([term,definition])=>({term,definition})),
  plainTerms:c.STARTER_TERMS.map(([term,definition])=>({term,definition})),plainIntro:'New to trading? Start with the six introductory lessons, beginning at lesson 1.',
  reference:[{title:'Formula card',columns:['Calculation','Expression','Assumption to remember'],rows:c.QUICK},{title:'Questions worth asking at work',items:questions},
   {title:'Scope and limits',intro:'This reference edition was researched on 26 September 2026. It teaches general concepts first, using IFRS and EU prudent valuation as explicit reference frameworks.',items:[
    'What this guide covers: trade and model foundations; source quality; IPV workflow and exceptions; accounting adjustments; all three FVH levels; all nine EU AVA categories; aggregation concepts; capital effects; day-one differences; governance and data lineage.',
    'Where deeper implementation starts: this is a substantial learning foundation, not an exhaustive bank methodology or regulatory implementation specification. It does not implement full curve construction, option pricing, xVA exposure simulation, legal netting tests, production AVA calibration, all Annex conditions or jurisdiction-specific reporting templates. Each requires the applicable bank policy and current authoritative rules.',
    'Numbers, tolerances, decisions and positions are invented for teaching. The normal-distribution lab and pre-aggregation bridge use simplified assumptions shown beside the controls.',
    'Publication date is not effective date: the 2024 EBA targeted-amendment material is a consultation, and this guide does not treat it as enacted law. The PRA restatement published in January 2026 has relevant provisions effective in January 2027. Verify the rule version for the reporting date before implementing a production calculation.',
    'Keep your learning portable: the lessons and labs work without the internet; source links need an internet connection. Progress is local to this browser; use Progress & backups before moving the folder or switching browsers. No account or external service is used.']}]};
}
function diagrams(c,lessons){
 const ids=FINANCE_LEGACY,out={};const add=(id,d,textExampleSections)=>{out[id]={...d,...(textExampleSections?{textExampleSections}:{})};};
 add(ids.start[2],c.FINANCE_DIAGRAMS['starter-3'],[1]);
 add(ids.start[4],c.FINANCE_DIAGRAMS['lesson-4']);
 add(ids.foundations['cash-flows'],c.FINANCE_DIAGRAMS['foundation-cash-flows']);
 for(const key of Object.keys(c.FINANCE_DIAGRAMS).filter(k=>/^lesson-\d+$/.test(k))){const n=Number(key.slice(7));add(ids.main[n-1],c.FINANCE_DIAGRAMS[key],n===4?[1]:undefined);}
 const order=lessons.map(l=>l.id);return Object.fromEntries(Object.entries(out).sort(([a],[b])=>order.indexOf(a)-order.indexOf(b)));
}
function outputs(){
 const c=content(),{lessons,stages}=build(c);
 const manifest=JSON.parse(fs.readFileSync(path.join(base,'path.json'),'utf8'));
 const {href,lessons:_,stages:__,...rest}=manifest;
 const p={id:rest.id,title:rest.title,category:rest.category,status:rest.status,description:rest.description,level:rest.level,
  prerequisites:['No trading knowledge needed: the six introductions start from everyday examples.','Basic arithmetic with percentages; each formula is written out with its units.'],
  outcomes:['Separate notional, price, market value and profit.','Challenge a mark with independent evidence and explain the exception.','Classify a fair-value measurement as Level 1, 2 or 3 and explain why.','Distinguish valuation uncertainty, AVAs and their capital effect.','Trace a month-end number back through its data.'],
  setup:['Lessons, labs and diagrams work without the internet; source links need a connection.','The practice studio holds the calculators, the month-end case, the trade journey and the visual stories.','Practice files run with Python 3 and the standard library.'],
  nextSteps:['Work through the month-end case in the practice studio.','Try the mixed revision a day later, then a week later.','Read the primary sources for the jurisdiction and reporting date you work with.'],
  sources:c.SOURCES.map(s=>{const r=c.SOURCE_REGISTER.find(x=>x.id===s.id);return {title:s.title,url:s.url,note:s.note,checked:r.checkedDate,access:r.access,changeTrigger:r.changeTrigger};}),
  sourcesNote:'These are dated teaching references. An access check is not a legal-currentness certification. New technical sections provide their specific paragraph references.',
  activities:[{title:'Follow one trade',href:STUDIO+'#journey/booking',description:'Eight stages: inputs, owners, controls and a live reporting preview.'},
   ...c.VISUAL_STORIES.map(s=>({title:'Visual story: '+s.title,href:STUDIO+'#visual/'+s.id,description:s.subtitle})),
   {title:'Interactive labs',href:STUDIO+'#labs',description:'Seven calculators: change an input and compare the result, each with a worksheet.'},
   {title:'The month-end case',href:STUDIO+'#case',description:'One bond, five different answers: six stages with worked answers and a small practice population.'},
   {title:'Applied module practice',href:STUDIO+'#practice',description:'Calculate, explain, diagnose and investigate, module by module, with saved practice status.'},
   {title:'Mixed revision',href:STUDIO+'#practice/revision',description:'Return tomorrow, then a week later. Try without notes and compare your reasoning.'},
   {title:'Complete printable handbook',href:'handbook.html',description:'Every lesson, lab worksheet, the case, module practice, the answer appendix, visual stories and the trade journey in one printable pack.'}],
  activitiesTitle:'Practice studio',
  lessons,stages,publicFiles:rest.publicFiles};
 return {'path.json':p,'glossary.json':glossary(c),'diagrams.json':diagrams(c,lessons)};
}
const files=outputs(),check=process.argv.includes('--check');let stale=[];
for(const [name,value] of Object.entries(files)){const file=path.join(base,name),text=JSON.stringify(value,null,2)+'\n';if(check){if(!fs.existsSync(file)||fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n')!==text)stale.push(name);}else fs.writeFileSync(file,text);}
if(stale.length){console.error('Stale finance course files: '+stale.join(', ')+'. Run node scripts/sync-finance-lessons.cjs');process.exit(1);}
console.log(check?'PASS: finance course files match the finance content.':'Wrote '+Object.keys(files).join(', '));
