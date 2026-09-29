const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let controls={},timers=new Map(),serial=0,events={},mediaEvents={};
const media={matches:false,addEventListener:(t,f)=>mediaEvents[t]=f,removeEventListener:t=>delete mediaEvents[t]};
const element=()=>({innerHTML:'',textContent:'',disabled:false,value:'7000',isConnected:true,events:{},attributes:{},addEventListener(t,f){this.events[t]=f;},setAttribute(k,v){this.attributes[k]=v;},querySelectorAll(){return [];}});
const ctx={escapeText:s=>String(s),matchMedia:()=>media,setTimeout:(f,ms)=>{const id=++serial;timers.set(id,{f,ms});return id;},clearTimeout:id=>timers.delete(id),document:{hidden:false,getElementById:id=>controls[id]??=element(),addEventListener:(t,f)=>events[t]=f,removeEventListener:t=>delete events[t]}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('assets/js/learning-tools.js','utf8'),ctx);
const lesson=require('../scripts/manifest.cjs').readPaths().find(p=>p.id==='react').lessons.find(l=>l.visual);
const c=id=>controls['visual-'+id],click=id=>c(id).events.click(),tick=()=>{const [id,t]=timers.entries().next().value;timers.delete(id);t.f();};
ctx.bindVisualExplorer(lesson);assert.equal(timers.size,0,'no automatic playback on entry');
click('play');assert.equal(timers.size,1);assert.equal(c('play').textContent,'Pause sequence');tick();assert.match(c('status').textContent,/Step 2/);
click('play');assert.equal(timers.size,0,'pause cancels pending step');
click('play');c('pace').value='10000';c('pace').events.change();assert.equal(timers.size,1);assert.equal([...timers.values()][0].ms,10000);
click('next');assert.equal(timers.size,0,'manual step pauses playback');
click('reset');assert.match(c('status').textContent,/Step 1/);click('play');for(let i=1;i<lesson.visual.scenarios[0].steps.length;i++)tick();assert.equal(timers.size,0);assert.equal(c('play').textContent,'Replay sequence');
click('play');assert.match(c('status').textContent,/Step 1/);ctx.document.hidden=true;events.visibilitychange();assert.equal(timers.size,0);ctx.document.hidden=false;
click('play');media.matches=true;mediaEvents.change();assert.equal(timers.size,0);assert.match(c('motion-note').textContent,/Reduced motion/);click('play');tick();assert.match(c('status').textContent,/Step 2/,'reduced motion supports still-frame playback');
c('scenario').events.change({target:{value:'1'}});assert.equal(timers.size,0);assert.match(c('status').textContent,/Step 1/);
click('play');const oldControls=controls;controls={};ctx.bindVisualExplorer(null);assert.equal(timers.size,0,'navigation cancels playback');assert.equal(Object.keys(events).length,0);assert.equal(Object.keys(mediaEvents).length,0);assert.equal(Object.keys(controls).length,0,'cleanup does not query the next page');assert.equal(oldControls['visual-play'].attributes['aria-pressed'],'false');
console.log('PASS: opt-in playback, pause, pace, manual stepping, replay, scenario reset, reduced motion, hidden-tab and route cleanup.');
// Exercise actual movement calculations, including SVG viewport scaling and reduced motion.
const sorting=require('../scripts/manifest.cjs').readPaths().find(p=>p.id==='data-structures-algorithms').lessons.find(l=>l.id==='sorting');
media.matches=false;controls={};let moves=[];
ctx.document.getElementById('visual-frame').querySelectorAll=function(){const initial=this.innerHTML.includes('<h3>Initial array</h3>');return [{dataset:{motionNode:'desktop-value-4'},textContent:'4',querySelector:()=>({textContent:'4'}),getBoundingClientRect:()=>({x:initial?0:115,y:0,width:103}),getScreenCTM:()=>({a:.5,d:.5}),animate:(frames,options)=>{moves.push({frames,options});return {cancel(){}};}}];};
ctx.bindVisualExplorer(sorting);click('next');assert.equal(moves.length,1);assert.equal(moves[0].frames[0].translate,'-230px 0px');assert.equal(moves[0].options.duration,480);
media.matches=true;mediaEvents.change();moves=[];click('prev');assert.equal(moves.length,0,'reduced motion suppresses movement');ctx.bindVisualExplorer(null);
for(const scenario of sorting.visual.scenarios){const keys=scenario.steps[0].nodes.map(n=>n.motionKey).sort();for(const step of scenario.steps)assert.deepEqual(step.nodes.map(n=>n.motionKey).sort(),keys,'moving values retain identity');}
console.log('PASS: stable sorting identities, scaled SVG movement and reduced-motion suppression.');
