import {makeRows, filterRows} from "./performance-fixture.ts";
const rows = makeRows();
const start = performance.now();
const result = filterRows(rows, "focus");
console.log({records:rows.length, matches:result.length,
  filterMilliseconds:+(performance.now()-start).toFixed(2)});
