const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const app=read('paths/financial-foundations/runtime/app.js');
const study=read('paths/financial-foundations/runtime/study.js');
const fixtures=vm.runInNewContext(read('paths/financial-foundations/content/curriculum.js')+'\n'+read('paths/financial-foundations/content/starter.js')+'\n'+read('paths/financial-foundations/content/exercises.js')+';({LESSONS,STARTER,EXERCISES})');
const key='valuation-lab-v1';
function harness(initial){
  const disk=new Map(initial?[[key,JSON.stringify(initial)]]:[]),events={},nodes=new Map();let fail=false,focused=null;
  function node(selector){if(!nodes.has(selector))nodes.set(selector,{textContent:'',innerHTML:'',focus(){focused=selector;},querySelectorAll(){return [];}});return nodes.get(selector);}
  const ctx=vm.createContext({...fixtures,Intl,setTimeout(){},location:{hash:'#learn'},
    localStorage:{getItem:k=>disk.get(k)||null,setItem(k,v){if(fail)throw Error('quota');disk.set(k,v);}},
    document:{querySelector:node,querySelectorAll:()=>[],getElementById:id=>node('#'+id),addEventListener:(type,fn)=>{events['document:'+type]=fn;}},
    window:{scrollTo(){},addEventListener:(type,fn)=>{events[type]=fn;}},
    pathView:()=>'<h1>Lessons</h1>',lessonView:id=>'<h1>Lesson '+id+'</h1>',practiceView:()=>'<h1>Practice</h1>'});
  vm.runInContext(app.slice(0,app.indexOf('const MODULES')),ctx);
  vm.runInContext(app.slice(app.indexOf('function render('),app.indexOf("document.addEventListener('click',e=>")),ctx);
  vm.runInContext(app.slice(app.indexOf('async function importProgress'),app.indexOf('const smallScreen=')),ctx);
  vm.runInContext(study.slice(study.indexOf("document.addEventListener('click'")),ctx);
  vm.runInContext(app.split('\n').find(line=>line.startsWith("window.addEventListener('hashchange'")),ctx);
  return {ctx,disk,node,events,failWrites:()=>{fail=true;},snapshot:()=>JSON.parse(vm.runInContext('JSON.stringify(state)',ctx)),focus:()=>focused};
}
(async()=>{
  // Exercise the real study-status event -> save -> startup validation boundary.
  const h=harness();
  for(const field of ['practised','checked'])h.events['document:click']({target:{closest:()=>({dataset:{studyStatus:'integrated-investigations|'+field}})}});
  const reloaded=harness(JSON.parse(h.disk.get(key)));
  assert.deepEqual(reloaded.snapshot().study['integrated-investigations'],{practised:true,checked:true});
  const allStudy=Object.fromEntries([...fixtures.EXERCISES.modules.map(m=>m.id),'revision'].map(id=>[id,{practised:true,checked:true}]));
  const restored=harness({done:[],answers:{},study:allStudy});
  assert.deepEqual(restored.snapshot().study,allStudy,'every current practice module survives reload');
  const original={done:[2],answers:{2:1},last:2,starterDone:[1],study:{foundations:{practised:true,checked:false}}};
  const candidate={done:[5],answers:{5:0},last:5,starterDone:[2],study:{'integrated-investigations':{practised:true,checked:true}}};
  const failing=harness(original),before=failing.snapshot(),beforeDisk=failing.disk.get(key);failing.failWrites();
  failing.ctx.file={size:200,text:async()=>JSON.stringify(candidate)};
  assert.equal(await vm.runInContext('importProgress(file)',failing.ctx),false);
  assert.deepEqual(failing.snapshot(),before,'failed restore retains in-memory progress');
  assert.equal(failing.disk.get(key),beforeDisk,'failed restore retains saved progress');
  assert.match(failing.node('#toast').textContent,/could not be restored.*existing progress is unchanged/);
  const success=harness(original);success.ctx.file={size:200,text:async()=>JSON.stringify(candidate)};
  assert.equal(await vm.runInContext('importProgress(file)',success.ctx),true);
  assert.deepEqual(success.snapshot(),candidate);assert.deepEqual(harness(JSON.parse(success.disk.get(key))).snapshot(),candidate);
  assert.equal(success.node('#toast').textContent,'Progress restored.');
  success.ctx.file={size:5,text:async()=>'{bad'};
  assert.equal(await vm.runInContext('importProgress(file)',success.ctx),false);assert.deepEqual(success.snapshot(),candidate);
  assert.match(success.node('#toast').textContent,/not a valid/);
  // Initial load leaves browser focus alone; a real route event focuses its heading.
  const navigation=harness();assert.equal(navigation.focus(),null);
  navigation.ctx.location.hash='#lesson/2';navigation.events.hashchange();
  assert.equal(navigation.focus(),'#main h1');assert.equal(navigation.node('#main h1').tabIndex,-1);
  assert.match(navigation.node('#main').innerHTML,/Lesson 2/);
  const course=read('course.html');assert.match(course,/<details class="finance-extra-navigation"><summary>Practice &amp; reference/);
  assert.match(course,/<a href="#explore">Course overview<\/a>/);
  assert.match(course,/<a href="#learn">Course contents<\/a>/);
  assert.match(course,/<a href="index.html#resources\/financial-foundations">Practice files<\/a>/);
  assert.match(course,/<a href="#labs">Interactive labs<\/a>/);
  assert.match(course,/<div class="study-tools-content">[\s\S]*?<a class="file-link" href="offline.html\?course=financial-foundations">Offline &amp; install<\/a>/);
  assert.match(app,/document.querySelector\('\.course-menu'\)\.open=!smallScreen.matches/);
  assert.doesNotMatch(course,/id="(?:export|restore|import)"/);
  assert.match(course,/<a href="index.html#backup">Progress &amp; backups<\/a>/);
  console.log('PASS: finance study persistence, transactional restore (failure/success/invalid), route focus and reading-first navigation.');
})().catch(error=>{console.error(error);process.exitCode=1;});
