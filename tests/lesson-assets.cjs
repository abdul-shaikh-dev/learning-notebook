// Lesson-only code and styles load on the first page that shows lesson content, in order, before that page renders.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
process.chdir(process.env.LEARNING_REPO||path.resolve(__dirname,'..'));
const {lazyFiles}=require('../scripts/lazy-catalog.cjs');
const html=fs.readFileSync('index.html','utf8');
// index.html: every lesson-only asset is a placeholder, not a tag the home page would fetch.
const marks=[...html.matchAll(/<meta name="lesson-asset" content="([^"]+)">/g)].map(m=>m[1]);
const lessonOnly=/highlight\.min|code-panels|notebook-mermaid|concrete-scenes|scenes-(?:dsa|apps|infra|patterns|data|engineering|practice)|concept-explorer|notebook-scenes-dark/;
assert.equal(marks.length,22,'Lesson-only scripts and styles');
for(const m of html.matchAll(/<(?:script src|link rel="stylesheet" href)="([^"]+)"/g))assert.ok(!lessonOnly.test(m[1]),'Loaded on every page: '+m[1]);
for(const file of marks)assert.ok(fs.existsSync(file.split('?')[0]),'Placeholder names a published file: '+file);
assert.ok(html.indexOf('content="assets/css/concept-explorer.css')<html.indexOf('href="assets/css/atlas-ui.css'),'Styles keep their place in the cascade');
const js=marks.filter(f=>f.includes('.js'));
assert.ok(js.indexOf('assets/js/concrete-scenes.js?v=concrete1')<js.findIndex(f=>f.includes('scenes-dsa')),'The scene registry runs before the scenes that register with it');
assert.ok(html.lastIndexOf('lesson-asset')<html.indexOf('</head>'),'Placeholders sit in the head');
const pages=fs.readFileSync('scripts/build-pages.cjs','utf8');for(const file of marks)assert.ok(pages.includes("'"+file.split('?')[0]+"'"),'Published and cached for offline use: '+file);

// The loader against a small document: placeholders, created tags and their load events.
function setup(){
 const added=[],elements=new Map();
 const node=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',focus(){},addEventListener(type,fn){this[type]=fn;}});return elements.get(id);};
 const placeholders=marks.map(content=>({content,after(tag){added.push(tag);}}));
 const document={getElementById:node,querySelectorAll:s=>s==='meta[name="lesson-asset"]'?placeholders:[],createElement:name=>({name,remove(){this.removed=true;}}),head:{append:s=>added.push(s)}};
 const ctx=vm.createContext({document,location:{hash:''}});
 const files=lazyFiles();
 vm.runInContext(files['content/catalog.js']+fs.readFileSync('assets/js/notebook-loader.js','utf8')+';this.loader=NotebookLoader;',ctx);
 return {ctx,added,node,files};
}
const flush=async()=>{for(let i=0;i<10;i++)await Promise.resolve();};
(async()=>{
 let {ctx,added,node,files}=setup(),renders=0;const render=()=>{renders++;};
 // Home, progress and review render without lesson assets.
 for(const route of ['','backup','review'])assert.equal(ctx.loader.prepare(route,undefined,render),false,route||'home');
 assert.equal(added.length,0,'No lesson asset is requested outside lessons');
 // A lesson requests its course and every lesson asset, styles as stylesheets and scripts in order.
 ctx.location.hash='#topic/react/forms';assert.equal(ctx.loader.prepare('topic','react',render),true);
 const course=added.find(t=>t.src?.startsWith('content/courses/react.js')),assets=added.filter(t=>t!==course);
 assert.ok(course);assert.equal(assets.length,marks.length);
 assert.deepEqual(assets.map(t=>t.href||t.src),marks,'Each tag is added beside its placeholder, in order');
 assert.ok(assets.filter(t=>t.name==='link').every(t=>t.rel==='stylesheet'));
 assert.ok(assets.filter(t=>t.name==='script').every(t=>t.async===false),'Scripts run in document order');
 // The lesson waits for the course and for every asset.
 vm.runInContext(files['content/courses/react.js'],ctx);course.onload();await flush();assert.equal(renders,0,'The course alone is not enough');
 assets.slice(0,-1).forEach(t=>t.onload());await flush();assert.equal(renders,0,'One asset is still loading');
 assets.at(-1).onload();await flush();assert.equal(renders,1,'Renders once everything has loaded');
 // Later lessons, course pages and packs need nothing more.
 for(const route of ['topic','path','pack'])assert.equal(ctx.loader.prepare(route,'react',render),false,route);
 // A failed asset shows a retry; the retry requests only what failed.
 ({ctx,added,node,files}=setup());renders=0;
 ctx.location.hash='#pack/react';ctx.loader.prepare('pack','react',render);
 vm.runInContext(files['content/courses/react.js'],ctx);
 const first=added.filter(t=>t.href||t.src?.startsWith('assets'));first.forEach((t,i)=>i===3?t.onerror():t.onload());added.find(t=>t.src?.startsWith('content/courses')).onload();await flush();
 assert.equal(renders,0);assert.match(node('main').innerHTML,/Try again/);assert.ok(first[3].removed,'The failed tag is removed');
 const before=added.length;node('retry-content').click();assert.equal(renders,1,'Retry re-renders, which prepares again');
 ctx.loader.prepare('pack','react',render);const again=added.slice(before);
 assert.deepEqual(again.map(t=>t.href||t.src),[marks[3]],'Only the failed asset is requested again');
 again[0].onload();await flush();assert.equal(renders,2);
 console.log('PASS: lesson-only assets: '+marks.length+' placeholders in cascade and run order, none fetched on home, progress or review, loaded before a lesson, course page or pack renders, once only, with retry of failures.');
})().catch(e=>{console.error(e);process.exitCode=1;});
