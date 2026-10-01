// Explicit per-path publish lists keep drafts and authoring files out of the site.
const fs=require('node:fs'),path=require('node:path');
const {root,readPaths,catalogSource}=require('./manifest.cjs');
const out=path.join(root,'_site');
const files=['assets/js/notebook-practice.js','assets/js/browser-python-worker.js','assets/css/notebook-practice.css','assets/js/notebook-theme.js','assets/css/notebook-theme.css','assets/css/notebook-scenes-dark.css','assets/css/notebook-finance-dark.css','manifest.webmanifest','offline.html','assets/css/pwa.css','assets/js/notebook-pwa.js','assets/icons/notebook-192.png','assets/icons/notebook-512.png','assets/icons/notebook-maskable-512.png','assets/js/concrete-scenes.js','assets/js/scenes-dsa.js','assets/css/scenes-dsa.css','assets/js/scenes-apps.js','assets/css/scenes-apps.css','assets/js/scenes-infra.js','assets/css/scenes-infra.css','assets/js/scenes-patterns.js','assets/css/scenes-patterns.css','assets/vendor/mermaid.tiny.js','assets/vendor/mermaid-LICENSE.txt','assets/js/notebook-mermaid.js','assets/css/notebook-mermaid.css','assets/vendor/highlight.min.js','assets/vendor/highlight-LICENSE.txt','assets/js/code-panels.js','assets/css/code-panels.css','index.html','course.html','handbook.html','assets/js/notebook-loader.js','content/search.js','assets/js/notebook-search.js','assets/js/notebook-backup.js','assets/js/catalog.js','assets/js/learning-tools.js','assets/css/styles.css','assets/css/library.css','assets/css/atlas-ui.css','assets/css/finance-notebook.css','assets/css/concept-explorer.css','assets/js/library-map.js','practice/sample-positions.csv','practice/answers.md'];
for(const [file,source] of Object.entries(require('./lazy-catalog.cjs').lazyFiles())){if(!fs.existsSync(path.join(root,file))||fs.readFileSync(path.join(root,file),'utf8')!==source)throw Error('Stale course chunk: '+file);files.push(file);}
for(const p of readPaths())if(p.status==='ready')for(const file of p.publicFiles)files.push('paths/'+p.id+'/'+file);
if(fs.readFileSync(path.join(root,'content/paths.js'),'utf8')!==catalogSource())throw Error('Run node scripts/sync-catalog.cjs first.');
if(fs.readFileSync(path.join(root,'content/search.js'),'utf8')!==require('./search-index.cjs').searchSource())throw Error('Run node scripts/sync-catalog.cjs first.');
if(path.dirname(out)!==root||path.basename(out)!=='_site')throw Error('Invalid output path');
if(fs.existsSync(out)&&fs.lstatSync(out).isSymbolicLink())throw Error('Refusing linked output');
for(const file of files){const src=path.join(root,file);if(!fs.statSync(src).isFile()||!fs.realpathSync(src).startsWith(root+path.sep))throw Error('Unsafe or missing file: '+file);}
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
for(const file of files){const target=path.join(out,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,file),target);}
fs.writeFileSync(path.join(out,'.nojekyll'),'');
require('./pwa-build.cjs').buildPwa(root,out,files);
for(const html of files.filter(f=>f.endsWith('.html'))){for(const m of fs.readFileSync(path.join(out,html),'utf8').matchAll(/(?:href|src)="([^"#]+)"/g)){const ref=m[1].split(/[?#]/)[0];if(/^(https?:|data:|\$)/.test(ref)||ref.includes('${'))continue;if(ref.startsWith('/')||!fs.existsSync(path.resolve(out,path.dirname(html),ref)))throw Error('Missing/nonportable reference: '+html+' → '+ref);}}
console.log(`Built ${files.length+2} public files. Draft paths, tests, documentation and Git history excluded.`);
