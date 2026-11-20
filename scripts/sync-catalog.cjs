const fs = require('node:fs'),
  path = require('node:path');
// The full editorial catalog (catalogSource() in manifest.cjs) is not written to disk: no page loads it, and tests
// build it in memory (#161). This script writes the files the site does load.
const { root } = require('./manifest.cjs');

const searchTarget = path.join(root, 'content/search.js'),
  searchSource = require('./search-index.cjs').searchSource();
if (process.argv.includes('--check')) {
  if (fs.readFileSync(searchTarget, 'utf8') !== searchSource)
    throw Error('Search index is stale. Run node scripts/sync-catalog.cjs.');
} else fs.writeFileSync(searchTarget, searchSource);
console.log('Search index matches published learning content.');

for (const [file, source] of Object.entries(require('./lazy-catalog.cjs').lazyFiles())) {
  const target = path.join(root, file);
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== source)
      throw Error('Lazy catalog is stale: ' + file);
  } else {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, source);
  }
}
console.log('Lazy course chunks match manifests.');

const readmeTarget = path.join(root, 'README.md'),
  readmeCurrent = fs.readFileSync(readmeTarget, 'utf8').replace(/\r\n/g, '\n'),
  readmeSource = require('./readme-catalog.cjs').readmeSource(readmeCurrent);
if (process.argv.includes('--check')) {
  if (readmeCurrent !== readmeSource)
    throw Error('README course table or count is stale. Run node scripts/sync-catalog.cjs.');
} else if (readmeCurrent !== readmeSource) fs.writeFileSync(readmeTarget, readmeSource);
console.log('README course table matches path manifests.');
