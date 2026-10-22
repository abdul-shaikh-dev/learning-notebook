const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const DAY=864e5,T0=Date.UTC(2026,9,1);
const quiz=(q,correct=1)=>({question:q,options:['A','B','C'],correct,explanation:'Because '+q+'.'});
const paths=[
 {id:'python',title:'Python',status:'ready',dataFile:'content/courses/python.js',lessons:[{id:'loops',title:'6. Repeat work with loops',quiz:quiz('range(1,4)?')},{id:'dicts',title:'5. Store related values',quiz:quiz('<b>keys</b>?',0)},{id:'plain',title:'7. No checkpoint'}]},
 {id:'sql',title:'SQL',status:'ready',dataFile:'content/courses/sql.js',lessons:[{id:'joins',title:'1. Joins',quiz:quiz('Rows?',2)}]},
 {id:'later',title:'Later',status:'planned',lessons:[]}];
function make(initial={},failWrites=false){
 const data=new Map(Object.entries(initial));
 const ctx={LEARNING_PATHS:JSON.parse(JSON.stringify(paths)),localStorage:{getItem:k=>data.has(k)?data.get(k):null,setItem(k,v){if(failWrites)throw Error('quota');data.set(k,String(v));}},
  quizChoices:(p,l)=>l.quiz.options.map((text,index)=>({text,index}))};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync('assets/js/notebook-review.js','utf8')+';this.R=NotebookReview;',ctx);
 return {R:ctx.R,data,ctx,path:id=>ctx.LEARNING_PATHS.find(p=>p.id===id)};
}
const key=id=>'learning-notebook:path:'+id+':checkpoints:v1';
// Schedule: a miss is due at once; correct answers return after 1, 3 and 7 days; a fourth retires the question.
{const {R,data,path}=make(),p=path('python'),l=p.lessons[0],saved=()=>JSON.parse(data.get(key('python'))).loops;
 R.record(p,l,false,T0);assert.deepEqual({...saved()},{correct:false,streak:0,at:T0});assert.equal(R.dueAt(saved()),T0);
 R.record(p,l,true,T0+1);assert.equal(saved().streak,1);assert.equal(R.dueAt(saved()),T0+1+DAY);
 R.record(p,l,true,T0+DAY/2);assert.equal(saved().at,T0+1,'An early correct answer keeps the schedule');
 let t=T0+1;for(const [streak,days] of [[2,3],[3,7]]){t+=R.INTERVALS[streak-2]*DAY;R.record(p,l,true,t);assert.equal(saved().streak,streak);assert.equal(R.dueAt(saved()),t+days*DAY);}
 t+=7*DAY;R.record(p,l,true,t);assert.equal(saved().streak,4);assert.equal(R.dueAt(saved()),null,'Retired after a week-long gap');
 R.record(p,l,true,t+DAY);assert.equal(saved().streak,4,'Retired questions stay retired when answered correctly');
 R.record(p,l,false,t+2*DAY);assert.deepEqual({...saved()},{correct:false,streak:0,at:t+2*DAY},'A later miss returns it to review');}
// Ordering, filtering and corrupt storage.
{const {R}=make({[key('python')]:JSON.stringify({loops:{correct:true,streak:1,at:T0-5*DAY},dicts:{correct:false,streak:0,at:T0-DAY},plain:{correct:true,streak:1,at:T0},gone:{correct:false,streak:0,at:T0},bad:{correct:true,streak:0,at:T0}}),[key('sql')]:'{not json'});
 const items=R.items(T0).filter(i=>i.ready);
 assert.deepEqual([...items.map(i=>i.lesson.id)],['dicts','loops'],'Missed first, unknown and invalid entries ignored');
 assert.deepEqual({...R.read('sql')},{},'Unreadable storage is treated as empty');
 assert.deepEqual([...R.dueCourses(T0)],['python']);}
// Home card states.
{assert.equal(make().R.card(T0),'','No card before any checkpoint is answered');
 const quiet=make({[key('sql')]:JSON.stringify({joins:{correct:true,streak:1,at:T0}})}).R.card(T0+DAY/2);
 assert(quiet.includes('is-quiet')&&quiet.includes('Nothing due')&&quiet.includes('tomorrow')&&!quiet.includes('href'));
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
 assert(R.view(T0+DAY/2).includes('Nothing to review right now. 2 questions return later.'));
 assert(make().R.view(T0).includes('Answer a lesson checkpoint to start your review list.'));}
// Storage failure is reported, not hidden.
{const {R,path}=make({},true),p=path('sql');assert.equal(R.note(R.record(p,p.lessons[0],true,T0),T0),'This browser could not save the answer for review.');}
// The loader fetches only the courses with due questions, once each.
{const requests=[],{ctx}=make({[key('sql')]:JSON.stringify({joins:{correct:false,streak:0,at:Date.now()-DAY}})});
 Object.assign(ctx,{document:{getElementById:()=>({innerHTML:'',focus(){}}),createElement:()=>({remove(){}}),head:{append:s=>requests.push(s)}},location:{hash:'#review'}});
 vm.runInContext(fs.readFileSync('assets/js/notebook-loader.js','utf8')+';this.loader=NotebookLoader;',ctx);
 assert.equal(ctx.loader.prepare('review',undefined,()=>{}),true);assert.deepEqual([...requests.map(s=>s.src)],['content/courses/sql.js']);
 ctx.loader.register({id:'sql'});assert.equal(ctx.loader.prepare('review',undefined,()=>{}),false,'Loaded courses need no request');}
console.log('PASS: checkpoint review schedule, retirement, ordering, corrupt storage, home card, escaped review page, first-answer saving, storage failure and on-demand loading.');
