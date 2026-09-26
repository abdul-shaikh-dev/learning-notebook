const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
process.chdir(path.resolve(__dirname,'..'));
const C=require('../assets/js/core.js');
let checks=0;
function near(actual,expected){assert.ok(Math.abs(actual-expected)<0.00001,`${actual} != ${expected}`);checks++;}
near(C.bond(10000000,98.5,40000).dirty,9890000);
near(C.bond(-10000000,100.8,-20000).dirty,-10100000);
near(C.ipv(20000000,99.8,99.65,25000).diff,-30000);
near(C.ipv(-10000000,101,100.8,15000).diff,20000);
assert.equal(C.ipv(5000000,98,97.5,25000).breach,false);checks++;
assert.equal(C.ipv(20000000,100,100.2,40000).breach,false);checks++;
assert.equal(C.ipv(5000000,98,97.5,25000,false).status,'Unverified source');checks++;
near(C.pv(1000000,5,5),783526.1664684589);
near(C.pv(1000000,0,50),1000000);
near(C.pv(1000000,5,0),1000000);
const bridge=C.bridge(10200000,200000,500000,200000);
near(bridge.fv,10000000);near(bridge.increment,300000);near(bridge.prudent,9700000);
near(C.bridge(10200000,200000,500000,0).increment,500000);
near(C.bridge(10200000,200000,100000,200000).increment,0);
assert.throws(()=>C.bridge(1000,10,30,20));checks++;
assert.equal(C.fvh(true,false),'Level 1');assert.equal(C.fvh(false,false),'Level 2');assert.equal(C.fvh(false,true),'Level 3');checks+=3;
const long=C.uncertainty(100,.2,10000000,'long'),short=C.uncertainty(100,.2,10000000,'short');
near(long.price,99.7436896869);near(short.price,100.2563103131);near(long.deduction,short.deduction);near(C.uncertainty(100,0,10000000,'long').deduction,0);
const cap=C.capital(1000000000,3000000,10000000000);near(cap.afterPct,9.97);near(cap.changeBp,3);
const data=vm.runInNewContext(fs.readFileSync('content/curriculum.js','utf8')+'\n'+fs.readFileSync('content/starter.js','utf8')+';({LESSONS,SOURCES,GLOSSARY,QUICK,STARTER})');
assert.equal(data.LESSONS.length,18);checks++;
const sourceIds=new Set(data.SOURCES.map(x=>x.id));
for(const [i,l] of data.LESSONS.entries()){assert.equal(l.id,i+1);assert.ok(l.body.length>=4);assert.ok(l.deep&&l.data&&l.pitfall&&l.example&&l.quiz.explain);assert.ok(l.quiz.correct>=0&&l.quiz.correct<l.quiz.options.length);for(const s of l.sources)assert.ok(sourceIds.has(s));checks++;}
for(const file of ['index.html','handbook.html','assets/css/styles.css','assets/js/core.js','assets/js/app.js','content/curriculum.js','practice/sample-positions.csv','practice/answers.md','README.md'])assert.ok(fs.existsSync(file),file);
for(const file of ['index.html','handbook.html']){const html=fs.readFileSync(file,'utf8');for(const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)){const ref=m[1];if(/^(https?:|data:|\$)/.test(ref)||ref.includes('${'))continue;assert.ok(fs.existsSync(ref),`${file}: ${ref}`);checks++;}}
const words=JSON.stringify(data.LESSONS).split(/\s+/).length;
console.log(`PASS: ${checks} arithmetic/content/link checks; ${data.LESSONS.length} lessons; ${data.GLOSSARY.length} glossary terms; approximately ${words} lesson-data words.`);

assert.equal(data.STARTER.length,6);
for(const [i,l]of data.STARTER.entries()){assert.equal(l.id,i+1);assert.ok(l.paragraphs.length>=4);assert.ok(l.quiz.options[l.quiz.correct]);assert.ok(l.quiz.explain&&l.connection);}
for(const term of ['Trade','Position','Book','Desk','Counterparty','Settlement'])assert.ok(data.GLOSSARY.some(g=>g[0]===term));
console.log('PASS: 6 introductory lessons with valid checkpoints and essential beginner terms.');

