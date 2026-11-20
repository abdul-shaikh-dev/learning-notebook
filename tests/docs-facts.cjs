// Docs stay true (#154): the README's generated counts are current, every checkpoint facts script runs in CI, the
// lesson checklist names files that exist, and known stale statements do not return.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const read=f=>fs.readFileSync(f,'utf8').replace(/\r\n/g,'\n');
const readme=read('README.md');
assert.equal(readme,require('../scripts/readme-catalog.cjs').readmeSource(readme),'README course count, table or challenge count is stale. Run node scripts/sync-catalog.cjs.');
const workflow=read('.github/workflows/pages.yml');
// #157: CI runs every group of tests/checks.json through scripts/check-all.cjs, which picks up every facts script.
const {checks,config}=require('../scripts/check-all.cjs'),listed=checks();
const facts=fs.readdirSync('tests').filter(f=>f.endsWith('_checkpoint_facts.py'));
for(const f of facts)assert.ok(listed.some(c=>c.run.includes('tests/'+f)),'tests/'+f+' is in the check list');
for(const g of config.groups)assert.ok(workflow.includes('node scripts/check-all.cjs --group '+g+'\n'),'pages.yml runs the '+g+' group');
assert.ok(!/run: python tests\/\w+_checkpoint_facts\.py/.test(workflow),'pages.yml runs facts scripts through check-all, not one by one');
const guide=read('docs/adding-learning-paths.md'),checklist=guide.slice(guide.indexOf('## Checklist for a new lesson'),guide.indexOf('\n## ',guide.indexOf('## Checklist for a new lesson')+3));
assert.ok(checklist.length>200,'The guide has a lesson checklist');
const named=[...checklist.matchAll(/`((?:tests|scripts)\/[\w.-]+\.(?:cjs|py))`/g)].map(m=>m[1]).filter(f=>!f.includes('<'));
assert.ok(named.length>=15);for(const f of named)assert.ok(fs.existsSync(f),'Checklist names an existing file: '+f);
for(const [,link] of checklist.matchAll(/\]\(([\w-]+\.md)(?:#[\w-]+)?\)/g))assert.ok(fs.existsSync(path.join('docs',link)),'Checklist links an existing doc: '+link);
const docs=['README.md',...fs.readdirSync('docs').filter(f=>f.endsWith('.md')&&!/\d{4}-\d{2}-\d{2}/.test(f)).map(f=>'docs/'+f)];
for(const f of docs){const text=read(f);for(const stale of ['separate authorized workflow dispatch','/ipv/'])assert.ok(!text.includes(stale),f+' repeats a stale statement: '+stale);}
// #161: dated reviews live in docs/archive/, docs/README.md lists every current guide, and no Markdown link is broken.
const current=fs.readdirSync('docs').filter(f=>f.endsWith('.md')&&f!=='README.md');
for(const f of current)assert.ok(!/\d{4}-\d{2}-\d{2}/.test(f),'Dated review belongs in docs/archive/: '+f);
const index=read('docs/README.md');for(const f of current)assert.ok(index.includes('('+f+')'),'docs/README.md lists '+f);
const tracked=require('node:child_process').execSync('git ls-files "*.md"',{encoding:'utf8'}).trim().split('\n').filter(f=>f&&!f.includes('node_modules/')&&fs.existsSync(f));
let checkedLinks=0;for(const f of tracked)for(const m of read(f).matchAll(/\]\(([^)#\s]+)(?:#[^)]*)?\)/g)){if(/^(https?|mailto):/.test(m[1]))continue;checkedLinks++;assert.ok(fs.existsSync(path.join(path.dirname(f),decodeURIComponent(m[1]))),f+' links a missing file: '+m[1]);}
console.log('Docs facts: README counts current, '+facts.length+' facts scripts in CI, '+named.length+' checklist files exist, no stale workflow or preview statements; '+current.length+' current guides indexed, '+checkedLinks+' Markdown links resolve.');
