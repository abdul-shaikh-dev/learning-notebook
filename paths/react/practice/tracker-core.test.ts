import {reducer, decodeSaved, encodeSaved, MAX_LESSONS} from "./tracker-core.ts";
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
const almostFull: Lesson[] = Array.from({length:MAX_LESSONS-1},(_,i)=>({id:String(i),title:`Lesson ${i}`,done:false}));
const full = reducer(almostFull,{type:"add",id:"last",title:"Last lesson"});
assert(full.length === MAX_LESSONS && almostFull.length === MAX_LESSONS-1,"final supported addition");
assert(JSON.stringify(decodeSaved(encodeSaved(full))) === JSON.stringify(full),"capacity boundary round trip");
assert(reducer(full,{type:"add",id:"overflow",title:"Overflow lesson"}) === full,"over-capacity add preserves state");
const afterRemove = reducer(full,{type:"remove",id:"last"});
assert(reducer(afterRemove,{type:"add",id:"replacement",title:"Replacement"}).length === MAX_LESSONS,"removal releases capacity");
const oversized = [...full,{id:"overflow",title:"Overflow lesson",done:false}];
let encodeRejected=false;try {encodeSaved(oversized);} catch {encodeRejected=true;}
assert(encodeRejected,"encoder rejects unsupported external state");
let decodeRejected=false;try {decodeSaved(JSON.stringify({version:1,lessons:oversized}));} catch {decodeRejected=true;}
assert(decodeRejected,"decoder rejects over-capacity payload");
console.log("All tracker domain tests passed.");

