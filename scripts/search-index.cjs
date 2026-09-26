const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {root,readPaths}=require('./manifest.cjs');
function plain(value){return (typeof value==='string'?value:Array.isArray(value)?value.map(plain).join(' '):value&&typeof value==='object'?Object.values(value).map(plain).join(' '):'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();}
function searchEntries(){
 const result=[];const add=(p,kind,title,href,text)=>result.push({path:p.id,course:p.title,kind,title,href,text:plain(text)});
 for(const p of readPaths().filter(p=>p.status==='ready')){
  add(p,'Course',p.title,p.href||'#path/'+p.id,[p.description,p.prerequisites,p.outcomes]);
  if(Array.isArray(p.lessons))for(const l of p.lessons)add(p,'Lesson',l.title,'#topic/'+p.id+'/'+l.id,[l.takeaway,l.sections,l.exercise?.prompt,l.diagram?.summary]);
  for(const t of p.resources?.tasks||[])add(p,'Task',t.title,'#resources/'+p.id+'/'+t.id,[t.goal,t.steps,t.notes]);
  for(const f of p.resources?.files||[]){const source=path.resolve(root,f.href);if(!source.startsWith(root+path.sep))throw Error('Unsafe search source');add(p,'File',path.basename(f.href),f.href,[f.description,fs.readFileSync(source,'utf8')]);}
  if(p.id==='financial-foundations'){
   const code=['curriculum','starter','foundations','activities','journey'].map(name=>fs.readFileSync(path.join(root,'paths',p.id,'content',name+'.js'),'utf8')).join('\n');
   const data=vm.runInNewContext(code+';({LESSONS,STARTER,FOUNDATIONS,LABS,TRADE_JOURNEY})',{}, {timeout:1000});
   for(const l of data.LESSONS)add(p,'Lesson',l.title,'course.html#lesson/'+l.id,[l.take,l.body,l.example,l.deep,l.data,l.pitfall]);
   for(const l of data.STARTER)add(p,'Lesson',l.title,'course.html#start/'+l.id,[l.take,l.paragraphs,l.example,l.connection]);
   for(const l of data.FOUNDATIONS)add(p,'Lesson',l.title,'course.html#foundations/'+l.id,l.paragraphs);
   for(const [id,l]of Object.entries(data.LABS))add(p,'Task',l.title,'course.html#labs/'+id,[l.name,l.intro]);
   for(const l of data.TRADE_JOURNEY)add(p,'Lesson',l.label,'course.html#journey/'+l.id,[l.body,l.input,l.output,l.control]);
  }
 }
 return result;
}
function searchSource(){return '// Generated from published lessons and practice resources.\nconst NOTEBOOK_SEARCH = '+JSON.stringify(searchEntries())+';\n';}
module.exports={searchEntries,searchSource};
