// The Python course starter runner: view, worker lifecycle, drafts and fallbacks, without a real runtime.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function fixture(lesson,{failStorage=false,cacheKeys=null}={}){
 const nodes={},session=new Map(),workers=[],timers=new Map();let next=1;
 const element=id=>nodes[id]??={value:'',textContent:'',disabled:false,readOnly:false,addEventListener(t,fn){this[t]=fn;}};
 class Worker{constructor(url,options){this.url=String(url);this.options=options;workers.push(this);}postMessage(data){this.data=data;}terminate(){this.terminated=true;}}
 const sessionStorage={getItem:k=>{if(failStorage)throw Error();return session.has(k)?session.get(k):null;},setItem(k,v){if(failStorage)throw Error();session.set(k,v);},removeItem(k){if(failStorage)throw Error();session.delete(k);}};
 const context={escapeText:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;'),localStorage:{getItem:()=>null,setItem(){}},sessionStorage,document:{getElementById:element,baseURI:'https://example.test/notebook/'},URL,Worker,setTimeout:(fn,ms)=>{const id=next++;timers.set(id,{fn,ms});return id;},clearTimeout:id=>timers.delete(id)};if(cacheKeys)context.caches={keys:async()=>cacheKeys};
 vm.createContext(context);vm.runInContext(fs.readFileSync('assets/js/notebook-practice.js','utf8'),context);
 const api=vm.runInContext('NotebookPractice',context),path={id:'python',lessons:[lesson]};
 element('runner-code').value=lesson.exercise.starter;api.bind(path,lesson);
 return {api,path,lesson,element,session,workers,timers};
}
const lesson={id:'loops',exercise:{starter:'total = 0\n# <add evens>'}};
(async()=>{
 let f=fixture(lesson),e=f.element;
 // View: escaped starter in an editor, offline hint; run-locally lessons and other courses keep the static block.
 const html=f.api.runner(f.path,lesson);
 assert(html.includes('<textarea id="runner-code"')&&html.includes('# &lt;add evens>')&&html.includes('offline.html?course=python'));
 const local=f.api.runner(f.path,{id:'two',exercise:{starter:'# helpers.py',runLocally:'Uses <two> files.'}});
 assert(!local.includes('textarea')&&local.includes('Uses &lt;two> files.')&&local.includes('data-code-label="Python starter"'));
 assert(!f.api.runner({id:'sql-server'},lesson).includes('textarea'),'Only the Python course runs starters');
 // Run: a fresh worker in run mode with the shared runtime; inputs lock while running.
 e('runner-code').value='print("hi")';e('runner-run').click();let w=f.workers.at(-1);
 assert.equal(w.data.mode,'run');assert.equal(w.options?.type,'module','Pyodide 314 needs a module worker');assert.equal(w.data.code,'print("hi")');assert.equal(w.data.runtime,'https://example.test/notebook/paths/python-problem-solving/runtime/');
 assert(e('runner-run').disabled&&e('runner-code').readOnly&&!e('runner-stop').disabled);assert.equal(e('runner-output').textContent,'Loading Python…');
 assert([...f.timers.values()].some(t=>t.ms===60000));
 w.onmessage({data:{type:'ready'}});assert.equal(e('runner-output').textContent,'Running…');assert([...f.timers.values()].some(t=>t.ms===5000));
 w.onmessage({data:{type:'result',ok:true,output:'hi\n',truncated:false,error:''}});
 assert.equal(e('runner-output').textContent,'hi\n');assert(w.terminated&&!e('runner-run').disabled&&!e('runner-code').readOnly);
 // Output formatting: truncation, errors after output, and silence.
 assert.equal(f.api.outputText({output:'x',truncated:true,error:''}),'x\n… Output stopped after 20,000 characters.');
 assert.equal(f.api.outputText({output:'a\n',error:'Traceback…'}),'a\n\nTraceback…');
 assert.equal(f.api.outputText({ok:true,output:'',error:''}),'Finished with no output. Use print() to see values.');
 // Stop, the 5-second limit, startup failure and late messages.
 e('runner-run').click();w=f.workers.at(-1);e('runner-stop').click();w.onmessage({data:{type:'result',ok:true,output:'late'}});
 assert(w.terminated);assert.match(e('runner-output').textContent,/^Stopped\./);
 e('runner-run').click();w=f.workers.at(-1);w.onmessage({data:{type:'ready'}});[...f.timers.values()].find(t=>t.ms===5000).fn();
 assert(w.terminated);assert.match(e('runner-output').textContent,/5 seconds/);
 e('runner-run').click();w=f.workers.at(-1);[...f.timers.values()].find(t=>t.ms===60000).fn();assert.match(e('runner-output').textContent,/60 seconds/);
 e('runner-run').click();w=f.workers.at(-1);w.onmessage({data:{type:'error',text:'boom'}});assert.match(e('runner-output').textContent,/Python could not run: boom/);
 e('runner-run').click();w=f.workers.at(-1);w.onerror();assert.match(e('runner-output').textContent,/could not load/);
 // Leaving the lesson ends the run and ignores its result.
 e('runner-run').click();w=f.workers.at(-1);f.api.cleanup();w.onmessage({data:{type:'result',ok:true,output:'stale'}});assert(w.terminated);assert.notEqual(e('runner-output').textContent,'stale');
 // Drafts last for the tab; reset restores the starter.
 f=fixture(lesson);e=f.element;e('runner-code').value='edited';e('runner-code').input();
 assert.equal(f.session.get('learning-notebook:runner:python:loops'),'edited');assert(f.api.runner(f.path,lesson).includes('>edited</textarea>'));
 e('runner-reset').click();assert.equal(e('runner-code').value,lesson.exercise.starter);assert(!f.session.has('learning-notebook:runner:python:loops'));assert.equal(e('runner-output').textContent,'Starter restored.');
 // Ctrl+Enter runs; blocked storage still renders and runs.
 let prevented=false;e('runner-code').keydown({ctrlKey:true,key:'Enter',preventDefault(){prevented=true;}});assert(prevented&&f.workers.length===1);
 f=fixture(lesson,{failStorage:true});e=f.element;e('runner-code').input();assert(f.api.runner(f.path,lesson).includes('# &lt;add evens>'));e('runner-run').click();assert.equal(f.workers.length,1);
 // A spare worker loads Python ahead of the next run: only after Python has loaded here, never on Stop.
 {const g=fixture(lesson),x=g.element;assert.equal(g.workers.length,0,'Opening a lesson starts no download');
  x('runner-run').click();let w=g.workers.at(-1);w.onmessage({data:{type:'ready'}});w.onmessage({data:{type:'result',ok:true,output:'1\n',error:''}});
  const spare=g.workers.at(-1);assert.notEqual(spare,w);assert.equal(spare.options?.type,'module');assert.equal(spare.data.type,'load');assert.equal(spare.data.runtime,'https://example.test/notebook/paths/python-problem-solving/runtime/');
  spare.onmessage({data:{type:'ready'}});
  x('runner-code').value='print(2)';x('runner-run').click();assert.equal(g.workers.at(-1),spare,'The run takes the spare');assert.equal(spare.data.mode,'run');
  assert.equal(x('runner-output').textContent,'Running…','A ready spare skips the loading message');
  assert(![...g.timers.values()].some(t=>t.ms===60000)&&[...g.timers.values()].some(t=>t.ms===5000));
  spare.onmessage({data:{type:'ready'}});assert.equal([...g.timers.values()].filter(t=>t.ms===5000).length,1,'Its own ready message does not restart the limit');
  spare.onmessage({data:{type:'result',ok:true,output:'2\n',error:''}});assert.equal(x('runner-output').textContent,'2\n');assert(spare.terminated);
  const third=g.workers.at(-1);assert.notEqual(third,spare);assert.equal(third.data.type,'load');
  third.onmessage({data:{type:'error',text:'no memory'}});assert(third.terminated,'A spare that fails to load is dropped');
  x('runner-run').click();w=g.workers.at(-1);assert.notEqual(w,third);assert.equal(x('runner-output').textContent,'Loading Python…');
  const count=g.workers.length;x('runner-stop').click();assert.equal(g.workers.length,count,'Stop starts no spare');
  x('runner-run').click();w=g.workers.at(-1);w.onmessage({data:{type:'ready'}});w.onmessage({data:{type:'result',ok:true,output:'',error:''}});
  const last=g.workers.at(-1);g.api.cleanup();assert(last.terminated,'Leaving the notebook ends the spare');
  g.api.bind(g.path,lesson);const reopened=g.workers.at(-1);assert.notEqual(reopened,last);assert.equal(reopened.data.type,'load');
  g.api.bind({id:'sql-server',lessons:[]},{id:'reading',sections:[]});assert(reopened.terminated,'A lesson with nothing to run ends the spare');}
 // On a later visit a spare starts as soon as the service worker already keeps the runtime.
 {const kept=fixture(lesson,{cacheKeys:['learning-notebook:%2F:runtime:abc']});await new Promise(r=>setImmediate(r));
  assert.equal(kept.workers.length,1);assert.equal(kept.workers[0].data.type,'load');
  const none=fixture(lesson,{cacheKeys:['learning-notebook:%2F:shell:abc']});await new Promise(r=>setImmediate(r));assert.equal(none.workers.length,0);}
 console.log('PASS: Python starter runner view, run mode, locked inputs, output formatting, stop, timeouts, load failures, cleanup, tab drafts, reset, keyboard, blocked storage and the spare worker.');
})().catch(e=>{console.error(e);process.exitCode=1;});
