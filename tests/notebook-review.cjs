const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const DAY=864e5,T0=Date.UTC(2026,9,1);
const quiz=(q,correct=1)=>({question:q,options:['A','B','C'],correct,explanation:'Because '+q+'.'});
const paths=[
 {id:'python',title:'Python',status:'ready',dataFile:'content/courses/python.js',stages:[{id:'foundation',stageCheck:[quiz('Stage one?',0)]},{id:'later'}],lessons:[{id:'loops',title:'6. Repeat work with loops',quiz:quiz('range(1,4)?'),extraQuiz:[quiz('Extra loop?',2)]},{id:'dicts',title:'5. Store related values',quiz:quiz('<b>keys</b>?',0)},{id:'plain',title:'7. No checkpoint'}]},
 {id:'sql',title:'SQL',status:'ready',dataFile:'content/courses/sql.js',lessons:[{id:'joins',title:'1. Joins',quiz:quiz('Rows?',2)}]},
 {id:'later',title:'Later',status:'planned',lessons:[]}];
function make(initial={},failWrites=false){
 const data=new Map(Object.entries(initial));
 const ctx={LEARNING_PATHS:JSON.parse(JSON.stringify(paths)),localStorage:{getItem:k=>data.has(k)?data.get(k):null,setItem(k,v){if(failWrites)throw Error('quota');data.set(k,String(v));}},
  quizChoices:(p,l)=>l.quiz.options.map((text,index)=>({text,index})),keyedQuizChoices:(q,seed)=>q.options.map((text,index)=>({text:text+'@'+seed,index})).reverse()};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync('assets/js/notebook-review.js','utf8')+';this.R=NotebookReview;',ctx);
 return {R:ctx.R,data,ctx,path:id=>ctx.LEARNING_PATHS.find(p=>p.id===id)};
}
const key=id=>'learning-notebook:path:'+id+':checkpoints:v1';
// Schedule: a miss is due at once; correct answers return after 1, 3 and 7 days; a fourth retires the question.
{const {R,data,path}=make(),p=path('python'),l=p.lessons[0],saved=()=>JSON.parse(data.get(key('python'))).loops;
 R.record(p,'loops',false,T0);assert.deepEqual({...saved()},{correct:false,streak:0,at:T0});assert.equal(R.dueAt(saved()),T0);
 R.record(p,'loops',true,T0+1);assert.equal(saved().streak,1);assert.equal(R.dueAt(saved()),T0+1+DAY);
 R.record(p,'loops',true,T0+DAY/2);assert.equal(saved().at,T0+1,'An early correct answer keeps the schedule');
 let t=T0+1;for(const [streak,days] of [[2,3],[3,7]]){t+=R.INTERVALS[streak-2]*DAY;R.record(p,'loops',true,t);assert.equal(saved().streak,streak);assert.equal(R.dueAt(saved()),t+days*DAY);}
 t+=7*DAY;R.record(p,'loops',true,t);assert.equal(saved().streak,4);assert.equal(R.dueAt(saved()),null,'Retired after a week-long gap');
 R.record(p,'loops',true,t+DAY);assert.equal(saved().streak,4,'Retired questions stay retired when answered correctly');
 R.record(p,'loops',false,t+2*DAY);assert.deepEqual({...saved()},{correct:false,streak:0,at:t+2*DAY},'A later miss returns it to review');}
// Ordering, filtering and corrupt storage.
{const {R}=make({[key('python')]:JSON.stringify({loops:{correct:true,streak:1,at:T0-5*DAY},dicts:{correct:false,streak:0,at:T0-DAY},plain:{correct:true,streak:1,at:T0},gone:{correct:false,streak:0,at:T0},bad:{correct:true,streak:0,at:T0}}),[key('sql')]:'{not json'});
 const items=R.items(T0).filter(i=>i.ready);
 assert.deepEqual([...items.map(i=>i.key)],['dicts','loops'],'Missed first, unknown and invalid entries ignored');
 assert.deepEqual({...R.read('sql')},{},'Unreadable storage is treated as empty');
 assert.deepEqual([...R.dueCourses(T0)],['python']);}
