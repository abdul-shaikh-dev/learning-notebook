import { useState } from "react";

type Lesson = { id: string; title: string; done: boolean };
const initial: Lesson[] = [
  { id: "types", title: "Types", done: false },
  { id: "state", title: "State", done: false },
  { id: "forms", title: "Forms", done: false },
];
export default function App() {
  const [lessons, setLessons] = useState<Lesson[]>(initial);
  const [query, setQuery] = useState("");
  const visible = lessons.filter(row => row.title.toLowerCase().includes(query.toLowerCase()));
  const count = lessons.filter(row => row.done).length;
  function toggle(id: string) {
    setLessons(previous => previous.map(row => row.id === id ? {...row, done: !row.done} : row));
  }
  return <main>
    <h1>My learning tracker</h1>
    <p aria-live="polite">{count} of {lessons.length} complete</p>
    <label htmlFor="search">Find a lesson</label>
    <input id="search" value={query} onChange={e => setQuery(e.target.value)} />
    {visible.length ? <ul>{visible.map(row => <li key={row.id}>
      <label><input type="checkbox" checked={row.done} onChange={() => toggle(row.id)} /> {row.title}</label>
    </li>)}</ul> : <p>No matching lessons.</p>}
    <p>This practice app stores changes in memory. Refreshing resets them.</p>
  </main>;
}

