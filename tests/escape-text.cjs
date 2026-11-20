// One HTML escape (#156): assets/js/escape-text.js defines it, every page loads it before other scripts, and no page
// script keeps its own copy.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ctx=vm.createContext({});if(!vm.runInContext('typeof escapeText',ctx).startsWith('f'))vm.runInContext(fs.readFileSync('assets/js/escape-text.js','utf8'),ctx);
const esc=vm.runInContext('escapeText',ctx);
assert.equal(esc(`<a href="x">Tom & Jerry's</a>`),'&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;');
assert.equal(esc(null),'');assert.equal(esc(undefined),'');assert.equal(esc(0),'0');
const scripts=dir=>fs.readdirSync(dir).filter(f=>f.endsWith('.js')).map(f=>path.posix.join(dir,f));
const pageScripts=[...scripts('assets/js'),...fs.readdirSync('paths').filter(d=>fs.existsSync('paths/'+d+'/runtime')).flatMap(d=>scripts('paths/'+d+'/runtime'))];
for(const f of pageScripts)if(f!=='assets/js/escape-text.js')assert.ok(!/replace\(\/\[&<>"'\]\/g/.test(fs.readFileSync(f,'utf8')),f+' keeps its own HTML escape; use escapeText');
for(const page of ['index.html','course.html','handbook.html']){const html=fs.readFileSync(page,'utf8');const first=html.match(/<script src="([^"?]+)/)[1];assert.equal(first,'assets/js/escape-text.js',page+' loads the escape helper first');}
console.log('Escape helper: one definition, loaded first on every page, '+pageScripts.length+' page scripts without their own copy.');
