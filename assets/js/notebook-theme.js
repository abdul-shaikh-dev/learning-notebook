/* Apply before paint; an explicit choice overrides the operating-system theme. */
(() => {
 'use strict';
 const key='learning-notebook:theme:v1', root=document.documentElement;
 if(!root)return;
 const media=window.matchMedia('(prefers-color-scheme: dark)');
 let preference;
 try { const saved=localStorage.getItem(key); if(saved==='light'||saved==='dark')preference=saved; } catch {}
 function apply(){
  const dark=(preference|| (media.matches?'dark':'light'))==='dark';
  root.dataset.theme=dark?'dark':'light';
  document.querySelectorAll('[data-theme-toggle]').forEach(button=>{button.setAttribute('aria-pressed',String(dark));button.setAttribute('title',dark?'Switch to light mode':'Switch to dark mode');});
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',dark?'#121e1a':'#17392f');
 }
 apply();
 media.addEventListener?.('change',()=>{if(!preference)apply();});
 window.addEventListener('storage',event=>{if(event.key===key||event.key===null){preference=event.newValue==='dark'||event.newValue==='light'?event.newValue:undefined;apply();}});
 document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('[data-theme-toggle]').forEach(button=>button.addEventListener('click',()=>{
   preference=root.dataset.theme==='dark'?'light':'dark';
   try{localStorage.setItem(key,preference);}catch{}
   apply();
  }));
  apply();
 });
})();
