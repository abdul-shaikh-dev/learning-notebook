const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {lazyFiles}=require('../scripts/lazy-catalog.cjs');
const files=lazyFiles(), metadata=vm.runInNewContext(files['content/catalog.js']+';LEARNING_PATHS');
assert.ok(Buffer.byteLength(files['content/catalog.js'])<80000,'Navigation data should stay compact');
assert.ok(metadata.every(p=>!p.resources&&!p.lessons?.some?.(l=>l.sections)));
const full=require('../scripts/manifest.cjs').readPaths();
for(const p of metadata){const original=full.find(x=>x.id===p.id);if(p.status!=='ready'){assert.equal(p.lessons.length,0);assert.ok(!files['content/courses/'+p.id+'.js']);continue;}assert.equal(Array.isArray(p.lessons)?p.lessons.length:p.lessons,Array.isArray(original.lessons)?original.lessons.length:original.lessons);}
const html=fs.readFileSync('index.html','utf8');assert.ok(!html.includes('src="content/search.js'));assert.ok(!html.includes('src="content/paths.js'));
const elements=new Map();const node=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',focus(){},addEventListener(type,fn){this[type]=fn;}});return elements.get(id);};
const requests=[];const ctx=vm.createContext({document:{getElementById:node,createElement:()=>({remove(){}}),head:{append:s=>requests.push(s)}},location:{hash:''}});
vm.runInContext(files['content/catalog.js']+fs.readFileSync('assets/js/notebook-loader.js','utf8')+';this.loader=NotebookLoader;',ctx);
let renders=0;const render=()=>{renders++;};const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
(async()=>{
 assert.equal(ctx.loader.prepare('',undefined,render),false);assert.equal(requests.length,0);
 ctx.location.hash='#topic/react/forms';assert.equal(ctx.loader.prepare('topic','react',render),true);assert.equal(requests.length,1);
 assert.equal(ctx.loader.prepare('topic','react',render),true);assert.equal(requests.length,1,'deduplicate simultaneous requests');
 ctx.location.hash='';ctx.loader.prepare('',undefined,render);
 vm.runInContext(files['content/courses/react.js'],ctx);requests[0].onload();await flush();assert.equal(renders,0,'stale route must not overwrite home');
 assert.equal(ctx.loader.prepare('topic','react',render),false,'cached course needs no script');
 ctx.location.hash='#topic/python/values-and-names';ctx.loader.prepare('topic','python',render);requests[1].onerror();await flush();assert.match(node('main').innerHTML,/Try again/);node('retry-content').click();assert.equal(renders,1);
 ctx.loader.prepare('topic','python',render);assert.equal(requests.length,3,'retry makes fresh request');vm.runInContext(files['content/courses/python.js'],ctx);requests[2].onload();await flush();assert.equal(renders,2);
 ctx.location.hash='#search';ctx.loader.prepare('search',undefined,render);assert.match(requests[3].src,/content\/search.js\?v=/);vm.runInContext('const NOTEBOOK_SEARCH=[];',ctx);requests[3].onload();await flush();assert.equal(ctx.loader.prepare('search',undefined,render),false);
 console.log('PASS: compact catalog, lazy course/search, deduplication, cached reuse, stale-route suppression and failure retry.');
})().catch(error=>{console.error(error);process.exitCode=1;});

