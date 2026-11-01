// External link check: every course source and lesson reference, one request at a time per host.
// Reports broken and redirected links as Markdown. It never fails the build; the scheduled workflow publishes the report.
const fs=require('node:fs'),path=require('node:path');

// url -> where it is cited, from course sources and lesson references.
function collectLinks(paths){
 const links=new Map();
 const add=(url,where)=>{if(typeof url!=='string'||!/^https?:\/\//.test(url))return;if(!links.has(url))links.set(url,[]);links.get(url).push(where);};
 for(const p of paths){
  for(const s of p.sources||[])add(s.url,{course:p.title,place:'Course sources'});
  for(const l of Array.isArray(p.lessons)?p.lessons:[])for(const r of l.references||[])add(r.url,{course:p.title,place:l.title});
 }
 return links;
}

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
// Statuses worth another try: rate limits, server errors and network failures (status 0).
const transient=status=>status===0||status===408||status===429||status>=500;

// One request with a timeout. HEAD first; some servers refuse HEAD, so those get a GET.
async function request(url,{fetch,timeout,userAgent}){
 for(const method of ['HEAD','GET']){
  try{
   const response=await fetch(url,{method,redirect:'manual',headers:{'user-agent':userAgent,accept:'text/html,*/*'},signal:AbortSignal.timeout(timeout)});
   if(method==='HEAD'&&[400,403,404,405,501].includes(response.status))continue;
   return {status:response.status,location:response.headers.get('location'),retryAfter:response.headers.get('retry-after')};
  }catch(error){if(method==='GET'||error.name==='TimeoutError')return {status:0,error:error.cause?.code||error.name||String(error)};}
 }
}

// Follow redirects by hand so the report can show where a link now points.
async function check(url,options){
 const {retries,backoff,wait}=options;let current=url,hops=0;
 for(;;){
  let result;
  for(let attempt=0;;attempt++){
   result=await request(current,options);
   if(!transient(result.status)||attempt>=retries)break;
   const after=Number(result.retryAfter);await wait(Math.min(Number.isFinite(after)&&after>0?after*1000:backoff*2**attempt,60000));
  }
  if(result.status>=300&&result.status<400&&result.location&&hops<5){
   current=new URL(result.location,current).href;hops++;
   // A redirect onto an allow-listed host proves the first hop resolves; the rest cannot be checked automatically.
   const reason=options.allow.hosts?.[new URL(current).host];
   if(reason)return {url,state:'skipped',final:current,reason};
   continue;
  }
  const ok=result.status>=200&&result.status<300;
  // A DOI always redirects to its publisher, and an added trailing slash is the same page; neither needs updating.
  const same=current===url||current===url+'/'||new URL(url).host==='doi.org';
  return {url,status:result.status,error:result.error,final:current===url?null:current,state:ok?(same?'ok':'redirected'):'broken'};
 }
}

// Hosts run in parallel up to `concurrency`; requests to the same host are spaced by `perHost` milliseconds.
async function checkLinks(urls,{fetch=globalThis.fetch,allow={hosts:{},urls:{}},perHost=1000,concurrency=6,retries=2,backoff=2000,timeout=20000,wait=sleep,userAgent='learning-notebook-link-check (+https://github.com/abdul-shaikh-dev/learning-notebook)'}={}){
 const results=[],byHost=new Map();
 for(const url of urls){
  const host=new URL(url).host,reason=allow.urls?.[url]||allow.hosts?.[host];
  if(reason){results.push({url,state:'skipped',reason});continue;}
  if(!byHost.has(host))byHost.set(host,[]);byHost.get(host).push(url);
 }
 const queue=[...byHost.values()],options={fetch,allow,retries,backoff,timeout,wait,userAgent};
 await Promise.all(Array.from({length:Math.min(concurrency,queue.length)},async()=>{
  for(let list;(list=queue.shift());)for(const [i,url] of list.entries()){if(i)await wait(perHost);results.push(await check(url,options));}
 }));
 return results.sort((a,b)=>a.url.localeCompare(b.url));
}

const cell=s=>String(s).replaceAll('|','\\|').replaceAll('\n',' ');
function report(results,links,{date=new Date().toISOString().slice(0,10)}={}){
 const count=state=>results.filter(r=>r.state===state).length;
 const broken=results.filter(r=>r.state==='broken'),moved=results.filter(r=>r.state==='redirected'),skipped=results.filter(r=>r.state==='skipped');
 const cited=url=>[...new Set((links.get(url)||[]).map(w=>w.course+' · '+w.place))].slice(0,3).map(cell).join('<br>')+((links.get(url)||[]).length>3?'<br>…':'');
 const lines=['# External link report','',`Checked ${date}: ${results.length} links. **${count('broken')} broken**, ${count('redirected')} redirected, ${count('ok')} OK, ${count('skipped')} skipped by the allow list.`,''];
 if(broken.length)lines.push('## Broken','','| Link | Result | Cited in |','| --- | --- | --- |',...broken.map(r=>`| ${cell(r.url)} | ${r.status?'HTTP '+r.status:cell(r.error||'No response')}${r.final?' after redirect to '+cell(r.final):''} | ${cited(r.url)} |`),'');
 if(moved.length)lines.push('## Redirected','','Update these to the new address when the target is the same page.','','| Link | Now | Cited in |','| --- | --- | --- |',...moved.map(r=>`| ${cell(r.url)} | ${cell(r.final)} | ${cited(r.url)} |`),'');
 if(skipped.length)lines.push('<details><summary>Skipped by the allow list</summary>','',...skipped.map(r=>`- ${cell(r.url)}${r.final?' (redirects to '+cell(r.final)+')':''}: ${cell(r.reason)}`),'','</details>','');
 if(!broken.length&&!moved.length)lines.push('Every checked link answered directly.','');
 return lines.join('\n');
}

module.exports={collectLinks,checkLinks,report};

if(require.main===module)(async()=>{
 const root=path.resolve(__dirname,'..'),args=process.argv.slice(2),out=args[args.indexOf('--out')+1];
 const links=collectLinks(require('./manifest.cjs').readPaths());
 const allow=JSON.parse(fs.readFileSync(path.join(root,'scripts/link-allowlist.json'),'utf8'));
 const results=await checkLinks([...links.keys()],{allow});
 const text=report(results,links);
 if(args.includes('--out')&&out)fs.writeFileSync(out,text);else process.stdout.write(text);
 if(args.includes('--json'))fs.writeFileSync(args[args.indexOf('--json')+1],JSON.stringify(results,null,1));
 console.error(`${results.filter(r=>r.state==='broken').length} broken, ${results.filter(r=>r.state==='redirected').length} redirected of ${results.length}.`);
})();
