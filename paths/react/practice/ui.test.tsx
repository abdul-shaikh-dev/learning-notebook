import {afterEach, beforeEach, expect, test} from "vitest";
import {act, cleanup, render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdvancedApp from "./AdvancedApp";
import RemoteLesson from "./RemoteLesson";
import type {Detail, Loader} from "./RemoteLesson";
afterEach(cleanup);
beforeEach(()=>window.history.replaceState({}, "", "/"));
function deferred() {let resolve!: (v:Detail)=>void; let reject!: (e:Error)=>void;
 const promise=new Promise<Detail>((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};}
test("late A cannot overwrite B even when the adapter ignores abort", async()=>{
 const a=deferred(), b=deferred();let aSignal:AbortSignal|undefined;
 const load:Loader=(id,signal)=>{if(id==="types") aSignal=signal;return id==="types" ? a.promise : b.promise;};
 render(<RemoteLesson load={load}/>);
 expect(screen.getByRole("status").textContent).toContain("Loading types");
 await userEvent.click(screen.getByRole("button",{name:"Open State"}));
 expect(aSignal?.aborted).toBe(true);
 await act(async()=>b.resolve({id:"state",title:"B latest"}));
 expect(screen.getByRole("heading",{name:"B latest"})).toBeTruthy();
 await act(async()=>a.resolve({id:"types",title:"A stale"}));
 expect(screen.queryByText("A stale")).toBeNull();
 expect(screen.getByRole("heading",{name:"B latest"})).toBeTruthy();
});
test("direct link survives remount; actual history Back and Forward synchronize selection", async()=>{
 window.history.replaceState({}, "", "/?lesson=state");
 const load:Loader=async id=>({id,title:id+" loaded"});
 const view=render(<RemoteLesson load={load}/>);
 await screen.findByRole("heading",{name:"state loaded"});
 view.unmount();render(<RemoteLesson load={load}/>);
 await screen.findByRole("heading",{name:"state loaded"});
 await userEvent.click(screen.getByRole("button",{name:"Open Types"}));
 await screen.findByRole("heading",{name:"types loaded"});
 act(()=>window.history.back());
 await screen.findByRole("heading",{name:"state loaded"});
 act(()=>window.history.forward());
 await screen.findByRole("heading",{name:"types loaded"});
 expect(new URL(window.location.href).searchParams.get("lesson")).toBe("types");
});
test("failed loading is visible and retry replaces it", async()=>{
 let attempts=0;const load:Loader=async id=>{if(++attempts===1)throw Error("offline");return {id,title:"Recovered"};};
 render(<RemoteLesson load={load}/>);
 expect((await screen.findByRole("alert")).textContent).toContain("Could not load");
 await userEvent.click(screen.getByRole("button",{name:"Retry lesson"}));
 await screen.findByRole("heading",{name:"Recovered"});expect(screen.queryByRole("alert")).toBeNull();
});
test("keyboard submission exposes a linked error, returns focus and preserves the draft across selection",async()=>{
 const user=userEvent.setup();render(<AdvancedApp/>);
 const input=screen.getByRole("textbox",{name:"New lesson title"});
 await user.click(input);await user.type(input,"x{Enter}");
 expect(input.getAttribute("aria-invalid")).toBe("true");
 expect(input.getAttribute("aria-describedby")).toBe(screen.getByRole("alert").id);
 expect(document.activeElement).toBe(input);
 await user.click(screen.getByRole("button",{name:"Open State"}));expect((input as HTMLInputElement).value).toBe("x");
 await user.click(input);await user.clear(input);await user.type(input,"Keyboard lesson{Enter}");
 expect(screen.getByRole("checkbox",{name:"Keyboard lesson"})).toBeTruthy();
 expect(input.getAttribute("aria-invalid")).toBe("false");
 await user.tab();expect(document.activeElement).toBe(screen.getByRole("button",{name:"Add lesson"}));
});
test("empty filters remain visible and invalid backups do not replace work", async()=>{
 const user=userEvent.setup();render(<AdvancedApp/>);
 await user.type(screen.getByRole("textbox",{name:"Find a lesson"}),"no-such-title");expect(screen.getByText("No matching lessons.")).toBeTruthy();
 await user.type(screen.getByRole("textbox",{name:"Validate a backup without replacing work"}),"bad json");
 await user.click(screen.getByRole("button",{name:"Validate backup"}));
 await waitFor(()=>expect(screen.getByText("Invalid backup. Check its version and records.")).toBeTruthy());
 expect(screen.getByText("0 of 2 complete")).toBeTruthy();
});
