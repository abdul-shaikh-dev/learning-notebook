#!/usr/bin/env node
// Depth report (#152): words of explanation per lesson and lessons without a worked example, across ready courses.
// A lesson has a worked example when one of its sections carries an `example` (code, text or prose) or it has a trace.
// Usage: node scripts/depth-report.cjs [--shortest N] [--floor WORDS] [--missing] [--json]
const fs = require('node:fs'),
  path = require('node:path');
const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2),
  option = (name, fallback) => {
    const i = args.indexOf(name);
    return i < 0 ? fallback : Number(args[i + 1]);
  };
const words = text => String(text).split(/\s+/).filter(Boolean).length;

function lessons() {
  const rows = [];
  for (const dir of fs.readdirSync(path.join(root, 'paths')).sort()) {
    const file = path.join(root, 'paths', dir, 'path.json');
    if (!fs.existsSync(file)) continue;
    const course = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (course.status !== 'ready' || !Array.isArray(course.lessons)) continue;
    for (const lesson of course.lessons) {
      if (!Array.isArray(lesson.sections)) continue;
      rows.push({
        course: course.id,
        lesson: lesson.id,
        title: lesson.title,
        words: lesson.sections.reduce((n, s) => n + (s.paragraphs || []).reduce((m, p) => m + words(p), 0), 0),
        worked: lesson.sections.some(s => s.example) || !!lesson.trace,
      });
    }
  }
  return rows;
}

function summary(rows) {
  const sorted = rows.map(r => r.words).sort((a, b) => a - b),
    at = q => sorted[Math.floor(q * (sorted.length - 1))] ?? 0;
  return {
    courses: new Set(rows.map(r => r.course)).size,
    lessons: rows.length,
    median: at(0.5),
    p10: at(0.1),
    p90: at(0.9),
    withoutWorkedExample: rows.filter(r => !r.worked).length,
  };
}

if (require.main === module) {
  const rows = lessons(),
    s = summary(rows),
    floor = option('--floor', 150),
    shortest = option('--shortest', 15);
  const byWords = [...rows].sort(
    (a, b) => a.words - b.words || (a.course + a.lesson).localeCompare(b.course + b.lesson),
  );
  if (args.includes('--json')) {
    console.log(JSON.stringify({ summary: s, lessons: byWords }, null, 2));
    return;
  }
  console.log(
    `${s.lessons} lessons in ${s.courses} courses · words of explanation: median ${s.median}, 10th percentile ${s.p10}, 90th percentile ${s.p90}`,
  );
  console.log(
    `${s.withoutWorkedExample} lessons without a worked example · ${rows.filter(r => r.words < floor).length} below ${floor} words`,
  );
  console.log(`\nShortest ${shortest}:`);
  for (const r of byWords.slice(0, shortest))
    console.log(`  ${String(r.words).padStart(4)}  ${r.worked ? ' ' : '*'} ${r.course}/${r.lesson}`);
  console.log('  (* no worked example)');
  if (args.includes('--missing')) {
    console.log('\nWithout a worked example:');
    for (const r of byWords.filter(r => !r.worked))
      console.log(`  ${String(r.words).padStart(4)}  ${r.course}/${r.lesson}`);
  }
}

module.exports = { lessons, summary };
