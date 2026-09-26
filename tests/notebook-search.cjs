const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {searchEntries,searchSource}=require('../scripts/search-index.cjs');
assert.equal(fs.readFileSync('content/search.js','utf8'),searchSource(),'Regenerate the search index');
const entries=searchEntries(),ctx={NOTEBOOK_SEARCH:entries};vm.createContext(ctx);vm.runInContext(fs.readFileSync('assets/js/notebook-search.js','utf8'),ctx);
const search=(q,p='',k='')=>ctx.notebookMatches(q,p,k);
assert.ok(search('dependency injection').some(x=>x.path==='dotnet'&&x.kind==='Lesson'));
assert.ok(search('test_projects.py','','File').some(x=>x.path==='python'&&x.href.endsWith('test_projects.py')));
assert.ok(search('P&L','financial-foundations').some(x=>x.kind==='Lesson'));
assert.ok(search('counterparty','financial-foundations','Lesson').length);
assert.ok(search('rollback','sql-server','Lesson').length);
assert.equal(search('unfindable_xyz_8849').length,0);assert.equal(search('   ').length,0);
assert.ok(search('python').every(x=>typeof x.href==='string'));
for(const item of entries){assert.ok(item.title&&item.text&&item.course);assert.ok(!item.href.includes('undefined'));assert.ok(!item.href.startsWith('javascript:'));if(!item.href.startsWith('#'))assert.ok(fs.existsSync(item.href.split('#')[0]));}
// Titles and body both contribute; filtering never leaks another path or type.
assert.ok(search('test','','File').every(x=>x.kind==='File'));assert.ok(search('data','python').every(x=>x.path==='python'));
assert.equal(search('test_projects.py')[0].title,'test_projects.py');
const snippet=ctx.notebookSnippet({text:'prefix '.repeat(50)+'needle '+'suffix '.repeat(50)},'needle');assert.ok(snippet.includes('needle'));assert.ok(snippet.length<240);
console.log(`PASS: ${entries.length} searchable entries, cross-course concepts, filenames, ranking, filters and contextual snippets.`);