// Home card states.
{assert.equal(make().R.card(T0),'','No card before any checkpoint is answered');
 const quiet=make({[key('sql')]:JSON.stringify({joins:{correct:true,streak:1,at:T0}})}).R.card(T0+DAY/2);
 assert(quiet.includes('is-quiet')&&quiet.includes('Nothing due')&&quiet.includes('1 question is scheduled; the next returns tomorrow')&&quiet.includes('href="#review"'),'The quiet card links to the schedule');
 const due=make({[key('python')]:JSON.stringify({dicts:{correct:false,streak:0,at:T0}}),[key('sql')]:JSON.stringify({joins:{correct:true,streak:1,at:T0-2*DAY}})}).R.card(T0);
 assert(due.includes('2 questions to review')&&due.includes('1 missed')&&due.includes('From 2 courses')&&due.includes('href="#review"'));}
// Review page: due questions only, escaped, linked to the lesson; the first answer is saved, later clicks only explain.
{const {R,data}=make({[key('python')]:JSON.stringify({dicts:{correct:false,streak:0,at:T0},loops:{correct:true,streak:1,at:T0}})});
 const html=R.view(T0+DAY/2);
 assert(html.includes('&lt;b&gt;keys&lt;/b&gt;?')&&!html.includes('<b>keys'),'Questions are escaped');
 assert(html.includes('href="#topic/python/dicts"')&&html.includes('Python · Store related values')&&html.includes('Missed'));
 assert(!html.includes('range(1,4)?'),'Questions not yet due are hidden');
 assert(html.includes('1 of 1 due questions shown.'));
 const buttons=[0,1,2].map(i=>({dataset:{reviewChoice:String(i)},listeners:[],addEventListener(t,f){this.listeners.push(f);},click(){this.listeners.forEach(f=>f());}}));
 const feedback={textContent:''},note={textContent:''};
 const row={dataset:{review:'0'},querySelectorAll:()=>buttons,querySelector:s=>s==='.review-feedback'?feedback:note};
 R.bind({querySelectorAll:()=>[row]},()=>T0+DAY/2);
 buttons[0].click();assert.equal(feedback.textContent,'Correct. Because <b>keys</b>?.');assert.equal(note.textContent,'Saved for review. It returns in 1 day.');
 const first=data.get(key('python'));buttons[1].click();
 assert.equal(feedback.textContent,'Not quite. Because <b>keys</b>?.');assert.equal(data.get(key('python')),first,'Only the first answer is saved');
 const empty=R.view(T0+DAY/2);
 assert(empty.includes('Nothing to review right now.</p>')&&empty.includes('<h2 id="review-schedule-title">Coming up</h2>'),'The schedule shows when nothing is due');
 assert(empty.indexOf('Python · Repeat work with loops')<empty.indexOf('Python · Store related values')&&empty.includes('Returns tomorrow'),'Upcoming questions are listed soonest first');
 assert(make().R.view(T0).includes('Answer a lesson checkpoint to start your review list.'));}
