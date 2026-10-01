(function(root){
 'use strict';
 function integer(value,min,max,label){if(!Number.isInteger(value)||value<min||value>max)throw new Error(label+' must be a whole number from '+min+' to '+max+'.');return value;}
 function capacity(available,buffer,planned,disruption){
  integer(available,0,10080,'Available minutes');integer(buffer,0,100,'Buffer percentage');integer(planned,0,10080,'Planned minutes');integer(disruption,0,10080,'Disruption minutes');
  const reserve=Math.round(available*buffer/100),target=available-reserve,remaining=Math.max(0,available-disruption);
  return {available,reserve,target,remaining,planned,overTarget:Math.max(0,planned-target),shortfall:Math.max(0,planned-remaining),spare:Math.max(0,remaining-planned)};
 }
 function move(tasks,id,status,limit){
  integer(limit,1,10,'Work-in-progress limit');if(!['ready','doing','blocked','done'].includes(status))throw new Error('Unknown task status.');
  const task=tasks.find(t=>t.id===id);if(!task)throw new Error('Task not found.');
  // Blocked tasks have started and remain part of work in progress.
  const started=t=>['doing','blocked'].includes(t.status);
  if(started({status})&&!started(task)&&tasks.filter(started).length>=limit)throw new Error('Work-in-progress limit reached. Finish work or review the limit before starting another task. Blocked work still counts.');
  return tasks.map(t=>t.id===id?{...t,status}:({...t}));
 }
 function plan(cue,action,fallback){const parts=[cue,action,fallback].map(x=>String(x).trim());if(parts.some(x=>!x||x.length>240))throw new Error('Complete each field with 1–240 characters.');return 'When '+parts[0]+', I will '+parts[1]+'. If that is not feasible, I will '+parts[2]+'.';}

 function text(value,max,label,required=false){if(typeof value!=='string'||value.length>max||(required&&!value.trim()))throw new Error(label+' is missing or too long.');return value;}
 function record(value,keys,label){if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!keys.includes(k)))throw new Error('Invalid '+label+'.');return value;}
 function backup(value){
  const v=record(value,['format','exportedAt','capacity','capacityInputs','review','tasks','wipLimit','habit','learning','conversation','cardDraft','taskDraft'],'practice file');
  const legacy=v.format==='notebook-personal-practice-v1';
  if(!legacy&&v.format!=='notebook-personal-practice-v2')throw new Error('Choose a Learning Notebook practice export, version 1 or 2.');
  if(typeof v.exportedAt!=='string'||v.exportedAt.length>40||!Number.isFinite(Date.parse(v.exportedAt)))throw new Error('Invalid export date.');
  const c=record(v.capacity,['available','reserve','target','remaining','planned','overTarget','shortfall','spare'],'capacity');
  for(const key of ['available','reserve','target','remaining','planned','overTarget','shortfall','spare'])integer(c[key],0,10080,'Capacity '+key);
  let inputs,warnings=[];
  if(legacy){
   const buffer=Array.from({length:101},(_,i)=>i).find(i=>Math.round(c.available*i/100)===c.reserve);
   if(buffer===undefined||c.remaining>c.available)throw new Error('Inconsistent legacy capacity.');
   inputs={available:c.available,buffer,planned:c.planned,disruption:c.available-c.remaining};
   warnings.push('This older export did not save the original buffer percentage or disruption input. An equivalent capacity result will be restored. Check those two inputs before continuing.');
  }else{
   inputs=record(v.capacityInputs,['available','buffer','planned','disruption'],'capacity inputs');
  }
  const computed=capacity(inputs.available,inputs.buffer,inputs.planned,inputs.disruption);
  if(Object.keys(computed).some(k=>computed[k]!==c[k]))throw new Error('Capacity results do not match the inputs.');
  if(!Array.isArray(v.tasks)||v.tasks.length>50)throw new Error('Practice files support up to 50 tasks.');
  const ids=new Set();
  const tasks=v.tasks.map(t=>{record(t,['id','title','status'],'task');integer(t.id,1,1000000,'Task ID');if(ids.has(t.id))throw new Error('Duplicate task ID.');ids.add(t.id);if(!['ready','doing','blocked','done'].includes(t.status))throw new Error('Unknown task status.');return {id:t.id,title:text(t.title,120,'Task title',true),status:t.status};});
  const limit=legacy&&typeof v.wipLimit==='string'&&/^\d+$/.test(v.wipLimit)?Number(v.wipLimit):v.wipLimit;
  integer(limit,1,10,'Work-in-progress limit');
  const h=record(v.habit,['cue','action','fallback','reflection'],'habit');
  const learning=record(v.learning,['question','answer','attempt','reviewDate'],'learning');
  const date=text(learning.reviewDate,10,'Review date');
  if(date&&(!/^\d{4}-\d{2}-\d{2}$/.test(date)||date.startsWith('0000')||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date))throw new Error('Invalid review date.');
  const conversation=record(v.conversation,['opening','request'],'conversation');
  if(!['','accuse','avoid','ask'].includes(conversation.opening))throw new Error('Unknown conversation choice.');
  const draft=legacy?{question:learning.question,answer:learning.answer}:record(v.cardDraft,['question','answer'],'card draft');
  return {data:{format:'notebook-personal-practice-v2',exportedAt:v.exportedAt,capacity:computed,capacityInputs:{...inputs},review:text(v.review,2000,'Review'),tasks,wipLimit:limit,habit:{cue:text(h.cue,240,'Cue'),action:text(h.action,240,'Action'),fallback:text(h.fallback,240,'Fallback'),reflection:text(h.reflection,2000,'Habit reflection')},learning:{question:text(learning.question,500,'Active question',true),answer:text(learning.answer,2000,'Active answer',true),attempt:text(learning.attempt,2000,'Recall attempt'),reviewDate:date},conversation:{opening:conversation.opening,request:text(conversation.request,2000,'Request')},cardDraft:{question:text(draft.question,500,'Draft question'),answer:text(draft.answer,2000,'Draft answer')},taskDraft:legacy?'':text(v.taskDraft,120,'Task draft')},warnings};
 }
 function parseBackup(raw){if(typeof raw!=='string'||raw.length>262144)throw new Error('Choose a practice JSON file under 256 KiB.');let value;try{value=JSON.parse(raw);}catch{throw new Error('The file is not valid JSON.');}return backup(value);}

 const api={capacity,move,plan,backup,parseBackup};if(typeof module==='object'&&module.exports)module.exports=api;else root.EffectivenessLab=api;
})(typeof window==='object'?window:globalThis);
