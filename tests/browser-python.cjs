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
 // Checkpoint answers that depend on code behaviour are recomputed here and must equal the marked option.
 const manifest=require(path.resolve('scripts/manifest.cjs')).readPaths();
 py.runPython(fs.readFileSync('tests/checkpoint_facts.py','utf8'));
 const facts=py.globals.get('FACTS').toJs();
 for(const [name,code] of facts){
  const [course,...rest]=name.split('/'),key=rest.join('/'),p=manifest.find(x=>x.id===course);
  const q=key.startsWith('stage/')?p?.stages.find(s=>s.id===rest[1])?.stageCheck?.[rest[2]-1]:p?.lessons.find(l=>l.id===rest[0])?.extraQuiz?.[rest[1]-2];
  assert.ok(q,name+': names a checkpoint question');
  const scope=py.globals.get('dict')();py.runPython(code,{globals:scope});
  assert.equal(scope.get('answer'),q.options[q.correct],name+': the marked answer matches the code');scope.destroy();
 }
 assert.equal(facts.size,72,'Code-based checkpoint answers checked');
 // Lesson examples in runExamples courses run unchanged, with the practice modules they name, and show a result.
 const runExample=async(code,files)=>{const messages=[],self={postMessage:data=>messages.push(data)};vm.runInNewContext(source,{self,importScripts:()=>{},loadPyodide:async()=>py,JSON,String});await self.onmessage({data:{mode:'run',runtime,code,files}});return messages.at(-1);};
 const examples={};
 for(const p of require(path.resolve('scripts/manifest.cjs')).readPaths().filter(p=>p.runExamples)){
  const enabled=p.lessons.flatMap(l=>l.sections.map((s,i)=>({l,s,i}))).filter(({s})=>s.example&&!s.exampleFormat);
  examples[p.id]=[enabled.length,enabled.filter(({s})=>s.exampleFiles).length];
  for(const {l,s,i} of enabled){
   const files=(s.exampleFiles||[]).map(f=>{assert.ok(p.publicFiles.includes(f),'Example module is published for offline use: '+f);return {name:f.split('/').pop(),source:fs.readFileSync('paths/'+p.id+'/'+f,'utf8')};});
   const r=await runExample(s.example,files),where=p.id+'/'+l.id+' example '+i;
   assert.equal(r.ok,true,where+': '+r.error);
   assert.ok(r.output||/^\s*assert\b/m.test(s.example),where+': prints a result or checks one with assert');
  }
 }
 assert.deepEqual(examples,{'data-structures-algorithms':[23,2],'design-patterns':[24,2],'practical-maths-statistics':[21,0]},'Enabled examples per course, and those that import practice modules');
 const missing=await runExample('from practice_helpers import solve',[]);assert.ok(!missing.ok&&/ModuleNotFoundError: No module named 'practice_helpers'/.test(missing.error),'An import that is not supplied fails clearly');
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
 console.log('PASS: real browser Python runtime executes all 30 references / 192 cases and rejects wrong answers, types, mutation, syntax, missing functions and SystemExit; checks 72 code-based checkpoint answers; runs 21 Python course references and 68 lesson examples (4 with their practice modules) as scripts with bounded output, exit codes, no stdin and learner-only tracebacks.');
})().catch(error=>{console.error(error);process.exitCode=1;});
