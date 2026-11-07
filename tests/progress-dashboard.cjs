const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
process.chdir(process.env.LEARNING_REPO||path.resolve(__dirname,'..'));
// The progress dashboard: per-course state and next step, review counts and totals, all from browser storage.
const DAY=864e5,NOW=Date.UTC(2026,10,1,12);
function env(saved={}){
 const store={...saved};
 const ctx={localStorage:{getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem:(k,v)=>{store[k]=String(v);},removeItem:k=>{delete store[k];}}};
 vm.createContext(ctx);
 vm.runInContext(['content/catalog.js','assets/js/notebook-review.js','assets/js/notebook-progress.js'].map(f=>fs.readFileSync(f,'utf8')).join('\n')+'\n;this.P=NotebookProgress;this.LEARNING_PATHS=LEARNING_PATHS;',ctx);
 return ctx;
}
const same=(a,b,m)=>assert.equal(JSON.stringify(a),JSON.stringify(b),m);
const key=id=>'learning-notebook:path:'+id+':v1',checks=id=>'learning-notebook:path:'+id+':assessments:v1',answers=id=>'learning-notebook:path:'+id+':checkpoints:v1';
const json=JSON.stringify;

// Nothing saved: no course is started, and the page explains how progress is recorded.
let e=env(),s=e.P.summary(NOW),html=e.P.view(NOW);
assert.equal(s.started.length,0);assert.equal(s.read,0);assert.equal(s.waiting.length,s.courses);
for(const text of ['No progress yet','Mark as read','checkpoint','project self-check','challenge','stays in this browser','Choose a course'])assert.ok(html.includes(text),'Empty state explains: '+text);
assert.ok(html.includes('Answer a lesson checkpoint'),'Empty review explains how questions join it');
assert.ok(!html.includes('Not started yet'),'The not-started list is only shown beside started courses');
assert.ok(!html.includes('progress-stats'),'No row of zero totals before any progress');

const paths=e.LEARNING_PATHS,python=paths.find(p=>p.id==='python'),sql=paths.find(p=>p.id==='sql-server'),pps=paths.find(p=>p.id==='python-problem-solving');
assert.equal(pps.challenges,pps.lessons.length,'The catalog counts challenges without loading the course');
assert.ok(!('challenges' in python),'Courses without challenges carry no count');
const [l1,l2,l3]=python.lessons;const fin0=paths.find(p=>p.id==='financial-foundations');
e=env({
 [key('python')]:json([l1.id,l2.id,l1.id,'not-a-lesson']),[checks('python')]:json([python.stages[0].id,'nope']),
 [answers('python')]:json({[l1.id]:{correct:false,streak:0,at:NOW-DAY},[l2.id]:{correct:true,streak:1,at:NOW},[l3.id]:{correct:true,streak:4,at:NOW-30*DAY},[l3.id+'/2']:{correct:true,streak:2,at:NOW-4*DAY}}),
 [key('sql-server')]:json(sql.lessons.map(l=>l.id)),
 'learning-notebook:challenges:python-problem-solving:v1':json({[pps.lessons[0].id]:{code:'x',status:'solved'},[pps.lessons[1].id]:{code:'y',status:'attempted'},[pps.lessons[2].id]:{code:'',status:'not-started'}}),
 [key('financial-foundations')]:json([fin0.lessons[0].id,fin0.lessons[1].id,fin0.lessons[1].id,fin0.lessons[14].id,'not-a-lesson']),'valuation-lab-v1':json({study:{foundations:{checked:true},revision:{checked:false}}}),
 [key('react')]:'{not json','learning-notebook:last-lesson:v1':json({path:'sql-server',lesson:sql.lessons[0].id})});
s=e.P.summary(NOW);
const byId=Object.fromEntries(s.started.map(c=>[c.p.id,c]));
same(Object.keys(byId).sort(),['financial-foundations','python','python-problem-solving','sql-server'],'Damaged storage starts nothing');
assert.equal(s.started[0].p.id,'sql-server','The course read most recently comes first');

