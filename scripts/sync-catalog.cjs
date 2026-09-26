const fs=require('node:fs'),path=require('node:path');
const {root,catalogSource}=require('./manifest.cjs');
const target=path.join(root,'content/paths.js');const source=catalogSource();
if(process.argv.includes('--check')){if(fs.readFileSync(target,'utf8')!==source)throw Error('Catalog is stale. Run node scripts/sync-catalog.cjs.');}else fs.writeFileSync(target,source);
console.log('Catalog matches path manifests.');
