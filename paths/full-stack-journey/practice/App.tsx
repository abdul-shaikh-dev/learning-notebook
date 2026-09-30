import {useEffect, useState} from 'react';
import {decodeTask, request, type StudyTask} from './planner-api';
export default function App() {
  const [tasks,setTasks]=useState<StudyTask[]>([]), [title,setTitle]=useState(''), [minutes,setMinutes]=useState('25');
  const [busy,setBusy]=useState(true), [status,setStatus]=useState('Loading tasks…');
  async function reload(signal?:AbortSignal) {
    const data=await request('',{signal}); if (!Array.isArray(data)) throw new Error('Expected task list');
    const rows=data.map(decodeTask); if(new Set(rows.map(r=>r.id)).size!==rows.length) throw new Error('Duplicate task IDs');
    setTasks(rows); setStatus(rows.length ? 'Tasks loaded.' : 'No tasks yet. Add your first study session.');
  }
  useEffect(()=>{const controller=new AbortController(); reload(controller.signal).catch(e=>{if(!controller.signal.aborted)setStatus(String(e.message));}).finally(()=>{if(!controller.signal.aborted)setBusy(false);});return ()=>controller.abort();},[]);
  async function add(e:React.FormEvent) {
    e.preventDefault(); if(busy)return;
    const n=Number(minutes); if(!title.trim() || title.trim().length>120 || !minutes.trim() || !Number.isInteger(n) || n<0 || n>1440){setStatus('Enter a title and whole minutes from 0 to 1440.');return;}
    setBusy(true);
    try { const task=decodeTask(await request('',{method:'POST',body:JSON.stringify({title,minutes:n})}));setTasks(old=>[...old,task]);setTitle('');setStatus('Study session added.'); }
    catch(e){setStatus((e as Error).message);}finally{setBusy(false);}
  }
  async function toggle(task:StudyTask) {
    if(busy)return; setBusy(true);
    try {const saved=decodeTask(await request('/'+task.id,{method:'PUT',body:JSON.stringify({title:task.title,minutes:task.minutes,done:!task.done,version:task.version})}));setTasks(old=>old.map(x=>x.id===saved.id?saved:x));setStatus('Completion saved.');}
    catch(e){setStatus((e as Error).message);}finally{setBusy(false);}
  }
  return <main><p>Full-Stack Project Journey · synthetic local data</p><h1>Study planner</h1>
    <form onSubmit={add}><label htmlFor="title">Study topic (required)</label><input id="title" disabled={busy} value={title} maxLength={120} onChange={e=>setTitle(e.target.value)} required />
      <label htmlFor="minutes">Planned minutes (0–1440, required)</label><input id="minutes" disabled={busy} type="number" min="0" max="1440" step="1" value={minutes} onChange={e=>setMinutes(e.target.value)} required />
      <button disabled={busy}>Add session</button></form><p role="status">{status}</p>
    <button disabled={busy} onClick={()=>{setBusy(true);reload().catch(e=>setStatus(e.message)).finally(()=>setBusy(false));}}>Reload list</button>
    <ul>{tasks.map(task=><li key={task.id}><span>{task.title} · {task.minutes} min · {task.done?'complete':'planned'}</span> <button disabled={busy} aria-label={(task.done?'Mark planned: ':'Mark complete: ')+task.title} onClick={()=>toggle(task)}>{task.done?'Reopen':'Complete'}</button></li>)}</ul>
    <p>The local reference has no login. Add verified identity and ownership checks before serving other users.</p>
  </main>;
}
