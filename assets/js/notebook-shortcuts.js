// Keyboard shortcuts for the notebook reader. They never fire while typing in a field, with a modifier key held, or over an open dialog.
const NotebookShortcuts=(()=>{
 const LIST=[['/','Search the notebook'],['[','Previous lesson'],[']','Next lesson'],['?','Show these shortcuts'],['Esc','Close this list']];
 const typing=t=>!!t&&(!!t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName||''));
 function lessonAt(hash,offset){
  const [route,id,lessonId]=String(hash).slice(1).split('?')[0].split('/');
  if(route!=='topic')return null;
  const p=LEARNING_PATHS.find(p=>p.id===id),lessons=Array.isArray(p?.lessons)?p.lessons:[],index=lessons.findIndex(l=>l.id===lessonId);
  const target=index<0?null:lessons[index+offset];
  return target?lessonRoute(p,target):null;
 }
 // What a key press should do, or null to leave it to the browser. Moving between lessons never marks one read.
 function action(e,hash,dialogOpen=false){
  if(e.defaultPrevented||e.ctrlKey||e.metaKey||e.altKey||dialogOpen||typing(e.target))return null;
  if(e.key==='/')return {type:'search'};
  if(e.key==='?')return {type:'help'};
  if(e.key==='['||e.key===']'){const href=lessonAt(hash,e.key===']'?1:-1);return href?{type:'go',href}:null;}
  return null;
 }
 function helpHTML(){return `<h2 id="shortcuts-title">Keyboard shortcuts</h2><dl class="shortcut-list">${LIST.map(([key,text])=>`<div><dt><kbd>${escapeText(key)}</kbd></dt><dd>${escapeText(text)}</dd></div>`).join('')}</dl><p>Shortcuts pause while you type in a search box or answer field.</p><form method="dialog"><button class="primary">Close</button></form>`;}
 function dialog(){
  let d=document.getElementById('shortcuts-dialog');
  if(!d){d=document.createElement('dialog');d.id='shortcuts-dialog';d.className='shortcuts-dialog';d.setAttribute('aria-labelledby','shortcuts-title');d.innerHTML=helpHTML();document.body.append(d);}
  return d;
 }
 function showHelp(){const d=dialog();if(!d.open)d.showModal();}
 // The search page can render after its index loads, so wait for the field instead of assuming it exists.
 function focusWhenReady(id){
  const field=document.getElementById(id);if(field){field.focus();return;}
  const main=document.getElementById('main');if(!main||typeof MutationObserver==='undefined')return;
  const observer=new MutationObserver(()=>{const ready=document.getElementById(id);if(ready){observer.disconnect();ready.focus();}});
  observer.observe(main,{childList:true,subtree:true});setTimeout(()=>observer.disconnect(),10000);
 }
 function run(a){
  if(a.type==='help')return showHelp();
  if(a.type==='go'){location.hash=a.href;return;}
  if(location.hash.split('?')[0]!=='#search')location.hash='#search';
  focusWhenReady('notebook-query');
 }
 function bind(){
  document.addEventListener('keydown',e=>{const a=action(e,location.hash,!!document.querySelector('dialog[open]'));if(!a)return;e.preventDefault();run(a);});
  document.querySelectorAll('[data-shortcuts]').forEach(button=>button.addEventListener('click',showHelp));
 }
 return {LIST,action,helpHTML,run,bind};
})();
if(typeof document!=='undefined'&&typeof document.addEventListener==='function'&&typeof location!=='undefined')NotebookShortcuts.bind();
