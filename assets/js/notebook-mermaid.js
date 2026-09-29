/* Mermaid diagrams are derived from the same nodes/edges as their text alternatives. */
(function(root){
 'use strict';
 const vendorUrl=new URL('../vendor/mermaid.tiny.js',document.currentScript.src).href;
 let loading,serial=0;
 const label=s=>String(s).replaceAll("->","→").replaceAll(String.fromCharCode(34),"”").replace(/[&<>#\n\r]/g,c=>'#'+c.charCodeAt(0)+';');
 function source(d){
  const ids=new Map(d.nodes.map((n,i)=>[n.id,'n'+i]));
  return ['flowchart TB','accTitle: '+d.title.replace(/[\r\n]/g,' '),'accDescr: '+d.summary.replace(/[\r\n]/g,' '),...d.nodes.map(n=>`${ids.get(n.id)}["${label(n.label)}"]`),...d.edges.map(e=>`${ids.get(e.from)} -->|"${label(e.label)}"| ${ids.get(e.to)}`)].join('\n');
 }
 function load(){
  if(!loading)loading=new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src=vendorUrl;
   script.onload=()=>{root.mermaid.initialize({startOnLoad:false,securityLevel:'strict',look:'classic',htmlLabels:false,theme:'base',fontFamily:'Arial, sans-serif',flowchart:{htmlLabels:false,useMaxWidth:true,curve:'linear'},themeVariables:{primaryColor:'#e4eee9',primaryTextColor:'#17392f',primaryBorderColor:'#557767',lineColor:'#557767',secondaryColor:'#f3f6f2',tertiaryColor:'#fff',fontSize:'16px'}});resolve(root.mermaid);};
   script.onerror=()=>reject(Error('Mermaid unavailable'));document.head.append(script);
  });
  return loading;
 }
 function active(section,d,step){
  section.dataset.mermaidActive=JSON.stringify(step.activeNodes||[]);
  section.querySelectorAll('.mermaid-view .node').forEach(node=>{const i=d.nodes.findIndex((n,j)=>node.id.includes('-flowchart-n'+j+'-'));node.classList.toggle('mermaid-current',i>=0&&(step.activeNodes||[]).includes(d.nodes[i].id));});
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
    view.innerHTML=result.svg;panel.dataset.mermaidReady='ready';status.textContent='';
    const svg=panel.querySelector('[data-mermaid-svg]');svg.disabled=false;svg.addEventListener('click',()=>download(result.svg,'image/svg+xml','learning-diagram.svg'));
    const section=panel.closest('.concept-diagram');active(section,d,{activeNodes:JSON.parse(section.dataset.mermaidActive||'[]')});
   }catch{panel.dataset.mermaidReady='failed';status.textContent='Diagram unavailable. The full explanation and connections are available below.';}
  }
 }
 root.NotebookMermaid={source,render,active};
})(globalThis);
