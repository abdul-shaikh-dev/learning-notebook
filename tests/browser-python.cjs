// Execute the shipped worker against the real vendored WebAssembly runtime.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
(async()=>{
 const runtime=path.resolve('paths/python-problem-solving/runtime')+path.sep;
 for(const [file,meta] of Object.entries(JSON.parse(fs.readFileSync(runtime+'provenance.json','utf8')))){assert.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(runtime+file)).digest('hex'),meta.sha256,'Runtime integrity: '+file);}
 const {loadPyodide}=require(runtime+'pyodide.js');
 const py=await loadPyodide({indexURL:runtime,stdout:()=>{},stderr:()=>{}});
 const source=fs.readFileSync('assets/js/browser-python-worker.js','utf8');
 const problems=JSON.parse(fs.readFileSync('paths/python-problem-solving/practice/cases.json','utf8'));
 const original=JSON.parse(fs.readFileSync('paths/python-problem-solving/challenges.json','utf8'));
 async function run(code,problem){const messages=[],self={postMessage:data=>messages.push(data)};const context={self,importScripts:()=>{},loadPyodide:async()=>py,JSON,String};vm.runInNewContext(source,context);await self.onmessage({data:{runtime,code,problem}});return messages.at(-1);}
 for(const c of original){const result=await run(c.solution,problems[c.id]);assert.equal(result.ok,true,c.id+': '+result.text);}
 const problem=problems['sum-approved'];
 for(const [code,match] of [
  ['def sum_approved(a,b): return -1',/Expected:/],
  ['def sum_approved(a,b): return True',/failed/],
  ['def sum_approved(a,b): a.append(2); return 0',/input arguments/],
  ['def sum_approved(a,b): raise RuntimeError("test")',/RuntimeError/],
  ['def broken(',/SyntaxError/],
  ['def another(a,b): return 0',/Define sum_approved/],
  ['raise SystemExit()',/SystemExit/]
 ]){const result=await run(code,problem);assert.equal(result.ok,false);assert.match(result.text,match);}
 console.log('PASS: real browser Python runtime executes all 30 references / 192 cases and rejects wrong answers, types, mutation, syntax, missing functions and SystemExit.');
})().catch(error=>{console.error(error);process.exitCode=1;});
