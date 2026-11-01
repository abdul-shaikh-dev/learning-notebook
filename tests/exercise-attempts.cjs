// Exercise attempts: saved answers, the solution opening after an attempt, self-rating, review scheduling, backups and progress.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
process.chdir(process.env.LEARNING_REPO||path.resolve(__dirname,'..'));
const DAY=864e5,T0=Date.UTC(2026,9,1);
const exercise=n=>({prompt:'Write `step '+n+'`.',checks:['Names the step.','Gives a reason.'],solution:'Step '+n+' because <it> matters.',solutionFormat:'prose'});
const quiz={question:'Q?',options:['A','B'],correct:0,explanation:'A.'};
const paths=[{id:'git',title:'Git',status:'ready',stages:[],lessons:[{id:'commit',title:'1. Commit',quiz,exercise:exercise(1)},{id:'branch',title:'2. Branch',quiz,exercise:exercise(2)}]},
 {id:'sql',title:'SQL',status:'ready',stages:[],lessons:[{id:'joins',title:'1. Joins',quiz,exercise:exercise(3)}]}];
const key=id=>'learning-notebook:path:'+id+':exercises:v1';
// A small DOM: enough elements for one attempt box, with click and input handlers.
function element(attrs={}){return {attrs,hidden:!!attrs.hidden,value:attrs.value||'',textContent:'',dataset:attrs.dataset||{},events:{},focused:false,
 addEventListener(t,f){this.events[t]=f;},setAttribute(k,v){this.attrs[k]=v;},hasAttribute(k){return k in this.attrs;},focus(){this.focused=true;},click(){this.events.click?.();}};}
function box(lesson,prefix,review=false){
 const parts={textarea:element(),status:element(),solution:element({hidden:true}),actions:element(),compare:element(),skip:element(),title:element(),note:element(),
  ratings:['matched','partly','missed'].map(r=>element({dataset:{rating:r}}))};
 const root=element({dataset:{prefix},...(review?{'data-review-mode':''}:{})});
 const map={'textarea':parts.textarea,'.exercise-status':parts.status,'[data-attempt-solution]':parts.solution,'.exercise-actions':parts.actions,'[data-attempt-compare]':parts.compare,'[data-attempt-skip]':parts.skip,['#'+prefix+'-solution-title']:parts.title,'[data-rating-note]':parts.note};
 root.querySelector=s=>map[s];root.querySelectorAll=s=>s==='[data-rating]'?parts.ratings:[];
 return {root,parts,container:{querySelector:s=>s==='[data-attempt="'+lesson+'"]'?root:null}};
}
function make(initial={}){
 const data=new Map(Object.entries(initial)),timers=[];
 const ctx={LEARNING_PATHS:JSON.parse(JSON.stringify(paths)),Date,TextEncoder,
  localStorage:{getItem:k=>data.has(k)?data.get(k):null,setItem(k,v){if(ctx.blocked)throw Error('quota');data.set(k,String(v));},removeItem:k=>data.delete(k)},
  setTimeout:f=>{timers.push(f);return timers.length;},clearTimeout:()=>{timers.length=0;},
  escapeText:s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])),
  quizChoices:(p,l)=>l.quiz.options.map((text,index)=>({text,index})),keyedQuizChoices:q=>q.options.map((text,index)=>({text,index}))};
 ctx.workedSolution=e=>'<div class="worked">'+ctx.escapeText(e.solution)+'</div>';ctx.exerciseExplanation=()=>'';
 vm.createContext(ctx);
 vm.runInContext(['assets/js/notebook-review.js','assets/js/notebook-backup.js','assets/js/notebook-progress.js'].map(f=>fs.readFileSync(f,'utf8')).join('\n')+';this.R=NotebookReview;this.B=NotebookBackup;this.P=NotebookProgress;',ctx);
 return {R:ctx.R,B:ctx.B,P:ctx.P,ctx,data,flush:()=>timers.splice(0).forEach(f=>f()),saved:id=>JSON.parse(data.get(key(id))||'{}'),path:id=>ctx.LEARNING_PATHS.find(p=>p.id===id)};
}

// Saving: an answer is kept with its time; clearing an unrated answer removes the record.
{const {R,saved,path}=make(),git=path('git');
 R.saveAnswer(git,'commit','My attempt',T0);assert.deepEqual(saved('git').commit,{answer:'My attempt',saved:T0});
 R.saveAnswer(git,'commit','x'.repeat(R.ANSWER+50),T0+1);assert.equal(saved('git').commit.answer.length,R.ANSWER,'Answers are capped');
 R.saveAnswer(git,'commit','   ',T0+2);assert.equal(saved('git').commit,undefined,'An empty unrated answer is removed');}

