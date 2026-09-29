/* Build injects an integrity-checked, scope-relative publication inventory. */
const CONFIG = __PWA_CONFIG__;
const BASE=new URL('./',self.location.href);
const PREFIX='learning-notebook:'+encodeURIComponent(BASE.pathname)+':';
const SHELL=PREFIX+'shell:'+CONFIG.version,REGISTRY=PREFIX+'downloads';
const locks=new Map();
const absolute=file=>new URL(file,BASE).href;
const registryKey=id=>absolute('__offline-course/'+id);
const course=id=>CONFIG.courses.find(c=>c.id===id);
async function digest(bytes){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');}
async function verified(file){
 const response=await fetch(absolute(file),{cache:'reload',signal:AbortSignal.timeout(30000)});
 if(!response.ok||response.type==='opaque')throw Error('A file could not be downloaded. Check your connection and try again.');
 if(await digest(await response.clone().arrayBuffer())!==CONFIG.files[file].hash)throw Error('The notebook changed during download. Apply the available update, then try again.');
 return response;
}
async function fill(name,files,progress){
 const cache=await caches.open(name);let done=0;
 for(const file of files){await cache.put(absolute(file),await verified(file));progress?.(++done,files.length);}
 return cache;
}
async function complete(name,files){
 if(!(await caches.keys()).includes(name))return false;
 const keys=new Set((await (await caches.open(name)).keys()).map(r=>r.url));
 return files.every(f=>keys.has(absolute(f)));
}
async function record(id){const response=await (await caches.open(REGISTRY)).match(registryKey(id));return response?response.json():null;}
async function status(){
 const courses=[],shellReady=await complete(SHELL,CONFIG.shell);
 for(const c of CONFIG.courses){const saved=await record(c.id);const current=shellReady&&saved?.version===(c.version||CONFIG.version)&&await complete(saved.cache,c.files);courses.push({id:c.id,title:c.title,bytes:c.bytes,saved:!!current,outdated:!!saved&&!current});}
 return {version:CONFIG.version,shellReady,courses};
}
function serial(id,work){const previous=locks.get(id)||Promise.resolve();const next=previous.catch(()=>{}).then(work);locks.set(id,next);return next.finally(()=>{if(locks.get(id)===next)locks.delete(id);});}
async function save(id,progress){
 const c=course(id);if(!c)throw Error('Unknown learning path.');
 return serial(id,async()=>{
  if(!await complete(SHELL,CONFIG.shell))await fill(SHELL,CONFIG.shell,progress);
  const revision=c.version||CONFIG.version;
  const name=PREFIX+'course:'+id+':'+revision+':'+crypto.randomUUID();let committed=false;
  try{
   await fill(name,c.files,progress);
   if(!await complete(name,c.files))throw Error('Download is incomplete. Please try again.');
   const previous=await record(id);
   await (await caches.open(REGISTRY)).put(registryKey(id),new Response(JSON.stringify({version:revision,cache:name}),{headers:{'Content-Type':'application/json'}}));
   committed=true;
   if(previous?.cache&&previous.cache!==name)await caches.delete(previous.cache).catch(()=>{});
  }catch(error){if(!committed)await caches.delete(name);if(error?.name==='QuotaExceededError')throw Error('Not enough browser storage. Remove an offline course and try again.');throw error;}
 });
}
async function remove(id){if(!course(id))throw Error('Unknown learning path.');return serial(id,async()=>{const saved=await record(id);await (await caches.open(REGISTRY)).delete(registryKey(id));if(saved?.cache)await caches.delete(saved.cache);});}
self.addEventListener('install',event=>event.waitUntil((async()=>{try{await fill(SHELL,CONFIG.shell);}catch(error){await caches.delete(SHELL);throw error;}})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 // Delete only this notebook's obsolete shell caches. Course selections survive updates.
 for(const key of await caches.keys())if(key.startsWith(PREFIX+'shell:')&&key!==SHELL)await caches.delete(key);
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
  else if(message.type==='REMOVE_COURSE')await remove(message.id);
  else if(message.type!=='STATUS')throw Error('Unknown offline action.');
  port.postMessage({ok:true,data:await status()});
 }catch(error){port.postMessage({ok:false,error:error.message||'Offline storage is unavailable.'});}})());
});
async function cached(file){
 const url=absolute(file),shell=await (await caches.open(SHELL)).match(url);if(shell)return shell;
 const owner=CONFIG.courses.find(c=>c.files.includes(file));if(!owner)return;
 const r=await record(owner.id);if(r?.version===(owner.version||CONFIG.version))return (await caches.open(r.cache)).match(url);
}
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==BASE.origin||!url.pathname.startsWith(BASE.pathname))return;
 let file;try{file=decodeURI(url.pathname.slice(BASE.pathname.length))||'index.html';}catch{return;}
 if(!CONFIG.files[file]&&event.request.mode!=='navigate')return;
 event.respondWith((async()=>{
  const hit=await cached(file);if(hit)return hit;
  try{return await fetch(event.request);}catch{
   if(event.request.mode==='navigate')return await cached('offline.html')||new Response('Open the notebook online once to prepare offline access.',{status:503});
   return new Response('This file is not saved offline. Open Offline & install to download its course.',{status:503,headers:{'Content-Type':'text/plain'}});
  }
 })());
});
