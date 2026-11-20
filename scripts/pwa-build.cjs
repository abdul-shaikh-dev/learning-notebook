const fs = require('node:fs'),
  path = require('node:path'),
  crypto = require('node:crypto');
const { readPaths } = require('./manifest.cjs');
function configFor(root, files) {
  const inventory = {};
  for (const file of [...new Set(files)].sort()) {
    const data = fs.readFileSync(path.join(root, file));
    inventory[file] = { hash: crypto.createHash('sha256').update(data).digest('hex'), bytes: data.length };
  }
  // The shell is precached on the first visit, so it holds only what every page needs (#151). The diagram renderer and
  // the search index are large and used only on some pages: they are kept on first use, or when a course is saved, in a
  // cache named after their own hashes, so a publication that leaves them alone does not download them again.
  const LAZY = ['assets/vendor/mermaid.tiny.js', 'content/search.js'];
  const shell = Object.keys(inventory).filter(
    f =>
      !LAZY.includes(f) &&
      (f.startsWith('assets/') ||
        ['index.html', 'offline.html', 'manifest.webmanifest', 'content/catalog.js'].includes(f)),
  );
  const lazyFiles = LAZY.filter(f => inventory[f]);
  const extras = {
    version: crypto
      .createHash('sha256')
      .update(JSON.stringify(lazyFiles.map(f => [f, inventory[f].hash])))
      .digest('hex')
      .slice(0, 16),
    files: lazyFiles,
    bytes: lazyFiles.reduce((n, f) => n + inventory[f].bytes, 0),
  };
  const courses = readPaths()
    .filter(p => p.status === 'ready')
    .map(p => {
      // The Python course runs its starters, and runExamples courses and lessons their examples, with the runtime published by
      // Python Problem Solving. Such a course is marked `runtime`: the worker keeps the runtime once, in its shared cache,
      // instead of copying about 13.5 MB into every course that needs it (#150).
      const runtime =
        p.id === 'python' ||
        p.id === 'python-problem-solving' ||
        !!p.runExamples ||
        (p.lessons || []).some(l => l.runExamples);
      const own = [
        ...new Set([
          'content/courses/' + p.id + '.js',
          ...p.publicFiles
            .filter(f => !f.startsWith('runtime/') || p.id !== 'python-problem-solving')
            .map(f => 'paths/' + p.id + '/' + f),
          ...(p.id === 'financial-foundations'
            ? ['course.html', 'handbook.html', 'practice/sample-positions.csv', 'practice/answers.md']
            : []),
        ]),
      ];
      for (const f of own) if (!inventory[f]) throw Error('Offline file is not published: ' + f);
      const version = crypto
        .createHash('sha256')
        .update(JSON.stringify(own.map(f => [f, inventory[f].hash])))
        .digest('hex')
        .slice(0, 16);
      return {
        id: p.id,
        title: p.title,
        version,
        files: own,
        bytes: own.reduce((n, f) => n + inventory[f].bytes, 0),
        ...(runtime ? { runtime: true } : {}),
      };
    });
  // The browser Python runtime is kept once fetched, under a name that changes only when its own files do.
  const runtimeFiles = Object.keys(inventory).filter(f => f.startsWith('paths/python-problem-solving/runtime/'));
  const runtime = {
    version: crypto
      .createHash('sha256')
      .update(JSON.stringify(runtimeFiles.map(f => [f, inventory[f].hash])))
      .digest('hex')
      .slice(0, 16),
    files: runtimeFiles,
    bytes: runtimeFiles.reduce((n, f) => n + inventory[f].bytes, 0),
  };
  const version = crypto
    .createHash('sha256')
    .update(JSON.stringify(inventory))
    .update(fs.readFileSync(path.join(root, 'scripts/sw-template.js')))
    .digest('hex')
    .slice(0, 16);
  return { version, files: inventory, shell, extras, courses, runtime };
}
function buildPwa(root, out, files) {
  const config = configFor(root, files);
  const source = fs
    .readFileSync(path.join(root, 'scripts/sw-template.js'), 'utf8')
    .replace('__PWA_CONFIG__', JSON.stringify(config));
  fs.writeFileSync(path.join(out, 'sw.js'), source);
  return config;
}
module.exports = { configFor, buildPwa };
