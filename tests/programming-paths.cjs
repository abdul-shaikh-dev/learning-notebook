const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ids=['python','dotnet','react','sql-server','data-structures-algorithms'];
const paths=ids.map(id=>JSON.parse(fs.readFileSync('paths/'+id+'/path.json','utf8')));
const nodes=new Map(),stored=new Map();
function node(id){if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',disabled:false,addEventListener(t,fn){this[t]=fn;},querySelectorAll(){return [];}});return nodes.get(id);}
const context={LEARNING_PATHS:paths,document:{getElementById:node},location:{hash:''},window:{addEventListener(){},scrollTo(){},print(){}},localStorage:{getItem:k=>stored.get(k)||null,setItem:(k,v)=>stored.set(k,v)}};
vm.createContext(context);vm.runInContext(fs.readFileSync('assets/js/catalog.js','utf8'),context);
let count=0;
for(const p of paths){
 assert.ok(p.prerequisites.length&&p.setup.length&&p.outcomes.length&&p.nextSteps.length&&p.sources.length);
 assert.ok(p.lessons.length>=10);
 for(const download of p.downloads||[]){assert.ok(fs.existsSync(download.href));assert.ok(p.publicFiles.includes(download.href.replace('paths/'+p.id+'/','')));}
 context.location.hash='#path/'+p.id;vm.runInContext('renderCatalog()',context);
 assert.ok(node('main').innerHTML.includes('Set up your practice environment'));
 for(const l of p.lessons){count++;assert.ok(l.sections.length>=2);assert.ok(l.exercise.prompt&&l.exercise.solution&&l.exercise.checks.length);assert.ok(l.quiz.options[l.quiz.correct]);
 context.location.hash='#topic/'+p.id+'/'+l.id;vm.runInContext('renderCatalog()',context);
 assert.ok(node('main').innerHTML.includes('Compare with a worked solution'));
 assert.ok(!node('main').innerHTML.includes('<script>'));
 if(l.trace){node('trace-next').click();assert.ok(node('trace-frame').innerHTML.includes('Step 2'));node('trace-prev').click();assert.ok(node('trace-frame').innerHTML.includes('Step 1'));assert.equal(node('trace-prev').disabled,true);}
 }
 context.location.hash='#pack/'+p.id;vm.runInContext('renderCatalog()',context);
 assert.ok(node('main').innerHTML.includes('Print / save PDF'));assert.ok(node('main').innerHTML.includes('Worked solution'));
 assert.equal((node('main').innerHTML.match(/<h3>Worked solution/g)||[]).length,p.lessons.length);
}
console.log('PASS: '+count+' programming lessons, exercises, official references, downloads, visual traces and complete printable packs.');

