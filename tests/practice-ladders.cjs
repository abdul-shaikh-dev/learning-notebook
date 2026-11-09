// Practice ladders: schema validation, the lesson-page ladder with hints and attempts, print packs and search.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
process.chdir(process.env.LEARNING_REPO||path.resolve(__dirname,'..'));
const {checkPractice}=require('../scripts/manifest.cjs');
const step=(kind,n)=>({kind,prompt:'Step '+n+' uses <b>tags</b>.',checks:['Names the rule.'],solution:'Answer '+n+' <i>.',solutionFormat:'prose',hints:['Look at <the> example.'],pitfalls:['Forgetting step '+n+'.']});

// Schema: 2-4 steps, known kinds, required prompt, solution and checks, no unknown fields.
assert.doesNotThrow(()=>checkPractice(undefined,'x'));
assert.doesNotThrow(()=>checkPractice([step('completion',1),step('variation',2),step('transfer',3),step('decide',4)],'x'));
for(const [bad,why] of [[[step('completion',1)],/2-4 steps/],[Array(5).fill(step('variation',1)),/2-4 steps/],[{},/2-4 steps/],
 [[step('guess',1),step('variation',2)],/kind/],[[{...step('completion',1),prompt:' '},step('variation',2)],/prompt/],
 [[{...step('completion',1),checks:[]},step('variation',2)],/checks/],[[{...step('completion',1),answer:'x'},step('variation',2)],/Unknown practice field answer/],
 [[{...step('completion',1),solutionFormat:'yaml'},step('variation',2)],/solution format/],[[{...step('completion',1),hints:['']},step('variation',2)],/hints/]])
 assert.throws(()=>checkPractice(bad,'course/lesson'),why,JSON.stringify(bad).slice(0,80));

// Lesson page: the ladder follows the exercise, each step with hints and its own attempt box.
const lesson={id:'cache',title:'1. Cache',takeaway:'Keep hot data close.',sections:[{title:'Idea',paragraphs:['Read it once.']}],
 exercise:{prompt:'Explain a cache.',checks:['Mentions misses.'],solution:'A copy.',solutionFormat:'prose'},
 practice:[step('completion',1),step('decide',2)],quiz:{question:'Q',options:['A','B'],correct:0,explanation:'Because'}};
const course={id:'fixture-ladders',title:'Fixture ladders',status:'ready',description:'Fixture',category:'Programming',level:'Beginner',lessons:[lesson,{id:'plain',title:'2. Plain',takeaway:'None.',sections:[{title:'Text',paragraphs:['Words.']}]}]};
const elements=new Map(),element=id=>{if(!elements.has(id))elements.set(id,{id,innerHTML:'',textContent:'',value:'',addEventListener(type,fn){this[type]=fn;},querySelectorAll(){return [];}});return elements.get(id);};
const bound=[];
const context={LEARNING_PATHS:[course],document:{getElementById:element},location:{hash:'#topic/fixture-ladders/cache'},window:{addEventListener(){},scrollTo(){}},localStorage:{getItem:()=>null,setItem(){}},
 NotebookReview:{attemptView:(p,record,prefix,solution)=>'<div data-attempt="'+record.id+'" data-prefix="'+prefix+'">'+solution+'</div>',bindAttempt:(root,p,record)=>bound.push(record.id)}};
vm.runInNewContext(fs.readFileSync('assets/js/learning-tools.js','utf8')+'\n'+fs.readFileSync('assets/js/catalog.js','utf8'),context);
vm.runInNewContext('renderCatalog()',context);
const html=element('main').innerHTML;
const at=s=>{const i=html.indexOf(s);assert.ok(i>=0,'missing '+s);return i;};
assert.ok(at('id="lesson-practice"')<at('id="lesson-ladder"')&&at('id="lesson-ladder"')<at('id="lesson-checkpoint"'),'The ladder sits between the exercise and the checkpoint');
assert.ok(html.includes('aria-labelledby="lesson-ladder-title"')&&html.includes('2 steps.'));
assert.ok(html.includes('Step 1</span> Finish the worked step')&&html.includes('Step 2</span> Does it apply?'));
assert.ok(html.includes('data-attempt="cache/practice/1" data-prefix="practice-1"')&&html.includes('data-attempt="cache/practice/2" data-prefix="practice-2"'));
assert.ok(html.includes('<summary>Hint 1</summary><p>Look at &lt;the&gt; example.</p>')&&html.includes('Forgetting step 2.'));
assert.ok(!html.includes('<b>tags</b>')&&!html.includes('<the>')&&!html.includes('<i>'),'Step text is escaped');
assert.ok(html.includes('data-jump="lesson-ladder">Practice ladder'),'The lesson menu links to the ladder');
assert.deepEqual(bound.slice(-3),['cache','cache/practice/1','cache/practice/2'],'Each step binds its own attempt');
// A lesson without a ladder renders no ladder section or menu entry.
context.location.hash='#topic/fixture-ladders/plain';vm.runInNewContext('renderCatalog()',context);
assert.ok(!element('main').innerHTML.includes('lesson-ladder'));
// Print packs show every step's solution without attempt boxes.
const printed=vm.runInNewContext('practiceView',context)(lesson,true);
assert.equal((printed.match(/\sid="/g)||[]).length,0,'Printed ladders carry no IDs, since a pack repeats them per lesson');
assert.ok(printed.includes('<h4>Worked solution</h4>')&&printed.includes('Answer 2 &lt;i&gt;.')&&!printed.includes('data-attempt')&&!printed.includes('id="lesson-ladder"'));

// Search: step prompts are indexed with the lesson.
const source=fs.readFileSync('scripts/search-index.cjs','utf8');assert.match(source,/l\.practice\|\|\[\]\)\.map\(step=>step\.prompt\)/);
console.log('PASS: practice ladders: schema validation, lesson-page steps with hints, escaping and per-step attempts, jump link, print solutions and search indexing.');
