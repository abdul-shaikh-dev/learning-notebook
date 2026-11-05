/* Engineering scenes: agent budgets, operation IDs, object authorization, injected clocks, tail latency and permission bits.
   Each renderer computes its outcome from the snapshot's tables; the authored node text explains it. */
(function(root){
 'use strict';
 const S=root.NotebookScenes,e=S.escape;
 const rows=(s,caption)=>(s.tables||[]).find(t=>t.caption===caption)?.rows||[];
 const node=(s,id)=>s.nodes.find(n=>n.id===id)||{label:'',detail:'',tone:'neutral'};
 const card=(s,prefix,id,extra='')=>{const n=node(s,id);return `<section data-motion-node="${prefix}-${e(id)}" class="eng-card tone-${e(n.tone)}"><h4>${e(n.label)}</h4><p>${e(n.detail)}</p>${extra}</section>`;};
 const header=(title,detail)=>`<div class="eng-caption"><strong>${title}</strong><span>${e(detail)}</span></div>`;
 const action=m=>`<button type="button" class="quiet eng-action" data-scene-next>${m.index===(m.scenario?.steps.length??0)-1?'Sequence complete':'Next step'} →</button>`;
 const scene=(kind,body,m)=>`<div class="scene-eng scene-eng-${kind}">${body}${action(m)}</div>`;

 // Agent loop: one slot per allowed proposal; an unbounded loop has no slots to run out of.
 S.register('loop',(s,m)=>{
  const proposals=rows(s,'Proposals'),[budget,status]=rows(s,'Run')[0]||['none','running'];
  const limit=Number(budget),bounded=Number.isInteger(limit),used=proposals.length;
  const evidence=[...new Set(proposals.flatMap(([, ,result])=>result.match(/[A-Z]+-\d+/g)||[]))];
  const slots=bounded?Array.from({length:limit},(_,i)=>`<li class="${i<used?'is-used':''}">${i<used?'used':'free'}</li>`).join(''):'';
  const meter=bounded?`${used} of ${limit} proposals used · ${limit-used} left`:`${used} proposals · no limit`;
  return scene('loop',`${header(bounded?`run(source, max_steps=${limit})`:'while True: ask, validate, run','Each proposal, including a finish, takes one step.')}
<div class="eng-row">${card(s,'agent','source')}<div data-motion-node="agent-budget" class="eng-meter${bounded?'':' is-unbounded'}"><span>Step budget</span>${bounded?`<ol aria-hidden="true">${slots}</ol>`:''}<strong>${e(meter)}</strong></div></div>
<ol class="eng-list">${proposals.map(([n,proposal,result])=>`<li data-motion-node="agent-p${e(n)}"><b>${e(n)}.</b> <code>${e(proposal)}</code> → ${e(result)}</li>`).join('')}</ol>
<div class="eng-row"><p data-motion-node="agent-evidence" class="eng-fact">Evidence observed: ${evidence.length?e(evidence.join(', ')):'none'}</p>${card(s,'agent','status',`<output>status: ${e(status)}</output>`)}</div>`,m);
 });

 // Operation identity: the store's notes and receipts after each call, and how many notes one intent produced.
 S.register('idempotent-effects',(s,m)=>{
  const notes=rows(s,'Notes'),receipts=rows(s,'Receipts');
  const list=(items,key,text)=>`<ul>${items.map(r=>`<li data-motion-node="op-${key}-${e(r[0])}">${text(r)}</li>`).join('')}</ul>`;
  return scene('ops',`${header('save_note through the fake store','The store writes a note and its receipt together.')}
<div class="eng-row">${card(s,'op','call')}<div class="eng-store"><span>Fake store</span><div><h4>Notes</h4>${list(notes,'note',([id,text])=>`<b>${e(id)}</b> ${e(text)}`)}</div><div><h4>Receipts</h4>${list(receipts,'receipt',([id,note])=>`<b>${e(id)}</b> → ${e(note)}`)}</div>${card(s,'op','store')}</div>${card(s,'op','harness')}</div>
<output data-motion-node="op-count" class="eng-total${notes.length>1?' is-invalid':''}">${notes.length} ${notes.length===1?'note':'notes'} for 1 intent</output>`,m);
 });

 // Object authorization: the handler's checks are computed from the request and the stored row.
 const allowed=([subject,tenant,role],doc,act)=>['read','update'].includes(act)&&tenant===doc.tenant&&(subject===doc.owner||(role==='reader'&&act==='read'));
 S.register('authorization-ownership',(s,m)=>{
  const [who,path,act]=rows(s,'Request')[0]||[],principal=String(who).split('/'),target=String(path).split('/').pop();
  const docs=rows(s,'documents').map(([id,tenant,owner,title])=>({id,tenant,owner,title})),doc=docs.find(d=>d.id===target);
  const checked=(rows(s,'Handler')[0]||[])[0]!=='session only';
  const ok=doc&&(checked?allowed(principal,doc,act):true),code=ok?200:404;
  const mark=(pass,text)=>`<li class="${pass?'is-pass':'is-fail'}">${pass?'✓':'✗'} ${e(text)}</li>`;
  const checks=checked&&doc?`<ul class="eng-checks">${mark(principal[1]===doc.tenant,`tenant ${principal[1]} = ${doc.tenant}`)}${mark(principal[0]===doc.owner||(principal[2]==='reader'&&act==='read'),`${principal[0]} owns ${doc.id} (owner ${doc.owner})`)}${mark(['read','update'].includes(act),`${act} is a supported action`)}</ul>`:'<ul class="eng-checks"><li class="is-skip">Session is valid; the row is not checked</li></ul>';
  return scene('authz',`${header(`PATCH ${e(path)}`,'Valid session and CSRF token in every request.')}
<div class="eng-row">${card(s,'authz','request')}${card(s,'authz','handler',checks)}${card(s,'authz','response',`<output class="${ok?'':'is-denied'}">${code} ${ok?'OK':'unavailable'}</output>`)}</div>
<table class="eng-table"><caption>documents after the request</caption><thead><tr><th scope="col">id</th><th scope="col">tenant</th><th scope="col">owner</th><th scope="col">title</th></tr></thead><tbody>${docs.map(d=>`<tr class="${d.id===target?'is-target':''}"><th scope="row" data-motion-node="authz-doc-${e(d.id)}">${e(d.id)}</th><td>${e(d.tenant)}</td><td>${e(d.owner)}</td><td>${e(d.title)}</td></tr>`).join('')}</tbody></table>`,m);
 });

 // Injected clock: the token is valid while checked < issued + ttl; the test passes when that matches its expectation.
 S.register('flaky-tests',(s,m)=>{
  const [issued,ttl,checked,expect]=rows(s,'Token')[0]||[],start=Number(issued),expiry=start+Number(ttl),at=Number(checked);
  const state=at<expiry?'valid':'expired',passes=state===expect,end=Math.max(expiry,at)+5,f=v=>(v-start)/(end-start),x=v=>`${f(v)*100}%`;
  const edge=v=>f(v)<.15?' is-start':f(v)>.85?' is-end':'';
  return scene('clock',`${header('assert token.'+(expect==='valid'?'is_valid':'is_expired')+'(now)','Valid while now < issued + ttl.')}
<div class="eng-row">${card(s,'clock','source')}</div>
<div class="eng-timeline" role="img" aria-label="Issued at ${start} s, expires at ${expiry} s, checked at ${at} s"><span data-motion-node="clock-issued" class="eng-tick${edge(start)}" style="--x:${x(start)}">issued ${start}</span><span class="eng-window" style="--from:${x(start)};--to:${x(expiry)}"></span><span data-motion-node="clock-expiry" class="eng-tick is-expiry${edge(expiry)}" style="--x:${x(expiry)}">expires ${expiry}</span><span data-motion-node="clock-checked" class="eng-tick is-check${edge(at)}" style="--x:${x(at)}">checked ${at}</span></div>
<p class="eng-fact">At ${at} s the token is <strong>${state}</strong>; the test expects ${e(expect)}.</p>${card(s,'clock','test',`<output class="${passes?'':'is-denied'}">test ${passes?'passes':'fails'}</output>`)}`,m);
 });

 // Tail latency: each release's requests as sorted bars, with the mean line and the nearest-rank p95 bar.
 const durations=r=>r.flatMap(([ms,count])=>Array(Number(count)).fill(Number(ms))).sort((a,b)=>a-b);
 const nearest=(v,p)=>v[Math.ceil(p*v.length)-1];
 S.register('latency-percentiles',(s,m)=>{
  const releases=['A','B'].map(r=>({r,values:durations(rows(s,`Release ${r} (ms)`))})).filter(x=>x.values.length);
  const scale=Math.max(...releases.flatMap(x=>x.values));
  const panel=({r,values})=>{const mean=values.reduce((t,v)=>t+v,0)/values.length,p95=nearest(values,.95),rank=Math.ceil(.95*values.length);
   return `<section data-motion-node="tail-${r.toLowerCase()}" class="eng-release"><h4>Release ${r} · ${values.length} requests</h4><div class="eng-bars" role="img" aria-label="Release ${r}: ${values.length} durations sorted from ${values[0]} to ${values.at(-1)} ms">${values.map((v,i)=>`<span class="${i===rank-1?'is-p95':''}" style="--h:${v/scale*100}%"></span>`).join('')}<i class="eng-mean-line" style="--h:${mean/scale*100}%"></i></div>
<dl><div data-motion-node="tail-${r.toLowerCase()}-mean"><dt>Mean</dt><dd>${Math.round(mean*100)/100} ms</dd></div><div data-motion-node="tail-${r.toLowerCase()}-p95"><dt>p95 (rank ${rank} of ${values.length})</dt><dd>${p95} ms</dd></div></dl></section>`;};
  return scene('tail',`${header('percentile(values, 0.95) = sorted[ceil(0.95 × n) − 1]','Each bar is one request, shortest to longest. The line is the mean.')}<div class="eng-releases">${releases.map(panel).join('')}</div>${card(s,'tail','verdict')}`,m);
 });

 // Permission bits: the process picks owner, group or other bits; a directory needs x to traverse, a file r or w.
 const bits=d=>['r','w','x'].map((c,i)=>Number(d)&(4>>i)?c:'-').join('');
 S.register('permissions-and-identities',(s,m)=>{
  const [user,groups]=rows(s,'Identity')[0]||[],member=String(groups).split(', ');
  let blocked='';
  const entries=rows(s,'Path').map(([path,owner,group,mode,needs])=>{const who=user===owner?0:member.includes(group)?1:2,own=bits(mode[who]),ok=!blocked&&own.includes(needs);
   const reached=!blocked;if(!ok&&!blocked)blocked=path;return {path,owner,group,mode,needs,who:['owner','group','other'][who],own,ok,reached};});
  const name=p=>p.split('/').pop().replace(/\W/g,'-');
  const verb={x:'traverse',r:'read',w:'write'};
  const result=blocked?`Permission denied at ${blocked}`:`${user} can ${verb[entries.at(-1)?.needs]||'use'} ${entries.at(-1)?.path||''}`;
  return scene('perm',`${header(`${e(user)} is in groups ${e(groups)}`,'Owner, group and other each get r = 4, w = 2, x = 1.')}
<ol class="eng-path">${entries.map(t=>`<li data-motion-node="perm-${e(name(t.path))}" class="${t.ok?'is-pass':t.reached?'is-fail':'is-skip'}"><code>${e(t.path)}</code><span>${e(t.owner)}:${e(t.group)} · mode ${e(t.mode)} = ${[0,1,2].map(i=>`<b class="${['owner','group','other'][i]===t.who?'is-own':''}">${bits(t.mode[i])}</b>`).join('')}</span><span>${t.reached?`${e(user)} uses the ${t.who} bits ${t.own}: ${verb[t.needs]} ${t.ok?'allowed':'denied'}`:`${e(user)} would use the ${t.who} bits ${t.own}, but the path is not reached`}</span></li>`).join('')}</ol>
${card(s,'perm','result',`<output class="${blocked?'is-denied':''}">${e(result)}</output>`)}`,m);
 });
})(globalThis);