// Extra lesson questions and stage checks: structural keys, labels, links, keyed order and first-answer saving.
{const {R,data,path}=make({[key('python')]:JSON.stringify({'loops/2':{correct:false,streak:0,at:T0},'stage/foundation/1':{correct:false,streak:0,at:T0+1},'loops/1':{correct:false,streak:0,at:T0},'stage/gone/1':{correct:false,streak:0,at:T0},'stage/later/1':{correct:true,streak:1,at:T0}})}),p=path('python');
 for(const [k,ok] of [['loops',true],['loops/2',true],['loops/9',true],['loops/1',false],['loops/10',false],['nope/2',false],['stage/foundation/1',true],['stage/foundation/0',false],['stage/missing/1',false],['stage/foundation',false],['a/b/c',false]])assert.equal(R.known(p,k),ok,k);
 assert.deepEqual(Object.keys(R.read('python')).sort(),['loops/2','stage/foundation/1','stage/later/1'],'Unknown keys are ignored');
 assert.equal(R.question(p,'stage/foundation/1').quiz.question,'Stage one?');assert.equal(R.question(p,'loops/2').quiz.question,'Extra loop?');assert.equal(R.question(p,'stage/later/1').quiz,undefined,'A question without content stays unresolved');
 const html=R.view(T0+DAY/2);
 assert(html.includes('<a href="#topic/python/loops">Python · Repeat work with loops · Question 2</a>')&&html.includes('<a href="#path/python">Python · Stage 1 check · Question 1</a>'));
 assert(html.indexOf('C@python/loops/2')<html.indexOf('A@python/loops/2'),'Extra questions use the keyed order');
 assert(html.includes('2 of 2 due questions shown.')&&html.includes('Python · Stage 2 check · Question 1')&&html.includes('Returns'),'Unresolved questions stay on the schedule only');
 const buttons=[0,1,2].map(i=>({dataset:{reviewChoice:String(i)},listeners:[],addEventListener(t,f){this.listeners.push(f);},click(){this.listeners.forEach(f=>f());}}));
 const feedback={textContent:''},note={textContent:''};
 R.bind({querySelectorAll:()=>[{dataset:{review:'1'},querySelectorAll:()=>buttons,querySelector:s=>s==='.review-feedback'?feedback:note}]},()=>T0+DAY/2);
 buttons[0].click();assert.equal(feedback.textContent,'Correct. Because Stage one?.');
 assert.deepEqual({...JSON.parse(data.get(key('python')))['stage/foundation/1']},{correct:true,streak:1,at:T0+DAY/2});}
// Undo after a mis-click restores the earlier record (or removes a first answer) and lets the next choice count.
{const {R,data,ctx,path}=make({[key('python')]:JSON.stringify({dicts:{correct:false,streak:0,at:T0}})}),p=path('python');
 const made=[];ctx.document={createElement:()=>{const b={listeners:[],addEventListener(t,f){this.listeners.push(f);},click(){this.listeners.forEach(f=>f());}};made.push(b);return b;}};
 const el={textContent:'',parts:[],append(...x){this.parts.push(...x);}};let resets=0;
 R.showNote(el,p,'loops',R.record(p,'loops',false,T0),()=>resets++,T0);
 assert.equal(made[0].textContent,'Undo: I chose by mistake');made[0].click();
 assert.equal(el.textContent,'Answer removed. Your next choice will be saved.');assert.equal(resets,1);
 assert(!('loops' in JSON.parse(data.get(key('python')))),'A first answer is removed');
 const r=R.record(p,'dicts',true,T0+1);assert.equal(R.undo(p,'dicts',r.previous),true);
 assert.deepEqual(JSON.parse(data.get(key('python'))).dicts,{correct:false,streak:0,at:T0},'An earlier record is restored');
 const quiet={textContent:'',append(){throw Error('no undo after a failed save');}};R.showNote(quiet,p,'loops',{saved:false,entry:{correct:true,streak:1,at:T0}},()=>{},T0);
 assert.equal(quiet.textContent,'This browser could not save the answer for review.');}
// Storage failure is reported, not hidden.
{const {R,path}=make({},true),p=path('sql');assert.equal(R.note(R.record(p,'joins',true,T0),T0),'This browser could not save the answer for review.');}
// The loader fetches only the courses with due questions, once each.
{const requests=[],{ctx}=make({[key('sql')]:JSON.stringify({joins:{correct:false,streak:0,at:Date.now()-DAY}})});
 Object.assign(ctx,{document:{getElementById:()=>({innerHTML:'',focus(){}}),createElement:()=>({remove(){}}),head:{append:s=>requests.push(s)}},location:{hash:'#review'}});
 vm.runInContext(fs.readFileSync('assets/js/notebook-loader.js','utf8')+';this.loader=NotebookLoader;',ctx);
 assert.equal(ctx.loader.prepare('review',undefined,()=>{}),true);assert.deepEqual([...requests.map(s=>s.src)],['content/courses/sql.js']);
 ctx.loader.register({id:'sql'});assert.equal(ctx.loader.prepare('review',undefined,()=>{}),false,'Loaded courses need no request');}
console.log('PASS: checkpoint review schedule, retirement, ordering, corrupt storage, home card, escaped review page, first-answer saving, mis-click undo, upcoming schedule, extra and stage question keys, storage failure and on-demand loading.');
