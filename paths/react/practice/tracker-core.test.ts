import {reducer, decodeSaved, encodeSaved} from "./tracker-core.ts";
import type {Lesson} from "./tracker-core.ts";
function assert(ok: boolean, message: string) {if(!ok) throw new Error(message);}
const start: Lesson[] = [{id:"a",title:"Alpha",done:false}];
const next = reducer(start,{type:"toggle",id:"a"});
assert(!start[0].done && next[0].done,"immutable toggle");
assert(reducer(start,{type:"add",id:"a",title:"Duplicate"}) === start,"duplicate rejected");
assert(reducer(start,{type:"add",id:"b",title:" "}) === start,"blank rejected");
const added = reducer(start,{type:"add",id:"b",title:" Beta "});
assert(added.length === 2 && added[1].title === "Beta","trim and add");
assert(reducer(added,{type:"remove",id:"a"}).length === 1,"remove");
assert(JSON.stringify(decodeSaved(encodeSaved(added))) === JSON.stringify(added),"round trip");
for(const value of ['{}','{"version":2,"lessons":[]}','{"version":1,"lessons":[null]}','{"version":1,"lessons":[{"id":"a","title":"OK","done":"false"}]}', '{"version":1,"lessons":[{"id":"a","title":"OK","done":false},{"id":"a","title":"OK","done":true}]}']) {
  let rejected=false;try {decodeSaved(value);} catch {rejected=true;}
  assert(rejected,"invalid record accepted");
}
console.log("All tracker domain tests passed.");

