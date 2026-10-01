const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const model=require('../practice/personal-effectiveness-studio/lab-model.js');
function fixture(){return {format:'notebook-personal-practice-v2',exportedAt:'2026-10-02T10:00:00.000Z',capacityInputs:{available:301,buffer:23,planned:180,disruption:400},capacity:model.capacity(301,23,180,400),review:'Keep a smaller commitment.',tasks:[{id:7,title:'<img src=x onerror=alert(1)>',status:'blocked'}],wipLimit:1,habit:{cue:'Dinner',action:'Read',fallback:'One question',reflection:'Useful'},learning:{question:'Question?',answer:'Answer.',attempt:'My attempt',reviewDate:'2026-10-09'},conversation:{opening:'ask',request:'Can you review?'},cardDraft:{question:'Unapplied draft',answer:'Draft answer'},taskDraft:'Unsubmitted action'};}
const original=fixture();assert.deepEqual(model.parseBackup(JSON.stringify(original)).data,original);
for(const change of [v=>v.tasks.push({...v.tasks[0]}),v=>v.tasks[0].status='unknown',v=>v.tasks[0].title='x'.repeat(121),v=>v.tasks=Array(51).fill(v.tasks[0]),v=>v.wipLimit=0,v=>v.capacity.spare=99,v=>v.capacityInputs.buffer=101,v=>v.learning.reviewDate='2026-02-30',v=>v.learning.reviewDate='0000-01-01',v=>v.conversation.opening='execute',v=>v.cardDraft.answer=42,v=>v.review='x'.repeat(2001),v=>v.extra=true,v=>v.exportedAt='bad',v=>v.format='notebook-personal-practice-v99']){
 const candidate=fixture();change(candidate);assert.throws(()=>model.backup(candidate));
}
assert.throws(()=>model.parseBackup('{'));assert.throws(()=>model.parseBackup(' '.repeat(262145)));
assert.throws(()=>model.parseBackup(JSON.stringify(original).replace('"review":','"__proto__":{},"review":')));
const legacy=fixture();legacy.format='notebook-personal-practice-v1';delete legacy.capacityInputs;delete legacy.cardDraft;delete legacy.taskDraft;legacy.wipLimit='1';
const restored=model.backup(legacy);assert.deepEqual(restored.data.capacity,legacy.capacity);assert.equal(restored.warnings.length,1);assert.equal(restored.data.capacityInputs.disruption,301);
// Every old integer percentage can produce an equivalent restored capacity, including rounding and zero capacity.
for(const available of [0,1,2,99,301,10080])for(let buffer=0;buffer<=100;buffer++){
 const v=structuredClone(legacy);v.capacity=model.capacity(available,buffer,200,900);
 assert.deepEqual(model.backup(v).data.capacity,v.capacity);
}
const nodes=new Map();
function el(id=''){return {id,value:'',textContent:'',hidden:false,style:{},dataset:{},files:[],validity:{valid:true},handlers:{},children:[],addEventListener(k,f){this.handlers[k]=f;},append(...items){this.children.push(...items);},replaceChildren(...items){this.children=items;},setAttribute(){},focus(){},click(){}};}
function node(id){if(!nodes.has(id))nodes.set(id,el(id));return nodes.get(id);}
const fieldIds=['available','buffer','planned','disruption','review','wip','cue','action','fallback','habit-reflection','question','answer','attempt','review-date','request','task-title'];
for(const id of fieldIds)node(id);
for(const [id,value] of Object.entries({available:'300',buffer:'20',planned:'240',disruption:'0',wip:'2',question:'Original question',answer:'Original answer',cue:'Cue',action:'Action',fallback:'Fallback'}))node(id).value=value;
const ctx={window:{EffectivenessLab:model},document:{getElementById:node,querySelectorAll:s=>s.startsWith('input:not')?fieldIds.map(node):[],createElement:()=>el(),body:{dataset:{start:'week'}}},URL:{createObjectURL(){return 'blob:test';},revokeObjectURL(){}},Blob,setTimeout(){},console};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('practice/personal-effectiveness-studio/lab.js','utf8'),ctx);
const selection=file=>{node('import-file').files=file?[file]:[];return node('import-file').handlers.change();};
const file=value=>({size:1000,text:async()=>JSON.stringify(value)});
(async()=>{
 const before=vm.runInContext('fingerprint()',ctx);
 await selection({size:262145,text(){throw Error('Must not read oversized file');}});
 assert.equal(vm.runInContext('fingerprint()',ctx),before);assert.match(node('import-status').textContent,/256/);
 await selection(file(original));assert.equal(vm.runInContext('fingerprint()',ctx),before,'Preview is read-only');
 node('review').value='New edit';node('confirm-import').handlers.click();assert.equal(node('review').value,'New edit');assert.match(node('import-status').textContent,/edited/);
 node('confirm-import').handlers.click();assert.equal(node('review').value,original.review);assert.equal(node('question').value,original.cardDraft.question);assert.equal(node('recall-prompt').textContent,original.learning.question);assert.equal(node('reference').hidden,true);assert.equal(node('disruption').value,'400');assert.equal(vm.runInContext('tasks[0].title',ctx),original.tasks[0].title);
 await selection(file(original));await selection({size:10,text:async()=>'{'});node('confirm-import').handlers.click();assert.equal(node('import-preview').hidden,true);
 let finish;const old=selection({size:100,text:()=>new Promise(resolve=>finish=resolve)});await selection(file(original));finish('{');await old;assert.equal(node('import-preview').hidden,false,'Older read cannot erase newer preview');
 node('cancel-import').handlers.click();assert.equal(node('import-preview').hidden,true);assert.equal(node('import-file').value,'');
 const empty=fixture();empty.tasks=[];await selection(file(empty));node('confirm-import').handlers.click();assert.equal(vm.runInContext('nextId',ctx),1);
 node('wip').value='0';node('export').handlers.click();assert.match(node('export-status').textContent,/limit/);
 console.log('PASS: practice backup roundtrip, legacy recovery, malformed/oversized input, preview, stale edits, file races, cancellation and export validation.');
})().catch(e=>{console.error(e);process.exitCode=1;});
