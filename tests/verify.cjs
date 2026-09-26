const path=require('node:path');process.chdir(path.resolve(__dirname,'..'));
require('./financial-foundations.cjs');
require('./catalog.cjs');
require('./study-pack.cjs');
const fs=require('node:fs'),assert=require('node:assert/strict');assert.equal(fs.readFileSync('content/paths.js','utf8'),require('../scripts/manifest.cjs').catalogSource(),'Run scripts/sync-catalog.cjs');

require('./authoring.cjs');

require('./visual-stories.cjs');

require('./journey.cjs');
require('./programming-paths.cjs');

require('./resource-navigation.cjs');

require('./notebook-search.cjs');
require('./notebook-backup.cjs');
