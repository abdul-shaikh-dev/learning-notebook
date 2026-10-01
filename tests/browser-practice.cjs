const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function fixture(){
 const nodes={},store=new Map(),workers=[],timers=new Map();let next=1,fail=false;
 function element(id){return nodes[id]??={value:'',textContent:'',disabled:false,readOnly:false,addEventListener(t,fn){this[t]=fn;}};}
 const problem={function:'solve',cases:[{args:[1],expected:1}]};
 class Worker{constructor(){workers.push(this);}postMessage(data){this.data=data;}terminate(){this.terminated=true;}}
 const context={escapeText:s=>String(s).replaceAll('<','&lt;'),localStorage:{getItem:k=>store.get(k)||null,setItem(k,v){if(fail)throw Error();store.set(k,v);}},document:{getElementById:element,baseURI:'https://example.test/notebook/'},URL,Blob,AbortController,Worker,fetch:async()=>({ok:true,json:async()=>({one:problem})}),setTimeout:(fn,ms)=>{const id=next++;timers.set(id,{fn,ms});return id;},clearTimeout:id=>timers.delete(id)};
 vm.createContext(context);vm.runInContext(fs.readFileSync('assets/js/notebook-practice.js','utf8'),context);
 const api=vm.runInContext('NotebookPractice',context),lesson={id:'one',exercise:{challenge:true,starter:'def solve(a): return a'}},path={id:'test',lessons:[lesson]};
 element('challenge-code').value=lesson.exercise.starter;element('challenge-status').value='not-started';api.bind(path,lesson);
 return {api,path,lesson,element,store,workers,timers,fail:()=>fail=true};
}
(async()=>{
 let f=fixture(),e=f.element;
 e('challenge-code').value='<draft>';e('challenge-code').input();
 assert.equal(f.api.entry(f.path,f.lesson).status,'attempted');assert(f.api.view(f.path,f.lesson).includes('&lt;draft>'));
 e('challenge-status').value='solved';e('challenge-status').change();assert(f.api.overview(f.path).includes('1 solved'));
 e('challenge-code').input();assert.equal(e('challenge-status').value,'attempted');
 await e('challenge-run').click();let worker=f.workers.at(-1);assert.equal(e('challenge-run').disabled,true);assert.equal(e('challenge-code').readOnly,true);assert(worker.data.runtime.includes('/notebook/paths/'));
 worker.onmessage({data:{type:'ready'}});assert([...f.timers.values()].some(t=>t.ms===5000));
 worker.onmessage({data:{type:'result',ok:true,text:'passed'}});assert.equal(e('challenge-status').value,'solved');assert.equal(e('challenge-run').disabled,false);assert(worker.terminated);
 await e('challenge-run').click();worker=f.workers.at(-1);e('challenge-stop').click();worker.onmessage({data:{type:'result',ok:true,text:'stale'}});assert.match(e('challenge-result').textContent,/Stopped/);assert.equal(e('challenge-status').value,'attempted');
 await e('challenge-run').click();worker=f.workers.at(-1);worker.onmessage({data:{type:'ready'}});[...f.timers.values()].find(t=>t.ms===5000).fn();assert.match(e('challenge-result').textContent,/5 seconds/);assert(worker.terminated);
 await e('challenge-run').click();worker=f.workers.at(-1);f.api.cleanup();worker.onmessage({data:{type:'result',ok:true,text:'stale'}});assert.notEqual(e('challenge-result').textContent,'stale');assert(worker.terminated);
 f=fixture();e=f.element;f.fail();e('challenge-code').input();assert.match(e('challenge-save').textContent,/Could not save/);
 f=fixture();e=f.element;const pending=e('challenge-run').click();e('challenge-stop').click();await pending;assert.equal(f.workers.length,0);assert.match(e('challenge-result').textContent,/Stopped/);
 console.log('PASS: challenge drafts, escaped content, progress, stop, timeout, stale results, navigation cleanup, cancelled startup and storage failure.');
})().catch(e=>{console.error(e);process.exitCode=1;});
