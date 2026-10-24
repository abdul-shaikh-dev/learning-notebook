// Real-browser accessibility audit: text contrast, 24px targets and visible keyboard focus,
// on every page type, light and dark, desktop and phone. Needs Chrome; set CHROME_PATH if it is elsewhere.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),http=require('node:http'),{spawn,spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const routes=['index.html','index.html#path/python','index.html#path/python/variables','index.html#search','index.html#review','index.html#backup','offline.html','course.html','course.html#explore','handbook.html'];
const views=[{width:1440,height:900,dark:false},{width:1440,height:900,dark:true},{width:390,height:844,dark:false},{width:390,height:844,dark:true}];
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json','.woff2':'font/woff2','.wasm':'application/wasm'};

function findChrome(){
 const named=[process.env.CHROME_PATH,'C:/Program Files/Google/Chrome/Application/chrome.exe','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean);
 for(const file of named)if(fs.existsSync(file))return file;
 for(const name of ['google-chrome','google-chrome-stable','chromium','chromium-browser']){const found=spawnSync('which',[name],{encoding:'utf8'});if(found.status===0)return found.stdout.trim();}
 return null;
}

// Runs inside the page. Returns readable problem descriptions.
const pageAudit=String.raw`(()=>{
 const parse=c=>{const m=c.match(/rgba?\(([^)]+)\)/);if(!m)return null;const [r,g,b,a=1]=m[1].split(/[ ,\/]+/).filter(Boolean).map(Number);return {r,g,b,a};};
 const lum=({r,g,b})=>{const f=v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4;};return .2126*f(r)+.7152*f(g)+.0722*f(b);};
 const bgOf=el=>{for(let e=el;e;e=e.parentElement){const s=getComputedStyle(e);if(s.backgroundImage!=='none')return null;const c=parse(s.backgroundColor);if(c&&c.a>.9)return c;}return parse(getComputedStyle(document.body).backgroundColor);};
 const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>1&&r.height>1&&s.visibility!=='hidden'&&s.display!=='none'&&+s.opacity>0&&!e.closest('[hidden],[inert],details:not([open]) > :not(summary)');};
 const label=e=>'<'+e.tagName.toLowerCase()+(e.className&&typeof e.className==='string'?' class="'+e.className.slice(0,40)+'"':'')+'> "'+(e.textContent||e.getAttribute('aria-label')||'').trim().replace(/\s+/g,' ').slice(0,40)+'"';
 const problems=[];
 for(const el of document.querySelectorAll('body *')){
  if(!visible(el)||el.closest('progress,svg'))continue;
  if(![...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))continue;
  const s=getComputedStyle(el),fg=parse(s.color),bg=bgOf(el);if(!fg||!bg||fg.a<.9)continue;
  const L1=lum(fg),L2=lum(bg),ratio=(Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05),size=parseFloat(s.fontSize),large=size>=24||(+s.fontWeight>=700&&size>=18.66);
  if(ratio<(large?3:4.5))problems.push('contrast '+ratio.toFixed(2)+' '+label(el));
 }
 // WCAG 2.5.8: a target under 24px passes when it sits in running text, when its label is the larger target,
 // or when a 24px circle on its centre touches no other target and no other small target's circle.
 const blockOf=e=>{let b=e.parentElement;while(b&&getComputedStyle(b).display.startsWith('inline'))b=b.parentElement;return b;};
 const inText=e=>{if(e.tagName!=='A'||getComputedStyle(e).display!=='inline')return false;const b=blockOf(e);if(!b)return false;const copy=b.cloneNode(true);copy.querySelectorAll('a,button,input,select,summary').forEach(x=>x.remove());return /[A-Za-z0-9]{2}/.test(copy.textContent);};
 const big=r=>r.width>=24&&r.height>=24;
 const targets=[...document.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button]')].filter(visible).map(el=>{const r=el.getBoundingClientRect();return {el,r,x:r.left+r.width/2,y:r.top+r.height/2,small:!big(r)};});
 const touches=(t,o)=>{const dx=Math.max(o.r.left-t.x,0,t.x-o.r.right),dy=Math.max(o.r.top-t.y,0,t.y-o.r.bottom);return Math.hypot(dx,dy)<12||(o.small&&Math.hypot(t.x-o.x,t.y-o.y)<24);};
 for(const t of targets){
  if(!t.small||inText(t.el)||[...(t.el.labels||[])].some(l=>big(l.getBoundingClientRect())))continue;
  if(!targets.some(o=>o!==t&&!o.el.contains(t.el)&&!t.el.contains(o.el)&&touches(t,o)))continue;
  problems.push('target '+Math.round(t.r.width)+'x'+Math.round(t.r.height)+' '+label(t.el));
 }
 return problems;
})()`;
const focusState=String.raw`(()=>{const e=document.activeElement;if(!e||e===document.body)return null;const s=getComputedStyle(e);
 const ring=(s.outlineStyle!=='none'&&parseFloat(s.outlineWidth)>=2)||/\d+px \d+px \d+px [1-9]/.test(s.boxShadow)||s.boxShadow.includes('inset');
 return {ring,name:'<'+e.tagName.toLowerCase()+'> "'+(e.textContent||e.getAttribute('aria-label')||e.placeholder||'').trim().replace(/\s+/g,' ').slice(0,40)+'"'};})()`;

(async()=>{
 const chromePath=findChrome();
 if(!chromePath){const msg='UI audit needs Chrome. Set CHROME_PATH to run it.';if(process.env.CI){console.error(msg);process.exit(1);}console.log('SKIP: '+msg);return;}
 const server=http.createServer((req,res)=>{
  const file=path.join(root,decodeURIComponent(new URL(req.url,'http://x').pathname));
  if(!file.startsWith(root)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});fs.createReadStream(file).pipe(res);
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port+'/';
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'ui-audit-'));
 const chrome=spawn(chromePath,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir='+profile,...(process.env.CI?['--no-sandbox']:[]),'about:blank'],{stdio:['ignore','ignore','pipe']});
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 const browserUrl=await new Promise((resolve,reject)=>{let text='';chrome.stderr.on('data',d=>{text+=d;const m=text.match(/ws:\/\/\S+/);if(m)resolve(m[0]);});chrome.on('exit',()=>reject(new Error('Chrome exited before it started')));});
 const ws=new WebSocket(browserUrl);await new Promise(r=>ws.onopen=r);
 let id=0;const pending=new Map();
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id);}};
 const send=(method,params={},sessionId)=>new Promise(r=>{const i=++id;pending.set(i,r);ws.send(JSON.stringify({id:i,method,params,sessionId}));});
 const {result:{targetId}}=await send('Target.createTarget',{url:'about:blank'});
 const {result:{sessionId}}=await send('Target.attachToTarget',{targetId,flatten:true});
 const page=(method,params)=>send(method,params,sessionId);
 const evaluate=async expression=>(await page('Runtime.evaluate',{expression,returnByValue:true})).result.result?.value;
 const failures=[];
 try{
  await page('Page.enable');await page('Runtime.enable');
  for(const view of views){
   const mobile=view.width<700;
   await page('Emulation.setDeviceMetricsOverride',{width:view.width,height:view.height,deviceScaleFactor:1,mobile});
   await page('Emulation.setTouchEmulationEnabled',{enabled:mobile});
   await page('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:view.dark?'dark':'light'},{name:'prefers-reduced-motion',value:'reduce'}]});
   for(const route of routes){
    const where=route+' at '+view.width+'px '+(view.dark?'dark':'light');
    await page('Page.navigate',{url:'about:blank'});
    await page('Page.navigate',{url:base+route});
    for(let i=0;i<80;i++){await sleep(150);if(await evaluate("document.readyState==='complete'&&!!document.querySelector('main')?.textContent.trim()&&!/Loading/.test(document.querySelector('main').textContent.slice(0,200))"))break;}
    await sleep(300);
    for(const problem of await evaluate(pageAudit)||[])failures.push(where+': '+problem);
    // Keyboard: the first stops in tab order must each show a visible focus indicator.
    for(let i=0;i<25;i++){
     for(const type of ['keyDown','keyUp'])await page('Input.dispatchKeyEvent',{type,key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
     const state=await evaluate(focusState);if(!state)break;
     if(!state.ring)failures.push(where+': focus without a visible ring '+state.name);
    }
   }
  }
 }finally{ws.close();chrome.kill();server.close();try{fs.rmSync(profile,{recursive:true,force:true});}catch{}}
 const unique=[...new Set(failures)];
 if(unique.length){console.error(unique.join('\n'));console.error('FAIL: '+unique.length+' UI accessibility problems.');process.exit(1);}
 console.log('PASS: contrast, 24px targets and visible keyboard focus on '+routes.length+' pages, light and dark, at 1440px and 390px.');
})().catch(error=>{console.error(error);process.exit(1);});
