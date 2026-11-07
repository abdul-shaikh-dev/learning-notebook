const fs=require('node:fs'),path=require('node:path');const {root}=require('./manifest.cjs');
const base=path.join(root,'paths/financial-foundations');
// The practice population is read from these files when the course data is built (see practice.json).
// Older links point at practice/ in the site root; keep those copies identical.
for(const file of ['sample-positions.csv','answers.md'])fs.copyFileSync(path.join(base,'practice',file),path.join(root,'practice',file));
console.log('Legacy download aliases synchronized.');
