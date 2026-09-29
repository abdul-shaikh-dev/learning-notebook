import {describe, expect, it, vi} from "vitest";
import {loadLocal, migrateSaved, saveLocal, STORAGE_KEY} from "./persistence-bridge";
import {makeHttpLoader} from "./http-loader";

const rows = [{id:"one",title:"One lesson",done:false}];
describe("advanced bridges", () => {
  it("migrates v1 and reloads a validated v2 save", () => {
    const storage = new Map<string,string>();
    expect(migrateSaved(JSON.stringify({version:1,lessons:rows}))).toEqual(rows);
    saveLocal({setItem:(key,value)=>{storage.set(key,value);}},rows);
    expect(loadLocal({getItem:key=>storage.get(key)??null})).toEqual(rows);
    expect(JSON.parse(storage.get(STORAGE_KEY)!)).toMatchObject({version:2});
    expect(()=>migrateSaved(JSON.stringify({version:3,lessons:rows}))).toThrow();
    expect(()=>migrateSaved(JSON.stringify({version:2,lessons:[{id:"one",title:"x",done:false}]}))).toThrow();
    storage.set(STORAGE_KEY, "corrupt");
    expect(()=>loadLocal({getItem:key=>storage.get(key)??null})).toThrow();
    const previous = storage.get(STORAGE_KEY);
    expect(()=>saveLocal({setItem:()=>{throw Error("quota");}},rows)).toThrow("quota");
    expect(storage.get(STORAGE_KEY)).toBe(previous);
  });
  it("checks HTTP status and response identity and forwards cancellation", async () => {
    const signal = new AbortController().signal;
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify({id:"one",title:"One lesson"}),{status:200}));
    expect(await makeHttpLoader("/api",fetcher as typeof fetch)("one",signal)).toEqual({id:"one",title:"One lesson"});
    expect(fetcher.mock.calls[0]?.[0]).toBe("/api/lessons/one");
    expect(fetcher.mock.calls[0]?.[1]?.signal).toBe(signal);
    const bad = vi.fn(async () => new Response("missing",{status:404}));
    await expect(makeHttpLoader("/api",bad as typeof fetch)("one",signal)).rejects.toThrow("HTTP 404");
    const wrongId = vi.fn(async () => new Response(JSON.stringify({id:"other",title:"Wrong"}),{status:200}));
    await expect(makeHttpLoader("/api",wrongId as typeof fetch)("one",signal)).rejects.toThrow("Invalid lesson response");
    const malformed = vi.fn(async () => new Response(JSON.stringify({id:"one",title:42}),{status:200}));
    await expect(makeHttpLoader("/api",malformed as typeof fetch)("one",signal)).rejects.toThrow("Invalid lesson response");
    const controller = new AbortController();
    const pending = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve,reject) => {
      init?.signal?.addEventListener("abort",()=>reject(new DOMException("Aborted","AbortError")),{once:true});
    }));
    const request = makeHttpLoader("/api",pending as typeof fetch)("one",controller.signal);
    controller.abort();
    await expect(request).rejects.toMatchObject({name:"AbortError"});
  });
});
