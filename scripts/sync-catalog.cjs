const fs=require('node:fs'),path=require('node:path');
const {root,catalogSource}=require('./manifest.cjs');
const target=path.join(root,'content/paths.js');const source=catalogSource();
if(process.argv.includes('--check')){if(fs.readFileSync(target,'utf8')!==source)throw Error('Catalog is stale. Run node scripts/sync-catalog.cjs.');}else fs.writeFileSync(target,source);
console.log('Catalog matches path manifests.');

const searchTarget=path.join(root,'content/search.js'),searchSource=require('./search-index.cjs').searchSource();
if(process.argv.includes('--check')){if(fs.readFileSync(searchTarget,'utf8')!==searchSource)throw Error('Search index is stale. Run node scripts/sync-catalog.cjs.');}else fs.writeFileSync(searchTarget,searchSource);
console.log('Search index matches published learning content.');

for(const [file,source] of Object.entries(require('./lazy-catalog.cjs').lazyFiles())){const target=path.join(root,file);if(process.argv.includes('--check')){if(!fs.existsSync(target)||fs.readFileSync(target,'utf8')!==source)throw Error('Lazy catalog is stale: '+file);}else{fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,source);}}
console.log('Lazy course chunks match manifests.');