const py=byId.python;
assert.equal(py.read,2,'Duplicates and unknown lessons do not count');assert.equal(py.total,python.lessons.length);
same(py.projects,{done:1,total:python.stages.length,label:'projects'});
same(py.review,{due:2,dueExercises:0,missed:1,scheduled:1,retired:1,next:NOW+DAY,attempted:0},'Missed and due-again questions are due; a week-old correct answer is retired');
same(py.step,{label:'Next: '+l3.title.replace(/^\d+\.\s*/,''),href:'#topic/python/'+l3.id},'The next step is the first unread lesson');

const q=byId['sql-server'];
assert.equal(q.read,q.total);same(q.step,{label:'Self-check your projects',href:'#path/sql-server'},'With every lesson read, the projects are next');
e.localStorage.setItem(checks('sql-server'),json(sql.stages.map(x=>x.id)));
same(e.P.summary(NOW).started.find(c=>c.p.id==='sql-server').step,{label:'Course complete · revisit it',href:'#path/sql-server'});

const ch=byId['python-problem-solving'];
same(ch.challenges,{solved:1,attempted:1,total:pps.lessons.length});assert.equal(ch.read,0);
same(ch.step,{label:'Next: '+pps.lessons[1].title.replace(/^\d+\.\s*/,''),href:'#topic/python-problem-solving/'+pps.lessons[1].id},'The next step skips a solved challenge');

const fin=byId['financial-foundations'];
assert.equal(fin.read,3,'Finance counts each valid lesson once');same(fin.projects,{done:1,total:7,label:'study sections',href:'course.html#practice'});
same(fin.step,{label:'Next: '+fin0.lessons[2].title.replace(/^\d+\.\s*/,''),href:'#topic/financial-foundations/'+fin0.lessons[2].id},'Finance continues with its first unread lesson');

assert.equal(s.read,2+sql.lessons.length+3,'Total lessons read');assert.equal(s.projects,1,'Finance study sections are not counted as projects');
assert.equal(s.solved,1);assert.equal(s.challenges,pps.lessons.length);
same(s.review,{due:2,dueExercises:0,missed:1,scheduled:1,retired:1,next:NOW+DAY});

html=e.P.view(NOW);
for(const text of ['Courses in progress','2 of '+python.lessons.length+' lessons read','1 of '+python.stages.length+' projects self-checked','2 questions due for review','1 of '+pps.lessons.length+' challenges solved · 1 in progress','Not started yet ('+(s.courses-4)+')','Review 2 questions','href="#review"','Due now','Retired'])assert.ok(html.includes(text),'Dashboard shows: '+text);
assert.ok(!html.includes('No progress yet'));assert.ok(html.includes('<dt>Lessons read</dt><dd>'+s.read+'</dd>'));
assert.match(html,/style="width:100%"/,'A finished course fills its meter');

// Nothing due: the review summary says when the next question returns.
e=env({[answers('python')]:json({[l1.id]:{correct:true,streak:2,at:NOW}})});
html=e.P.view(NOW);assert.ok(html.includes('Nothing is due. The next question returns in 3 days.'));assert.ok(!html.includes('Review 1 question'));

// Storage that throws on every read still renders.
const broken={localStorage:{getItem(){throw Error('blocked');}}};vm.createContext(broken);
vm.runInContext(['content/catalog.js','assets/js/notebook-review.js','assets/js/notebook-progress.js'].map(f=>fs.readFileSync(f,'utf8')).join('\n')+'\n;this.P=NotebookProgress;',broken);
assert.ok(broken.P.view(NOW).includes('No progress yet'),'Blocked storage shows the empty state');

const backup=fs.readFileSync('assets/js/notebook-backup.js','utf8');
assert.ok(backup.indexOf('nb-dashboard')<backup.indexOf('Back up progress'),'Backups stay on the page, below the dashboard');
console.log('PASS: progress dashboard: per-course lessons, projects, challenges and next step; review due, missed, scheduled and retired; totals; ordering; empty, damaged and blocked storage.');
