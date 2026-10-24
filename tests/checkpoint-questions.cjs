// Extra lesson questions and end-of-stage checks: content shape, stable answer order, lesson and course pages, print pack and review.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {readPaths,checkQuestions}=require('../scripts/manifest.cjs');
// Authoring mistakes stop the build: answer index, repeated or blank options, missing explanation, unknown fields, too many questions.
const good={question:'Q?',options:['A','B'],correct:1,explanation:'Because.'};
checkQuestions([good],8,'fixture');
for(const bad of [[],[{...good,correct:2}],[{...good,options:['A','A']}],[{...good,options:['A',' ']}],[{...good,explanation:''}],[{...good,hint:'x'}],[{...good,options:['A']}],Array(9).fill(good)])assert.throws(()=>checkQuestions(bad,8,'fixture'),/Invalid question/);
const paths=readPaths().filter(p=>p.status==='ready'&&!p.href);
const nodes=new Map(),stored=new Map();
function node(id){if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',disabled:false,addEventListener(t,fn){this[t]=fn;},querySelectorAll(){return [];}});return nodes.get(id);}
const context={LEARNING_PATHS:paths,document:{getElementById:node},location:{hash:''},window:{addEventListener(){},scrollTo(){},print(){}},localStorage:{getItem:k=>stored.get(k)??null,setItem:(k,v)=>stored.set(k,v)}};
vm.createContext(context);vm.runInContext(fs.readFileSync('assets/js/learning-tools.js','utf8')+'\n'+fs.readFileSync('assets/js/notebook-review.js','utf8')+'\n'+fs.readFileSync('assets/js/catalog.js','utf8'),context);
const R=vm.runInContext('NotebookReview',context),esc=vm.runInContext('escapeText',context),keyed=(q,seed)=>[...vm.runInContext('keyedQuizChoices',context)(q,seed)];
const saved=id=>JSON.parse(stored.get('learning-notebook:path:'+id+':checkpoints:v1')||'{}');
// A block of answer buttons that records clicks, with its feedback and note paragraphs.
function block(key,size){
 const buttons=[...Array(size)].map((_,i)=>({dataset:{keyChoice:String(i)},listeners:[],addEventListener(t,f){this.listeners.push(f);},click(){this.listeners.forEach(f=>f());}}));
 const feedback={textContent:''},note={textContent:''};
 return {buttons,feedback,note,dataset:{quizKey:key},querySelectorAll:()=>buttons,querySelector:s=>s==='.quiz-feedback'?feedback:note};
}
let lessons=0,stages=0;
for(const p of paths){
 const questions=[...p.lessons.flatMap(l=>[l.quiz,...(l.extraQuiz||[])]),...(p.stages||[]).flatMap(s=>s.stageCheck||[])].filter(Boolean);
 assert.equal(new Set(questions.map(q=>q.question)).size,questions.length,p.id+': every question is distinct');
 const slots=new Map();
 for(const [key,q] of [...p.lessons.flatMap(l=>(l.extraQuiz||[]).map((q,i)=>[l.id+'/'+(i+2),q])),...(p.stages||[]).flatMap(s=>(s.stageCheck||[]).map((q,i)=>['stage/'+s.id+'/'+(i+1),q]))]){
  assert.ok(R.known(p,key)&&R.question(p,key).quiz===q,p.id+'/'+key+': key resolves to its question');
  const choices=keyed(q,p.id+'/'+key);
  assert.deepEqual(choices.map(c=>c.index).sort(),q.options.map((_,i)=>i),key+': every option shown once');
  assert.deepEqual(choices,keyed(q,p.id+'/'+key),key+': stable on revisit');
  const slot=choices.findIndex(c=>c.index===q.correct);slots.set(slot,(slots.get(slot)||0)+1);
 }
 if(slots.size)assert.ok(slots.size>1,p.id+': correct answers do not all sit in one position');
}
// The Python course carries one extra question per lesson and three per stage.
const p=paths.find(x=>x.id==='python');
assert.ok(p.lessons.every(l=>l.extraQuiz?.length===1));assert.deepEqual(p.stages.map(s=>s.stageCheck.length),[3,3,3]);
// Lesson pages: each extra question saves its own first answer, independent of the main checkpoint.
for(const l of p.lessons){
 lessons++;stored.clear();
 const key=l.id+'/2',q=l.extraQuiz[0],b=block(key,q.options.length);
 context.location.hash='#topic/python/'+l.id;node('main').querySelectorAll=s=>s==='[data-quiz-key]'?[b]:[];vm.runInContext('renderCatalog()',context);
 const html=node('main').innerHTML;
 assert.ok(html.includes('data-quiz-key="'+key+'"')&&html.indexOf('id="checkpoint-note"')<html.indexOf('data-quiz-key'),l.id+': extra question follows the checkpoint');
 assert.ok(html.includes('>'+esc(q.question)+'<'),l.id+': the question is shown escaped');
 const wrong=(q.correct+1)%q.options.length;
 b.buttons[wrong].click();assert.equal(b.feedback.textContent,'Not quite. '+q.explanation);
 b.buttons[q.correct].click();assert.equal(b.feedback.textContent,'Correct. '+q.explanation);
 assert.deepEqual(Object.keys(saved('python')),[key],l.id+': only the extra question is recorded');
 assert.equal(saved('python')[key].correct,false,'The first answer counts');assert.match(b.note.textContent,/stays there until you answer it correctly/);
}
node('main').querySelectorAll=()=>[];
// Course page: a stage check in every stage, before the project; answers go to the stage keys.
stored.clear();
const blocks=p.stages.flatMap(s=>s.stageCheck.map((q,i)=>block('stage/'+s.id+'/'+(i+1),q.options.length)));
context.location.hash='#path/python';node('main').querySelectorAll=s=>s==='[data-quiz-key]'?blocks:[];vm.runInContext('renderCatalog()',context);
let html=node('main').innerHTML;
for(const s of p.stages){stages+=s.stageCheck.length;const at=html.indexOf('id="stage-'+s.id+'"');assert.ok(html.indexOf('Check this stage',at)<html.indexOf('class="stage-project"',at),s.id+': the check comes before the project');}
assert.equal((html.match(/data-quiz-key="stage\//g)||[]).length,9);
blocks[0].buttons[p.stages[0].stageCheck[0].correct].click();
assert.deepEqual(Object.keys(saved('python')),['stage/foundation/1']);assert.match(blocks[0].note.textContent,/returns in 1 day/);
node('main').querySelectorAll=()=>[];
// Print pack: every question with its answer and no answer buttons.
context.location.hash='#pack/python';vm.runInContext('renderCatalog()',context);html=node('main').innerHTML;
assert.ok(!html.includes('data-quiz-key')&&!html.includes('data-key-choice'));
assert.equal((html.match(/<strong>Answer:<\/strong>/g)||[]).length,23*2+9,'Checkpoint, extra and stage answers are printed');
// Review: a missed stage question comes back with the course link and keyed order.
stored.set('learning-notebook:path:python:checkpoints:v1',JSON.stringify({'stage/advanced/2':{correct:false,streak:0,at:Date.now()-1000}}));
html=R.view();const q=p.stages[2].stageCheck[1];
assert.ok(html.includes('<a href="#path/python">Python · Stage 3 check · Question 2</a>')&&html.includes('Missed'));
assert.ok(keyed(q,'python/stage/advanced/2').every((c,i,all)=>i===0||html.indexOf('>'+esc(c.text)+'<')>html.indexOf('>'+esc(all[i-1].text)+'<')),'Review shows the same order as the course page');
console.log('PASS: '+lessons+' extra lesson questions and '+stages+' stage-check questions: distinct questions, resolvable keys, stable mixed answer positions, lesson and course binding, first-answer saving, print answers and review.');