const app=fs.readFileSync('assets/js/app.js','utf8');
const validation=app.split('\n').find(line=>line.startsWith('function validateState'));
const validate=vm.runInNewContext(validation+';validateState',{STARTER:data.STARTER});
const legacy=validate({done:[1,5],answers:{1:2},last:5});
assert.equal(JSON.stringify(legacy.starterDone),'[]');
assert.equal(JSON.stringify(legacy.done),'[1,5]');
assert.equal(legacy.last,5);
assert.equal(JSON.stringify(validate({done:[],answers:{},starterDone:[1,1,6,7,-1]}).starterDone),'[1,6]');
console.log('PASS: legacy progress compatibility and introduction completion validation.');
const paths=vm.runInNewContext(fs.readFileSync('content/paths.js','utf8')+';LEARNING_PATHS');
assert.equal(new Set(paths.map(p=>p.id)).size,paths.length);
for(const p of paths){assert.match(p.id,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);assert.ok(['ready','planned'].includes(p.status));if(p.status==='ready'&&p.href)assert.ok(fs.existsSync(p.href.split('#')[0]));if(p.status==='ready'&&!p.href){assert.ok(Array.isArray(p.lessons)&&p.lessons.length);assert.equal(new Set(p.lessons.map(l=>l.id)).size,p.lessons.length);for(const l of p.lessons){assert.ok(l.title&&l.takeaway&&l.sections.length);if(l.quiz)assert.ok(l.quiz.options[l.quiz.correct]&&l.quiz.explanation);}}}
assert.ok(fs.readFileSync('assets/js/catalog.js','utf8').includes("'learning-notebook:path:'+id+':v1'"));
for(const m of fs.readFileSync('course.html','utf8').matchAll(/(?:src|href)="([^"#]+)"/g)){if(!/^(https?:|data:)/.test(m[1]))assert.ok(fs.existsSync(m[1].split('#')[0]),m[1]);}
console.log('PASS: catalog schema, unique path IDs, course assets and path-scoped storage.');
// Exercise a future path with a fixture through the actual shared reader.
const fixture={id:'test-topic',title:'Test topic',status:'ready',description:'Fixture',lessons:[{id:'one',title:'First',takeaway:'Idea',sections:[{title:'Concept',paragraphs:['<safe text>']}],quiz:{question:'Q',options:['A','B'],correct:0,explanation:'Because'}}]};
const elements=new Map();const element=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',addEventListener(type,fn){this[type]=fn;},querySelectorAll(){return [];}});return elements.get(id);};
const stored=new Map();const context={LEARNING_PATHS:[fixture],document:{getElementById:element},location:{hash:'#topic/test-topic/one'},window:{addEventListener(){},scrollTo(){}},localStorage:{getItem:k=>stored.get(k)||null,setItem:(k,v)=>stored.set(k,v)}};
vm.runInNewContext(fs.readFileSync('assets/js/catalog.js','utf8'),context);
assert.ok(element('main').innerHTML.includes('&lt;safe text&gt;'));
element('mark-done').click({target:element('mark-done')});assert.equal(stored.get('learning-notebook:path:test-topic:v1'),'["one"]');
element('mark-done').click({target:element('mark-done')});assert.equal(stored.get('learning-notebook:path:test-topic:v1'),'[]');
context.location.hash='#path/test-topic';vm.runInNewContext('renderCatalog()',context);assert.ok(element('main').innerHTML.includes('0 of 1 complete'));
context.location.hash='#topic/test-topic/missing';vm.runInNewContext('renderCatalog()',context);assert.ok(element('main').innerHTML.includes('Path unavailable'));
console.log('PASS: future-course rendering, text escaping, completion toggle and invalid routes.');
