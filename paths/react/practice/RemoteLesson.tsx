import {useEffect, useState} from "react";
export type Detail = {id: string; title: string};
export type Loader = (id: string, signal: AbortSignal) => Promise<Detail>;
const demoLoader: Loader = async (id, signal) => {
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, 200);
    signal.addEventListener("abort", () => {clearTimeout(timer); reject(new DOMException("Aborted", "AbortError"));}, {once:true});
  });
  if (!["types", "state"].includes(id)) throw Error("Unknown lesson");
  return {id, title:id === "types" ? "Types detail" : "State detail"};
};
function selected() { return new URL(window.location.href).searchParams.get("lesson") || "types"; }
export default function RemoteLesson({load = demoLoader}: {load?: Loader}) {
  const [id, setId] = useState(selected);
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<{id:string; detail?:Detail; error?:string}>({id:""});
  useEffect(() => {
    const pop = () => setId(selected());
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    let current = true; // Ignore even an adapter that does not honor abort.
    setResult({id});
    load(id, controller.signal).then(detail => {
      if (current) setResult(detail.id === id ? {id, detail} : {id, error:"Response identity mismatch."});
    }, () => {if(current) setResult({id, error:"Could not load this lesson."});});
    return () => {current=false; controller.abort();};
  }, [id, load, retry]);
  function navigate(next:string) {
    const url=new URL(window.location.href);url.searchParams.set("lesson",next);
    window.history.pushState({}, "", url);setId(next); // pushState does not emit popstate.
  }
  return <section aria-label="Remote lesson workshop">
    <h2>URL-selected lesson</h2>
    <button onClick={() => navigate("types")}>Open Types</button>
    <button onClick={() => navigate("state")}>Open State</button>
    {result.id !== id || (!result.detail && !result.error) ? <p role="status">Loading {id}…</p> :
      result.error ? <><p role="alert">{result.error}</p><button onClick={() => setRetry(x=>x+1)}>Retry lesson</button></> :
      <h3>{result.detail?.title}</h3>}
    <p>This adapter uses local demo data. The URL controls selection; add-title drafts remain owned by the tracker.</p>
  </section>;
}
