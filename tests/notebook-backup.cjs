/* VM-only checks: no browser, network, repository storage or dependencies. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname,'../assets/js/notebook-backup.js'),'utf8');
const paths = [
  {id:'financial-foundations',title:'Financial foundations',status:'ready',lessons:24},
  {id:'python',title:'Python',status:'ready',lessons:[{id:'first'},{id:'second'}],stages:[{id:'foundation'},{id:'advanced'}]},
  {id:'sql-server',title:'SQL Server',status:'ready',lessons:[{id:'joins'}],stages:[{id:'foundation'}]}
];
const pk = id=>'learning-notebook:path:'+id+':v1';
const sk = id=>'learning-notebook:path:'+id+':assessments:v1';
const fk = 'valuation-lab-v1', last='learning-notebook:last-lesson:v1';
const plain = value=>JSON.parse(JSON.stringify(value));
function make(initial={}) {
  const data=new Map(Object.entries(initial)), writes=[], downloads=[];
  let writesUntilFailure=Infinity, persistentFailure=false;
  const storage={getItem:k=>data.has(k)?data.get(k):null,
    setItem(k,v){if(persistentFailure || --writesUntilFailure===0)throw Error('quota');writes.push(k);data.set(k,String(v));},
    removeItem(k){if(persistentFailure)throw Error('blocked');writes.push(k);data.delete(k);}};
  const context={LEARNING_PATHS:paths,localStorage:storage,TextEncoder,Blob,Date,console,
    URL:{createObjectURL:blob=>{downloads.push(blob);return'blob:backup';},revokeObjectURL:()=>{}},
    document:{createElement:()=>({click(){}})},setTimeout:fn=>fn()};
  vm.createContext(context);vm.runInContext(source,context);
  return {context,data,writes,downloads,api:vm.runInContext('NotebookBackup',context),
    failWrite(number){writesUntilFailure=number;},failAlways(){persistentFailure=true;}};
}
const finance = fields=>({done:[],starterDone:[],answers:{},last:1,study:{},...fields});
const progress = fields=>({paths:{},financial:null,lastLesson:null,...fields});
const envelope = value=>JSON.stringify({app:'learning-notebook',version:1,createdAt:'2026-09-26T00:00:00.000Z',progress:value});
const incoming = env=>env.api.parse(envelope(progress({paths:{python:{read:['second'],assessed:['advanced']}}}))).progress;
function dom() {
  const nodes={};
  for(const id of ['nb-status','nb-file','nb-apply','nb-export','nb-preview','nb-local']) {
    nodes[id]={textContent:'',innerHTML:'',disabled:id==='nb-apply',value:'',files:[],events:{},
      addEventListener(type,fn){this.events[type]=fn;}};
  }
  return {nodes,querySelector:selector=>nodes[selector.slice(1)]||null};
}
const tests=[];
const test=(name,run)=>tests.push({name,run});
test('exports every allowlisted progress category without unrelated storage',()=>{
  const env=make({[pk('python')]:JSON.stringify(['first']),[sk('python')]:JSON.stringify(['foundation']),
    [fk]:JSON.stringify(finance({done:[1],starterDone:[2],answers:{1:0},study:{foundations:{practised:true,checked:true}}})),
    [last]:JSON.stringify({path:'python',lesson:'first'}),'unrelated-secret':'do not export'});
  const exported=JSON.parse(env.api.create());
  assert.equal(exported.app,'learning-notebook');
  assert.deepEqual(exported.progress.paths.python,{read:['first'],assessed:['foundation']});
  assert.equal(exported.progress.financial.answers['1'],0);
  assert.equal(exported.progress.financial.study.foundations.checked,true);
  assert.equal(exported.progress.lastLesson.lesson,'first');
  assert(!JSON.stringify(exported).includes('unrelated-secret'));
  assert.equal(env.writes.length,0);
});
test('merge unions completions and preserves local answer and resume conflicts',()=>{
  const env=make({[pk('python')]:JSON.stringify(['first']),[sk('python')]:JSON.stringify(['foundation']),
    [last]:JSON.stringify({path:'python',lesson:'first'}),
    [fk]:JSON.stringify(finance({done:[1],answers:{1:0},last:2,study:{foundations:{practised:true,checked:false}}}))});
  const imported=progress({paths:{python:{read:['second'],assessed:['advanced']}},
    lastLesson:{path:'sql-server',lesson:'joins'},
    financial:finance({done:[2],starterDone:[1],answers:{1:2,2:1},last:8,study:{foundations:{practised:true,checked:true}}})});
  const preview=env.api.plan(imported);assert.equal(env.writes.length,0);
  env.api.apply(preview);
  assert.deepEqual(JSON.parse(env.data.get(pk('python'))),['first','second']);
  assert.deepEqual(JSON.parse(env.data.get(sk('python'))),['foundation','advanced']);
  const result=JSON.parse(env.data.get(fk));
  assert.deepEqual(result.done,[1,2]);assert.deepEqual(result.answers,{'1':0,'2':1});
  assert.equal(result.last,2);assert.equal(result.study.foundations.checked,true);
  assert.deepEqual(JSON.parse(env.data.get(last)),{path:'python',lesson:'first'});
});
test('legacy finance import affects only finance',()=>{
  const env=make({[pk('python')]:JSON.stringify(['first'])});
  const parsed=env.api.parse(JSON.stringify({done:[3],answers:{3:1},version:1}));
  assert.equal(parsed.legacy,true);env.api.apply(env.api.plan(parsed.progress));
  assert.deepEqual(env.writes,[fk]);assert.deepEqual(JSON.parse(env.data.get(fk)).done,[3]);
  assert.deepEqual(JSON.parse(env.data.get(pk('python'))),['first']);
});
test('rejects unsupported envelope keys versions identities and arbitrary storage keys',()=>{
  const env=make();
  const invalid=[{app:'another-app',version:1,progress:progress()},
    {app:'learning-notebook',version:2,progress:progress()},
    {app:'learning-notebook',version:1,progress:progress(),storage:{secret:'attack'}},
    {app:'learning-notebook',version:1,progress:progress({paths:{evil:{read:[],assessed:[]}}})},
    {done:[],answers:{},version:1,localStorage:{secret:'attack'}}];
  for(const value of invalid)assert.throws(()=>env.api.parse(JSON.stringify(value)));
  assert.equal(env.writes.length,0);
});
test('validates lesson stage resume finance answers and study invariants',()=>{
  const env=make();
  const invalid=[progress({paths:{python:{read:['missing'],assessed:[]}}}),
    progress({paths:{python:{read:[],assessed:['missing']}}}),
    progress({lastLesson:{path:'python',lesson:'missing'}}),
    progress({financial:finance({done:[19]})}),progress({financial:finance({starterDone:[7]})}),
    progress({financial:finance({answers:{1:3}})}),progress({financial:finance({answers:{__proto__:0,'19':1}})}),
    progress({financial:finance({last:0})}),
    progress({financial:finance({study:{foundations:{practised:false,checked:true}}})})];
  for(const value of invalid)assert.throws(()=>env.api.parse(envelope(value)));
  assert.equal(env.writes.length,0);
});
test('deduplicates valid IDs and imports missing last location',()=>{
  const env=make();
  const imported=env.api.parse(envelope(progress({paths:{python:{read:['first','first'],assessed:[]}},lastLesson:{path:'python',lesson:'first'}}))).progress;
  env.api.apply(env.api.plan(imported));
  assert.deepEqual(JSON.parse(env.data.get(pk('python'))),['first']);
  assert.equal(JSON.parse(env.data.get(last)).lesson,'first');
});
test('byte size and malformed JSON limits run before writes',()=>{
  const env=make();
  assert.throws(()=>env.api.parse('{broken'));
  assert.throws(()=>env.api.parse('é'.repeat(600000)),/too large/);
  assert.throws(()=>env.api.parse('x'.repeat(env.api.LIMIT+1)),/too large/);
  assert.equal(env.writes.length,0);
});
test('rollback restores changed existing keys and removes newly created keys',()=>{
  const initial={[pk('python')]:JSON.stringify(['first'])},env=make(initial);
  const preview=env.api.plan(progress({paths:{python:{read:['second'],assessed:['advanced']},'sql-server':{read:['joins'],assessed:[]}}}));
  env.failWrite(3);
  assert.throws(()=>env.api.apply(preview),/previous progress was restored/);
  assert.deepEqual(Object.fromEntries(env.data),initial);
});
test('reports rollback failure honestly',()=>{
  const env=make();const preview=env.api.plan(incoming(env));env.failAlways();
  assert.throws(()=>env.api.apply(preview),/Some progress may have changed/);
});
test('detects stale preview rather than overwriting newer local progress',()=>{
  const env=make(),preview=env.api.plan(incoming(env));
  env.data.set(pk('python'),JSON.stringify(['first']));
  assert.throws(()=>env.api.apply(preview),/Progress changed/);
  assert.deepEqual(JSON.parse(env.data.get(pk('python'))),['first']);assert.equal(env.writes.length,0);
});
test('does not trust forged write operations in a plan',()=>{
  const env=make(),preview=env.api.plan(incoming(env));preview.writes=[['evil','value']];
  env.api.apply(preview);assert.equal(env.data.has('evil'),false);
  assert.deepEqual(JSON.parse(env.data.get(pk('python'))),['second']);
});
test('missing or corrupt browser storage produces readable safe failures',()=>{
  const env=make({[pk('python')]:'not-json'});
  assert.throws(()=>env.api.create(),/unreadable/);assert.equal(env.writes.length,0);
  const unavailable=make();Object.defineProperty(unavailable.context,'localStorage',{get(){throw Error('blocked');}});
  assert.throws(()=>unavailable.api.create(),/storage is unavailable/);
  assert.match(unavailable.context.notebookBackupView(),/storage is unavailable/);
});
test('UI previews before explicit import and refreshes a stale preview',async()=>{
  const env=make(),main=dom();env.context.bindNotebookBackup(main);
  main.nodes['nb-file'].files=[{size:100,text:async()=>envelope(progress({paths:{python:{read:['second'],assessed:[]}}}))}];
  await main.nodes['nb-file'].events.change();
  assert.equal(env.writes.length,0);assert.equal(main.nodes['nb-apply'].disabled,false);
  assert.match(main.nodes['nb-preview'].innerHTML,/After merge/);
  env.data.set(pk('python'),JSON.stringify(['first']));
  main.nodes['nb-apply'].events.click();assert.equal(env.writes.length,0);
  assert.match(main.nodes['nb-status'].textContent,/preview is updated/);
  main.nodes['nb-apply'].events.click();
  assert.deepEqual(JSON.parse(env.data.get(pk('python'))),['first','second']);
  assert.equal(main.nodes['nb-apply'].disabled,true);
});
test('UI invalid selection clears previous approval and never imports',async()=>{
  const env=make(),main=dom();env.context.bindNotebookBackup(main);
  main.nodes['nb-file'].files=[{size:10,text:async()=>envelope(progress())}];
  await main.nodes['nb-file'].events.change();
  main.nodes['nb-file'].files=[{size:10,text:async()=>'{bad'}];
  await main.nodes['nb-file'].events.change();
  assert.equal(main.nodes['nb-apply'].disabled,true);main.nodes['nb-apply'].events.click();
  assert.equal(env.writes.length,0);
});
test('UI file-read races cannot restore an older preview',async()=>{
  const env=make(),main=dom();env.context.bindNotebookBackup(main);let resolve;
  main.nodes['nb-file'].files=[{size:10,text:()=>new Promise(r=>{resolve=r;})}];
  const older=main.nodes['nb-file'].events.change();
  main.nodes['nb-file'].files=[{size:10,text:async()=>'{bad'}];
  await main.nodes['nb-file'].events.change();resolve(envelope(progress()));await older;
  assert.equal(main.nodes['nb-apply'].disabled,true);assert.equal(env.writes.length,0);
});
test('backup download uses a JSON Blob and makes no storage writes',async()=>{
  const env=make(),main=dom();env.context.bindNotebookBackup(main);main.nodes['nb-export'].events.click();
  assert.equal(env.downloads.length,1);
  assert.equal(JSON.parse(await env.downloads[0].text()).app,'learning-notebook');assert.equal(env.writes.length,0);
});
(async()=>{for(const {name,run} of tests){await run();console.log('✓ '+name);}console.log(tests.length+' notebook backup checks passed.');})().catch(error=>{console.error(error);process.exitCode=1;});
