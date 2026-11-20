// Docs stay true (#154): the README's generated counts are current, every checkpoint facts script runs in CI, the
// lesson checklist names files that exist, and known stale statements do not return.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const read=f=>fs.readFileSync(f,'utf8').replace(/\r\n/g,'\n');
const readme=read('README.md');
assert.equal(readme,require('../scripts/readme-catalog.cjs').readmeSource(readme),'README course count, table or challenge count is stale. Run node scripts/sync-catalog.cjs.');
const workflow=read('.github/workflows/pages.yml');
const facts=fs.readdirSync('tests').filter(f=>f.endsWith('_checkpoint_facts.py'));
for(const f of facts)assert.ok(workflow.includes('tests/'+f),'tests/'+f+' has a CI step in pages.yml');
const guide=read('docs/adding-learning-paths.md'),checklist=guide.slice(guide.indexOf('## Checklist for a new lesson'),guide.indexOf('\n## ',guide.indexOf('## Checklist for a new lesson')+3));
assert.ok(checklist.length>200,'The guide has a lesson checklist');
const named=[...checklist.matchAll(/`((?:tests|scripts)\/[\w.-]+\.(?:cjs|py))`/g)].map(m=>m[1]).filter(f=>!f.includes('<'));
assert.ok(named.length>=15);for(const f of named)assert.ok(fs.existsSync(f),'Checklist names an existing file: '+f);
for(const [,link] of checklist.matchAll(/\]\(([\w-]+\.md)(?:#[\w-]+)?\)/g))assert.ok(fs.existsSync(path.join('docs',link)),'Checklist links an existing doc: '+link);
const docs=['README.md',...fs.readdirSync('docs').filter(f=>f.endsWith('.md')&&!/\d{4}-\d{2}-\d{2}/.test(f)).map(f=>'docs/'+f)];
for(const f of docs){const text=read(f);for(const stale of ['separate authorized workflow dispatch','/ipv/'])assert.ok(!text.includes(stale),f+' repeats a stale statement: '+stale);}
console.log('Docs facts: README counts current, '+facts.length+' facts scripts in CI, '+named.length+' checklist files exist, no stale workflow or preview statements.');
