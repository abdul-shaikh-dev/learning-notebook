// Unknown path.json fields are rejected (#155), naming the file, the lesson and the field; every course passes.
const assert=require('node:assert/strict'),fs=require('node:fs'),{checkKeys,readPaths}=require('../scripts/manifest.cjs');
assert.ok(readPaths().length>0,'Every current course passes');
const file='paths/networking-web/path.json',base=JSON.parse(fs.readFileSync(file,'utf8'));
const lesson=base.lessons.find(l=>l.sections.some(s=>s.exampleFormat)),index=lesson.sections.findIndex(s=>s.exampleFormat);
const variant=change=>{const p=structuredClone(base);change(p,p.lessons.find(l=>l.id===lesson.id));return ()=>checkKeys(p,file);};
assert.doesNotThrow(variant(()=>{}));
// A misspelt exampleFormat would render a text example as runnable code.
assert.throws(variant((p,l)=>{const s=l.sections[index];s.exampleFromat=s.exampleFormat;delete s.exampleFormat;}),
 new RegExp('Unknown section field "exampleFromat" in paths/networking-web/path\.json, lesson '+lesson.id+' section '+(index+1)));
for(const [label,change,pattern] of [
 ['lesson',(p,l)=>{l.takeawy=l.takeaway;},/Unknown lesson field "takeawy" in paths\/networking-web\/path\.json, lesson /],
 ['quiz',(p,l)=>{l.quiz.corect=1;},/Unknown quiz field "corect" .*lesson .* quiz/],
 ['exercise',(p,l)=>{l.exercise.solutoin='x';},/Unknown exercise field "solutoin"/],
 ['reference',(p,l)=>{l.references=[{title:'t',url:'https://example.test',reviewd:'2026-01-01'}];},/Unknown reference field "reviewd" .* reference 1/],
 ['path',p=>{p.runExample=true;},/Unknown path field "runExample" in paths\/networking-web\/path\.json$/],
 ['stage',p=>{p.stages[0].exitCriterion=[];},/Unknown stage field "exitCriterion"/],
 ['trace',(p,l)=>{l.trace={title:'t',frames:[{label:'a',items:[],explaination:'x'}]};},/Unknown frame field "explaination" .* trace frame 1/]])
 assert.throws(variant(change),pattern,label);
console.log('Manifest keys: every course passes; unknown path, stage, lesson, section, exercise, quiz, reference and trace fields are rejected with file, lesson and field.');
