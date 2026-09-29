/* Local-only syntax highlighting. Plain examples stay plain; explicit metadata wins. */
(function(root){
 'use strict';
 const labels={python:'Python',csharp:'C#',javascript:'JavaScript',typescript:'TypeScript',jsx:'JavaScript / JSX',tsx:'TypeScript / TSX',sql:'SQL',bash:'Terminal',powershell:'PowerShell',yaml:'YAML',json:'JSON',xml:'HTML / XML',css:'CSS',dockerfile:'Dockerfile',ini:'TOML / INI',plaintext:'Plain text'};
 const aliases={py:'python',cs:'csharp','c#':'csharp',js:'javascript',ts:'typescript',sh:'bash',shell:'bash',console:'bash',ps1:'powershell',yml:'yaml',html:'xml',toml:'ini',text:'plaintext',none:'plaintext'};
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function languageFor(source,context='',explicit=''){
  const requested=aliases[explicit.trim().toLowerCase()]||explicit.trim().toLowerCase();
  if(requested)return Object.hasOwn(labels,requested)?requested:'plaintext';
  const s=source.trim();
  if(!s)return 'plaintext';
  if(/^(?:HTTP\/\d|GET |POST |PUT |DELETE |PATCH )/m.test(s))return 'plaintext';
  if(/^(?:SELECT\b[\s\S]*?\bFROM\b|WITH\s+\w+\s+AS\s*\(|CREATE\s+(?:TABLE|INDEX|PROCEDURE)|INSERT\s+INTO|UPDATE\s+\w+\s+SET|BEGIN\s+TRAN|SET\s+(?:XACT_ABORT|NOCOUNT)|DECLARE\s+@)/im.test(s))return 'sql';
  if(/^(?:param\s*\(|\$ErrorActionPreference\s*=|(?:Get|Set|New|Write|Invoke|Test|Remove|Start|Stop|Import|Export|ConvertTo|ConvertFrom)-[A-Z]\w*)|\bpwsh\b|\.\\[\w-]+\.ps1\b/m.test(s))return 'powershell';
  if(/^(?:FROM\s+\S+|RUN\s+\S+|COPY\s+\S+\s+\S+|ENTRYPOINT\s+\[)/m.test(s))return 'dockerfile';
  if(/^(?:apiVersion:|kind:\s*(?:Deployment|Service|Pod|ConfigMap|Secret|Job)|services:|name:\s*[^\n]+\non:)/m.test(s))return 'yaml';
  if(/^[\[{]/.test(s)){try{JSON.parse(s);return 'json';}catch{}}
  // Detect JSX before generic markup, but keep real HTML documents as HTML.
  const typed=/\b(?:interface|type)\s+\w+\s*(?:=|\{)|:\s*(?:string|number|boolean)\b/.test(s)&&/\b(?:const|let|interface|type|function|export)\b/.test(s);
  const markup=/<(?:[A-Za-z][\w.:-]*(?:\s|\/?>)|>)/.test(s);
  const jsxAttribute=/\b(?:className|htmlFor)\s*=|\b[\w]+\s*=\s*\{/.test(s);
  const jsLeading=/^(?:(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)\s*)*(?:import\s|export\s|(?:async\s+)?function\s|(?:const|let|type|interface)\s|return\s*[(<])/.test(s);
  if(markup&&!/^<(?:!doctype|\?xml|html\b)/i.test(s)&&(jsxAttribute||jsLeading||context==='react'&&/^<>/.test(s)))return typed?'tsx':'jsx';
  if(/^\s*<(?:!doctype|\?xml|[A-Za-z][\w:-]*(?:\s+[\w:-]+=|>))/im.test(s))return 'xml';
  if(/^(?:\$\s+)?(?:python(?:3)?|py|pip|npm|npx|node|dotnet|git|kubectl|docker|helm|kind|curl|pytest|cd|mkdir|ls|echo)\s+\S/m.test(s))return 'bash';
  if(/\b(?:public|private|internal)\s+(?:static\s+|sealed\s+|async\s+)*(?:class|record|interface|Task|void|int|string)\b|\bConsole\.Write|\bapp\.Map(?:Get|Post|Put|Delete|Patch|Group)\s*\(|\busing\s+System\b|\b(?:var|await)\s+\w+[\s\S]*;/.test(s)&&context==='dotnet')return 'csharp';
  if(/^\s*(?:async\s+)?def\s+\w+\s*\(|^\s*class\s+\w+(?:\([^\n]*\))?\s*:|^from\s+[\w.]+\s+import\s|^import\s+[\w.]+\s*$|\bprint\s*\(/m.test(s))return 'python';
  if(typed)return 'typescript';
  if(/\b(?:const|let|function)\s+\w+|\b(?:useState|useEffect|console\.log)\s*\(|^import\s+.*\s+from\s+['"]/m.test(s))return 'javascript';
  if(/^[.#]?[\w-]+\s*\{\s*(?:color|display|margin|padding|font|background)[\w-]*\s*:/m.test(s))return 'css';
  // Restrict fallback to the course's language, and require actual syntax evidence.
  const candidate={python:'python','data-structures-algorithms':'python','ai-agents':'python','agent-harnesses':'python',dotnet:'csharp',react:'javascript','sql-server':'sql'}[context];
  if(candidate&&/[=;{}]|\w\(/.test(s)&&root.hljs){const hit=root.hljs.highlightAuto(s,[candidate]);if(hit.language&&hit.relevance>=3)return candidate;}
  return 'plaintext';
 }
 function highlight(source,language){return root.hljs&&language!=='plaintext'?root.hljs.highlight(source,{language:({jsx:'javascript',tsx:'typescript'})[language]||language,ignoreIllegals:true}).value:escape(source);}
 function enhance(main,context=''){
  main.querySelectorAll('pre').forEach((pre,index)=>{
   if(pre.classList.contains('folder-tree')){pre.tabIndex=0;pre.setAttribute('role','region');pre.setAttribute('aria-label','Folder layout; scroll horizontally if needed');return;}
   if(pre.dataset.codePanel==='ready')return;
   const source=pre.textContent;
   const child=pre.querySelector('code');
   const declared=pre.dataset.language||child?.dataset.language||(child?.className||pre.className).match(/language-([\w#+-]+)/)?.[1]||'';
   const language=languageFor(source,context,declared);
   pre.dataset.codePanel='ready';pre.dataset.language=language;
   const panel=document.createElement('div');panel.className='code-panel';
   const header=document.createElement('div');header.className='code-panel-header';
   const label=document.createElement('span');label.className='code-language';label.textContent=language==='plaintext'?'Example · plain text':labels[language];
   const actions=document.createElement('div');actions.className='code-panel-actions no-print';
   const copy=document.createElement('button');copy.type='button';copy.textContent='Copy';copy.setAttribute('aria-label','Copy '+label.textContent+' example '+(index+1));
   const wrap=document.createElement('button');wrap.type='button';wrap.textContent='Wrap lines';wrap.setAttribute('aria-pressed','false');wrap.setAttribute('aria-label','Wrap lines in example '+(index+1));
   const status=document.createElement('span');status.className='code-copy-status no-print';status.setAttribute('role','status');
   wrap.addEventListener('click',()=>{const on=wrap.getAttribute('aria-pressed')!=='true';wrap.setAttribute('aria-pressed',String(on));pre.classList.toggle('code-wrap',on);});
   copy.addEventListener('click',async()=>{try{if(!root.navigator?.clipboard)throw Error('unavailable');await root.navigator.clipboard.writeText(source);status.textContent='Copied.';}catch{status.textContent='Copy unavailable. Select the code and copy it manually.';pre.focus();}});
   const code=document.createElement('code');code.className='hljs language-'+language;code.innerHTML=highlight(source,language);pre.replaceChildren(code);
   pre.tabIndex=0;pre.setAttribute('role','region');pre.setAttribute('aria-label',label.textContent+' example '+(index+1)+'; scroll horizontally or use Wrap lines');
   actions.append(wrap,copy);header.append(label,actions);pre.before(panel);panel.append(header,pre,status);
  });
 }
 root.NotebookCode={languageFor,highlight,enhance};
})(globalThis);
