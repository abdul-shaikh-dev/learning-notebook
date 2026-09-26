const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const root='paths/financial-foundations/';
const names=['curriculum','starter','foundations','advanced','exercises','activities','lab-guides','practice-data','source-register','journey'];
const source=names.map(n=>fs.readFileSync(root+'content/'+n+'.js','utf8')).join('\n');
const data=vm.runInNewContext(source+';({LESSONS,FOUNDATIONS,ADVANCED,EXERCISES,LABS,LAB_GUIDES,CASE_STEPS,PRACTICE_ROWS,SOURCE_REGISTER})');
assert.equal(data.FOUNDATIONS.length,6);assert.equal(data.EXERCISES.modules.length,5);assert.equal(data.EXERCISES.revision.length,6);
const expected={'foundations-numeric':2000000*97.4/100+12000,'control-numeric':-4000000*(101.05-101.2)/100,'hierarchy-numeric':12+3-2+.8-.2+1.5-.6,'prudence-numeric':Math.max(0,998-.5*996-.5*990),'working-numeric':-5000+8000,'revision-price-units':6000000*(99.65-99.8)/100,'revision-bridge':2500000-12000-7000+9000};
for(const m of data.EXERCISES.modules){assert.equal(m.tasks.length,4);assert.equal(new Set(m.tasks.map(t=>t.type)).size,4);for(const id of m.lessonIds)assert.ok(data.LESSONS.some(l=>l.id===id));}
for(const t of data.EXERCISES.modules.flatMap(m=>m.tasks).concat(data.EXERCISES.revision)){assert.ok(t.prompt&&t.answer&&t.reasoning&&t.rubric.length>=2);if(t.numericAnswer!==undefined)assert.ok(Math.abs(t.numericAnswer-expected[t.id])<0.001,t.id);}
for(const a of data.ADVANCED){assert.ok(data.LESSONS.some(l=>l.id===a.lessonId));assert.ok(a.citations.length);for(const c of a.citations)assert.ok(c.url.startsWith('https://')&&c.paragraph&&c.checkedDate&&c.status);}
assert.equal(data.LESSONS[15].quiz.correct,1);assert.ok(data.LESSONS[15].body[0].includes('bank pays 100'));
assert.equal(data.LAB_GUIDES.length,Object.keys(data.LABS).length);for(const g of data.LAB_GUIDES)assert.ok(data.LABS[g.id]&&g.prompt&&g.answer);
assert.equal(data.CASE_STEPS.length,6);assert.equal(data.PRACTICE_ROWS.length,6);
for(const file of ['sample-positions.csv','answers.md'])assert.equal(fs.readFileSync('practice/'+file,'utf8'),fs.readFileSync(root+'practice/'+file,'utf8'));
const nodes=new Map();const node=id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',value:'',addEventListener(type,fn){this[type]=fn;}});return nodes.get(id);};
vm.runInNewContext(source+'\n'+fs.readFileSync(root+'runtime/handbook.js','utf8'),{document:{getElementById:node},window:{print(){}}});
const pack=node('book').innerHTML;for(const id of ['introductions','foundations','main-lessons','labs','case','population','practice','reference','answers','sources','visual-stories','trade-journey'])assert.ok(pack.includes('id="'+id+'"'),id);
for(const g of data.LAB_GUIDES)assert.ok(pack.includes(g.id==='pv'?'Discounting':data.LABS[g.id].name));
for(const r of data.PRACTICE_ROWS)assert.ok(pack.includes(r.TradeId));
assert.ok(pack.indexOf('id="answers"')>pack.indexOf('id="practice"'));
const events={};const ctx={document:{addEventListener:(type,fn)=>events[type]=fn,getElementById:node},state:{done:[1],study:{}},esc:s=>String(s),save(){},render(){}};
vm.runInNewContext(source+'\n'+fs.readFileSync(root+'runtime/study.js','utf8'),ctx);
let html=vm.runInNewContext("practiceView('foundations')",ctx);assert.ok(html.includes('data-check-exercise'));
node('number-foundations-foundations-numeric').value='1960000';events.click({target:{closest:()=>({dataset:{checkExercise:'foundations|foundations-numeric'}})}});assert.ok(node('number-feedback-foundations-foundations-numeric').textContent.startsWith('The number matches'));
node('number-foundations-foundations-numeric').value='';events.click({target:{closest:()=>({dataset:{checkExercise:'foundations|foundations-numeric'}})}});assert.equal(node('number-feedback-foundations-foundations-numeric').textContent,'Enter a number first.');
events.click({target:{closest:()=>({dataset:{studyStatus:'foundations|practised'}})}});events.click({target:{closest:()=>({dataset:{studyStatus:'foundations|checked'}})}});assert.equal(ctx.state.study.foundations.checked,true);events.click({target:{closest:()=>({dataset:{studyStatus:'foundations|practised'}})}});assert.equal(ctx.state.study.foundations.checked,false);
console.log('PASS: reviewed content coverage, exercise calculations, complete study pack, numeric feedback and practice/self-check tracking.');
