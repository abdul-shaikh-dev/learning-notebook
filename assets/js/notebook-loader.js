/* Classic scripts retain file:// use while loading only the requested course. */
const NotebookLoader = (() => {
 'use strict';
 const pending=new Map(),loaded=new Set();
 let searchReady=false,epoch=0;
 function register(data){
  const target=LEARNING_PATHS.find(p=>p.id===data.id);
  if(!target)throw Error('Unknown course chunk');
  Object.assign(target,data);loaded.add(data.id);
 }
 function script(file){
  if(pending.has(file))return pending.get(file);
  const promise=new Promise((resolve,reject)=>{
   const tag=document.createElement('script');tag.src=file;
   tag.onload=()=>{tag.remove();resolve();};
   tag.onerror=()=>{tag.remove();pending.delete(file);reject(Error('Could not load learning content'));};
   document.head.append(tag);
  });pending.set(file,promise);return promise;
 }
 // Lesson-only code and styles (highlighting, concept scenes, diagrams) wait in index.html as placeholders, in cascade and
 // execution order. The first page that shows lesson content adds each real tag beside its placeholder; other pages never fetch them.
 let lessonAssets=null,lessonReady=null;
 function lessonPending(){
  lessonAssets??=[...(document.querySelectorAll?.('meta[name="lesson-asset"]')||[])].map(mark=>({mark,done:false}));
  return lessonAssets.some(a=>!a.done);
 }
 function loadLessonAssets(){
  if(lessonReady)return lessonReady;
  lessonReady=Promise.all(lessonAssets.filter(a=>!a.done).map(asset=>new Promise((resolve,reject)=>{
   const file=asset.mark.content,css=file.split('?')[0].endsWith('.css'),tag=document.createElement(css?'link':'script');
   if(css){tag.rel='stylesheet';tag.href=file;}else{tag.async=false;tag.src=file;}
   tag.onload=()=>{asset.done=true;resolve();};
   tag.onerror=()=>{tag.remove();reject(Error('Could not load '+file));};
   asset.mark.after(tag);
  }))).catch(error=>{lessonReady=null;throw error;});
  return lessonReady;
 }
 function prepare(route,id,render){
  const turn=++epoch,hash=location.hash;
  const p=LEARNING_PATHS.find(p=>p.id===id&&p.status==='ready');
  let work;
  if(route==='search'&&!searchReady)work=()=>script(NOTEBOOK_SEARCH_FILE).then(()=>{if(typeof NOTEBOOK_SEARCH==='undefined')throw Error('Missing search index');searchReady=true;});
  else if(['path','topic','pack','resources'].includes(route)&&p&&(!p.href||route==='resources')){
   const course=!loaded.has(id),assets=lessonPending();
   if(course||assets)work=()=>Promise.all([course?script(p.dataFile).then(()=>{if(!loaded.has(id))throw Error('Missing course data');}):null,assets?loadLessonAssets():null]);
  }
  // Review loads only the courses whose questions are due.
  const reviewing=route==='review'&&typeof NotebookReview!=='undefined'?NotebookReview.dueCourses().map(id=>LEARNING_PATHS.find(p=>p.id===id)).filter(p=>p&&p.dataFile&&!loaded.has(p.id)):[];
  if(reviewing.length)work=()=>Promise.all(reviewing.map(p=>script(p.dataFile))).then(()=>{if(reviewing.some(p=>!loaded.has(p.id)))throw Error('Missing course data');});
  if(!work)return false;
  if(typeof stopVisualPlayback==='function')stopVisualPlayback();
  const main=document.getElementById('main');
  main.innerHTML='<p role="status">Loading '+(route==='search'?'search index':route==='review'?'review questions':'learning path')+'…</p>';
  work().then(()=>{if(turn===epoch&&hash===location.hash){render();main.focus?.({preventScroll:true});}}).catch(()=>{
   if(turn!==epoch||hash!==location.hash)return;
   // Allow a fresh request after network errors or a malformed/stale chunk.
   if(route==='search')pending.delete(NOTEBOOK_SEARCH_FILE);else for(const course of reviewing.length?reviewing:[p])pending.delete(course.dataFile);
   main.innerHTML='<h1>Content could not load</h1><p>Check your connection, then try again. Your saved progress is unchanged. For offline access, save this course first from <a href="offline.html">Offline &amp; install</a>.</p><button id="retry-content" type="button">Try again</button><p><a href="#">All learning paths</a></p>';
   document.getElementById('retry-content').addEventListener('click',render);
  });
  return true;
 }
 return {register,prepare};
})();
