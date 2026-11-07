/* Challenge drafts and practice status are independent of reading progress. */
const NotebookPractice=(()=>{
 const statuses=['not-started','attempted','solved'];
 const key=id=>'learning-notebook:challenges:'+id+':v1';
 let dispose=()=>{};
 function read(id){try{const value=JSON.parse(localStorage.getItem(key(id))||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch{return {};}}
 function entry(p,l){const value=read(p.id)[l.id];return value&&typeof value.code==='string'&&value.code.length<=20000&&statuses.includes(value.status)?value:{code:l.exercise.starter,status:'not-started'};}
 function view(p,l){const value=entry(p,l);return `<div class="browser-practice"><label for="challenge-code">Your Python code</label><textarea id="challenge-code" spellcheck="false" autocapitalize="off" autocomplete="off" maxlength="20000" aria-describedby="challenge-editor-help">${escapeText(value.code)}</textarea><p id="challenge-editor-help">Ctrl+Enter runs the tests. Tab moves to the next control. Code runs in your browser; the first run loads about 12 MB of Python files.</p><div class="practice-actions"><button type="button" class="primary" id="challenge-run">Run tests</button><button type="button" id="challenge-stop" disabled>Stop</button><button type="button" id="challenge-download">Download my code</button></div><div id="challenge-result" role="status" aria-live="polite">Ready when you are.</div><div class="practice-progress"><label for="challenge-status">Practice status</label><select id="challenge-status">${statuses.map(s=>`<option value="${s}"${s===value.status?' selected':''}>${s==='not-started'?'Not started':s==='attempted'?'Attempted':'Solved'}</option>`).join('')}</select></div><p class="practice-note">Passing tests marks this solved. You can also update the status after working locally. Editing a solution marks it attempted. Reading progress stays separate.</p><p id="challenge-save" role="status">Drafts and practice status stay in this browser and are included in progress backups.</p><p class="practice-note">For offline tests, save this course from <a href="offline.html?course=python-problem-solving">Offline &amp; install</a>. Only the bundled Python standard library is available. Printed output is suppressed; return your answer.</p></div>`;}
 function overview(p){if(!p.lessons?.some(l=>l.exercise?.challenge))return '';const saved=read(p.id),lessons=p.lessons.filter(l=>l.exercise?.challenge);const solved=lessons.filter(l=>saved[l.id]?.status==='solved').length,attempted=lessons.filter(l=>saved[l.id]?.status==='attempted').length;return `<p class="practice-overview">Practice: ${solved} solved · ${attempted} attempted · ${lessons.length-solved-attempted} not started. Reading is tracked separately.</p>`;}
 function bind(p,l){dispose();dispose=()=>{};if(runnable(p,l)||l?.exercise?.challenge||(l?.sections||[]).some(s=>exampleRunnable(p,s)))prepare();else drop();bindExamples(p,l);if(runnable(p,l)){bindRunner(p,l);return;}if(!p||!l?.exercise?.challenge)return;
  const code=document.getElementById('challenge-code');if(!code)return;
  const run=document.getElementById('challenge-run'),stop=document.getElementById('challenge-stop'),status=document.getElementById('challenge-status'),result=document.getElementById('challenge-result'),saved=document.getElementById('challenge-save');
  let worker=null,timer=null,controller=null,active=true;
  const save=()=>{try{const data=read(p.id);data[l.id]={code:code.value,status:status.value};localStorage.setItem(key(p.id),JSON.stringify(data));saved.textContent='Draft and practice status saved in this browser.';}catch{saved.textContent='Could not save this draft. Download your code before leaving this page.';}};
  const end=()=>{if(worker)worker.terminate();worker=null;if(controller)controller.abort();controller=null;clearTimeout(timer);timer=null;run.disabled=false;stop.disabled=true;code.readOnly=false;status.disabled=false;};
  dispose=()=>{active=false;end();};
  code.addEventListener('input',()=>{status.value='attempted';save();});
  status.addEventListener('change',save);
  stop.addEventListener('click',()=>{end();result.textContent='Stopped. Your code is still here; revise it and run again.';});
  run.addEventListener('click',async()=>{
   end();status.value='attempted';save();run.disabled=true;stop.disabled=false;code.readOnly=true;status.disabled=true;
   result.textContent=warmSpare()?'Loading the test cases…':'Loading Python and the test cases…';
   const request=new AbortController();controller=request;
   timer=setTimeout(()=>{end();result.textContent='Python could not start within 60 seconds. Retry online or use the downloaded practice files.';},60000);
   try{
    const response=await fetch('paths/python-problem-solving/practice/cases.json',{signal:request.signal});if(!response.ok)throw Error('Test cases are unavailable. Save this course for offline use or retry online.');
    const problems=await response.json();if(!active||request.signal.aborted)return;
    const problem=problems[l.id];if(!problem)throw Error('No test cases were found for this challenge.');
    const spareWorker=take(),current=spareWorker.worker;worker=current;
    const running=()=>{warmed=true;clearTimeout(timer);result.textContent='Running tests…';timer=setTimeout(()=>{end();result.textContent='Stopped after 5 seconds. Check for a loop that never ends, or try a smaller amount of work.';warm();},5000);};
    current.onmessage=({data})=>{
     if(!active||worker!==current)return;
     if(data.type==='ready'){if(!spareWorker.ready){spareWorker.ready=true;running();}return;}
     if(data.type==='result'){status.value=data.ok?'solved':'attempted';result.textContent=data.text;save();end();warm();}
     else if(data.type==='error'){result.textContent='Python could not run: '+data.text+'\nYou can retry or use the downloadable practice files.';end();}
    };
    current.onerror=()=>{if(worker!==current)return;result.textContent='Python could not load. Retry online or use the downloadable practice files.';end();};
    if(spareWorker.ready)running();
    current.postMessage({code:code.value,problem,runtime:new URL('paths/python-problem-solving/runtime/',document.baseURI).href});
   }catch(error){if(!active||request.signal.aborted)return;result.textContent=String(error.message||error);end();}
  });
  code.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();if(!run.disabled)run.click();}});
  document.getElementById('challenge-download').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([code.value+'\n'],{type:'text/x-python'})),a=document.createElement('a');a.href=url;a.download=l.id+'.py';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
 }
 // Python course starters run in the same fresh-worker sandbox as challenges, without tests or saved drafts.
 const runtime=()=>new URL('paths/python-problem-solving/runtime/',document.baseURI).href;
 // A spare worker loads Python ahead of the next run, so a run does not wait about a second for start-up.
 // Each run still takes its own worker. A spare starts only once Python has loaded in this page or the
 // service worker already keeps the runtime, so opening a lesson never starts the 12 MB download.
 const workerURL=()=>new URL('assets/js/browser-python-worker.js',document.baseURI);
 let spare=null,warmed=false;
 function warm(){
  if(spare||!warmed)return;
  const s={worker:new Worker(workerURL()),ready:false};spare=s;
  s.worker.onmessage=({data})=>{if(spare!==s)return;if(data.type==='ready')s.ready=true;else drop();};
  s.worker.onerror=()=>{if(spare===s)drop();};
  s.worker.postMessage({type:'load',runtime:runtime()});
 }
 function drop(){if(spare)spare.worker.terminate();spare=null;}
 const warmSpare=()=>!!spare?.ready;
 function take(){const s=spare;spare=null;return s||{worker:new Worker(workerURL()),ready:false};}
 function prepare(){if(warmed){warm();return;}try{caches.keys().then(keys=>{if(keys.some(k=>k.includes(':runtime:'))){warmed=true;warm();}},()=>{});}catch{}}
 const draftKey=(p,l)=>'learning-notebook:runner:'+p.id+':'+l.id;
 const runnable=(p,l)=>p?.id==='python'&&!!l?.exercise?.starter&&!l.exercise.challenge&&!l.exercise.runLocally;
 function runner(p,l){
  const e=l.exercise,local=`<pre class="example" data-language="python" data-code-label="Python starter"><code>${escapeText(e.starter)}</code></pre>`;
  if(!runnable(p,l))return `<p>${escapeText(e.runLocally||'Copy into a Python file and run locally.')}</p>${local}`;
  let code=e.starter;try{code=sessionStorage.getItem(draftKey(p,l))??e.starter;}catch{}
  return `<div class="browser-practice python-runner"><label for="runner-code">Python starter</label><textarea id="runner-code" spellcheck="false" autocapitalize="off" autocomplete="off" maxlength="20000" aria-describedby="runner-help">${escapeText(code)}</textarea><p id="runner-help">Edit and run it here, or copy it into a Python file and run it locally. Ctrl+Enter runs; Tab moves to the next control. Only the standard library is available, input() has nothing to read, and the first run loads about 12 MB. Edits last until you close this tab.</p><div class="practice-actions"><button type="button" class="primary" id="runner-run">Run</button><button type="button" id="runner-stop" disabled>Stop</button><button type="button" id="runner-reset">Reset to starter</button></div><div id="runner-output" role="status" aria-live="polite" tabindex="0" aria-label="Output">Output appears here.</div><p class="practice-note">To run this offline, save the Python course from <a href="offline.html?course=python">Offline &amp; install</a>.</p></div>`;
 }
 function outputText(r){const text=(r.output||'')+(r.truncated?'\n… Output stopped after 20,000 characters.':'')+(r.error?(r.output?'\n':'')+r.error:'');return text||'Finished with no output. Use print() to see values.';}
 // One run in a fresh worker: 60 seconds to start, 5 to finish. Returns a function that stops it.
 function launch({code,files=[],show,result,done}){
  let timer=null,finished=false;const s=take(),worker=s.worker;
  const end=()=>{if(finished)return;finished=true;worker.terminate();clearTimeout(timer);done();};
  const running=()=>{warmed=true;clearTimeout(timer);show('Running…');timer=setTimeout(()=>{show('Stopped after 5 seconds. Check for a loop that never ends, or try a smaller amount of work.');end();warm();},5000);};
  if(s.ready)running();else timer=setTimeout(()=>{show('Python could not start within 60 seconds. Retry online, or copy the code and run it locally.');end();},60000);
  worker.onmessage=({data})=>{
   if(finished)return;
   if(data.type==='ready'){if(!s.ready){s.ready=true;running();}return;}
   show(data.type==='result'?result(data):'Python could not run: '+data.text+'\nRetry, or copy the code and run it locally.');end();if(data.type==='result')warm();
  };
  worker.onerror=()=>{if(finished)return;show('Python could not load. Retry online, or copy the code and run it locally.');end();};
  worker.postMessage({mode:'run',code,files,runtime:runtime()});
  return end;
 }
 function bindRunner(p,l){
  const code=document.getElementById('runner-code');if(!code)return;
  const run=document.getElementById('runner-run'),stop=document.getElementById('runner-stop'),reset=document.getElementById('runner-reset'),output=document.getElementById('runner-output');
  let halt=null;
  const end=()=>{if(halt)halt();};
  dispose=end;
  code.addEventListener('input',()=>{try{sessionStorage.setItem(draftKey(p,l),code.value);}catch{}});
  reset.addEventListener('click',()=>{end();code.value=l.exercise.starter;try{sessionStorage.removeItem(draftKey(p,l));}catch{}output.textContent='Starter restored.';});
  stop.addEventListener('click',()=>{end();output.textContent='Stopped. Your code is still here; revise it and run again.';});
  run.addEventListener('click',()=>{
   end();run.disabled=true;stop.disabled=false;code.readOnly=true;output.textContent=warmSpare()?'Running…':'Loading Python…';
   halt=launch({code:code.value,show:text=>{output.textContent=text;},result:outputText,done:()=>{halt=null;run.disabled=false;stop.disabled=true;code.readOnly=false;}});
  });
  code.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();if(!run.disabled)run.click();}});
 }
 // Lesson examples in courses marked runExamples run unchanged, with any practice modules they import.
 // exampleFormat marks an example that is not runnable Python, such as a text diagram; exampleRunLocally gives the reason a Python example cannot run in the browser.
 const exampleRunnable=(p,s)=>!!p?.runExamples&&!!s?.example&&!s.exampleFormat&&!s.exampleRunLocally;
 function exampleControls(p,s,i){
  if(!exampleRunnable(p,s))return '';
  const rows=Math.min(Math.max(s.example.split('\n').length+1,4),24);
  return `<div class="browser-practice example-runner no-print"><div class="practice-actions example-actions"><button type="button" class="primary" id="example-run-${i}">Run</button><button type="button" id="example-edit-${i}" aria-controls="example-editor-${i}">Edit</button><button type="button" id="example-reset-${i}" hidden>Reset</button></div><div id="example-editing-${i}" hidden><label for="example-editor-${i}">Your version of this example</label><textarea id="example-editor-${i}" rows="${rows}" spellcheck="false" autocapitalize="off" autocomplete="off" maxlength="20000" aria-describedby="example-help-${i}">${escapeText(s.example)}</textarea><p id="example-help-${i}">Ctrl+Enter runs. Edits last until you leave this lesson.</p></div><div id="example-output-${i}" class="example-output" role="status" aria-live="polite" tabindex="0" aria-label="Output of this example" hidden></div></div>`;
 }
 function exampleText(r,code){return r.ok&&!r.output&&/^\s*assert\b/m.test(code)?'Finished without errors: every assert held. Add print() to see values.':outputText(r);}
 let stopExamples=()=>{};
 function bindExamples(p,l){
  stopExamples();const stops=[];stopExamples=()=>{for(const stop of stops)stop();};
  (l?.sections||[]).forEach((s,i)=>{
   const run=exampleRunnable(p,s)&&document.getElementById('example-run-'+i);if(!run)return;
   const edit=document.getElementById('example-edit-'+i),reset=document.getElementById('example-reset-'+i),editing=document.getElementById('example-editing-'+i),editor=document.getElementById('example-editor-'+i),output=document.getElementById('example-output-'+i);
   const pre=document.getElementById('example-code-'+i),panel=pre?.closest?.('.code-panel')||pre;
   let halt=null,attempt=0;
   const idle=()=>{halt=null;run.textContent='Run';editor.readOnly=false;};
   const end=()=>{attempt++;if(halt)halt();else idle();};
   stops.push(end);
   const setEditing=on=>{editing.hidden=!on;if(panel)panel.hidden=on;edit.hidden=on;reset.hidden=!on;};
   edit.addEventListener('click',()=>{setEditing(true);editor.focus();});
   reset.addEventListener('click',()=>{end();editor.value=s.example;setEditing(false);output.hidden=true;output.textContent='';edit.focus();});
   run.addEventListener('click',async()=>{
    if(run.textContent==='Stop'){end();output.textContent='Stopped. Revise the code and run it again.';return;}
    end();const current=attempt,code=editing.hidden?s.example:editor.value;
    run.textContent='Stop';editor.readOnly=true;output.hidden=false;output.textContent=warmSpare()?'Running…':'Loading Python… The first run downloads about 12 MB.';
    let files=[];
    try{files=await Promise.all((s.exampleFiles||[]).map(async file=>{const response=await fetch('paths/'+p.id+'/'+file);if(!response.ok)throw Error(file);return {name:file.split('/').pop(),source:await response.text()};}));}
    catch(error){if(current!==attempt)return;output.textContent='This example imports '+String(error.message||error)+', which could not load. Retry online, or save this course from Offline & install.';idle();return;}
    if(current!==attempt)return;
    halt=launch({code,files,show:text=>{output.textContent=text;},result:r=>exampleText(r,code),done:idle});
   });
   editor.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();if(run.textContent==='Run')run.click();}});
  });
 }
 function badge(p,l){if(!l.exercise?.challenge)return '';const status=entry(p,l).status;return '<span class="practice-badge">'+(status==='solved'?'Solved':status==='attempted'?'Attempted':'Not started')+'</span>';}
 return {view,bind,runner,outputText,exampleControls,exampleText,overview,badge,read,entry,key,cleanup:()=>{dispose();stopExamples();drop();}};
})();
