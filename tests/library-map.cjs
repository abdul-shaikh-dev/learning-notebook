const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const paths=require('../scripts/manifest.cjs').readPaths();
const nodes=new Map(),store=new Map(),preferences=new Map();
function node(id){if(!nodes.has(id))nodes.set(id,{value:'',innerHTML:'',textContent:'',hidden:false,addEventListener(type,fn){this[type]=fn;},querySelectorAll(){return [];}});return nodes.get(id);}
const ctx={LEARNING_PATHS:paths,document:{getElementById:node},window:{addEventListener(){},scrollTo(){}},location:{hash:''},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},sessionStorage:{getItem:k=>preferences.get(k)||null,setItem:(k,v)=>preferences.set(k,v)}};
vm.createContext(ctx);vm.runInContext(['library-map','learning-tools','catalog'].map(f=>fs.readFileSync('assets/js/'+f+'.js','utf8')).join('\n'),ctx);
const html=node('main').innerHTML;assert.ok(html.includes('Your learning map'));assert.ok(html.includes('231 lessons'));
for(const p of paths.filter(p=>p.status==='ready'))assert.ok(html.includes(p.href||'#path/'+p.id),p.id);
const buttons=['map','list'].map(view=>({dataset:{libraryView:view},setAttribute(k,v){this[k]=v;},addEventListener(k,v){this[k]=v;}}));
ctx.bindLibraryMap({querySelectorAll:()=>buttons});buttons[1].click();assert.equal(node('learning-map').hidden,true);assert.equal(node('path-list').hidden,false);assert.equal(buttons[1]['aria-pressed'],'true');ctx.bindLibraryMap({querySelectorAll:()=>buttons});assert.equal(node('learning-map').hidden,true,'View preference survives returning');buttons[0].click();assert.equal(node('path-list').hidden,true);
assert.ok(ctx.libraryMap('zz_absent').includes('No matching paths'));assert.ok(!ctx.libraryMap('zz_absent').includes('map-node'));assert.ok(ctx.libraryMap('SQL').includes('#path/sql-server'));
store.set('learning-notebook:path:python:v1',JSON.stringify(['run-a-program','run-a-program','unknown']));assert.equal(ctx.libraryProgress(paths.find(p=>p.id==='python')).done,1);
store.set('valuation-lab-v1',JSON.stringify({done:[1,1,19],starterDone:[1,7]}));assert.equal(ctx.libraryProgress(paths.find(p=>p.id==='financial-foundations')).done,2);
ctx.LEARNING_PATHS.push({id:'new-path',title:'New subject',status:'ready',category:'Other',description:'Future learning',lessons:[]});assert.ok(ctx.libraryMap().includes('#path/new-path'));
console.log('PASS: visual map course coverage, filtering, progress integrity, map/list switching and session preference.');