// Rating: a first match is not scheduled; partly or missed is due at once; matching later follows 1, 3 and 7 days.
{const {R,saved,path,ctx}=make(),git=path('git');
 R.saveAnswer(git,'commit','Attempt',T0);
 let r=R.rate(git,'commit','matched',null,T0+1);assert.deepEqual({...saved('git').commit},{answer:'Attempt',saved:T0,rating:'matched'});assert.match(R.exerciseNote(r,T0+1),/not scheduled/);
 assert.equal(R.items(T0+10*DAY).length,0,'A first attempt that matches never enters review');
 r=R.rate(git,'branch','partly',null,T0);assert.deepEqual({...saved('git').branch},{answer:'',saved:T0,rating:'partly',correct:false,streak:0,at:T0});
 assert.match(R.exerciseNote(r,T0),/until an attempt matches/);
 const base=saved('git').branch;
 R.rate(git,'branch','matched',base,T0+1);assert.equal(saved('git').branch.streak,1);assert.equal(R.dueAt(saved('git').branch),T0+1+DAY);
 R.rate(git,'branch','missed',base,T0+2);assert.deepEqual([saved('git').branch.rating,saved('git').branch.streak],['missed',0],'Changing the rating on one showing replaces it');
 R.rate(git,'branch','matched',base,T0+3);const once=saved('git').branch;
 R.rate(git,'branch','matched',once,T0+DAY/2);assert.equal(saved('git').branch.at,T0+3,'An early match keeps the schedule');
 let t=T0+3;for(const [streak,days] of [[2,3],[3,7]]){t+=R.INTERVALS[streak-2]*DAY;R.rate(git,'branch','matched',saved('git').branch,t);assert.equal(saved('git').branch.streak,streak);assert.equal(R.dueAt(saved('git').branch),t+days*DAY);}
 t+=7*DAY;r=R.rate(git,'branch','matched',saved('git').branch,t);assert.equal(R.dueAt(saved('git').branch),null);assert.match(R.exerciseNote(r,t),/leaves your review/);
 R.saveAnswer(git,'branch','',t+1);assert.equal(saved('git').branch.rating,'matched','Clearing a rated answer keeps its rating');
 ctx.blocked=true;assert.equal(R.exerciseNote(R.rate(git,'commit','missed',null,t),t),'This browser could not save the rating.');}

// Storage: unknown lessons, bad fields and inconsistent schedules are ignored.
{const {R}=make({[key('git')]:JSON.stringify({commit:{answer:'ok',saved:T0},gone:{answer:'x',saved:T0},branch:{answer:'x',saved:T0,rating:'matched',correct:false,streak:0,at:T0}}),[key('sql')]:'{bad json'});
 assert.deepEqual(Object.keys(R.readExercises('git')),['commit']);assert.equal(Object.keys(R.readExercises('sql')).length,0);
 for(const bad of [{answer:1,saved:T0},{answer:'x',saved:0},{answer:'x',saved:T0,rating:'great'},{answer:'x',saved:T0,correct:false,streak:0,at:T0},{answer:'x',saved:T0,rating:'missed',correct:false},{answer:'x',saved:T0,extra:1}])assert.equal(R.validExercise(bad),false,JSON.stringify(bad));}

// Lesson page: the solution opens after an attempt or on request, then the rating is saved.
{const {R,ctx,flush,saved,path}=make(),git=path('git'),lesson=git.lessons[0];
 const html=R.attemptView(git,lesson,'exercise','<p>SOLUTION</p>');
 assert(html.includes('<label class="exercise-label" for="exercise-answer">Your answer</label>')&&html.includes('aria-describedby="exercise-help exercise-status"'));
 assert(/data-attempt-solution[^>]*hidden/.test(html),'The solution starts closed');assert(!html.includes('data-review-mode'));
 const {root,parts,container}=box('commit','exercise');R.bindAttempt(container,git,lesson,()=>T0);
 parts.compare.click();assert.match(parts.status.textContent,/Write an attempt first/);assert(parts.textarea.focused&&parts.solution.hidden,'An empty attempt keeps the solution closed');
 parts.textarea.value='Because it records a snapshot';parts.textarea.events.input();flush();assert.equal(parts.status.textContent,'Saved in this browser.');assert.equal(saved('git').commit.answer,'Because it records a snapshot');
 parts.compare.click();assert(!parts.solution.hidden&&parts.actions.hidden&&parts.title.focused,'Comparing opens the solution and moves focus to it');
 parts.ratings[1].click();assert.equal(parts.ratings[1].attrs['aria-pressed'],'true');assert.equal(parts.ratings[0].attrs['aria-pressed'],'false');assert.equal(saved('git').commit.rating,'partly');
 parts.ratings[0].click();assert.equal(saved('git').commit.correct,undefined,'Re-rating on the same showing starts from the earlier state');
 // A revisit shows the saved answer with the solution open and the rating pressed.
 const again=R.attemptView(git,lesson,'exercise','<p>SOLUTION</p>');assert(again.includes('>Because it records a snapshot</textarea>')&&!/data-attempt-solution[^>]*hidden/.test(again)&&again.includes('data-rating="matched" aria-pressed="true"'));
 // Showing the solution without an attempt is always possible.
 const other=box('branch','exercise');R.bindAttempt(other.container,git,git.lessons[1],()=>T0);other.parts.skip.click();assert(!other.parts.solution.hidden);
 // Escaping: stored text cannot inject markup.
 R.saveAnswer(git,'branch','</textarea><script>x</script>',T0);assert(!R.attemptView(git,git.lessons[1],'e','').includes('<script>'));}

