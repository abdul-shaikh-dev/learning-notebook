const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {searchEntries,searchIndex,searchSource}=require('../scripts/search-index.cjs');
assert.equal(fs.readFileSync('content/search.js','utf8'),searchSource(),'Regenerate the search index');
const entries=searchEntries(),index=searchIndex(entries),store={};
const ctx={NOTEBOOK_SEARCH:index,LEARNING_PATHS:require('../scripts/manifest.cjs').readPaths(),escapeText:s=>String(s).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';'),
 localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);},removeItem:k=>{delete store[k];}}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('assets/js/notebook-search.js','utf8'),ctx);
const search=(q,p='',k='')=>ctx.notebookMatches(q,p,k);
assert.ok(search('dependency injection').some(x=>x.path==='dotnet'&&x.kind==='Lesson'));
assert.ok(search('test_projects.py','','File').some(x=>x.path==='python'&&x.href.endsWith('test_projects.py')));
assert.ok(search('P&L','financial-foundations').some(x=>x.kind==='Lesson'));
assert.ok(search('counterparty','financial-foundations','Lesson').length);
assert.ok(search('rollback','sql-server','Lesson').length);
assert.equal(search('unfindable_xyz_8849').length,0);assert.equal(search('   ').length,0);assert.equal(search('the of and').length,0,'Stop words alone find nothing');
for(const item of entries){assert.ok(item.title&&item.text&&item.course);if(item.kind!=="Lesson"||item.path!=="financial-foundations")assert.ok(item.summary,"Every entry has a summary: "+item.href);assert.ok(!item.href.includes('undefined'));assert.ok(!item.href.startsWith('javascript:'));if(!item.href.startsWith('#'))assert.ok(fs.existsSync(item.href.split('#')[0]));}
// Filtering never leaks another path or type.
assert.ok(search('test','','File').every(x=>x.kind==='File'));assert.ok(search('data','python').every(x=>x.path==='python'));
assert.equal(search('test_projects.py')[0].title,'test_projects.py');
// Recall: the compact index finds exactly what a scan of every entry's full text finds.
const fullText=q=>{const terms=q.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);return entries.filter(e=>terms.every(t=>(e.title+' '+e.course+' '+e.text).toLocaleLowerCase().includes(t))).map(e=>e.href+'|'+e.title).sort();};
const RECALL=['dependency injection','test_projects.py','P&L','counterparty','rollback','async','await','joins','idempotency','retry','kubernetes','pod','deployment','useEffect','React','git rebase','merge conflict','LINQ','Entity Framework','pandas','dataframe','regression','p-value','big-o','binary search','hash map','observer','strategy pattern','SQL injection','XSS','JWT','OAuth','kafka','queue','outbox','SLO','latency','tracing','systemd','chmod','process','accessibility','aria-label','contrast','unit test','unittest','mock','load balancer','cache','sharding','consistency','requirements','user story','agent','tool call','prompt','embeddings','package.json','README.md','Dockerfile','.csv','sql server','index','transaction','deadlock'];
const lost=[];
for(const q of RECALL){
 const before=fullText(q),after=search(q).map(e=>e.href+'|'+e.title).sort(),missing=before.filter(x=>!after.includes(x));
 if(!before.length)lost.push(q+': finds nothing at all');
 if(missing.length)lost.push(`${q}: misses ${missing.slice(0,3).join(', ')}`);
 // Extra results are only expected where the query itself is normalised, as ".csv" becomes "csv".
 const plainQuery=JSON.stringify(ctx.notebookTokens(q))===JSON.stringify(q.trim().toLocaleLowerCase().split(/\s+/));
 if(plainQuery&&after.length!==before.length)lost.push(`${q}: ${before.length} before, ${after.length} after`);
}
assert.deepEqual(lost,[],'Compact index changed what these queries find');
// Results: matched words are marked, text is escaped, results are grouped by course.
assert.equal(ctx.notebookHighlight('Use <b>Dependency</b> injection','dependency'),'Use &#60;b&#62;<mark>Dependency</mark>&#60;/b&#62; injection');
assert.equal(ctx.notebookHighlight('a+b (c)','a+b'),'<mark>a+b</mark> (c)');
const html=ctx.notebookResults(search('rollback'),'rollback');
assert.equal((html.match(/class="search-group"/g)||[]).length,new Set(search('rollback').map(x=>x.path)).size,'One group per course');
assert.ok(html.includes('<mark>'));
for(const item of index.entries)assert.ok(item[4].length<=161,'Excerpts stay short');
// The start screen: recent searches are remembered newest first, without duplicates, at most five.
assert.ok(ctx.notebookSearchStart().includes('Try a topic'));assert.ok(!ctx.notebookSearchStart().includes('Recent searches'));
for(const q of ['joins','async','Joins','retries','P&L','pods','kafka'])ctx.rememberSearch(q);
assert.equal(JSON.stringify(ctx.notebookRecent()),JSON.stringify(['kafka','pods','P&L','retries','Joins']));
store['learning-notebook:last-lesson:v1']=JSON.stringify({path:'sql-server'});
const start=ctx.notebookSearchStart();assert.ok(start.includes('Recent searches')&&start.includes('data-search-course="sql-server"'));
store['learning-notebook:recent-searches:v1']='not json';assert.equal(ctx.notebookRecent().length,0,'A damaged list is ignored');
// An old cached index (a plain list) finds nothing instead of failing.
vm.runInContext('NOTEBOOK_SEARCH=[{title:"x",text:"rollback"}]',ctx);assert.equal(search('rollback').length,0);
const raw=fs.statSync('content/search.js').size,gz=require('node:zlib').gzipSync(fs.readFileSync('content/search.js'),{level:9}).length;
assert.ok(gz<=350*1024,`The search index should stay at or under 350 KB compressed, now ${Math.round(gz/1024)} KB`);
console.log(`PASS: ${entries.length} searchable entries in a ${Math.round(raw/1024)} KB index (${Math.round(gz/1024)} KB compressed); ${RECALL.length} recall queries find the same lessons as a full-text scan; filters, ranking, highlighting, grouping and recent searches.`);
