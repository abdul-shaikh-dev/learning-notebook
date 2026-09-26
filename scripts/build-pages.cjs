// Build a clean, portable public-site artifact. Never copy the whole repository.
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'_site');
const files=['index.html','handbook.html','assets/js/app.js','assets/js/core.js','assets/js/starter.js','assets/css/styles.css','content/curriculum.js','content/starter.js','practice/sample-positions.csv','practice/answers.md'];
// Only this fixed build output is ever cleared. It is inside the repository.
if(path.dirname(out)!==root||path.basename(out)!=='_site')throw Error('Invalid output path');
if(fs.existsSync(out)&&fs.lstatSync(out).isSymbolicLink())throw Error('Refusing a linked output directory');
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(out,{recursive:true});
for(const file of files){const source=path.join(root,file);if(!fs.statSync(source).isFile())throw Error('Missing site file: '+file);const target=path.join(out,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(source,target);}
fs.writeFileSync(path.join(out,'.nojekyll'),'');
for(const html of ['index.html','handbook.html']){const text=fs.readFileSync(path.join(out,html),'utf8');for(const m of text.matchAll(/(?:href|src)="([^"#]+)"/g)){const ref=m[1];if(/^(https?:|data:|\$)/.test(ref)||ref.includes('${'))continue;if(ref.startsWith('/')||!fs.existsSync(path.join(out,ref)))throw Error('Nonportable or missing reference: '+ref);}}
console.log(`Built ${files.length+1} public files in _site. Git history, docs, tests and progress exports excluded.`);
