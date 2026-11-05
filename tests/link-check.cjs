// External link check without the network: collection, results, retries, redirects, the allow list, per-host spacing, review age and the report.
const path=require('node:path'),assert=require('node:assert/strict');
process.chdir(process.env.LEARNING_REPO||path.resolve(__dirname,'..'));
const {collectLinks,checkLinks,reviewCutoff,staleReferences,report}=require('../scripts/check-links.cjs');
// Every course source and lesson reference is collected once, with where it is cited.
const real=collectLinks(require('../scripts/manifest.cjs').readPaths());
assert.ok(real.size>400,'Course sources and lesson references are collected: '+real.size);
assert.ok([...real.keys()].every(u=>/^https?:\/\//.test(u)));
const allow=require('../scripts/link-allowlist.json');
for(const [host,reason] of Object.entries(allow.hosts))assert.ok(/^[a-z0-9.-]+$/.test(host)&&reason.length>10,'Allow-list entries name a host and a reason: '+host);
const fixture=collectLinks([{title:'Course',sources:[{url:'https://ok.test/a'},{url:'mailto:x@y.test'}],lessons:[{title:'1. Lesson',references:[{url:'https://ok.test/a'},{url:'https://dead.test/gone'}]}]}]);
assert.deepEqual([...fixture.keys()],['https://ok.test/a','https://dead.test/gone'],'Non-web links are ignored and repeats merged');
assert.equal(fixture.get('https://ok.test/a').length,2);
// A fake web: each URL answers with a script of responses, one per request.
const web={
 'https://ok.test/a':[200],
 'https://ok.test/b':[200],
 'https://dead.test/gone':[404,404],
 'https://flaky.test/x':[503,200],
 'https://slow.test/x':[[429,{'retry-after':'7'}],200],
 'https://down.test/x':Array(6).fill('error'),
 'https://moved.test/old':[[301,{location:'/new'}]],
 'https://moved.test/new':[200],
 'https://slash.test/page':[[308,{location:'https://slash.test/page/'}]],
 'https://slash.test/page/':[200],
 'https://doi.org/10.1/x':[[302,{location:'https://publisher.test/article'}]],
 'https://publisher.test/article':[200],
 'https://doi.org/10.1/y':[[302,{location:'https://blocked.test/article'}]],
 'https://nohead.test/x':[405,200],
 'https://lang.test/page?id=1':[[302,{location:'/page?id=1&hl=vi'}]],
 'https://lang.test/page?id=1&hl=vi':[200],
 'https://lang.test/swap?id=1':[[302,{location:'/swap?id=2&hl=vi'}]],
 'https://lang.test/swap?id=2&hl=vi':[200],
 'https://skip.test/x':[]
};
const calls=[],waits=[];
const fetch=async(url,{method,redirect})=>{
 assert.equal(redirect,'manual');calls.push(method+' '+url);
 const step=web[url]?.shift();if(step===undefined)throw Error('Unexpected request '+url);
 if(step==='error')throw Object.assign(Error('fetch failed'),{cause:{code:'ECONNREFUSED'}});
 const [status,headers={}]=Array.isArray(step)?step:[step];
 return {status,headers:{get:k=>headers[k]??null}};
};
(async()=>{
 const urls=Object.keys(web).filter(u=>!['https://moved.test/new','https://slash.test/page/','https://publisher.test/article','https://lang.test/page?id=1&hl=vi','https://lang.test/swap?id=2&hl=vi'].includes(u));
 const results=await checkLinks(urls,{fetch,wait:async ms=>{waits.push(ms);},allow:{hosts:{'skip.test':'Blocks robots.','blocked.test':'Answers 403.'},urls:{}},retries:2,backoff:100,perHost:1000});
 const by=Object.fromEntries(results.map(r=>[r.url,r]));
 assert.equal(by['https://ok.test/a'].state,'ok');
 assert.equal(by['https://dead.test/gone'].state,'broken','A deliberately broken link is reported');assert.equal(by['https://dead.test/gone'].status,404);
 assert.equal(by['https://flaky.test/x'].state,'ok','A transient 503 is retried');
 assert.equal(by['https://slow.test/x'].state,'ok');assert.ok(waits.includes(7000),'Retry-After is honoured');
 assert.equal(by['https://down.test/x'].state,'broken');assert.equal(by['https://down.test/x'].error,'ECONNREFUSED');assert.ok(waits.includes(100)&&waits.includes(200),'Retries back off');
 assert.deepEqual([by['https://moved.test/old'].state,by['https://moved.test/old'].final],['redirected','https://moved.test/new'],'A moved page reports its new address');
 assert.equal(by['https://slash.test/page'].state,'ok','An added trailing slash is the same page');
 assert.equal(by['https://doi.org/10.1/x'].state,'ok','A resolving DOI is fine');
 assert.equal(by['https://lang.test/page?id=1'].state,'ok','Added query settings, such as a language or version, leave the same page');
 assert.deepEqual([by['https://lang.test/swap?id=1'].state,by['https://lang.test/swap?id=1'].final],['redirected','https://lang.test/swap?id=2&hl=vi'],'A changed query value is a different page');
 assert.deepEqual([by['https://doi.org/10.1/y'].state,by['https://doi.org/10.1/y'].reason],['skipped','Answers 403.'],'A redirect onto an allow-listed host is skipped after the first hop');
 assert.equal(by['https://nohead.test/x'].state,'ok');assert.ok(calls.includes('HEAD https://nohead.test/x')&&calls.includes('GET https://nohead.test/x'),'A refused HEAD falls back to GET');
 assert.equal(by['https://skip.test/x'].state,'skipped');assert.ok(!calls.some(c=>c.includes('skip.test')),'Allow-listed hosts are not requested');
 assert.ok(waits.filter(ms=>ms===1000).length>=2,'Requests to one host are spaced');
 // The report leads with the broken link, shows where it is cited and never lists OK links.
 const links=new Map(urls.map(u=>[u,[{course:'Course',place:u.includes('dead')?'3. Lesson | pipes':'Course sources'}]]));
 const text=report(results,links,{date:'2026-11-01'});
 assert.match(text,/Checked 2026-11-01: 14 links\. \*\*2 broken\*\*, 2 redirected, 8 OK, 2 skipped/);
 assert.ok(text.indexOf('## Broken')<text.indexOf('## Redirected'));
 assert.ok(text.includes('| https://dead.test/gone | HTTP 404 | Course · 3. Lesson \\| pipes |'),'Table cells are escaped');
 assert.ok(text.includes('| https://down.test/x | ECONNREFUSED |'));
 assert.ok(text.includes('| https://moved.test/old | https://moved.test/new |'));
 assert.ok(!text.includes('https://ok.test/a'));
 assert.ok(report([{url:'https://ok.test/a',state:'ok'}],links).includes('Every checked link answered directly.'));
 // Review age: calendar months back from a fixed day, keeping the day or using the month's last day.
 assert.equal(allow.reviewedMaxAgeMonths,12,'The review age is set beside the allow list');
 assert.equal(reviewCutoff('2027-10-01',12),'2026-10-01');
 assert.equal(reviewCutoff('2028-02-29',12),'2027-02-28','A shorter month uses its last day');
 assert.equal(reviewCutoff('2027-03-31',1),'2027-02-28');
 assert.equal(reviewCutoff('2027-01-15',1),'2026-12-15','Crosses a year');
 const course=(title,lessons)=>({title,lessons:lessons.map(([lesson,refs])=>({title:lesson,references:refs.map(([url,reviewed])=>({title:'Ref '+url.slice(-1),url,reviewed}))}))});
 const dated=[course('Beta',[['1. One',[['https://b.test/a','2026-09-30'],['https://b.test/b','2026-10-01']]],['2. Two',[['https://b.test/a','2026-09-30']]]]),
  course('Alpha',[['1. First',[['https://a.test/x','2026-10-02'],['https://a.test/y','2026-02-30'],['https://a.test/z',undefined]]]])];
 const due=staleReferences(dated,{today:'2027-10-01',months:12});
 assert.equal(due.cutoff,'2026-10-01');
 assert.deepEqual(due.references.map(r=>[r.course,r.url,r.reviewed,r.lessons.join(' + ')]),[
  ['Alpha','https://a.test/y',null,'1. First'],['Alpha','https://a.test/z',null,'1. First'],
  ['Beta','https://b.test/a','2026-09-30','1. One + 2. Two']],
  'Older than the cutoff, or with a missing or impossible date; the cutoff day itself is not due; one row per reference, listing every lesson that cites it');
 const section=report([{url:'https://ok.test/a',state:'ok'}],links,{date:'2027-10-01',stale:due});
 assert.ok(section.includes('## References due for review')&&section.includes('more than 12 months ago, before 2026-10-01'));
 assert.ok(section.indexOf('### Alpha')<section.indexOf('### Beta'),'Grouped by course');
 assert.ok(section.includes('| [Ref a](https://b.test/a) | 2026-09-30 | 1. One<br>2. Two |'));
 assert.ok(section.includes('| [Ref y](https://a.test/y) | Missing or invalid date | 1. First |'));
 const none=report([],links,{stale:staleReferences(dated.slice(0,1),{today:'2026-11-05',months:12})});
 assert.ok(none.includes('None: every lesson reference was reviewed on or after 2025-11-05.')&&!none.includes('###'),'Says when nothing is due');
 assert.ok(!report([],links).includes('References due for review'),'The section appears only when review ages are passed');
 console.log('PASS: external link check: '+real.size+' links collected; broken, redirected, retried, rate-limited, HEAD fallback, DOI, trailing slash, added query settings and allow-listed links; per-host spacing, review age and the Markdown report.');
})().catch(e=>{console.error(e);process.exitCode=1;});
