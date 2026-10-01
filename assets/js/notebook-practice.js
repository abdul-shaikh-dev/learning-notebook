/* Challenge drafts and practice status are independent of reading progress. */
const NotebookPractice=(()=>{
 const statuses=['not-started','attempted','solved'];
 const key=id=>'learning-notebook:challenges:'+id+':v1';
 let dispose=()=>{};
 function read(id){try{const value=JSON.parse(localStorage.getItem(key(id))||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch{return {};}}
 function entry(p,l){const value=read(p.id)[l.id];return value&&typeof value.code==='string'&&value.code.length<=20000&&statuses.includes(value.status)?value:{code:l.exercise.starter,status:'not-started'};}
 function view(p,l){const value=entry(p,l);return `<div class="browser-practice"><label for="challenge-code">Your Python code</label><textarea id="challenge-code" spellcheck="false" autocapitalize="off" autocomplete="off" maxlength="20000" aria-describedby="challenge-editor-help">${escapeText(value.code)}</textarea><p id="challenge-editor-help">Ctrl+Enter runs the tests. Tab moves to the next control. Code runs in your browser; the first run loads about 12 MB of Python files.</p><div class="practice-actions"><button type="button" class="primary" id="challenge-run">Run tests</button><button type="button" id="challenge-stop" disabled>Stop</button><button type="button" id="challenge-download">Download my code</button></div><div id="challenge-result" role="status" aria-live="polite">Ready when you are.</div><div class="practice-progress"><label for="challenge-status">Practice status</label><select id="challenge-status">${statuses.map(s=>`<option value="${s}"${s===value.status?' selected':''}>${s==='not-started'?'Not started':s==='attempted'?'Attempted':'Solved'}</option>`).join('')}</select></div><p class="practice-note">Passing tests marks this solved. You can also update the status after working locally. Editing a solution marks it attempted. Reading progress stays separate.</p><p id="challenge-save" role="status">Drafts and practice status stay in this browser and are included in progress backups.</p><p class="practice-note">For offline tests, save this course from <a href="offline.html?course=python-problem-solving">Offline &amp; install</a>. Only the bundled Python standard library is available. Printed output is suppressed; return your answer.</p></div>`;}
 function overview(p){if(!p.lessons?.some(l=>l.exercise?.challenge))return '';const saved=read(p.id),lessons=p.lessons.filter(l=>l.exercise?.challenge);const solved=lessons.filter(l=>saved[l.id]?.status==='solved').length,attempted=lessons.filter(l=>saved[l.id]?.status==='attempted').length;return `<p class="practice-overview">Practice: ${solved} solved · ${attempted} attempted · ${lessons.length-solved-attempted} not started. Reading is tracked separately.</p>`;}
 function bind(p,l){dispose();dispose=()=>{};if(!p||!l?.exercise?.challenge)return;
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
   result.textContent='Loading Python and the test cases…';
   const request=new AbortController();controller=request;
   timer=setTimeout(()=>{end();result.textContent='Python could not start within 60 seconds. Retry online or use the downloaded practice files.';},60000);
   try{
    const response=await fetch('paths/python-problem-solving/practice/cases.json',{signal:request.signal});if(!response.ok)throw Error('Test cases are unavailable. Save this course for offline use or retry online.');
    const problems=await response.json();if(!active||request.signal.aborted)return;
    const problem=problems[l.id];if(!problem)throw Error('No test cases were found for this challenge.');
    const current=new Worker(new URL('assets/js/browser-python-worker.js',document.baseURI));worker=current;
    current.onmessage=({data})=>{
     if(!active||worker!==current)return;
     if(data.type==='ready'){clearTimeout(timer);result.textContent='Running tests…';timer=setTimeout(()=>{end();result.textContent='Stopped after 5 seconds. Check for a loop that never ends, or try a smaller amount of work.';},5000);return;}
     if(data.type==='result'){status.value=data.ok?'solved':'attempted';result.textContent=data.text;save();end();}
     else if(data.type==='error'){result.textContent='Python could not run: '+data.text+'\nYou can retry or use the downloadable practice files.';end();}
    };
    current.onerror=()=>{if(worker!==current)return;result.textContent='Python could not load. Retry online or use the downloadable practice files.';end();};
    current.postMessage({code:code.value,problem,runtime:new URL('paths/python-problem-solving/runtime/',document.baseURI).href});
   }catch(error){if(!active||request.signal.aborted)return;result.textContent=String(error.message||error);end();}
  });
  code.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();if(!run.disabled)run.click();}});
  document.getElementById('challenge-download').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([code.value+'\n'],{type:'text/x-python'})),a=document.createElement('a');a.href=url;a.download=l.id+'.py';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
 }
 function badge(p,l){if(!l.exercise?.challenge)return '';const status=entry(p,l).status;return '<span class="practice-badge">'+(status==='solved'?'Solved':status==='attempted'?'Attempted':'Not started')+'</span>';}
 return {view,bind,overview,badge,read,entry,key,cleanup:()=>dispose()};
})();
