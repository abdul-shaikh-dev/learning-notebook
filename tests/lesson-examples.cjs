// Lesson example runner: which examples get Run and Edit, the worker request, practice modules, editing, stop and cleanup.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
process.chdir(process.env.LEARNING_REPO||path.resolve(__dirname,'..'));
const course={id:'design-patterns',runExamples:true};
const lesson={id:'mediator',sections:[
 {title:'Assert',example:'from collaboration import x\nassert x == 1',exampleFiles:['collaboration.py']},
 {title:'Diagram',example:'# a --> b',exampleFormat:'text'},
 {title:'Prose',paragraphs:[]},
 {title:'Print',example:'print("<hi>")'}
]};
function fixture({fail=false}={}){
 const nodes={},workers=[],timers=new Map(),fetched=[];let next=1;
 const panel={hidden:false};
 const element=id=>nodes[id]??={id,value:'',textContent:'',hidden:false,readOnly:false,focus(){this.focused=true;},closest:sel=>sel==='.code-panel'?panel:null,addEventListener(t,fn){this[t]=fn;}};
 class Worker{constructor(url){this.url=String(url);workers.push(this);}postMessage(data){this.data=data;}terminate(){this.terminated=true;}}
 const fetch=async url=>{fetched.push(url);return fail?{ok:false}:{ok:true,text:async()=>'x = 1\n'};};
 const context={escapeText:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;'),localStorage:{getItem:()=>null,setItem(){}},sessionStorage:{getItem:()=>null,setItem(){}},document:{getElementById:element,baseURI:'https://example.test/notebook/'},URL,Worker,fetch,Promise,setTimeout:(fn,ms)=>{const id=next++;timers.set(id,{fn,ms});return id;},clearTimeout:id=>timers.delete(id)};
 vm.createContext(context);vm.runInContext(fs.readFileSync('assets/js/notebook-practice.js','utf8'),context);
 const api=vm.runInContext('NotebookPractice',context);
 for(const i of [0,3]){element('example-editing-'+i).hidden=true;element('example-reset-'+i).hidden=true;element('example-output-'+i).hidden=true;element('example-run-'+i).textContent='Run';element('example-editor-'+i).value=lesson.sections[i].example;}
 api.bind(course,lesson);
 return {api,element,workers,timers,fetched,panel};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
 let f=fixture(),e=f.element;
 // View: only runnable Python examples in a runExamples course get controls; the editor holds the escaped example.
 const html=f.api.exampleControls(course,lesson.sections[3],3);
 assert(html.includes('id="example-run-3"')&&html.includes('id="example-edit-3"')&&html.includes('>print("&lt;hi>")</textarea>')&&html.includes('role="status"')&&html.includes('no-print'));
 assert.equal(f.api.exampleControls(course,lesson.sections[1],1),'','A text diagram is not run');
 assert.equal(f.api.exampleControls(course,lesson.sections[2],2),'','A section without an example has no controls');
 assert.equal(f.api.exampleControls({id:'sql-server'},lesson.sections[3],3),'','Only courses marked runExamples run their examples');
 assert(!e('example-run-1').click,'No handlers are bound for the diagram');
 // Run: the shown example, unchanged, in a fresh run-mode worker; the button becomes Stop.
 e('example-run-3').click();await tick();let w=f.workers.at(-1);
 assert.equal(w.data.mode,'run');assert.equal(w.data.code,'print("<hi>")');assert.equal(w.data.files.length,0);assert.equal(w.data.runtime,'https://example.test/notebook/paths/python-problem-solving/runtime/');
 assert.equal(e('example-run-3').textContent,'Stop');assert(!e('example-output-3').hidden);assert.match(e('example-output-3').textContent,/12 MB/);
 w.onmessage({data:{type:'ready'}});assert.equal(e('example-output-3').textContent,'Running…');
 w.onmessage({data:{type:'result',ok:true,output:'<hi>\n',truncated:false,error:''}});
 assert.equal(e('example-output-3').textContent,'<hi>\n');assert(w.terminated);assert.equal(e('example-run-3').textContent,'Run');
 // Practice modules are fetched from the course folder and passed by file name.
 e('example-run-0').click();await tick();w=f.workers.at(-1);
 assert.deepEqual(f.fetched,['paths/design-patterns/collaboration.py']);assert.equal(JSON.stringify(w.data.files),JSON.stringify([{name:'collaboration.py',source:'x = 1\n'}]));
 w.onmessage({data:{type:'result',ok:true,output:'',error:''}});assert.equal(e('example-output-0').textContent,'Finished without errors: every assert held. Add print() to see values.');
 assert.equal(f.api.exampleText({ok:true,output:'',error:''},'x = 1'),'Finished with no output. Use print() to see values.');
 assert.equal(f.api.exampleText({ok:false,output:'',error:'AssertionError'},'assert False'),'AssertionError');
 // Edit swaps the highlighted panel for an editor and runs the edited code; Reset restores the example.
 e('example-edit-3').click();assert(f.panel.hidden&&!e('example-editing-3').hidden&&e('example-edit-3').hidden&&!e('example-reset-3').hidden&&e('example-editor-3').focused);
 e('example-editor-3').value='print(2)';let prevented=false;e('example-editor-3').keydown({ctrlKey:true,key:'Enter',preventDefault(){prevented=true;}});await tick();
 w=f.workers.at(-1);assert(prevented);assert.equal(w.data.code,'print(2)');assert(e('example-editor-3').readOnly);
 // Stop ends the run and ignores a late result.
 e('example-run-3').click();assert(w.terminated);assert.match(e('example-output-3').textContent,/^Stopped\./);assert(!e('example-editor-3').readOnly);
 w.onmessage({data:{type:'result',ok:true,output:'late'}});assert.match(e('example-output-3').textContent,/^Stopped\./);
 e('example-reset-3').click();assert.equal(e('example-editor-3').value,'print("<hi>")');assert(!f.panel.hidden&&e('example-editing-3').hidden&&!e('example-edit-3').hidden&&e('example-output-3').hidden);
 // The 5-second limit and load failures.
 e('example-run-3').click();await tick();w=f.workers.at(-1);w.onmessage({data:{type:'ready'}});[...f.timers.values()].find(t=>t.ms===5000).fn();assert(w.terminated);assert.match(e('example-output-3').textContent,/5 seconds/);
 e('example-run-3').click();await tick();w=f.workers.at(-1);w.onerror();assert.match(e('example-output-3').textContent,/could not load/);
 // Leaving the lesson stops every example.
 e('example-run-3').click();await tick();w=f.workers.at(-1);f.api.cleanup();assert(w.terminated);w.onmessage({data:{type:'result',ok:true,output:'stale'}});assert.notEqual(e('example-output-3').textContent,'stale');
 // A module that cannot be fetched explains how to get it, and starts no worker.
 f=fixture({fail:true});e=f.element;e('example-run-0').click();await tick();
 assert.equal(f.workers.length,0);assert.match(e('example-output-0').textContent,/imports collaboration\.py, which could not load/);assert.equal(e('example-run-0').textContent,'Run');
 // Rendering: the lesson page adds the controls after a Python-labelled example, and leaves text diagrams plain.
 const tools={escapeText:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;'),NotebookPractice:f.api};vm.createContext(tools);vm.runInContext(fs.readFileSync('assets/js/learning-tools.js','utf8'),tools);
 const shown=tools.lessonExample(lesson,lesson.sections[3],3,course);assert(shown.startsWith('<pre class="example" id="example-code-3" data-language="python">')&&shown.includes('example-run-3'));
 assert.equal(tools.lessonExample(lesson,lesson.sections[1],1,course),'<pre class="example" data-language="plaintext"># a --> b</pre>');
 assert(!tools.lessonExample(lesson,lesson.sections[3],3,{id:'react'}).includes('example-run'),'Other courses keep plain examples');
 // Data: the three Python courses run their examples, and every named module is a published course file.
 const paths=require(path.resolve('scripts/manifest.cjs')).readPaths();
 assert.deepEqual(paths.filter(p=>p.runExamples).map(p=>p.id).sort(),['data-structures-algorithms','design-patterns','practical-maths-statistics']);
 for(const p of paths)for(const l of Array.isArray(p.lessons)?p.lessons:[])for(const s of l.sections||[])for(const file of s.exampleFiles||[]){assert.ok(p.runExamples&&p.publicFiles.includes(file),p.id+'/'+l.id+': '+file);assert.match(s.example,new RegExp('^(from|import) '+file.split('/').pop().replace('.py','')+'\\b','m'));}
 console.log('PASS: lesson example runner: runnable examples only, run mode, practice modules, assert-only results, edit, Ctrl+Enter, stop, 5-second limit, load failures, cleanup and rendering.');
})().catch(e=>{console.error(e);process.exitCode=1;});
