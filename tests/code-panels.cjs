const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context={};vm.createContext(context);
vm.runInContext(fs.readFileSync('assets/vendor/highlight.min.js','utf8'),context);
vm.runInContext(fs.readFileSync('assets/js/code-panels.js','utf8'),context);
const code=context.NotebookCode;
const fixtures=[
 ['var values = new List<string>();','dotnet','csharp'],
 ['print("Hello") # comment','python','python'],
 ['Console.WriteLine("Hello");','dotnet','csharp'],
 ['dotnet new console -n Hello','dotnet','bash'],
 ['const count = 2; console.log(count);','react','javascript'],
 ['interface Task { title: string }','react','typescript'],
 ['SELECT OrderId FROM Orders WHERE Amount > 10;','sql-server','sql'],
 ['Get-Content .\\test.txt','delivery-operations','powershell'],
 ['apiVersion: apps/v1\nkind: Deployment','kubernetes','yaml'],
 ['{"count":2,"title":"<script>"}','','json'],
 ['<label for="topic">Topic</label>','react','xml'],
 ['const App = () => <button onClick={() => save()}>Save</button>;','react','jsx'],
 ['type Props = {title: string};\nconst App = ({title}: Props) => <h1>{title}</h1>;','react','tsx'],
 ['<input value={query} onChange={e => setQuery(e.target.value)} />','react','jsx'],
 ['<>Hello <strong>world</strong></>','react','jsx'],
 ['<!doctype html>\n<html><script>const count = 1;</script></html>','react','xml'],
 ['<div>\n<script>const count = 1;</script>\n</div>','react','xml'],
 ['FROM python:3.14\nCOPY . /app','','dockerfile'],
 ['PV = 100 / (1 + 0.05)^2','financial-foundations','plaintext'],
 ['A service accepts a request and returns a result.','dotnet','plaintext'],
 ['GET /api/tasks HTTP/1.1','','plaintext']
];
function decoded(html){return html.replace(/<[^>]*>/g,'').replace(/&(amp|lt|gt|quot|#x27|#39);/g,(_,x)=>({amp:'&',lt:'<',gt:'>',quot:'"','#x27':"'",'#39':"'"}[x]));}
for(const [source,path,language] of fixtures){assert.equal(code.languageFor(source,path),language,source);assert.equal(decoded(code.highlight(source,language)),source,'Highlighting changes source');}
const react=JSON.parse(fs.readFileSync('paths/react/path.json','utf8'));
const forms=react.lessons.find(l=>l.id==='forms').sections.find(s=>s.example).example;
assert.equal(code.languageFor(forms,'react'),'jsx','The actual controlled-input lesson must not be classified as XML');
assert.equal(decoded(code.highlight(forms,'jsx')),forms,'JSX highlighting must preserve the actual lesson source');
assert.equal(code.languageFor(forms,'react','html'),'xml','Explicit metadata wins over JSX evidence');
assert.equal(code.languageFor(forms,'react',' TSX '),'tsx');
assert.equal(code.languageFor('<label>Title</label>','react','jsx'),'jsx');
assert.equal(code.languageFor('print(1)','python','plaintext'),'plaintext');
assert.equal(code.languageFor('print(1)','','py'),'python');
assert.equal(code.languageFor('<img src=x onerror=alert(1)>','','unsupported'),'plaintext');
assert(!code.highlight('<script>alert(1)</script>','xml').includes('<script>'));
assert(code.highlight('print("hello")','python').includes('hljs-string'));
// Exercise panel controls without depending on a browser or a new test runtime.
class Element{
 constructor(tag){this.tagName=tag;this.dataset={};this.children=[];this.className='';this.attributes={};this.listeners={};this._text='';this.classList={contains:n=>this.className.split(' ').includes(n),toggle:(n,on)=>{this.className=this.className.split(' ').filter(x=>x!==n).concat(on?[n]:[]).join(' ');}};}
 set textContent(v){this._text=v;}get textContent(){return this._text;}
 set innerHTML(v){this._text=decoded(v);}
 append(...nodes){for(const n of nodes){if(n.parent)n.parent.children=n.parent.children.filter(x=>x!==n);n.parent=this;this.children.push(n);}}
 before(n){const i=this.parent.children.indexOf(this);this.parent.children.splice(i,0,n);n.parent=this.parent;}
 replaceChildren(...nodes){this.children=[];this.append(...nodes);}
 setAttribute(k,v){this.attributes[k]=v;}getAttribute(k){return this.attributes[k]??null;}
 addEventListener(k,fn){this.listeners[k]=fn;}focus(){this.focused=true;}
 querySelector(s){return this.children.find(x=>x.tagName===s)||null;}
 querySelectorAll(s){return this.children.flatMap(x=>[...(x.tagName===s?[x]:[]),...x.querySelectorAll(s)]);}
}
assert.equal(code.languageFor('class Example:\n    def method(self):\n        return 1','design-patterns'),'python');
const main=new Element('main'),pre=new Element('pre');pre.textContent='print("<hello>")\n';main.append(pre);
context.document={createElement:tag=>new Element(tag)};
let copied;context.navigator={clipboard:{writeText:async text=>{copied=text;}}};
code.enhance(main,'python');assert.equal(main.children.length,1);assert.equal(main.children[0].className,'code-panel');
const buttons=main.querySelectorAll('button');buttons[0].listeners.click();assert.equal(buttons[0].getAttribute('aria-pressed'),'true');assert(pre.classList.contains('code-wrap'));
buttons[1].listeners.click();assert.equal(copied,'print("<hello>")\n');
code.enhance(main,'python');assert.equal(main.querySelectorAll('button').length,2,'Repeated enhancement duplicates controls');
const reactMain=new Element('main'),reactPre=new Element('pre');reactPre.textContent=forms;reactMain.append(reactPre);
code.enhance(reactMain,'react');
assert.equal(reactPre.dataset.language,'jsx');
assert.equal(reactMain.querySelectorAll('span')[0].textContent,'JavaScript / JSX');
assert.equal(reactPre.querySelector('code').className,'hljs language-jsx');
assert.equal(reactPre.querySelector('code').textContent,forms);
delete context.hljs;assert.equal(code.highlight('<hello>','python'),'&lt;hello&gt;','Missing highlighter should preserve safe text');
console.log('PASS: code language labels, syntax tokens, escaped markup, exact copy, wrap controls, idempotence and missing-library fallback.');
