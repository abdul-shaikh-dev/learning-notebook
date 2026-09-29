const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const template=fs.readFileSync(require('node:path').join(__dirname,'../scripts/sw-template.js'),'utf8');
const base='https://example.test/learning-notebook/',prefix='learning-notebook:'+encodeURIComponent('/learning-notebook/')+':';
const bodies={'index.html':'home','offline.html':'offline','assets/app.js':'shell-js','content/courses/python.js':'python','paths/python/practice.zip':'zip','content/courses/react.js':'react'};
function config(version='one'){return {version,files:Object.fromEntries(Object.entries(bodies).map(([f,b])=>[f,{hash:crypto.createHash('sha256').update(b).digest('hex'),bytes:b.length}])),shell:['index.html','offline.html','assets/app.js'],courses:[{id:'python',title:'Python',files:['content/courses/python.js','paths/python/practice.zip'],bytes:9},{id:'react',title:'React',files:['content/courses/react.js'],bytes:5}]};}
class Storage{
 constructor(){this.data=new Map();this.deleted=[];}
 async keys(){return [...this.data.keys()];}
 async open(name){if(!this.data.has(name))this.data.set(name,new Map());const map=this.data.get(name),url=k=>typeof k==='string'?k:k.url;return {put:async(k,v)=>{map.set(url(k),v.clone());},match:async k=>map.get(url(k))?.clone(),delete:async k=>map.delete(url(k)),keys:async()=>[...map.keys()].map(url=>new Request(url))};}
 async delete(name){this.deleted.push(name);return this.data.delete(name);}
}
function worker(version='one',storage=new Storage(),courseVersion){
 const listeners={},state={offline:false,bad:null,claims:0,activations:0,requests:[]};
 const self={location:{href:base+'sw.js'},addEventListener:(t,f)=>listeners[t]=f,clients:{claim:async()=>state.claims++},skipWaiting:async()=>state.activations++};
 const settings=config(version);if(courseVersion)settings.courses.forEach(c=>c.version=courseVersion);
 const context=vm.createContext({self,caches:storage,Response,Request,URL,AbortSignal,crypto:crypto.webcrypto,fetch:async input=>{const url=typeof input==='string'?input:input.url;state.requests.push(url);if(state.offline)throw Error('network unavailable');const file=new URL(url).pathname.slice('/learning-notebook/'.length);return new Response(state.bad===file?'corrupt':bodies[file]||'online',{status:200});}});
 vm.runInContext(template.replace('__PWA_CONFIG__',JSON.stringify(settings)),context);
 async function event(type,extras={}){let pending;listeners[type]({...extras,waitUntil:p=>pending=p});if(pending)await pending;}
 async function message(type,id,source=base+'index.html'){const replies=[];await event('message',{data:{type,id},source:{url:source},ports:[{postMessage:r=>replies.push(r)}]});return replies;}
 async function fetch(file,mode='cors',method='GET'){let promise;listeners.fetch({request:{url:new URL(file,base).href,mode,method},respondWith:p=>promise=p});return promise?await promise:null;}
 return {storage,state,event,message,fetch,status:async()=>{const replies=await message('STATUS');return replies.at(-1).data;}};
}
// Build uses explicit published inventory, with no dependence on repository content.
{
 const path=require('node:path'),root=path.resolve('pwa-fixture');
 const ready=[{id:'python',title:'Python',status:'ready',publicFiles:['practice.zip']},{id:'financial-foundations',title:'Finance',status:'ready',publicFiles:['runtime.js']},{id:'future',status:'planned',publicFiles:[]}];
 const files=['index.html','offline.html','manifest.webmanifest','content/catalog.js','content/search.js','assets/app.js','content/courses/python.js','paths/python/practice.zip','content/courses/financial-foundations.js','paths/financial-foundations/runtime.js','course.html','handbook.html','practice/sample-positions.csv','practice/answers.md'];
 const data=new Map(files.map(f=>[path.join(root,f),Buffer.from(f)]));data.set(path.join(root,'scripts/sw-template.js'),Buffer.from(template));
 const writes=new Map(),fakeFs={readFileSync:(f,enc)=>{const b=data.get(f);if(!b)throw Error('Missing fixture '+f);return enc?b.toString():b;},writeFileSync:(f,s)=>writes.set(f,s)};
 const mod={exports:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../scripts/pwa-build.cjs'),'utf8'),{module:mod,require:id=>id==='node:fs'?fakeFs:id==='./manifest.cjs'?{readPaths:()=>ready}:require(id)});
 const first=mod.exports.configFor(root,files),again=mod.exports.configFor(root,[...files].reverse());assert.equal(first.version,again.version);assert.equal(first.courses.length,2);assert.ok(first.shell.includes('assets/app.js'));assert.ok(!first.shell.includes('paths/python/practice.zip'));assert.ok(first.courses.find(c=>c.id==='financial-foundations').files.includes('handbook.html'));assert.throws(()=>mod.exports.configFor(root,files.filter(f=>f!=='paths/python/practice.zip')),/not published/);
 mod.exports.buildPwa(root,'output',files);assert.ok(!writes.get(path.join('output','sw.js')).includes('__PWA_CONFIG__'));data.set(path.join(root,'assets/app.js'),Buffer.from('changed-ui'));const ui=mod.exports.configFor(root,files);assert.notEqual(ui.version,first.version);assert.equal(ui.courses[0].version,first.courses[0].version);data.set(path.join(root,'paths/python/practice.zip'),Buffer.from('changed-course'));const changed=mod.exports.configFor(root,files);assert.notEqual(changed.courses[0].version,first.courses[0].version);
}
(async()=>{
 // Successful installation is byte-verified, and partial or corrupt shells roll back.
 const w=worker();await w.event('install');assert.equal((await w.status()).shellReady,true);assert.equal(w.state.activations,0,'installation must not force activation');
 const broken=worker();broken.state.bad='offline.html';await assert.rejects(broken.event('install'),/changed during download/);assert.equal((await broken.storage.keys()).includes(prefix+'shell:one'),false);
 const offlineInstall=worker();offlineInstall.state.offline=true;await assert.rejects(offlineInstall.event('install'));assert.equal((await offlineInstall.storage.keys()).includes(prefix+'shell:one'),false);
 // Course download publishes a record only after all files are present.
 let replies=await w.message('SAVE_COURSE','python');assert.equal(replies.at(-1).ok,true);assert.equal(replies.filter(r=>r.progress).length,2);assert.equal((await w.status()).courses[0].saved,true);
 const registry=await w.storage.open(prefix+'downloads'),key=base+'__offline-course/python';const prior=await (await registry.match(key)).json();
 w.state.bad='paths/python/practice.zip';replies=await w.message('SAVE_COURSE','python');assert.equal(replies.at(-1).ok,false);assert.deepEqual(await (await registry.match(key)).json(),prior);assert.equal((await w.status()).courses[0].saved,true);assert.equal((await w.storage.keys()).filter(k=>k.startsWith(prefix+'course:')).length,1,'failed staging cache removed');w.state.bad=null;
 // Incomplete cache records are never advertised as saved.
 const savedCache=await w.storage.open(prior.cache);await savedCache.delete(base+'paths/python/practice.zip');assert.equal((await w.status()).courses[0].saved,false);assert.equal((await w.status()).courses[0].outdated,true);await w.message('SAVE_COURSE','python');
 // Cache-first offline shell and chosen course; unsaved content is explicit 503.
 w.state.offline=true;assert.equal(await (await w.fetch('index.html?v=new','navigate')).text(),'home');assert.equal(await (await w.fetch('content/courses/python.js')).text(),'python');assert.equal((await w.fetch('content/courses/react.js')).status,503);assert.equal(await (await w.fetch('unknown-page','navigate')).text(),'offline');assert.equal(await w.fetch('https://elsewhere.test/file'),null);assert.equal(await w.fetch('assets/app.js','cors','POST'),null);assert.equal(await w.fetch('not-in-inventory.txt'),null);
 // Update is explicit. Activation preserves selections, reports old downloads as outdated,
 // clears this scope's stale shell caches, and leaves other apps untouched.
 w.state.offline=false;await w.storage.open(prefix+'course:abandoned');await w.storage.open('other-app:cache');await w.storage.open('learning-notebook:%2Felsewhere%2F:shell:one');const update=worker('two',w.storage);await update.event('install');await update.message('ACTIVATE_UPDATE');assert.equal(update.state.activations,1);await update.event('activate');assert.equal(update.state.claims,1);assert.equal((await update.storage.keys()).includes(prefix+'shell:one'),false);assert.equal((await update.storage.keys()).includes(prefix+'course:abandoned'),true,'activation must not delete another worker staging download');assert.equal((await update.status()).courses[0].outdated,true);assert.equal((await update.status()).courses[0].saved,false);update.state.offline=true;assert.equal((await update.fetch('content/courses/python.js')).status,503,'old version course not mixed into new shell');update.state.offline=false;await update.message('SAVE_COURSE','python');assert.equal((await update.status()).courses[0].saved,true);
 // Remove is confined to course cache/registry; the worker has no progress-storage API.
 await update.message('REMOVE_COURSE','python');assert.equal(await registry.match(key),undefined);assert.equal((await update.status()).courses[0].saved,false);assert.equal((await update.status()).shellReady,true);assert.ok((await update.storage.keys()).includes('other-app:cache'));assert.ok((await update.storage.keys()).includes('learning-notebook:%2Felsewhere%2F:shell:one'));assert.ok(!/localStorage|indexedDB/.test(template));
 assert.deepEqual(await update.message('SAVE_COURSE','react','https://evil.test/learning-notebook/'),[]);assert.deepEqual(await update.message('ACTIVATE_UPDATE',null,'https://example.test/other/'),[]);assert.equal(update.state.activations,1);assert.equal((await update.message('UNKNOWN')).at(-1).ok,false);assert.equal((await update.message('SAVE_COURSE','missing')).at(-1).ok,false);
 const empty=worker();empty.state.offline=true;assert.equal((await empty.fetch('unknown','navigate')).status,503);
 // A UI-only publication keeps intact course downloads; a changed course becomes outdated.
 const stable=worker('ui-one',new Storage(),'course-one');await stable.event('install');await stable.message('SAVE_COURSE','python');const uiUpdate=worker('ui-two',stable.storage,'course-one');await uiUpdate.event('install');await uiUpdate.event('activate');assert.equal((await uiUpdate.status()).courses[0].saved,true);uiUpdate.state.offline=true;assert.equal(await (await uiUpdate.fetch('content/courses/python.js')).text(),'python');const changed=worker('ui-three',stable.storage,'course-two');assert.equal((await changed.status()).courses[0].outdated,true);
 // Cleanup failure after commit must not invalidate the new complete download.
 const commit=worker();await commit.message('SAVE_COURSE','python');const committedRegistry=await commit.storage.open(prefix+'downloads');const old=await (await committedRegistry.match(key)).json();const originalDelete=commit.storage.delete.bind(commit.storage);commit.storage.delete=async name=>{if(name===old.cache)throw Error('cleanup unavailable');return originalDelete(name);};assert.equal((await commit.message('SAVE_COURSE','python')).at(-1).ok,true);assert.equal((await commit.status()).courses[0].saved,true);
 // Eviction of shared shell files invalidates offline readiness; save repairs them.
 const evicted=worker();await evicted.event('install');await evicted.message('SAVE_COURSE','python');await evicted.storage.delete(prefix+'shell:one');assert.equal((await evicted.status()).courses[0].saved,false);assert.equal((await evicted.status()).shellReady,false);await evicted.message('SAVE_COURSE','python');assert.equal((await evicted.status()).courses[0].saved,true);
 console.log('PWA worker: integrity, rollback, atomic downloads, scope isolation, updates and offline routing verified.');
})().catch(error=>{console.error(error);process.exitCode=1;});
