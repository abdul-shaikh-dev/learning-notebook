const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {readPaths}=require('../scripts/manifest.cjs');
const paths=readPaths().filter(p=>p.status==='ready'&&!p.href&&p.stages);
assert.ok(paths.length>=5);
const nodes=new Map(),stored=new Map();
function node(id){if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',disabled:false,addEventListener(t,fn){this[t]=fn;},querySelectorAll(){return [];}});return nodes.get(id);}
const context={LEARNING_PATHS:paths,document:{getElementById:node},location:{hash:''},window:{addEventListener(){},scrollTo(){},print(){}},localStorage:{getItem:k=>stored.get(k)||null,setItem:(k,v)=>stored.set(k,v)}};
vm.createContext(context);vm.runInContext((fs.readFileSync('assets/js/learning-tools.js','utf8')+'\n'+fs.readFileSync('assets/js/catalog.js','utf8')),context);
let count=0;
for(const p of paths){
 assert.ok(p.prerequisites.length&&p.setup.length&&p.outcomes.length&&p.nextSteps.length&&p.sources.length);
 assert.ok(p.lessons.length >= (p.category === 'Personal effectiveness' ? 12 : 20), p.id + ': complete course length');
 assert.deepEqual(p.stages.map(s=>s.id),['foundation','intermediate','advanced']);
 for(const stage of p.stages){assert.ok(stage.exitCriteria.length&&stage.project.requirements.length&&stage.project.rubric.length&&stage.project.solution);assert.ok(p.lessons.some(l=>l.stage===stage.id));}
 assert.ok(p.lessons.every(l=>p.stages.some(s=>s.id===l.stage)));
 for(const download of p.downloads||[]){assert.ok(fs.existsSync(download.href));assert.ok(p.publicFiles.includes(download.href.replace('paths/'+p.id+'/','')));}
 context.location.hash='#path/'+p.id;vm.runInContext('renderCatalog()',context);
 assert.ok(node('main').innerHTML.includes('Set up your practice environment'));
 for(const l of p.lessons){count++;assert.ok(l.sections.length>=2);assert.ok(l.exercise.prompt&&l.exercise.solution&&l.exercise.checks.length);assert.ok(l.exercise.solutionFormat===undefined||['prose','code'].includes(l.exercise.solutionFormat));assert.ok(l.quiz?.options[l.quiz.correct]||l.exercise.challenge&&l.exercise.hints.length===3);
 const choices=(l.quiz?.options||[]).map((_,i)=>({dataset:{choice:String(i)},addEventListener(t,fn){this[t]=fn;}}));
 node('main').querySelectorAll=selector=>selector==='[data-choice]'?choices:[];
 context.location.hash='#topic/'+p.id+'/'+l.id;vm.runInContext('renderCatalog()',context);
 if(l.quiz){choices[l.quiz.correct].click();assert.equal(node('feedback').textContent,'Correct. '+l.quiz.explanation);
 choices[(l.quiz.correct+1)%choices.length].click();assert.equal(node('feedback').textContent,'Not quite. '+l.quiz.explanation);}
 node('main').querySelectorAll=()=>[];
 assert.ok(node('main').innerHTML.includes('Compare with a worked solution'));
 assert.ok(!node('main').innerHTML.includes('<script>'));
 if(l.trace&&!l.diagram){node('trace-next').click();assert.ok(node('trace-frame').innerHTML.includes('Step 2'));node('trace-prev').click();assert.ok(node('trace-frame').innerHTML.includes('Step 1'));assert.equal(node('trace-prev').disabled,true);}
 }
 context.location.hash='#pack/'+p.id;vm.runInContext('renderCatalog()',context);
 assert.ok(node('main').innerHTML.includes('Print / save PDF'));assert.ok(node('main').innerHTML.includes('Worked solution'));
 assert.equal((node('main').innerHTML.match(/<h3>Worked solution/g)||[]).length,p.lessons.length);
 assert.equal((node('main').innerHTML.match(/<h4>Reference approach/g)||[]).length,p.stages.length);
 assert.ok(!node('main').innerHTML.includes('data-stage-check'));
}
console.log('PASS: '+count+' staged lessons, exercises, scoped references, downloads, visual traces and complete printable packs.');


const p=paths[0],key='learning-notebook:path:'+p.id+':assessments:v1';
const button={dataset:{stageCheck:'foundation'},addEventListener(t,fn){this[t]=fn;}};
node('main').querySelectorAll=selector=>selector==='[data-stage-check]'?[button]:[];
context.location.hash='#path/'+p.id;vm.runInContext('renderCatalog()',context);
const readingBefore=stored.get('learning-notebook:path:'+p.id+':v1');
button.click();assert.equal(stored.get(key),'["foundation"]');
assert.equal(stored.get('learning-notebook:path:'+p.id+':v1'),readingBefore);
button.click();assert.equal(stored.get(key),'[]');
stored.set(key,'broken');button.click();assert.equal(stored.get(key),'["foundation"]');
context.localStorage.setItem=()=>{throw new Error('blocked');};button.click();assert.match(button.textContent,/Could not save/);
console.log('PASS: stage coverage, project rubrics, independent self-assessment toggle and storage recovery.');
