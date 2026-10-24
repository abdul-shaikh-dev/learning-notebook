/* Data scenes: summary statistics, grouped rates and classification thresholds, drawn from each snapshot's tables. */
(function(root){
 'use strict';
 const S=root.NotebookScenes,e=S.escape;
 const rows=(s,caption)=>(s.tables||[]).find(t=>t.caption===caption)?.rows||[];
 const number=n=>String(Math.round(n*100)/100);
 const percent=n=>number(n*100)+'%';
 const header=(title,detail)=>`<div class="data-caption"><strong>${e(title)}</strong><span>${e(detail)}</span></div>`;
 const notes=s=>`<ul class="data-notes">${s.nodes.map(n=>`<li class="tone-${e(n.tone)}"><b>${e(n.label)}:</b> ${e(n.detail)}</li>`).join('')}</ul>`;
 const action=label=>`<button type="button" class="quiet data-action" data-scene-next>${e(label)} →</button>`;

 // Mean and median on one axis: equal values stack, missing values wait beside the axis.
 S.register('mean-median-and-outliers',(s,m)=>{
  const observations=rows(s,'Latencies (ms)').map(([name,value])=>({name,value:Number.parseFloat(value),entered:/entered/.test(value)}));
  const measured=observations.filter(o=>Number.isFinite(o.value)),values=measured.map(o=>o.value).sort((a,b)=>a-b);
  const mean=values.reduce((t,v)=>t+v,0)/values.length,mid=values.length>>1,median=values.length%2?values[mid]:(values[mid-1]+values[mid])/2;
  const scale=Math.max(100,...values),at=v=>`${v/scale*100}%`,seen=new Map();
  const dots=measured.map(o=>{const level=seen.get(o.value)||0;seen.set(o.value,level+1);return `<li data-motion-node="stat-obs-${e(o.name.toLowerCase())}" class="stat-dot${o.entered?' is-entered':''}" style="--x:${at(o.value)};--level:${level}"><span>${e(o.name)}</span></li>`;}).join('');
  const missing=observations.filter(o=>!Number.isFinite(o.value));
  const last=m.index===(m.scenario?.steps.length??0)-1;
  return `<div class="scene-data">${header('Where do the summaries sit?',`${values.length} measured ${values.length===1?'request':'requests'}${missing.length?`, ${missing.length} missing`:''}. Equal values stack.`)}
<div class="stat-plot"><ol class="stat-dots" aria-label="Measured latencies">${dots}</ol><div class="stat-axis" aria-hidden="true">${[0,.25,.5,.75,1].map(f=>`<span style="--x:${f*100}%">${number(f*scale)}</span>`).join('')}</div>
<p class="stat-marker is-median" data-motion-node="stat-median" style="--x:${at(median)}">Median ${number(median)} ms</p><p class="stat-marker is-mean" data-motion-node="stat-mean" style="--x:${at(mean)}">Mean ${number(mean)} ms</p></div>
${missing.length?`<p class="stat-missing">Not measured: ${missing.map(o=>`<span data-motion-node="stat-obs-${e(o.name.toLowerCase())}">${e(o.name)}</span>`).join(' ')}</p>`:''}
<dl class="stat-summary"><div><dt>n</dt><dd>${values.length}</dd></div><div><dt>Mean</dt><dd>${number(mean)} ms</dd></div><div><dt>Median</dt><dd>${number(median)} ms</dd></div></dl>${notes(s)}${action(last?'Sequence complete':'Next step')}</div>`;
 });

 // groupby: the same ten tickets move from one table into team groups, then into rates.
 const TICKETS=[['T1','A',1],['T2','B',0],['T3','B',1],['T4','A',0],['T5','B',0],['T6','B',0],['T7','B',0],['T8','B',0],['T9','B',0],['T10','B',0]];
 const ticket=([id,team,breach])=>`<li data-motion-node="rate-${id}" class="rate-ticket${breach?' is-breach':''}"><b>${id}</b><span>${team}</span><span>${breach?'Breach':'On time'}</span></li>`;
 S.register('group-and-denominators',(s,m)=>{
  const averaged=m.scenarioIndex===1,grouped=averaged||m.index>=1,summarised=averaged||m.index>=2;
  const overall=averaged?['','unweighted','weighted'][m.index]:m.index>=3?'weighted':'';
  const teams=['A','B'].map(team=>{const members=TICKETS.filter(t=>t[1]===team),breaches=members.reduce((n,t)=>n+t[2],0);return {team,members,breaches,rate:breaches/members.length};});
  const tickets=teams.reduce((n,t)=>n+t.members.length,0),breaches=teams.reduce((n,t)=>n+t.breaches,0);
  const result=overall==='weighted'?`${breaches} breaches / ${tickets} tickets = ${percent(breaches/tickets)}`:overall==='unweighted'?`(${teams.map(t=>percent(t.rate)).join(' + ')}) / ${teams.length} = ${percent(teams.reduce((n,t)=>n+t.rate,0)/teams.length)}`:'';
  const groups=grouped?`<div class="rate-groups">${teams.map(t=>`<section data-motion-node="rate-group-${t.team}" class="rate-group"><h4>Team ${t.team}</h4><ol>${t.members.map(ticket).join('')}</ol>${summarised?`<p data-motion-node="rate-agg-${t.team}" class="rate-aggregate">${t.members.length} tickets · ${t.breaches} ${t.breaches===1?'breach':'breaches'} · rate ${percent(t.rate)}</p>`:''}</section>`).join('')}</div>`:`<section class="rate-table"><h4>Ticket rows, in file order</h4><ol>${TICKETS.map(ticket).join('')}</ol></section>`;
  const last=m.index===(m.scenario?.steps.length??0)-1;
  return `<div class="scene-data">${header('groupby("team"), then one overall rate','Each chip is one ticket. The text says whether it breached.')}<div class="rate-call"><code>${summarised?'df.groupby("team")["breach"].agg(["size", "sum", "mean"])':grouped?'df.groupby("team")':'df'}</code></div>${groups}${overall?`<output data-motion-node="rate-overall" class="rate-overall${overall==='unweighted'?' is-invalid':''}"><span>${overall==='unweighted'?'Mean of team rates':'Overall ticket rate'}</span><strong>${e(result)}</strong></output>`:''}${notes(s)}${action(last?'Sequence complete':'Next step')}</div>`;
 });

 // Threshold: tickets sit on a score axis in a lane for their true label; the line decides what is flagged.
 S.register('threshold-policy',(s,m)=>{
  const tickets=rows(s,'Tickets').map(([name,score,truth])=>({name,score:Number(score),positive:truth==='Needs help'}));
  const threshold=Number(rows(s,'Rule')[0]?.[0]);
  const outcome=t=>t.score>=threshold?(t.positive?'TP':'FP'):(t.positive?'FN':'TN');
  const count=Object.fromEntries(['TP','FP','FN','TN'].map(k=>[k,tickets.filter(t=>outcome(t)===k).length]));
  const cost=4*count.FN+count.FP;
  const lane=(positive,label)=>`<div class="ml-lane"><span class="ml-lane-label">${label}</span><ol>${tickets.filter(t=>t.positive===positive).map(t=>`<li data-motion-node="ml-ticket-${e(t.name)}" class="ml-ticket is-${outcome(t).toLowerCase()}" style="--x:${t.score*100}%"><b>${e(t.name)}</b><span>${t.score} · ${outcome(t)}</span></li>`).join('')}</ol></div>`;
  const last=m.index===(m.scenario?.steps.length??0)-1;
  return `<div class="scene-data">${header(`Flag a ticket when its score is at least ${threshold}`,`${tickets[0]?.name.startsWith('T')?'Test':'Validation'} tickets. Lanes show the true label; the line shows the rule.`)}
<div class="ml-plot"><div class="ml-flagged" style="--x:${threshold*100}%" aria-hidden="true"><span>Flagged</span></div><div class="ml-threshold" data-motion-node="ml-threshold" style="--x:${threshold*100}%"><span>${threshold}</span></div>${lane(true,'Needs help')}${lane(false,'Fine')}<div class="ml-axis" aria-hidden="true">${[0,.25,.5,.75,1].map(f=>`<span style="--x:${f*100}%">${f}</span>`).join('')}</div></div>
<div class="ml-results"><table class="ml-confusion"><caption>Confusion counts</caption><thead><tr><th scope="col">Truth</th><th scope="col">Flagged</th><th scope="col">Not flagged</th></tr></thead><tbody><tr><th scope="row">Needs help</th><td>TP ${count.TP}</td><td>FN ${count.FN}</td></tr><tr><th scope="row">Fine</th><td>FP ${count.FP}</td><td>TN ${count.TN}</td></tr></tbody></table>
<output data-motion-node="ml-cost" class="ml-cost"><span>Cost = 4 × FN + FP</span><strong>4 × ${count.FN} + ${count.FP} = ${cost}</strong></output></div>${notes(s)}${action(last?'Sequence complete':'Next step')}</div>`;
 });
})(globalThis);
