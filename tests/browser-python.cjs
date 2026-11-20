// Execute the shipped worker against the real vendored WebAssembly runtime.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
(async()=>{
 const runtime=path.resolve('paths/python-problem-solving/runtime')+path.sep;
 for(const [file,meta] of Object.entries(JSON.parse(fs.readFileSync(runtime+'provenance.json','utf8')))){assert.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(runtime+file)).digest('hex'),meta.sha256,'Runtime integrity: '+file);}
 const {loadPyodide}=await import(require('node:url').pathToFileURL(runtime+'pyodide.mjs').href);
 const py=await loadPyodide({indexURL:runtime,stdout:()=>{},stderr:()=>{}});
 const source=fs.readFileSync('assets/js/browser-python-worker.js','utf8');
 const problems=JSON.parse(fs.readFileSync('paths/python-problem-solving/practice/cases.json','utf8'));
 const original=JSON.parse(fs.readFileSync('paths/python-problem-solving/challenges.json','utf8'));
 async function run(code,problem){const messages=[],self={postMessage:data=>messages.push(data),importRuntime:async()=>({loadPyodide:async()=>py})};const context={self,JSON,String};vm.runInNewContext(source,context);await self.onmessage({data:{runtime,code,problem}});return messages.at(-1);}
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
 const runCode=async code=>{const messages=[],self={postMessage:data=>messages.push(data),importRuntime:async()=>({loadPyodide:async()=>py})};vm.runInNewContext(source,{self,JSON,String});await self.onmessage({data:{mode:'run',runtime,code}});return messages.at(-1);};
 const course=require(path.resolve('scripts/manifest.cjs')).readPaths().find(p=>p.id==='python').lessons;
 const runnable=course.filter(l=>!l.exercise.runLocally&&l.exercise.solutionFormat!=='prose');
 // #157: no fixed totals; every item is checked, with a floor so a filter that silently matches nothing fails.
 assert.ok(runnable.length>=20,'Python course references run in the browser')
 for(const l of runnable){const r=await runCode(l.exercise.solution);assert.equal(r.ok,true,l.id+': '+r.error);assert.ok(r.output,l.id+': the reference prints its result');}
 // Checkpoint answers that depend on code behaviour are recomputed here and must equal the marked option.
 const manifest=require(path.resolve('scripts/manifest.cjs')).readPaths();
 py.runPython(fs.readFileSync('tests/checkpoint_facts.py','utf8'));
 const facts=py.globals.get('FACTS').toJs({dict_converter:Array.from});
 for(const [name,code] of facts){
  const [course,...rest]=name.split('/'),key=rest.join('/'),p=manifest.find(x=>x.id===course);
  const q=key.startsWith('stage/')?p?.stages.find(s=>s.id===rest[1])?.stageCheck?.[rest[2]-1]:p?.lessons.find(l=>l.id===rest[0])?.extraQuiz?.[rest[1]-2];
  assert.ok(q,name+': names a checkpoint question');
  const scope=py.globals.get('dict')();py.runPython(code,{globals:scope});
  assert.equal(scope.get('answer'),q.options[q.correct],name+': the marked answer matches the code');scope.destroy();
 }
 assert.ok(facts.length>=80,'Code-based checkpoint answers checked');
 // Practice ladder answers that depend on code behaviour: each worked solution states what the code computes.
 const practice=py.globals.get('PRACTICE').toJs({dict_converter:Array.from});
 for(const [name,code] of practice){
  const [course,lesson,n]=name.split('/'),step=manifest.find(x=>x.id===course)?.lessons.find(l=>l.id===lesson)?.practice?.[n-1];
  assert.ok(step,name+': names a practice step');
  const scope=py.globals.get('dict')();py.runPython(code,{globals:scope});
  for(const text of scope.get('expected').toJs())assert.ok(step.solution.includes(text),name+': the solution states '+JSON.stringify(text));
  scope.destroy();
 }
 assert.ok(practice.length>=30,'Code-based practice answers checked');
 // Lesson examples in runExamples courses and lessons run unchanged, with the practice modules they name, and show a result.
 // An "# Expected output:" block at the end of an example must match what it prints.
 const runExample=async(code,files)=>{const messages=[],self={postMessage:data=>messages.push(data),importRuntime:async()=>({loadPyodide:async()=>py})};vm.runInNewContext(source,{self,JSON,String});await self.onmessage({data:{mode:'run',runtime,code,files}});return messages.at(-1);};
 const examples={};let stated=0,local=0;
 for(const p of require(path.resolve('scripts/manifest.cjs')).readPaths().filter(p=>p.runExamples||p.lessons?.some?.(l=>l.runExamples))){
  const all=p.lessons.filter(l=>p.runExamples||l.runExamples).flatMap(l=>l.sections.map((s,i)=>({l,s,i}))).filter(({s})=>s.example&&!s.exampleFormat),enabled=all.filter(({s})=>!s.exampleRunLocally);
  // An example kept for local running really cannot run here, for the reason it states.
  for(const {l,s,i} of all.filter(({s})=>s.exampleRunLocally)){const r=await runExample(s.example,[]);assert.ok(!r.ok&&/can't start new thread/.test(r.error)&&/threads/.test(s.exampleRunLocally),p.id+'/'+l.id+' example '+i+' cannot run in the browser for its stated reason');local++;}
  examples[p.id]=[enabled.length,enabled.filter(({s})=>s.exampleFiles).length];
  for(const {l,s,i} of enabled){
   const files=(s.exampleFiles||[]).map(f=>{assert.ok(p.publicFiles.includes(f),'Example module is published for offline use: '+f);return {name:f.split('/').pop(),source:fs.readFileSync('paths/'+p.id+'/'+f,'utf8')};});
   const r=await runExample(s.example,files),where=p.id+'/'+l.id+' example '+i;
   assert.equal(r.ok,true,where+': '+r.error);
   assert.ok(r.output||/^\s*assert\b/m.test(s.example),where+': prints a result or checks one with assert');
   const expected=s.example.match(/^# Expected output:\n((?:#.*(?:\n|$))+)$/m);
   if(expected){stated++;assert.equal(r.output.trimEnd(),expected[1].trimEnd().split('\n').map(x=>x.replace(/^# ?/,'')).join('\n'),where+': prints its stated output');}
  }
 }
 // Every course or lesson that opts in has at least one example that runs here.
 for(const [id,[enabled]] of Object.entries(examples))assert.ok(enabled>0,id+': runExamples is set but no example runs');
 
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
 const total=Object.values(examples).reduce((n,[e])=>n+e,0),withModules=Object.values(examples).reduce((n,[,m])=>n+m,0),cases=original.reduce((n,c)=>n+(problems[c.id]?.cases?.length||0),0);
 console.log('PASS: real browser Python runtime executes all '+original.length+' references'+(cases?' / '+cases+' cases':'')+' and rejects wrong answers, types, mutation, syntax, missing functions and SystemExit; checks '+facts.length+' code-based checkpoint answers and '+practice.length+' practice ladder answers; runs '+runnable.length+' Python course references and '+total+' lesson examples in '+Object.keys(examples).length+' courses ('+withModules+' with their practice modules; '+stated+' matching their stated output), confirms '+local+' thread examples cannot run in the browser, as scripts with bounded output, exit codes, no stdin and learner-only tracebacks.');
})().catch(error=>{console.error(error);process.exitCode=1;});
