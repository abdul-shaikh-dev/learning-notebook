const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
process.chdir(path.resolve(__dirname,'..'));
const C=require('../paths/financial-foundations/runtime/calculations.js');
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
const data=vm.runInNewContext(fs.readFileSync('paths/financial-foundations/content/curriculum.js','utf8')+'\n'+fs.readFileSync('paths/financial-foundations/content/starter.js','utf8')+';({LESSONS,SOURCES,GLOSSARY,QUICK,STARTER})');
assert.equal(data.LESSONS.length,18);checks++;
const sourceIds=new Set(data.SOURCES.map(x=>x.id));
for(const [i,l] of data.LESSONS.entries()){assert.equal(l.id,i+1);assert.ok(l.body.length>=4);assert.ok(l.deep&&l.data&&l.pitfall&&l.example&&l.quiz.explain);assert.ok(l.quiz.correct>=0&&l.quiz.correct<l.quiz.options.length);for(const s of l.sources)assert.ok(sourceIds.has(s));checks++;}
for(const file of ['index.html','handbook.html','assets/css/styles.css','paths/financial-foundations/runtime/calculations.js','paths/financial-foundations/runtime/app.js','paths/financial-foundations/content/curriculum.js','practice/sample-positions.csv','practice/answers.md','README.md'])assert.ok(fs.existsSync(file),file);
for(const file of ['index.html','handbook.html']){const html=fs.readFileSync(file,'utf8');for(const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)){const ref=m[1].split(/[?#]/)[0];if(/^(https?:|data:|\$)/.test(ref)||ref.includes('${'))continue;assert.ok(fs.existsSync(ref),`${file}: ${ref}`);checks++;}}
const words=JSON.stringify(data.LESSONS).split(/\s+/).length;
console.log(`PASS: ${checks} arithmetic/content/link checks; ${data.LESSONS.length} lessons; ${data.GLOSSARY.length} glossary terms; approximately ${words} lesson-data words.`);

assert.equal(data.STARTER.length,6);
for(const [i,l]of data.STARTER.entries()){assert.equal(l.id,i+1);assert.ok(l.paragraphs.length>=4);assert.ok(l.quiz.options[l.quiz.correct]);assert.ok(l.quiz.explain&&l.connection);}
for(const term of ['Trade','Position','Book','Desk','Counterparty','Settlement'])assert.ok(data.GLOSSARY.some(g=>g[0]===term));
console.log('PASS: 6 introductory lessons with valid checkpoints and essential beginner terms.');

const app=fs.readFileSync('paths/financial-foundations/runtime/app.js','utf8');
const validation=app.split('\n').find(line=>line.startsWith('function validateState'));
const validate=vm.runInNewContext(validation+';validateState',{STARTER:data.STARTER});
const legacy=validate({done:[1,5],answers:{1:2},last:5});
assert.equal(JSON.stringify(legacy.starterDone),'[]');
assert.equal(JSON.stringify(legacy.done),'[1,5]');
assert.equal(legacy.last,5);
assert.equal(JSON.stringify(validate({done:[],answers:{},starterDone:[1,1,6,7,-1]}).starterDone),'[1,6]');
console.log('PASS: legacy progress compatibility and introduction completion validation.');

const restored=validate({done:[1],answers:{1:0},starterDone:[2],study:{foundations:{practised:true,checked:true},revision:{practised:false,checked:true},unknown:{practised:true}}});
assert.equal(restored.study.foundations.checked,true);assert.equal(restored.study.revision.checked,false);assert.ok(!restored.study.unknown);

// Exercise the actual lab renderer with its real field contract, including sd=0.
const labs=vm.runInNewContext(fs.readFileSync('paths/financial-foundations/content/activities.js','utf8')+';LABS');
const labSource=app.slice(app.indexOf('const row='),app.indexOf('function caseView'));
function renderUncertainty(sd,side){
  const nodes={lab:{dataset:{key:'uncertainty'}},result:{},experiment:{},side:{value:side}};
  for(const [id,,value] of labs.uncertainty.fields)nodes[id]={value:String(id==='sd'?sd:value),setAttribute(){}};
  const render=vm.runInNewContext(labSource+';updateLab',{
    $:selector=>nodes[selector.slice(1)],LABS:labs,Calc:C,
    num:(value,digits=2)=>Number(value).toFixed(digits),money:value=>'$'+value.toFixed(2),esc:String
  });
  render();return {html:nodes.result.innerHTML,experiment:nodes.experiment.textContent};
}
for(const side of ['long','short']){
  const zero=renderUncertainty(0,side);
  assert.match(zero.html,/Deterministic price/);
  assert.match(zero.html,/100% at this price, none strictly above or below/);
  assert.match(zero.html,/no uncertainty deduction/);
  assert.doesNotMatch(zero.html,/90%|percentile/);
  assert.match(zero.experiment,/Increase the standard deviation above zero/);
  const numeric=C.uncertainty(100,0,10000000,side);
  near(numeric.price,100);near(numeric.low,100);near(numeric.high,100);near(numeric.deduction,0);
  const positive=renderUncertainty(.2,side);
  assert.match(positive.html,new RegExp(side==='long'?'10th percentile':'90th percentile'));
  assert.match(positive.html,new RegExp(side==='long'?'90% of this assumed distribution lies above':'90% of this assumed distribution lies below'));
  assert.doesNotMatch(positive.html,/Deterministic price/);
}
console.log('PASS: uncertainty lab rendering for zero and positive spread, long and short.');
