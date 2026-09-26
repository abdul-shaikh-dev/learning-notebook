const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'notebook-authoring-'));
fs.mkdirSync(path.join(temp,'scripts'));fs.mkdirSync(path.join(temp,'paths'));fs.mkdirSync(path.join(temp,'content'));
for(const name of ['manifest.cjs','sync-catalog.cjs','new-path.cjs'])fs.copyFileSync(path.join(__dirname,'../scripts',name),path.join(temp,'scripts',name));
function run(...args){return cp.spawnSync(process.execPath,args,{encoding:'utf8',cwd:temp});}
let r=run('scripts/new-path.cjs','test-topic','Test topic');assert.equal(r.status,0,r.stderr);
let p=JSON.parse(fs.readFileSync(path.join(temp,'paths/test-topic/path.json'),'utf8'));assert.equal(p.status,'planned');
assert.ok(!fs.readFileSync(path.join(temp,'content/paths.js'),'utf8').includes('Replace this draft'));
p.status='ready';fs.writeFileSync(path.join(temp,'paths/test-topic/path.json'),JSON.stringify(p));r=run('scripts/sync-catalog.cjs');assert.equal(r.status,0,r.stderr);assert.ok(fs.readFileSync(path.join(temp,'content/paths.js'),'utf8').includes('first-steps'));
assert.notEqual(run('scripts/new-path.cjs','test-topic','Duplicate').status,0);
assert.notEqual(run('scripts/new-path.cjs','../outside','Invalid').status,0);
// Remove only the resolved temporary test directory created above.
const resolved=fs.realpathSync(temp),tmpRoot=fs.realpathSync(os.tmpdir());assert.equal(path.dirname(resolved),tmpRoot);assert.ok(path.basename(resolved).startsWith('notebook-authoring-'));fs.rmSync(resolved,{recursive:true,force:true});
console.log('PASS: path scaffold, draft exclusion, ready-path registration and unsafe/duplicate ID rejection.');
