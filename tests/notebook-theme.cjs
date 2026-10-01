const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('assets/js/notebook-theme.js','utf8');
function setup(saved,system=false,blocked=false){
 const handlers={},button={setAttribute(k,v){this[k]=v;},addEventListener(t,fn){this[t]=fn;}},root={dataset:{}},media={matches:system,addEventListener(t,fn){this[t]=fn;}},store=new Map(saved?[['learning-notebook:theme:v1',saved]]:[]);
 const ctx={document:{documentElement:root,querySelectorAll:()=>[button],querySelector:()=>null,addEventListener(t,fn){handlers[t]=fn;}},window:{matchMedia:()=>media,addEventListener(t,fn){handlers[t]=fn;}},localStorage:{getItem:k=>{if(blocked)throw Error();return store.get(k);},setItem:(k,v)=>{if(blocked)throw Error();store.set(k,v);}}};
 vm.runInNewContext(source,ctx);handlers.DOMContentLoaded();return{root,button,media,handlers,store};
}
let x=setup(undefined,true);assert.equal(x.root.dataset.theme,'dark');assert.equal(x.button['aria-pressed'],'true');
x.media.matches=false;x.media.change();assert.equal(x.root.dataset.theme,'light');
x.button.click();assert.equal(x.store.get('learning-notebook:theme:v1'),'dark');x.media.change();assert.equal(x.root.dataset.theme,'dark');
assert.equal(setup('light',true).root.dataset.theme,'light');assert.equal(setup('invalid',true).root.dataset.theme,'dark');
x.handlers.storage({key:'learning-notebook:theme:v1',newValue:'light'});assert.equal(x.root.dataset.theme,'light');
x=setup(undefined,false,true);x.button.click();assert.equal(x.root.dataset.theme,'dark','Storage failure does not block toggling');
for(const page of ['index.html','course.html','handbook.html','offline.html']){const html=fs.readFileSync(page,'utf8');assert(html.includes('data-theme-toggle'),page);assert(html.includes('assets/js/notebook-theme.js'),page);assert(html.includes('assets/css/notebook-theme.css'),page);}
console.log('PASS: system theme, manual override, persistence, storage failure, cross-tab change and core page controls.');
