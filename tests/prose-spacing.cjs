const path=require('node:path'),assert=require('node:assert/strict');
process.chdir(process.env.LEARNING_REPO||path.resolve(__dirname,'..'));
const paths=require(path.resolve('scripts/manifest.cjs')).readPaths();
// Catches words and numbers fused by over-eager compression, e.g. "the8", "labels,selectors", "Correctness:five".
const PROSE=new Set('title takeaway paragraphs prompt question options explanation checks description detail notes caption intro label section scope summary goal outcomes items setup nextSteps prerequisites requirements rubric exitCriteria brief steps expected hints reasoning pitfalls transfer'.split(' '));
const CODE=new Set(['example','solution']);
const WORD_DIGIT=/\b(?:the|and|or|to|of|in|is|are|at|by|for|from|with|than|then|always|run|limit|request|order|access|approximately)\d/;
const PUNCT=/[a-z]{2,}[,;][a-z]{2,}|[a-z]{2,}:[a-z]{2,}|\d[;:][A-Za-z]{2,}/;
// Literal fragments quoted or bracketed in prose (decimal(p,s), "id,status") are code, not sentences.
const literalFree=s=>s.replace(/"[^"]*"|\([^()]*\)|\[[^\]]*\]|\{[^}]*\}|<[^<>]*>/g,' ');
const comments=s=>s.split('\n').map(l=>l.match(/^\s*(?:--|#|\/\/)(.*)$|;\s*--(.*)$/)).filter(Boolean).map(m=>m[1]??m[2]);
const problems=[];
function check(text,where){const plain=literalFree(text);for(const re of [WORD_DIGIT,PUNCT]){const m=plain.match(re);if(m)problems.push(where+': …'+plain.slice(Math.max(0,m.index-30),m.index+m[0].length+20).replace(/\n/g,' ')+'…');}}
function walk(value,key,where,parent){
  if(typeof value==='string'){
    const prose=PROSE.has(key)||(key==='solution'&&parent?.solutionFormat==='prose')||(key==='example'&&parent?.exampleFormat==='prose');
    if(prose)check(value,where+' '+key);else if(CODE.has(key))for(const c of comments(value))check(c,where+' '+key+' comment');
  }else if(Array.isArray(value))value.forEach(v=>walk(v,key,where,parent));
  else if(value&&typeof value==='object')for(const [k,v] of Object.entries(value))walk(v,k,value.id&&typeof value.id==='string'&&value!==parent?where.split(' ')[0]+' '+value.id:where,value);
}
let strings=0;const count=v=>typeof v==='string'?strings++:v&&typeof v==='object'&&Object.values(v).forEach(count);
for(const p of paths){count(p);walk(p,'',p.id,null);}
assert.deepEqual(problems,[],'Fused words or punctuation in lesson text:\n'+problems.join('\n'));
console.log(`PASS: prose spacing across ${paths.length} paths and ${strings} strings; no fused words, numbers or punctuation.`);
