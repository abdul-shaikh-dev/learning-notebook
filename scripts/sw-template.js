/* Build injects an integrity-checked, scope-relative publication inventory. */
const CONFIG = __PWA_CONFIG__;
const BASE=new URL('./',self.location.href);
const say=text=>Object.assign(Error(text),{friendly:true});
const PREFIX='learning-notebook:'+encodeURIComponent(BASE.pathname)+':';
const SHELL=PREFIX+'shell:'+CONFIG.version,REGISTRY=PREFIX+'downloads';
// The Python runtime (about 14 MB) is kept after its first verified download, so later runs and publications do not fetch it again.
const RUNTIME=CONFIG.runtime?.files?.length?PREFIX+'runtime:'+CONFIG.runtime.version:null;
const runtimeFile=file=>!!RUNTIME&&CONFIG.runtime.files.includes(file);
// Diagrams (Mermaid) and the search index are not precached with the shell (#151). They are kept after first use or when
// a course is saved, in a cache named by their own hash, so a publication that does not change them keeps them.
const EXTRAS=CONFIG.extras?.files?.length?PREFIX+'extras:'+CONFIG.extras.version:null;
const extrasFile=file=>!!EXTRAS&&CONFIG.extras.files.includes(file);
const locks=new Map();
const absolute=file=>new URL(file,BASE).href;
const registryKey=id=>absolute('__offline-course/'+id);
const course=id=>CONFIG.courses.find(c=>c.id===id);
async function digest(bytes){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');}
async function verified(file){
 const response=await fetch(absolute(file),{cache:'reload',signal:AbortSignal.timeout(30000)});
 if(!response.ok||response.type==='opaque')throw say('A file could not be downloaded. Check your connection and try again.');
 if(await digest(await response.clone().arrayBuffer())!==CONFIG.files[file].hash)throw say('The notebook changed during download. Apply the available update, then try again.');
 return response;
}
// An unchanged file is copied from an older cache of this notebook (checked against its hash) instead of downloaded again.
async function reuse(file,except){
 const url=absolute(file);
 for(const key of await caches.keys()){
  if(!key.startsWith(PREFIX)||key===REGISTRY||key===except)continue;
  const hit=await (await caches.open(key)).match(url);if(!hit)continue;
  const bytes=await hit.arrayBuffer();
  if(await digest(bytes)===CONFIG.files[file].hash)return new Response(bytes,{status:200,headers:{'Content-Type':hit.headers.get('Content-Type')||'application/octet-stream'}});
 }
}
// Adds the files the cache does not hold yet.
async function fill(name,files,progress){
 const cache=await caches.open(name),have=new Set((await cache.keys()).map(r=>r.url));
 const missing=files.filter(f=>!have.has(absolute(f)));let done=0;
 for(const file of missing){await cache.put(absolute(file),await reuse(file,name)||await verified(file));progress?.(++done,missing.length);}
 return cache;
}
async function complete(name,files){
 if(!(await caches.keys()).includes(name))return false;
 const keys=new Set((await (await caches.open(name)).keys()).map(r=>r.url));
 return files.every(f=>keys.has(absolute(f)));
}
// A course marked `runtime` also needs the shared Python runtime, kept once in RUNTIME for every such course (#150).
const needsRuntime=c=>!!c.runtime&&!!RUNTIME;
const runtimeReady=async()=>!RUNTIME||await complete(RUNTIME,CONFIG.runtime.files);
const extrasReady=async()=>!EXTRAS||await complete(EXTRAS,CONFIG.extras.files);
async function record(id){const response=await (await caches.open(REGISTRY)).match(registryKey(id));return response?response.json():null;}
async function status(){
 const courses=[],shellReady=await complete(SHELL,CONFIG.shell),runtime=await runtimeReady(),extras=await extrasReady();
 for(const c of CONFIG.courses){const saved=await record(c.id);const current=shellReady&&saved?.version===(c.version||CONFIG.version)&&await complete(saved.cache,c.files)&&extras&&(!needsRuntime(c)||runtime);courses.push({id:c.id,title:c.title,bytes:c.bytes,runtime:needsRuntime(c),saved:!!current,outdated:!!saved&&!current});}
 return {version:CONFIG.version,shellReady,runtime:RUNTIME?{bytes:CONFIG.runtime.bytes||0,ready:runtime}:null,extras:EXTRAS?{bytes:CONFIG.extras.bytes||0,ready:extras}:null,courses};
}
function serial(id,work){const previous=locks.get(id)||Promise.resolve();const next=previous.catch(()=>{}).then(work);locks.set(id,next);return next.finally(()=>{if(locks.get(id)===next)locks.delete(id);});}
// onlyOutdated refreshes a course that is saved but no longer matches this publication, and leaves others alone,
// so several tabs asking at once download it once.
async function save(id,progress,onlyOutdated=false){
 const c=course(id);if(!c)throw say('Unknown learning path.');
 return serial(id,async()=>{
  if(onlyOutdated){const saved=await record(id);if(!saved||saved.version===(c.version||CONFIG.version)&&await complete(saved.cache,c.files)&&await complete(SHELL,CONFIG.shell)&&await extrasReady()&&(!needsRuntime(c)||await runtimeReady()))return;}
  if(!await complete(SHELL,CONFIG.shell))await fill(SHELL,CONFIG.shell,progress);
  const revision=c.version||CONFIG.version;
  const name=PREFIX+'course:'+id+':'+revision+':'+crypto.randomUUID();let committed=false;
  try{
   if(EXTRAS)await fill(EXTRAS,CONFIG.extras.files,progress);
   if(needsRuntime(c))await fill(RUNTIME,CONFIG.runtime.files,progress);
   await fill(name,c.files,progress);
   if(!await complete(name,c.files))throw say('Download is incomplete. Please try again.');
   const previous=await record(id);
   await (await caches.open(REGISTRY)).put(registryKey(id),new Response(JSON.stringify({version:revision,cache:name}),{headers:{'Content-Type':'application/json'}}));
   committed=true;
   if(previous?.cache&&previous.cache!==name)await caches.delete(previous.cache).catch(()=>{});
  }catch(error){if(!committed)await caches.delete(name);if(error?.name==='QuotaExceededError')throw say('Not enough browser storage. Remove an offline course and try again.');throw error;}
 });
}
async function remove(id){if(!course(id))throw say('Unknown learning path.');return serial(id,async()=>{const saved=await record(id);await (await caches.open(REGISTRY)).delete(registryKey(id));if(saved?.cache)await caches.delete(saved.cache);});}
// Diagrams and search kept by the previous shell or extras cache carry over before activation deletes that cache.
async function carryExtras(){
 if(!EXTRAS)return;const cache=await caches.open(EXTRAS),have=new Set((await cache.keys()).map(r=>r.url));
 for(const file of CONFIG.extras.files)if(!have.has(absolute(file))){const r=await reuse(file,EXTRAS);if(r)await cache.put(absolute(file),r);}
}
self.addEventListener('install',event=>event.waitUntil((async()=>{try{await fill(SHELL,CONFIG.shell);}catch(error){await caches.delete(SHELL);throw error;}await carryExtras().catch(()=>{});})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 // Delete only this notebook's obsolete shell, runtime and extras caches. Course selections survive updates.
 for(const key of await caches.keys())if(key.startsWith(PREFIX+'shell:')&&key!==SHELL||key.startsWith(PREFIX+'runtime:')&&key!==RUNTIME||key.startsWith(PREFIX+'extras:')&&key!==EXTRAS)await caches.delete(key);
 // Incomplete downloads are removed by their save transaction, not by activation.
 // An older worker may still be finishing a download in another tab.
 await self.clients.claim();
})()));
self.addEventListener('message',event=>{
 const message=event.data||{},port=event.ports?.[0];
 // Only pages within this app's origin and scope can operate its caches.
 if(!event.source?.url?.startsWith(BASE.href))return;
 if(message.type==='ACTIVATE_UPDATE'){event.waitUntil(self.skipWaiting());return;}
 if(!port)return;
 event.waitUntil((async()=>{try{
  if(message.type==='SAVE_COURSE')await save(message.id,(done,total)=>port.postMessage({progress:{done,total}}));
  else if(message.type==='UPDATE_COURSE')await save(message.id,(done,total)=>port.postMessage({progress:{done,total}}),true);
  else if(message.type==='REMOVE_COURSE')await remove(message.id);
  else if(message.type!=='STATUS')throw say('Unknown offline action.');
  port.postMessage({ok:true,data:await status()});
 }catch(error){port.postMessage({ok:false,error:error?.friendly?error.message:'Offline storage could not complete this request.'});}})());
});
// Only a complete, byte-verified copy is kept; any failure leaves the cache as it was.
async function keep(name,file,response){try{
 const bytes=await response.arrayBuffer();if(await digest(bytes)!==CONFIG.files[file].hash)return;
 await (await caches.open(name)).put(absolute(file),new Response(bytes,{status:200,headers:{'Content-Type':response.headers.get('Content-Type')||'application/octet-stream'}}));
}catch{}}
async function cached(file){
 const url=absolute(file),shell=await (await caches.open(SHELL)).match(url);if(shell)return shell;
 const own=runtimeFile(file)?RUNTIME:extrasFile(file)?EXTRAS:null;
 if(own&&(await caches.keys()).includes(own)){const kept=await (await caches.open(own)).match(url);if(kept)return kept;}
 // A file can belong to several courses (the Python runtime); any saved owner can serve it.
 for(const owner of CONFIG.courses.filter(c=>c.files.includes(file))){
  const r=await record(owner.id);if(r?.version!==(owner.version||CONFIG.version))continue;
  const hit=await (await caches.open(r.cache)).match(url);if(hit)return hit;
 }
}
// After a publication changes a saved course, its previous download still serves offline until it is refreshed:
// an older copy of a lesson is better than none. Online, the current files come from the network instead.
async function previous(file){
 const url=absolute(file),names=await caches.keys();
 for(const owner of CONFIG.courses.filter(c=>c.files.includes(file))){
  const r=await record(owner.id);if(!r?.cache||!names.includes(r.cache))continue;
  const hit=await (await caches.open(r.cache)).match(url);if(hit)return hit;
 }
}
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==BASE.origin||!url.pathname.startsWith(BASE.pathname))return;
 let file;try{file=decodeURI(url.pathname.slice(BASE.pathname.length))||'index.html';}catch{return;}
 if(!CONFIG.files[file]&&event.request.mode!=='navigate')return;
 event.respondWith((async()=>{
  const hit=await cached(file);if(hit)return hit;
  try{
   const response=await fetch(event.request);
   const own=runtimeFile(file)?RUNTIME:extrasFile(file)?EXTRAS:null;
   if(own&&response.ok&&response.type!=='opaque')event.waitUntil(keep(own,file,response.clone()));
   return response;
  }catch{
   const old=await previous(file);if(old)return old;
   if(event.request.mode==='navigate')return await cached('offline.html')||new Response('Open the notebook online once to prepare offline access.',{status:503});
   return new Response('This file is not saved offline. Open Offline & install to download its course.',{status:503,headers:{'Content-Type':'text/plain'}});
  }
 })());
});
