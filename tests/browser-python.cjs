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
 // Lesson starters run as scripts: every runnable Python course solution must finish cleanly in the browser runtime.
 const runCode=async code=>{const messages=[],self={postMessage:data=>messages.push(data)};vm.runInNewContext(source,{self,importScripts:()=>{},loadPyodide:async()=>py,JSON,String});await self.onmessage({data:{mode:'run',runtime,code}});return messages.at(-1);};
 const course=require(path.resolve('scripts/manifest.cjs')).readPaths().find(p=>p.id==='python').lessons;
 const runnable=course.filter(l=>!l.exercise.runLocally&&l.exercise.solutionFormat!=='prose');
 assert.equal(runnable.length,21,'Two lessons are marked to run locally');
 for(const l of runnable){const r=await runCode(l.exercise.solution);assert.equal(r.ok,true,l.id+': '+r.error);assert.ok(r.output,l.id+': the reference prints its result');}
 for(const [code,check] of [
  ['print("a")\nprint("b")',r=>r.ok&&r.output==='a\nb\n'&&!r.error],
  ['x = 1',r=>r.ok&&r.output===''],
  ['print("x"*30000)',r=>r.ok&&r.truncated&&r.output.length===20000],
  ['import sys; sys.exit(0)',r=>r.ok&&!r.error],
  ['raise SystemExit(3)',r=>!r.ok&&r.error==='Exited with status 3.'],
  ['input("name? ")',r=>!r.ok&&/EOFError/.test(r.error)&&/Assign a value instead/.test(r.error)],
  ['def f():\n    return 1/0\nprint("before")\nf()',r=>!r.ok&&r.output==='before\n'&&/line 4/.test(r.error)&&r.error.includes('line 2, in f\n    return 1/0')&&/ZeroDivisionError/.test(r.error)&&!/exec|<string>/.test(r.error)],
  ['def broken(',r=>!r.ok&&/SyntaxError/.test(r.error)],
  ['import sys; print("oops", file=sys.stderr)',r=>r.ok&&r.output==='oops\n']
 ]){const r=await runCode(code);assert.ok(check(r),code+' -> '+JSON.stringify(r));}
 console.log('PASS: real browser Python runtime executes all 30 references / 192 cases and rejects wrong answers, types, mutation, syntax, missing functions and SystemExit; runs 21 Python course references as scripts with bounded output, exit codes, no stdin and learner-only tracebacks.');
})().catch(error=>{console.error(error);process.exitCode=1;});
