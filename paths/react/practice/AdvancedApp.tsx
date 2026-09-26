import {useReducer, useState} from "react";
import type {FormEvent} from "react";
import {reducer, decodeSaved, encodeSaved} from "./tracker-core";
import type {Lesson} from "./tracker-core";
const initial: Lesson[] = [{id:"types",title:"Types",done:false},{id:"state",title:"State",done:false}];
export default function AdvancedApp() {
  const [rows, dispatch] = useReducer(reducer, initial);
  const [title, setTitle] = useState("");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [exported, setExported] = useState("");
  const [importText, setImportText] = useState("");
  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(title.trim().length < 2 || title.trim().length > 100) {
      setMessage("Use a title between 2 and 100 characters."); return;
    }
    dispatch({type:"add",id:crypto.randomUUID(),title});
    setTitle(""); setMessage("Lesson added.");
  }
  function validateImport() {
    try {
      const decoded = decodeSaved(importText);
      setMessage("Valid backup with " + decoded.length + " lessons. Validation only; current work has not been replaced.");
    } catch { setMessage("Invalid backup. Check its version and records."); }
  }
  const visible = rows.filter(row => row.title.toLowerCase().includes(query.toLowerCase()));
  return <main>
    <h1>Learning tracker workshop</h1>
    <form onSubmit={add}>
      <label htmlFor="title">New lesson title</label>
      <input id="title" value={title} onChange={e=>setTitle(e.target.value)} maxLength={100} />
      <button type="submit">Add lesson</button>
    </form>
    <p role="status">{message}</p>
    <label htmlFor="search">Find a lesson</label>
    <input id="search" value={query} onChange={e=>setQuery(e.target.value)} />
    <p>{rows.filter(row=>row.done).length} of {rows.length} complete</p>
    {visible.length ? <ul>{visible.map(row=><li key={row.id}>
      <label><input type="checkbox" checked={row.done} onChange={()=>dispatch({type:"toggle",id:row.id})}/>{row.title}</label>
      <button onClick={()=>dispatch({type:"remove",id:row.id})} aria-label={"Remove "+row.title}>Remove</button>
    </li>)}</ul> : <p>No matching lessons.</p>}
    <button onClick={()=>setExported(encodeSaved(rows))}>Prepare JSON backup</button>
    <label htmlFor="backup">Generated backup</label>
    <textarea id="backup" readOnly value={exported}/>
    <label htmlFor="import">Validate a backup without replacing work</label>
    <textarea id="import" value={importText} onChange={e=>setImportText(e.target.value)}/>
    <button onClick={validateImport}>Validate backup</button>
    <p>Changes remain in memory. Copy the generated JSON to a file before refreshing. Import here validates only; replacement and persistence are project extensions.</p>
  </main>;
}

