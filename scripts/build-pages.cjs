// Explicit per-path publish lists keep drafts and authoring files out of the site.
const fs=require('node:fs'),path=require('node:path');
const {root,readPaths,catalogSource}=require('./manifest.cjs');
const out=path.join(root,'_site');
const files=['index.html','course.html','handbook.html','content/paths.js','assets/js/catalog.js','assets/css/styles.css','practice/sample-positions.csv','practice/answers.md'];
for(const p of readPaths())if(p.status==='ready')for(const file of p.publicFiles)files.push('paths/'+p.id+'/'+file);
if(fs.readFileSync(path.join(root,'content/paths.js'),'utf8')!==catalogSource())throw Error('Run node scripts/sync-catalog.cjs first.');
if(path.dirname(out)!==root||path.basename(out)!=='_site')throw Error('Invalid output path');
if(fs.existsSync(out)&&fs.lstatSync(out).isSymbolicLink())throw Error('Refusing linked output');
for(const file of files){const src=path.join(root,file);if(!fs.statSync(src).isFile()||!fs.realpathSync(src).startsWith(root+path.sep))throw Error('Unsafe or missing file: '+file);}
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
for(const file of files){const target=path.join(out,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,file),target);}
fs.writeFileSync(path.join(out,'.nojekyll'),'');
for(const html of files.filter(f=>f.endsWith('.html'))){for(const m of fs.readFileSync(path.join(out,html),'utf8').matchAll(/(?:href|src)="([^"#]+)"/g)){const ref=m[1].split(/[?#]/)[0];if(/^(https?:|data:|\$)/.test(ref)||ref.includes('${'))continue;if(ref.startsWith('/')||!fs.existsSync(path.resolve(out,path.dirname(html),ref)))throw Error('Missing/nonportable reference: '+html+' → '+ref);}}
console.log(`Built ${files.length+1} public files. Draft paths, tests, documentation and Git history excluded.`);
