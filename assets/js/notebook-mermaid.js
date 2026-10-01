/* Diagrams share authored nodes/edges with their readable text alternatives. */
(function(root){
 'use strict';
 const vendorUrl=new URL('../vendor/mermaid.tiny.js',document.currentScript.src).href;
 let loading,serial=0;
 const label=s=>String(s).replaceAll('->','→').replaceAll('"','”').replace(/[&<>#\n\r;]/g,c=>'#'+c.charCodeAt(0)+';');
 function source(d){
  const ids=new Map(d.nodes.map((n,i)=>[n.id,'n'+i]));
  const description=['accTitle: '+d.title.replace(/[\r\n]/g,' '),'accDescr: '+d.summary.replace(/[\r\n]/g,' ')];
  if(d.type==='sequence')return ['sequenceDiagram',...description,...d.nodes.map(n=>`participant ${ids.get(n.id)} as ${label(n.label)}`),...(d.sequenceOrder||d.edges.map((_,i)=>i)).map(i=>{const e=d.edges[i];return `${ids.get(e.from)}${e.reply?'-->>':'->>'}${ids.get(e.to)}: ${label(e.label)}`;})].join('\n');
  const shapes={decision:['{','}'],database:['[(',')]'],terminal:['([','])']};
  return ['flowchart '+(d.direction==='LR'?'LR':'TB'),...description,...d.nodes.map(n=>{const [a,b]=shapes[n.shape]||['[',']'];return `${ids.get(n.id)}${a}"${label(n.label)}"${b}`;}),...d.edges.map(e=>`${ids.get(e.from)} -->|"${label(e.label)}"| ${ids.get(e.to)}`)].join('\n');
 }
 // Mermaid's SVG text mode can leave its numeric escapes as literal text.
 // Decode only text nodes, never markup, and only the characters we escape.
 function readableLabels(drawing){
  drawing.querySelectorAll('text,tspan').forEach(element=>{
   element.childNodes.forEach(node=>{
    if(node.nodeType===3)node.textContent=node.textContent.replace(/&#(38|60|62|35|10|13|59);/g,(_,code)=>String.fromCharCode(Number(code)));
   });
  });
 }
 function showTextFallback(panel){
  const alternative=panel.closest('.concept-diagram')?.querySelector('[data-diagram-alternative]');
  if(alternative){alternative.classList.remove('diagram-accessible-text');if(alternative.tagName==='DETAILS')alternative.open=true;}
 }
 function load(){
  if(!loading)loading=new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src=vendorUrl;
   script.onload=()=>{root.mermaid.initialize({startOnLoad:false,securityLevel:'strict',look:'classic',htmlLabels:false,theme:'base',fontFamily:'Arial, sans-serif',flowchart:{htmlLabels:false,useMaxWidth:false,curve:'linear'},sequence:{useMaxWidth:false,wrap:true},themeVariables:{primaryColor:'#e4eee9',primaryTextColor:'#17392f',primaryBorderColor:'#557767',lineColor:'#557767',secondaryColor:'#f3f6f2',tertiaryColor:'#fff',fontSize:'16px'}});resolve(root.mermaid);};
   script.onerror=()=>{loading=null;script.remove();reject(Error('Mermaid unavailable'));};document.head.append(script);
  });
  return loading;
 }
 function active(section,d,step){
  section.dataset.mermaidActive=JSON.stringify(step.activeNodes||[]);
  section.dataset.mermaidEdges=JSON.stringify(step.activeEdges||[]);
  section.querySelectorAll('.node').forEach(node=>{const i=d.nodes.findIndex((n,j)=>node.id.includes('-flowchart-n'+j+'-'));node.classList.toggle('mermaid-current',i>=0&&(step.activeNodes||[]).includes(d.nodes[i].id));});
  section.querySelectorAll('[data-diagram-node]').forEach(node=>node.classList.toggle('mermaid-current',(step.activeNodes||[]).includes(node.dataset.diagramNode)));
  section.querySelectorAll('[data-diagram-edge]').forEach(edge=>edge.classList.toggle('mermaid-edge-current',(step.activeEdges||[]).includes(Number(edge.dataset.diagramEdge))));
 }
 function mapDrawing(d,drawing){
  const sequence=d.type==='sequence';
  const edges=drawing.querySelectorAll(sequence?'.messageLine0,.messageLine1':'.flowchart-link');
  const order=sequence?(d.sequenceOrder||d.edges.map((_,i)=>i)):d.edges.map((_,i)=>i);
  edges.forEach((edge,i)=>{edge.dataset.diagramEdge=order[i];
   // A separate marker lets each step emphasize only its own arrowhead.
   for(const attribute of ['marker-start','marker-end']){const value=edge.getAttribute(attribute),id=value?.match(/#([^)'"]+)/)?.[1];if(!id)continue;const original=[...drawing.querySelectorAll('marker')].find(m=>m.id===id);if(!original)continue;const marker=original.cloneNode(true);marker.id=id+'-step-'+i+'-'+attribute;marker.dataset.diagramEdge=order[i];original.parentElement.append(marker);edge.setAttribute(attribute,'url(#'+marker.id+')');}
  });
  drawing.querySelectorAll(sequence?'.messageText':'.edgeLabel').forEach((edge,i)=>{edge.dataset.diagramEdge=order[i];});
  if(sequence)drawing.querySelectorAll('rect.actor').forEach(actor=>{const id=actor.getAttribute('name');const i=Number((id||'').replace(/^n/,''));if(id&&d.nodes[i])actor.parentElement.dataset.diagramNode=d.nodes[i].id;});
 }
 function expanded(panel,view,drawing,title,trigger){
  const dialog=document.createElement('dialog');dialog.className='mermaid-dialog';
  const heading=document.createElement('h2');heading.id='diagram-viewer-title-'+(++serial);heading.textContent=title;dialog.setAttribute('aria-labelledby',heading.id);
  const controls=document.createElement('div');controls.className='mermaid-toolbar';
  const viewport=document.createElement('div');viewport.className='mermaid-view mermaid-expanded-view';viewport.tabIndex=0;viewport.setAttribute('role','region');viewport.setAttribute('aria-label','Expanded diagram; scroll to explore');
  const status=document.createElement('span');status.className='mermaid-zoom-status';status.setAttribute('role','status');
  const hint=document.createElement('p');hint.className='mermaid-hint';hint.textContent='Scroll to explore. Zoom changes diagram size. Escape closes this viewer.';
  const originalWidth=drawing.style.width,natural=Number(drawing.getAttribute('viewBox').split(/\s+/)[2]);let zoom=1;
  function button(text,handler){const b=document.createElement('button');b.type='button';b.className='quiet';b.textContent=text;b.addEventListener('click',handler);controls.append(b);return b;}
  const out=button('Zoom out',()=>resize(zoom-.25));const into=button('Zoom in',()=>resize(zoom+.25));button('Actual size',()=>resize(1));button('Fit diagram',()=>resize(Math.min(1,(viewport.clientWidth-32)/natural)));const close=button('Close diagram',()=>dialog.close());
  function resize(value){zoom=Math.max(.25,Math.min(3,value));drawing.style.width=natural*zoom+'px';status.textContent=Math.round(zoom*100)+'%';out.disabled=zoom<=.25;into.disabled=zoom>=3;}
  controls.append(status);dialog.append(heading,controls,hint,viewport);panel.append(dialog);viewport.append(drawing);
  const onRoute=()=>dialog.close();
  dialog.addEventListener('close',()=>{drawing.style.width=originalWidth;view.append(drawing);dialog.remove();root.removeEventListener('hashchange',onRoute);root.removeEventListener('beforeprint',onRoute);if(trigger.isConnected)trigger.focus();},{once:true});
  root.addEventListener('hashchange',onRoute,{once:true});root.addEventListener('beforeprint',onRoute,{once:true});dialog.showModal();resize(1);close.focus();
 }
 function download(text,type,name){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 async function render(main){
  for(const panel of main.querySelectorAll('[data-mermaid-diagram]')){
   if(panel.dataset.mermaidReady)continue;panel.dataset.mermaidReady='pending';
   const d=JSON.parse(panel.dataset.mermaidDiagram),text=source(d),view=panel.querySelector('.mermaid-view'),status=panel.querySelector('.mermaid-status');
   const fit=panel.querySelector('[data-mermaid-fit]');fit.addEventListener('click',()=>{const on=fit.getAttribute('aria-pressed')!=='true';fit.setAttribute('aria-pressed',String(on));view.classList.toggle('is-fit',on);});
   panel.querySelector('[data-mermaid-source]').addEventListener('click',()=>download(text,'text/plain;charset=utf-8','learning-diagram.mmd'));
   try{
    const api=await load();if(!panel.isConnected)continue;
    const result=await api.render('notebook-mermaid-'+(++serial),text);if(!panel.isConnected)continue;
    view.innerHTML=result.svg;const drawing=view.querySelector('svg');readableLabels(drawing);const exportSvg=drawing.outerHTML;const naturalWidth=Number(drawing.getAttribute('viewBox').split(/\s+/)[2]);drawing.style.width=naturalWidth+'px';drawing.style.maxWidth='none';mapDrawing(d,drawing);panel.dataset.mermaidReady='ready';status.textContent='';
    const expand=document.createElement('button');expand.type='button';expand.className='quiet';expand.textContent='Expand diagram';expand.dataset.mermaidExpand='';expand.addEventListener('click',()=>expanded(panel,view,drawing,d.title,expand));fit.after(expand);
    const hint=panel.querySelector('.mermaid-hint');if(hint)hint.textContent='Read at actual size; scroll across wide diagrams. Expand for zoom controls. Fit to screen may reduce label size.';
    const svg=panel.querySelector('[data-mermaid-svg]');svg.disabled=false;svg.addEventListener('click',()=>download(exportSvg,'image/svg+xml','learning-diagram.svg'));
    const section=panel.closest('.concept-diagram');active(section,d,{activeNodes:JSON.parse(section.dataset.mermaidActive||'[]'),activeEdges:JSON.parse(section.dataset.mermaidEdges||'[]')});
   }catch{showTextFallback(panel);panel.dataset.mermaidReady='failed';status.textContent='Diagram unavailable. The full explanation and connections are available below.';}
  }
 }
 root.NotebookMermaid={source,render,active,readableLabels,showTextFallback};
})(globalThis);