// Review: due exercises appear beside questions, with an empty box and the earlier answer beside the solution.
{const {R,ctx,data,flush,saved,path}=make({'learning-notebook:path:sql:checkpoints:v1':JSON.stringify({joins:{correct:false,streak:0,at:T0}})}),git=path('git');
 R.saveAnswer(git,'commit','First try',T0);R.rate(git,'commit','missed',null,T0);
 R.saveAnswer(git,'branch','Matched',T0);R.rate(git,'branch','matched',null,T0);
 assert.deepEqual(JSON.parse(JSON.stringify(R.items(T0).map(i=>[i.path.id,i.key,!!i.exercise]))),[['git','commit',true],['sql','joins',false]].sort((a,b)=>a[0]<b[0]?-1:1));
 assert.deepEqual([...R.dueCourses(T0)].sort(),['git','sql'],'Due exercises load their course');
 assert(R.card(T0).includes('1 question and 1 exercise to review'));
 const view=R.view(T0);assert(view.includes('2 of 2 due items shown.')&&view.includes('Git · Commit · Exercise')&&view.includes('Write `step 1`.')&&view.includes('<li>Names the step.</li>'));
 assert(view.includes('data-review-mode')&&view.includes('></textarea>')&&view.includes('<summary>Your previous answer</summary><p>First try</p>'),'Review starts with an empty box and keeps the earlier answer beside the solution');
 // Answering in review: an empty box never erases the earlier answer, and a match schedules a return.
 const i=view.match(/data-review-exercise="(\d)"/)[1],b=box('commit','review-exercise-'+i,true);
 const main={querySelector:s=>s==='[data-review-exercise="'+i+'"]'?b.container:null,querySelectorAll:()=>[]};
 R.bind(main,()=>T0+DAY);b.parts.textarea.value='  ';b.parts.textarea.events.input();flush();assert.equal(saved('git').commit.answer,'First try');
 b.parts.textarea.value='Second try';b.parts.textarea.events.input();b.parts.compare.click();b.parts.ratings[0].click();
 assert.deepEqual([saved('git').commit.answer,saved('git').commit.streak],['Second try',1]);assert.match(b.parts.note.textContent,/returns in 1 day/);
 assert(R.card(T0+DAY).includes('1 question to review'));}

// Backups: exercises export, validate, merge by most recent change and are counted.
{const {B,R,data,path}=make(),git=path('git');
 R.saveAnswer(git,'commit','Mine',T0);R.rate(git,'branch','partly',null,T0);
 const exported=JSON.parse(B.create()).progress.paths;
 assert.deepEqual(exported.git.exercises,{commit:{answer:'Mine',saved:T0},branch:{answer:'',saved:T0,rating:'partly',correct:false,streak:0,at:T0}});
 assert(!Object.hasOwn(exported.sql,'exercises'),'Courses without attempts keep the older backup shape');
 const env=answers=>JSON.stringify({app:'learning-notebook',version:1,progress:{paths:{git:{read:[],assessed:[],exercises:answers}},financial:null,lastLesson:null}});
 for(const bad of [{gone:{answer:'x',saved:T0}},{commit:{answer:'x'.repeat(5001),saved:T0}},{commit:{answer:'x',saved:T0,rating:'ok'}},{commit:{answer:'x',saved:T0,correct:true,streak:1,at:T0}},{commit:{answer:'x',saved:T0,rating:'missed',correct:true,streak:1,at:T0}},{commit:{answer:'x',saved:T0,code:1}}])
  assert.throws(()=>B.parse(env(bad)),/exercise/i,JSON.stringify(bad));
 B.apply(B.plan(B.parse(env({commit:{answer:'Older',saved:T0-1},branch:{answer:'Newer',saved:T0+5}})).progress));
 assert.deepEqual([R.readExercises('git').commit.answer,R.readExercises('git').branch.answer],['Mine','Newer'],'The more recent change wins');
 assert(B.view().includes('2 exercises attempted'));
 // An older backup without exercises leaves them untouched.
 B.apply(B.plan(B.parse(JSON.stringify({app:'learning-notebook',version:1,progress:{paths:{git:{read:['commit'],assessed:[]}},financial:null,lastLesson:null}})).progress));
 assert.equal(R.readExercises('git').commit.answer,'Mine');}

// Progress: attempted exercises start a course and are counted; due exercises are named in review.
{const {P,R,path}=make(),git=path('git');
 R.saveAnswer(git,'commit','Mine',T0);R.rate(git,'branch','missed',null,T0);
 const s=P.summary(T0),c=s.started.find(c=>c.p.id==='git');
 assert.equal(c.review.attempted,1);assert.equal(s.attempted,1);assert.equal(s.review.dueExercises,1);
 const html=P.view(T0);assert(html.includes('Exercises attempted')&&html.includes('1 exercise attempted')&&html.includes('1 exercise due for review')&&html.includes('Review 1 exercise'));}
console.log('PASS: exercise attempts: saving, capped and cleared answers, solution after an attempt or on request, ratings and re-rating, review scheduling and page, backups with merge and validation, and progress counts.');
