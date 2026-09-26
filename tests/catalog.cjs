const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const paths=vm.runInNewContext(fs.readFileSync('content/paths.js','utf8')+';LEARNING_PATHS');
assert.equal(new Set(paths.map(p=>p.id)).size,paths.length);
for(const p of paths){assert.match(p.id,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);assert.ok(['ready','planned'].includes(p.status));if(p.status==='ready'&&p.href)assert.ok(fs.existsSync(p.href.split(/[?#]/)[0]));if(p.status==='ready'&&!p.href){assert.ok(Array.isArray(p.lessons)&&p.lessons.length);assert.equal(new Set(p.lessons.map(l=>l.id)).size,p.lessons.length);for(const l of p.lessons){assert.ok(l.title&&l.takeaway&&l.sections.length);if(l.quiz)assert.ok(l.quiz.options[l.quiz.correct]&&l.quiz.explanation);}}}
assert.ok(fs.readFileSync('assets/js/catalog.js','utf8').includes("'learning-notebook:path:'+id+':v1'"));
for(const m of fs.readFileSync('course.html','utf8').matchAll(/(?:src|href)="([^"#]+)"/g)){if(!/^(https?:|data:)/.test(m[1]))assert.ok(fs.existsSync(m[1].split(/[?#]/)[0]),m[1]);}
console.log('PASS: catalog schema, unique path IDs, course assets and path-scoped storage.');
// Exercise a future path with a fixture through the actual shared reader.
const fixture={id:'test-topic',title:'Test topic',status:'ready',description:'Fixture',lessons:[{id:'one',title:'First',takeaway:'Idea',sections:[{title:'Concept',paragraphs:['<safe text>']}],quiz:{question:'Q',options:['A','B'],correct:0,explanation:'Because'}}]};
const elements=new Map();const element=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',addEventListener(type,fn){this[type]=fn;},querySelectorAll(){return [];}});return elements.get(id);};
const stored=new Map();const context={LEARNING_PATHS:[fixture],document:{getElementById:element},location:{hash:'#topic/test-topic/one'},window:{addEventListener(){},scrollTo(){}},localStorage:{getItem:k=>stored.get(k)||null,setItem:(k,v)=>stored.set(k,v)}};
vm.runInNewContext(fs.readFileSync('assets/js/catalog.js','utf8'),context);
assert.ok(element('main').innerHTML.includes('&lt;safe text&gt;'));
element('mark-done').click({target:element('mark-done')});assert.equal(stored.get('learning-notebook:path:test-topic:v1'),'["one"]');
element('mark-done').click({target:element('mark-done')});assert.equal(stored.get('learning-notebook:path:test-topic:v1'),'[]');
context.location.hash='#path/test-topic';vm.runInNewContext('renderCatalog()',context);assert.ok(element('main').innerHTML.includes('0 of 1 read'));
context.location.hash='#topic/test-topic/missing';vm.runInNewContext('renderCatalog()',context);assert.ok(element('main').innerHTML.includes('Path unavailable'));
console.log('PASS: future-course rendering, text escaping, completion toggle and invalid routes.');
