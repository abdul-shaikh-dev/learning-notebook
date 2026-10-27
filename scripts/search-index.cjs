const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {root,readPaths}=require('./manifest.cjs');
function plain(value){return (typeof value==='string'?value:Array.isArray(value)?value.map(plain).join(' '):value&&typeof value==='object'?Object.values(value).map(plain).join(' '):'').replace(/<[^>]*>/g,' ').replace(/`([^`\n]*)`/g,'$1').replace(/\s+/g,' ').trim();}
function searchEntries(){
 // summary is the entry's own one-line description, shown under each result; text is everything searched.
 const result=[];const add=(p,kind,title,href,text,summary)=>result.push({path:p.id,course:p.title,kind,title,href,text:plain(text),summary:plain(summary)});
 for(const p of readPaths().filter(p=>p.status==='ready')){
  add(p,'Course',p.title,p.href||'#path/'+p.id,[p.description,p.prerequisites,p.outcomes],p.description);
  if(Array.isArray(p.lessons))for(const l of p.lessons)add(p,'Lesson',l.title,'#topic/'+p.id+'/'+l.id,[l.takeaway,l.sections,l.exercise?.prompt,l.diagram?.summary,l.visual],l.takeaway);
  for(const t of p.resources?.tasks||[])add(p,'Task',t.title,'#resources/'+p.id+'/'+t.id,[t.goal,t.steps,t.notes],t.goal);
  for(const f of p.resources?.files||[]){const source=path.resolve(root,f.href);if(!source.startsWith(root+path.sep))throw Error('Unsafe search source');add(p,'File',path.basename(f.href),f.href,[f.description,fs.readFileSync(source,'utf8')],f.description);}
  if(p.id==='financial-foundations'){
   const code=['curriculum','starter','foundations','activities','journey'].map(name=>fs.readFileSync(path.join(root,'paths',p.id,'content',name+'.js'),'utf8')).join('\n');
   const data=vm.runInNewContext(code+';({LESSONS,STARTER,FOUNDATIONS,LABS,TRADE_JOURNEY})',{}, {timeout:1000});
   for(const l of data.LESSONS)add(p,'Lesson',l.title,'course.html#lesson/'+l.id,[l.take,l.body,l.example,l.deep,l.data,l.pitfall],l.take);
   for(const l of data.STARTER)add(p,'Lesson',l.title,'course.html#start/'+l.id,[l.take,l.paragraphs,l.example,l.connection],l.take);
   for(const l of data.FOUNDATIONS)add(p,'Lesson',l.title,'course.html#foundations/'+l.id,l.paragraphs);
   for(const [id,l]of Object.entries(data.LABS))add(p,'Task',l.title,'course.html#labs/'+id,[l.name,l.intro],l.intro);
   for(const l of data.TRADE_JOURNEY)add(p,'Lesson',l.label,'course.html#journey/'+l.id,[l.body,l.input,l.output,l.control],l.body);
  }
 }
 return result;
}
// The reader's own tokenizer, so the index splits text exactly as a query is split.
function searchTokens(){const source=fs.readFileSync(path.join(root,'assets/js/notebook-search.js'),'utf8'),ctx={};vm.createContext(ctx);vm.runInContext(source.match(/^const SEARCH_STOP_WORDS=[\s\S]*?^}$/m)[0]+';this.tokens=notebookTokens;',ctx);return ctx.tokens;}
function excerpt(text,size=160){if(text.length<=size)return text;const cut=text.slice(0,size),space=cut.lastIndexOf(' ');return (space>size/2?cut.slice(0,space):cut)+'…';}
// Each word appears once with the entries that contain it, as base-36 gaps between entry numbers.
function searchIndex(entries=searchEntries()){
 const tokens=searchTokens(),kinds={Course:'C',Lesson:'L',Task:'T',File:'F'},courses={},byWord=new Map();
 entries.forEach((e,id)=>{courses[e.path]=e.course;for(const word of tokens(e.title+' '+e.text,true)){if(!byWord.has(word))byWord.set(word,[]);byWord.get(word).push(id);}});
 const words=[...byWord.keys()].sort();
 return {courses,entries:entries.map(e=>[e.path,kinds[e.kind],e.title,e.href,excerpt(e.summary||e.text)]),words:words.join(' '),postings:words.map(w=>{let at=0;return byWord.get(w).map(id=>{const gap=id-at;at=id;return gap.toString(36);}).join(',');})};
}
function searchSource(){return '// Generated from published lessons and practice resources.\nconst NOTEBOOK_SEARCH = '+JSON.stringify(searchIndex())+';\n';}
module.exports={searchEntries,searchIndex,searchSource};
