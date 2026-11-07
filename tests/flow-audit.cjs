const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={URL,document:{currentScript:{src:'https://example.test/assets/js/notebook-mermaid.js'}},escapeText:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll("'",'&#39;').replaceAll('"','&quot;')};
vm.createContext(ctx);
for(const f of ['assets/js/notebook-mermaid.js','assets/js/learning-tools.js','paths/financial-foundations/runtime/diagrams.js'])vm.runInContext(fs.readFileSync(f,'utf8'),ctx);
let alternatives=0;
for(const p of require('../scripts/manifest.cjs').readPaths())for(const l of Array.isArray(p.lessons)?p.lessons:[]){
 for(const i of l.diagram?.textExampleSections||[]){
  assert(Number.isInteger(i)&&l.sections[i]?.example,p.id+'/'+l.id+' flow section index');
  const html=ctx.lessonExample(l,l.sections[i],i);
  assert(html.includes('Read the original flow as text'));
  assert(html.includes(ctx.escapeText(l.sections[i].example)),'original example preserved');alternatives++;
 }
 for(const [i,s] of l.sections.entries())if(s.example&&!l.diagram?.textExampleSections?.includes(i))assert(!ctx.lessonExample(l,s,i).includes('<details>'),'code remains directly visible');
}
const diagrams=JSON.parse(fs.readFileSync('paths/financial-foundations/diagrams.json','utf8'));
// Nine maps; the trade-to-position map serves both introduction 5 and main lesson 18.
assert.equal(new Set(Object.values(diagrams).map(d=>d.title)).size,9);
for(const [key,d] of Object.entries(diagrams)){
 const ids=new Set(d.nodes.map(n=>n.id));assert.equal(ids.size,d.nodes.length);for(const e of d.edges)assert(ids.has(e.from)&&ids.has(e.to));
 const source=ctx.NotebookMermaid.source(d);assert(!source.includes('undefined'));assert.equal((source.match(/ -->/g)||[]).length,d.edges.length);
 const html=ctx.financialDiagram(d,true,key);assert(html.includes('data-diagram-alternative'));assert(!html.includes('diagram-accessible-text'));assert(!html.includes('<summary>Read the diagram as text'));for(const n of d.nodes)assert(html.includes(ctx.escapeText(n.description)));
}
assert.equal(ctx.financialDiagram(undefined),'');
const catalog=fs.readFileSync('assets/js/catalog.js','utf8');assert(catalog.includes('${traceView(l)}'));assert(!catalog.includes('if(l&&l.trace&&!l.diagram)'),'diagrams must not hide traces');
console.log(`PASS: ${alternatives} explicit flow text alternatives, executable examples preserved, nine Finance maps and trace coexistence.`);
