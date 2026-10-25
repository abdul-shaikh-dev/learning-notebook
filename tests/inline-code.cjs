const path=require('node:path'),assert=require('node:assert/strict');
process.chdir(process.env.LEARNING_REPO||path.resolve(__dirname,'..'));
// Lesson paragraphs mark code with backticks; the patterns live in inline-code-rules.cjs.
const {findings}=require('./inline-code-rules.cjs');
const paths=require(path.resolve('scripts/manifest.cjs')).readPaths();
const problems=[];let marked=0,paragraphs=0;
for(const p of paths){
 if(!Array.isArray(p.lessons))continue;
 for(const l of p.lessons)for(const s of l.sections||[])for(const t of s.paragraphs||[]){
  paragraphs++;if(/`[^`]+`/.test(t))marked++;
  assert.equal((t.match(/`/g)||[]).length%2,0,p.id+' '+l.id+': unbalanced backtick in "'+t.slice(0,80)+'"');
  assert.doesNotMatch(t,/``/,p.id+' '+l.id+': empty code span');
  for(const f of findings(t,p.id))problems.push(p.id+' '+l.id+' ['+f.kind+'] '+f.token);
 }
}
if(process.argv.includes('--list')){console.log(problems.join('\n'));console.log(problems.length+' unmarked');process.exit(0);}
assert.deepEqual(problems,[],'Unmarked inline code in lesson paragraphs. Wrap it in backticks, or add intended prose to tests/inline-code-allow.json:\n'+problems.slice(0,40).join('\n'));
// Rendering: spans become escaped <code>, lesson links stay outside code, and the lesson page and printed pack show no raw backticks.
const fs=require('node:fs'),vm=require('node:vm'),nodes=new Map();
const node=id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',value:'',addEventListener(){},querySelectorAll(){return [];}});return nodes.get(id);};
const ctx={LEARNING_PATHS:paths,document:{getElementById:node,querySelector:node,querySelectorAll:()=>[],addEventListener(){}},window:{addEventListener(){},scrollTo(){}},location:{hash:''},localStorage:{getItem:()=>null,setItem(){}},setTimeout(){},Intl};
vm.createContext(ctx);vm.runInContext(['library-map','learning-tools','catalog'].map(f=>fs.readFileSync('assets/js/'+f+'.js','utf8')).join('\n'),ctx);
assert.equal(vm.runInContext('proseText("Use `a<b` & `x`, not `")',ctx),'Use <code>a&lt;b</code> &amp; <code>x</code>, not `');
const python=paths.find(p=>p.id==='python');ctx.python=python;
assert.equal(vm.runInContext('lessonText(python,"See lesson 2, not `lesson 2`.")',ctx).match(/<a /g).length,1,'only the prose reference links');
assert.match(vm.runInContext('lessonText(python,"`lesson 2`")',ctx),/^<code>lesson 2<\/code>$/);
const prose=html=>[...html.matchAll(/<p>([\s\S]*?)<\/p>/g)].map(m=>m[1]).join('\n');
ctx.location.hash='#topic/python/text-and-input';vm.runInContext('renderCatalog()',ctx);
const lesson=node('main').innerHTML;assert.match(lesson,/<code>name\.strip\(\)<\/code>/);assert.doesNotMatch(prose(lesson),/`/,'lesson paragraphs show no raw backticks');
const pack=vm.runInContext('coursePack(python)',ctx);assert.match(pack,/<code>name\.strip\(\)<\/code>/);assert.doesNotMatch(prose(pack),/`/,'printed pack shows no raw backticks');
const search=require(path.resolve('scripts/search-index.cjs')).searchEntries().find(e=>e.href==='#topic/python/text-and-input');
assert.match(search.text,/name\.strip\(\) returns/);assert.doesNotMatch(search.text,/`name/,'search indexes text without backticks');
console.log(`PASS: inline code is marked in lesson paragraphs; ${marked} of ${paragraphs} paragraphs carry code spans and none holds unmarked calls, identifiers, files, flags, git commands or SQL; spans render as escaped code on lesson pages and printed packs, and search indexes them without backticks.`);
