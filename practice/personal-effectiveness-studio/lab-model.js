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
 const api={capacity,move,plan};if(typeof module==='object'&&module.exports)module.exports=api;else root.EffectivenessLab=api;
})(typeof window==='object'?window:globalThis);
