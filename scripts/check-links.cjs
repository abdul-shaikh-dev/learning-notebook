// External link check: every course source and lesson reference, one request at a time per host.
// Reports broken and redirected links, and lesson references due for review, as Markdown. It never fails the build; the scheduled workflow publishes the report.
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

// Lesson references whose reviewed date is more than `months` calendar months before `today` (both YYYY-MM-DD).
// The cutoff keeps the day of the month, or the month's last day when it is shorter. A missing or invalid date counts as due.
function reviewCutoff(today,months){
 const [y,m,d]=today.split('-').map(Number),total=y*12+(m-1)-months,year=Math.floor(total/12),month=total%12+1;
 const day=Math.min(d,new Date(Date.UTC(year,month,0)).getUTCDate());
 return `${String(year).padStart(4,'0')}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}
const validDate=s=>{if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const [y,m,d]=s.split('-').map(Number),t=new Date(Date.UTC(y,m-1,d));return t.getUTCFullYear()===y&&t.getUTCMonth()===m-1&&t.getUTCDate()===d;};
function staleReferences(paths,{today,months}){
 const cutoff=reviewCutoff(today,months),due=new Map();
 for(const p of paths)for(const l of Array.isArray(p.lessons)?p.lessons:[])for(const r of l.references||[]){
  if(validDate(r.reviewed)&&r.reviewed>=cutoff)continue;
  const key=p.title+'\n'+r.url+'\n'+r.reviewed;
  if(!due.has(key))due.set(key,{course:p.title,title:r.title,url:r.url,reviewed:validDate(r.reviewed)?r.reviewed:null,lessons:[]});
  due.get(key).lessons.push(l.title);
 }
 return {cutoff,months,references:[...due.values()].sort((a,b)=>a.course.localeCompare(b.course)||(a.reviewed??'').localeCompare(b.reviewed??'')||a.url.localeCompare(b.url))};
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
function report(results,links,{date=new Date().toISOString().slice(0,10),stale}={}){
 const count=state=>results.filter(r=>r.state===state).length;
 const broken=results.filter(r=>r.state==='broken'),moved=results.filter(r=>r.state==='redirected'),skipped=results.filter(r=>r.state==='skipped');
 const cited=url=>[...new Set((links.get(url)||[]).map(w=>w.course+' · '+w.place))].slice(0,3).map(cell).join('<br>')+((links.get(url)||[]).length>3?'<br>…':'');
 const lines=['# External link report','',`Checked ${date}: ${results.length} links. **${count('broken')} broken**, ${count('redirected')} redirected, ${count('ok')} OK, ${count('skipped')} skipped by the allow list.`,''];
 if(broken.length)lines.push('## Broken','','| Link | Result | Cited in |','| --- | --- | --- |',...broken.map(r=>`| ${cell(r.url)} | ${r.status?'HTTP '+r.status:cell(r.error||'No response')}${r.final?' after redirect to '+cell(r.final):''} | ${cited(r.url)} |`),'');
 if(moved.length)lines.push('## Redirected','','Update these to the new address when the target is the same page.','','| Link | Now | Cited in |','| --- | --- | --- |',...moved.map(r=>`| ${cell(r.url)} | ${cell(r.final)} | ${cited(r.url)} |`),'');
 if(skipped.length)lines.push('<details><summary>Skipped by the allow list</summary>','',...skipped.map(r=>`- ${cell(r.url)}${r.final?' (redirects to '+cell(r.final)+')':''}: ${cell(r.reason)}`),'','</details>','');
 if(!broken.length&&!moved.length)lines.push('Every checked link answered directly.','');
 if(stale){
  const {references:due,cutoff,months}=stale;
  lines.push('## References due for review','',`Lesson references last reviewed more than ${months} months ago, before ${cutoff}. Re-read each source, update the lesson if the source has changed, then update the reference's \`reviewed\` date.`,'');
  if(!due.length)lines.push(`None: every lesson reference was reviewed on or after ${cutoff}.`,'');
  for(const course of [...new Set(due.map(r=>r.course))])lines.push(`### ${cell(course)}`,'','| Reference | Reviewed | Cited in |','| --- | --- | --- |',...due.filter(r=>r.course===course).map(r=>`| [${cell(r.title)}](${cell(r.url)}) | ${r.reviewed??'Missing or invalid date'} | ${r.lessons.map(cell).join('<br>')} |`),'');
 }
 return lines.join('\n');
}

module.exports={collectLinks,checkLinks,reviewCutoff,staleReferences,report};

if(require.main===module)(async()=>{
 const root=path.resolve(__dirname,'..'),args=process.argv.slice(2),out=args[args.indexOf('--out')+1];
 const paths=require('./manifest.cjs').readPaths(),links=collectLinks(paths);
 const allow=JSON.parse(fs.readFileSync(path.join(root,'scripts/link-allowlist.json'),'utf8'));
 const stale=staleReferences(paths,{today:new Date().toISOString().slice(0,10),months:allow.reviewedMaxAgeMonths});
 const results=await checkLinks([...links.keys()],{allow});
 const text=report(results,links,{stale});
 if(args.includes('--out')&&out)fs.writeFileSync(out,text);else process.stdout.write(text);
 if(args.includes('--json'))fs.writeFileSync(args[args.indexOf('--json')+1],JSON.stringify(results,null,1));
 if(args.includes('--stale-json'))fs.writeFileSync(args[args.indexOf('--stale-json')+1],JSON.stringify(stale.references,null,1));
 console.error(`${results.filter(r=>r.state==='broken').length} broken, ${results.filter(r=>r.state==='redirected').length} redirected of ${results.length}; ${stale.references.length} references due for review.`);
})();
