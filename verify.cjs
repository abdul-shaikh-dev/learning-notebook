const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const C=require('./core.js');
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
const data=vm.runInNewContext(fs.readFileSync('content.js','utf8')+';({LESSONS,SOURCES,GLOSSARY,QUICK})');
assert.equal(data.LESSONS.length,18);checks++;
const sourceIds=new Set(data.SOURCES.map(x=>x.id));
for(const [i,l] of data.LESSONS.entries()){assert.equal(l.id,i+1);assert.ok(l.body.length>=4);assert.ok(l.deep&&l.data&&l.pitfall&&l.example&&l.quiz.explain);assert.ok(l.quiz.correct>=0&&l.quiz.correct<l.quiz.options.length);for(const s of l.sources)assert.ok(sourceIds.has(s));checks++;}
for(const file of ['index.html','handbook.html','styles.css','core.js','app.js','content.js','sample-positions.csv','practice-answers.md','README.md'])assert.ok(fs.existsSync(file),file);
for(const file of ['index.html','handbook.html']){const html=fs.readFileSync(file,'utf8');for(const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)){const ref=m[1];if(/^(https?:|data:|\$)/.test(ref)||ref.includes('${'))continue;assert.ok(fs.existsSync(ref),`${file}: ${ref}`);checks++;}}
const words=JSON.stringify(data.LESSONS).split(/\s+/).length;
console.log(`PASS: ${checks} arithmetic/content/link checks; ${data.LESSONS.length} lessons; ${data.GLOSSARY.length} glossary terms; approximately ${words} lesson-data words.`);
