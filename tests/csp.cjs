// Content Security Policy (#158): every published page carries the site's policy, scripts come only from the site
// (inline scripts only by hash), and the checker catches a missing tag, a stale hash and an inline handler.
const fs=require('node:fs'),assert=require('node:assert/strict');
const {policy,withPolicy,problem}=require('../scripts/csp.cjs'),{readPaths}=require('../scripts/manifest.cjs');
const pages=['index.html','course.html','handbook.html','offline.html','practice/personal-effectiveness-studio/lab.html'];
for(const p of readPaths())if(p.status==='ready')for(const f of p.publicFiles)if(f.endsWith('.html'))pages.push('paths/'+p.id+'/'+f);
for(const page of pages)assert.equal(problem(fs.readFileSync(page,'utf8')),null,page);
const scriptSrc=html=>policy(html).split('; ').find(d=>d.startsWith('script-src'));
assert.equal(scriptSrc('<p>'),"script-src 'self' 'wasm-unsafe-eval'");
assert.ok(!policy('<p>').includes("'unsafe-eval'")&&!scriptSrc('<p>').includes("'unsafe-inline'"));
const page='<!doctype html><head><meta charset="utf-8"><script>a()</script></head><body></body>',ok=withPolicy(page);
assert.match(problem(page),/no Content-Security-Policy/);assert.equal(problem(ok),null);assert.match(scriptSrc(ok),/'sha256-[\w+/=]{44}'$/);
assert.match(problem(ok.replace('a()','b()')),/stale/);
assert.match(problem(ok.replace('<body>','<body onload="a()">')),/inline event handler/);
console.log('CSP: '+pages.length+' published pages carry the policy; inline scripts only by hash.');
