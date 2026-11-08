// Generates the README's course count and "Choose a learning path" table from paths/*/path.json.
// Run through scripts/sync-catalog.cjs; its --check mode fails when the README is stale.
const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '..');
const SITE = 'https://abdul-shaikh-dev.github.io/learning-notebook/index.html#path/';
// Display order of the catalog categories.
const CATEGORIES = ['Programming', 'Software engineering', 'Infrastructure & operations', 'Data & AI',
  'Design & accessibility', 'Personal effectiveness', 'Finance'];
// Extra links shown after a course in the README table.
const EXTRA_LINKS = {'financial-foundations': ['[practice studio](https://abdul-shaikh-dev.github.io/learning-notebook/course.html#explore)']};

function readyCourses() {
  return fs.readdirSync(path.join(root, 'paths'), {withFileTypes: true})
    .filter(d => d.isDirectory() && fs.existsSync(path.join(root, 'paths', d.name, 'path.json')))
    .map(d => JSON.parse(fs.readFileSync(path.join(root, 'paths', d.name, 'path.json'), 'utf8')))
    .filter(p => p.status === 'ready');
}

function readmeSource(current) {
  const courses = readyCourses();
  // Categories not in the display order are listed after it, alphabetically.
  const others = [...new Set(courses.map(p => p.category).filter(c => !CATEGORIES.includes(c)))].sort();
  const lessons = courses.reduce((sum, p) => sum + p.lessons.length, 0);
  const rows = [...CATEGORIES, ...others].map(category => {
    const links = courses.filter(p => p.category === category)
      .sort((a, b) => a.title.localeCompare(b.title, 'en'))
      .flatMap(p => [`[${p.title}](${SITE}${p.id})`, ...(EXTRA_LINKS[p.id] || [])]);
    return links.length ? `| ${category} | ${links.join(' · ')} |` : null;
  }).filter(Boolean);
  const table = ['| Area | Courses |', '| --- | --- |', ...rows].join('\n');
  const count = /\*\*\d+ learning paths and \d+ lessons and challenges\*\*/;
  const block = /\| Area \| Courses \|\n\| --- \| --- \|\n(?:\|.*\|\n?)*/;
  if (!count.test(current) || !block.test(current)) throw Error('README is missing the course count or course table');
  return current
    .replace(count, `**${courses.length} learning paths and ${lessons} lessons and challenges**`)
    .replace(block, m => table + (m.endsWith('\n') ? '\n' : ''));
}

module.exports = {CATEGORIES, readmeSource};
