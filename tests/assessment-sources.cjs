const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const paths=require('../scripts/manifest.cjs').readPaths();
const node=()=>({innerHTML:'',textContent:'',addEventListener(){},querySelectorAll(){return [];}});
const ctx={LEARNING_PATHS:paths,document:{getElementById:node},window:{addEventListener(){},scrollTo(){}},location:{hash:''},localStorage:{getItem(){return null}}};
vm.createContext(ctx);vm.runInContext(['learning-tools','catalog'].map(f=>fs.readFileSync('assets/js/'+f+'.js','utf8')).join('\n'),ctx);
let lessons=0;
for(const p of paths.filter(p=>Array.isArray(p.lessons)&&p.status==='ready')){
 const counts=new Map();
 for(const l of p.lessons){
  lessons++;
  assert.ok(l.references?.length,`${p.id}/${l.id}: missing lesson references`);
  for(const ref of l.references){assert.ok(ref.title&&ref.section&&ref.scope&&/^\d{4}-\d{2}-\d{2}$/.test(ref.reviewed));assert.ok(ref.url.startsWith('https://'));}
  if(!l.quiz)continue;
  const choices=ctx.quizChoices(p,l),size=l.quiz.options.length;
  assert.equal(choices.length,size);
  assert.deepEqual(Array.from(choices,c=>c.index).sort(),l.quiz.options.map((_,i)=>i));
  assert.deepEqual(Array.from(choices,c=>c.text),Array.from(ctx.quizChoices(p,l),c=>c.text),'Stable on revisit');
  const correctPosition=choices.findIndex(c=>c.index===l.quiz.correct);
  assert.equal(choices[correctPosition].text,l.quiz.options[l.quiz.correct]);
  if(!counts.has(size))counts.set(size,Array(size).fill(0));counts.get(size)[correctPosition]++;
 }
 for(const values of counts.values())assert.ok(Math.max(...values)-Math.min(...values)<=1,p.id+' answer positions balanced');
 const pack=ctx.coursePack(p);assert.ok(pack.includes('Sources for this lesson'),p.id+' print references');
}
const html=ctx.lessonReferences({references:[{title:'<script>',url:'javascript:alert(1)',section:'<unsafe>',scope:'<scope>',reviewed:'2026-09-27'}]});
assert.ok(!html.includes('javascript:')&&!html.includes('<script>'));assert.ok(html.includes('&lt;script&gt;'));
console.log(`PASS: ${lessons} lessons have scoped sources; balanced stable quiz choices retain answer identity; print and escaping checked.`);

// Public self-check criteria must not reveal the quiz's answer before an attempt.
for(const id of ['testing-debugging','networking-web']){
 const p=paths.find(p=>p.id===id);
 for(const l of p.lessons){
  assert.ok(l.exercise.checks.length>=2,`${id}/${l.id}: useful self-check criteria`);
  for(const check of l.exercise.checks){
   assert.ok(!check.includes('Explain the reasoning behind this answer:'),`${id}/${l.id}: answer leakage`);
   assert.ok(!check.includes(l.quiz.options[l.quiz.correct]),`${id}/${l.id}: rubric reveals quiz answer`);
  }
 }
}
for(const [id,capstone] of [['data-structures-algorithms','algorithm-review'],['design-patterns','selection']]){
 const p=paths.find(p=>p.id===id), stages=p.stages.map(s=>s.id);
 for(let i=1;i<p.lessons.length;i++)assert.ok(stages.indexOf(p.lessons[i-1].stage)<=stages.indexOf(p.lessons[i].stage),id+' linear reader must follow stage progression');
 assert.equal(p.lessons.at(-1).id,capstone,id+' concludes with the review');
}
console.log('PASS: 48 answer-free rubrics and coherent DSA/Patterns progression.');
