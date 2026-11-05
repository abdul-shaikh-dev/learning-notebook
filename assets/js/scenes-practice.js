/* Practice scenes: generators, expected-version updates, plan actions, expand-and-contract, contrast ratios and characterization checks.
   Each renderer computes its outcome from the snapshot's tables, following the course lab's rule; the authored node text explains it. */
(function(root){
 'use strict';
 const S=root.NotebookScenes,e=S.escape;
 const table=(s,caption)=>(s.tables||[]).find(t=>t.caption===caption);
 const rows=(s,caption)=>table(s,caption)?.rows||[];
 const node=(s,id)=>s.nodes.find(n=>n.id===id)||{label:'',detail:'',tone:'neutral'};
 const card=(s,prefix,id,extra='')=>{const n=node(s,id);return `<section data-motion-node="${prefix}-${e(id)}" class="prc-card tone-${e(n.tone)}"><h4>${e(n.label)}</h4><p>${e(n.detail)}</p>${extra}</section>`;};
 const cards=(s,prefix,extra={})=>s.nodes.map(n=>card(s,prefix,n.id,extra[n.id]||'')).join('');
 const header=(title,detail)=>`<div class="prc-caption"><strong>${title}</strong><span>${e(detail)}</span></div>`;
 const action=m=>`<button type="button" class="quiet prc-action" data-scene-next>${m.index===(m.scenario?.steps.length??0)-1?'Sequence complete':'Next step'} →</button>`;
 const scene=(kind,body,m)=>`<div class="scene-prc scene-prc-${kind}">${body}${action(m)}</div>`;
 const grid=(caption,columns,body,extra='')=>`<table class="prc-table"><caption>${e(caption)}</caption><thead><tr>${columns.map(c=>`<th scope="col">${e(c)}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table>${extra}`;

 // Generators: one generator object is a single pass; a fresh call or a saved list can be read again.
 S.register('iterators-and-generators',(s,m)=>{
  const source=rows(s,'Source').map(([v])=>Number(v)),calls=rows(s,'Calls'),valid=source.filter(v=>v>=0);
  let stream=null,saved=null;const results=[];
  for(const [n,op,target] of calls){
   let values;
   if(target==='stream'){if(!stream)stream={left:[...valid]};values=stream.left;stream.left=[];}
   else if(target==='fresh')values=[...valid];
   else if(target==='saved'){if(!saved)saved=[...valid];values=saved;}
   const code=target==='stream'?`${op}(stream)`:target==='fresh'?`${op}(valid_minutes(source))`:op==='save'?'saved = list(valid_minutes(source))':`${op}(saved)`;
   const result=op==='sum'?String(values.reduce((t,v)=>t+v,0)):op==='save'?`${values.length} values kept`:`[${values.join(', ')}]`;
   results.push({n,code,result,empty:op==='list'&&!values.length});
  }
  const shared=!!table(s,'Stream'),state=!shared?'none: each reader makes its own':!stream?'created, body not started':stream.left.length?'values left':'exhausted';
  const marks=source.map((v,i)=>`<li data-motion-node="py-value-${i}" class="${v<0?'is-skip':''}"><code>${e(String(v))}</code><span>${v<0?'skips':'yields'}</span></li>`).join('');
  return scene('gen',`${header('def valid_minutes(values): yield each value ≥ 0','A generator object runs its body as it is read, once.')}
<div class="prc-row"><div class="prc-store"><span>source</span><ol class="prc-values">${marks}</ol></div><div data-motion-node="py-stream" class="prc-meter${stream&&!stream.left.length?' is-empty':''}"><span>Shared stream</span><strong>${e(state)}</strong></div>${cards(s,'py')}</div>
<ol class="prc-list">${results.map(r=>`<li data-motion-node="py-call-${e(r.n)}"><code>${e(r.code)}</code> → <output class="${r.empty?'is-denied':''}">${e(r.result)}</output></li>`).join('')}</ol>`,m);
 });

 // Expected-version updates: a save names the version it read; the store compares and increments in one step.
 S.register('conflicts',(s,m)=>{
  const checked=(rows(s,'Update')[0]||[])[0]==='WHERE Id=@id AND Version=@version';
  let [title,minutes,done,version]=rows(s,'Row read by both tabs')[0]||[];version=Number(version);
  const results=rows(s,'Requests').map(([n,tab,mins,isDone,sent])=>{
   const ok=!checked||Number(sent)===version;
   if(ok){minutes=mins;done=isDone;version+=1;}
   return {n,tab,mins,isDone,sent,code:ok?200:409};
  });
  const list=results.map(r=>`<li data-motion-node="fs-req-${e(r.n)}"><b>${e(r.tab)}</b> PUT minutes ${e(r.mins)}, done ${e(r.isDone)}${checked?`, version ${e(r.sent)}`:''} → <output class="${r.code===409?'is-denied':''}">${r.code} ${r.code===409?'Conflict':'OK'}</output></li>`).join('');
  return scene('version',`${header(`UPDATE dbo.StudyTasks SET … ${checked?'WHERE Id=@id AND Version=@version':'WHERE Id=@id'}`,checked?'Zero rows updated means another save won: 409.':'Every save succeeds; the last one wins.')}
<div class="prc-row">${cards(s,'fs')}</div><ol class="prc-list">${list||'<li>No saves yet</li>'}</ol>
<output data-motion-node="fs-row" class="prc-total">Saved row: ${e(title)} · ${e(minutes)} min · done ${e(done)} · version ${version}</output>`,m);
 });

 // Plan actions: the lab's plan() compares identity, kind and name, then the whole resource; destroy and replace need allow_destroy.
 S.register('plan-review',(s,m)=>{
  const read=c=>Object.fromEntries(rows(s,c).map(([id,kind,name,tags])=>[id,{id,kind,name,tags}]));
  const old=read('Current'),now=read('Desired'),[flag,ran]=rows(s,'Apply')[0]||[],allow=flag==='allow_destroy=True';
  const plan=[...new Set([...Object.keys(old),...Object.keys(now)])].sort().map(id=>{const a=old[id],b=now[id];
   const act=!a?'create':!b?'destroy':a.kind!==b.kind||a.name!==b.name?'replace':a.tags!==b.tags?'update':'no-op';
   return {id,act,why:act==='replace'?`name ${a.name} → ${b.name}`:act==='update'?'tags differ':act==='create'?'new ID':act==='destroy'?'ID absent from desired':'identical'};});
  const destructive=plan.filter(p=>['destroy','replace'].includes(p.act)),refused=destructive.length&&!allow,changes=plan.filter(p=>p.act!=='no-op').length;
  const body=plan.map(p=>`<tr class="act-${p.act}"><th scope="row" data-motion-node="cloud-${e(p.id)}">${e(p.id)}</th><td><b>${p.act}</b></td><td>${e(p.why)}</td></tr>`).join('');
  return scene('plan',`${header('plan(current, desired)','Read each action before the count of changes.')}
${grid('Planned actions',['id','action','reason'],body)}
<div class="prc-row"><p class="prc-fact">${changes} of ${plan.length} resources change; ${destructive.length} destructive.</p>${cards(s,'cloud',{apply:`<output data-motion-node="cloud-result" class="${ran==='yes'&&refused?'is-denied':''}">${ran!=='yes'?`simulate_apply(…, ${e(flag)}) not run yet`:refused?'ValueError: destructive model operation requires explicit allow_destroy':changes?'applied':'nothing to apply'}</output>`})}</div>`,m);
 });

 // Expand and contract: old code reads title, new code reads COALESCE(label, title); dropping title breaks old readers and keeps only label.
 S.register('schema-evolution',(s,m)=>{
  const t=table(s,'notes')||{columns:[],rows:[]},has=c=>t.columns.includes(c),col=(r,c)=>r[t.columns.indexOf(c)];
  const value=v=>v==='NULL'?null:v,instances=rows(s,'Running instances');
  const oldRead=has('title')?t.rows.map(r=>col(r,'title')):null,newRead=t.rows.map(r=>value(has('label')?col(r,'label'):null)??(has('title')?col(r,'title'):null));
  const lost=newRead.filter(v=>v===null).length,oldRunning=instances.some(([, v])=>v==='old');
  const reader=(id,label,result,fail)=>`<div data-motion-node="db-${id}" class="prc-meter${fail?' is-empty':''}"><span>${label}</span><strong>${e(result)}</strong></div>`;
  const body=t.rows.map(r=>`<tr class="${has('label')&&col(r,'label')==='NULL'?'is-null':''}">${r.map((c,i)=>i?`<td>${e(c)}</td>`:`<th scope="row" data-motion-node="db-row-${e(r[0])}">${e(c)}</th>`).join('')}</tr>`).join('');
  return scene('schema',`${header(`notes(${t.columns.join(', ')})`,'Old and new releases share one database during a rollout.')}
<div class="prc-row">${grid('notes',t.columns,body)}<div class="prc-store"><span>Running</span><ul>${instances.map(([n,v])=>`<li><b>${e(n)}</b> ${e(v)} release</li>`).join('')}</ul></div></div>
<div class="prc-row">${reader('old-reader','Old reader: SELECT title',oldRead?oldRead.join(', '):oldRunning?'OperationalError: no such column: title':'not running',!oldRead&&oldRunning)}${reader('new-reader','New reader: COALESCE(label, title)',newRead.map(v=>v??'NULL').join(', ')+(lost?` · ${lost} lost`:''),lost>0)}</div>
<div class="prc-row">${cards(s,'db')}</div>`,m);
 });

 // Contrast: WCAG relative luminance of two sRGB colours; 4.5:1 for ordinary text, 3:1 for large text and non-text parts.
 const channel=c=>{c/=255;return c<=.03928?c/12.92:((c+.055)/1.055)**2.4;};
 const luminance=hex=>{const [r,g,b]=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16));return .2126*channel(r)+.7152*channel(g)+.0722*channel(b);};
 const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
 const needs={'ordinary text':4.5,'large text':3,'non-text':3};
 S.register('contrast-colour',(s,m)=>{
  const pairs=rows(s,'Colour pairs').map(([id,use,fg,bg,kind])=>{const r=ratio(fg,bg),need=needs[kind];return {id,use,fg,bg,kind,r,need,ok:r>=need};});
  const shown=r=>Math.floor(r*100)/100;
  const items=pairs.map(p=>`<li data-motion-node="ui-${e(p.id)}" class="${p.ok?'is-pass':'is-fail'}"><span class="prc-swatch" style="color:#${e(p.fg)};background:#${e(p.bg)};border-color:#${e(p.fg)}" aria-hidden="true">${p.kind==='non-text'?'▭':'Aa'}</span><span><b>${e(p.use)}</b><br><code>#${e(p.fg)}</code> on <code>#${e(p.bg)}</code> · ${e(p.kind)}</span><output class="${p.ok?'':'is-denied'}">${shown(p.r).toFixed(2)}:1 ${p.ok?'≥':'&lt;'} ${p.need}:1 · ${p.ok?'passes':'fails'}</output></li>`).join('');
  return scene('contrast',`${header('contrast(foreground, background)','(lighter + 0.05) ÷ (darker + 0.05), from relative luminance.')}
<ul class="prc-pairs">${items}</ul><div class="prc-row">${cards(s,'ui')}</div>`,m);
 });

 // Characterization: run the legacy or fixed summary over the tickets, then evaluate each check against what it printed.
 S.register('characterization',(s,m)=>{
  const tickets=rows(s,'tickets.csv'),impl=(rows(s,'Implementation')[0]||[])[0];
  const kept=tickets.filter(([, ,min])=>impl==='fixed'||Number(min)!==0);
  const out={count:kept.length,total_minutes:kept.reduce((t,[, ,min])=>t+Number(min),0)},json=JSON.stringify(out).replace(/,/g,', ').replace(/:/g,': ');
  const checks=rows(s,'Checks').map(([id,what,expected])=>{const actual=what==='keys'?Object.keys(out).join(', '):what==='whole output'?json:String(out[what]);return {id,what,expected,actual,ok:actual===expected};});
  const body=tickets.map(r=>`<tr class="${impl!=='fixed'&&Number(r[2])===0?'is-null':''}">${r.map((c,i)=>i?`<td>${e(c)}</td>`:`<th scope="row">${e(c)}</th>`).join('')}</tr>`).join('');
  const list=checks.map(c=>`<li data-motion-node="req-${e(c.id)}" class="${c.ok?'is-pass':'is-fail'}">${c.ok?'✓':'✗'} <b>${e(c.what)}</b> expects <code>${e(c.expected)}</code>${c.ok?'':`, got <code>${e(c.actual)}</code>`}</li>`).join('');
  return scene('char',`${header(impl==='fixed'?'report.summarize(read_tickets(path))':'legacy_report.summarize_file(path)','The same four tickets; the checks decide what may change.')}
<div class="prc-row">${grid('tickets.csv',['id','status','minutes'],body)}<div class="prc-store"><span>Prints</span><output data-motion-node="req-output" class="prc-total">${e(json)}</output><ul class="prc-checks">${list}</ul></div></div>
<div class="prc-row">${cards(s,'req')}</div>`,m);
 });
})(globalThis);
