#!/usr/bin/env node
// One command for every check (#157). The list lives in tests/checks.json; each CI job runs its group with
// `node scripts/check-all.cjs --group <job>`, so CI and a local run use the same commands.
//
//   node scripts/check-all.cjs                    every group (checks whose tools are missing are skipped locally)
//   node scripts/check-all.cjs --fast             skip the slow checks
//   node scripts/check-all.cjs --group build,python
//   node scripts/check-all.cjs --match network    only checks whose name or command contains "network"
//   node scripts/check-all.cjs --list             print the checks without running them
//
// --python <exe> and --science-python <exe> (or NOTEBOOK_PYTHON, NOTEBOOK_SCIENCE_PYTHON) choose interpreters;
// --sql "<args>" (or NOTEBOOK_SQL_ARGS) gives the SQL Server connection arguments, for example --sql "--server .\SQLEXPRESS".
// In CI (CI=true) a missing tool or setting fails its check instead of skipping it.
const fs = require('node:fs'),
  path = require('node:path'),
  { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(root, 'tests/checks.json'), 'utf8'));

// The listed checks plus one per tests/*_checkpoint_facts.py, in the group its prefix names.
function checks() {
  const facts = fs
    .readdirSync(path.join(root, 'tests'))
    .filter(f => f.endsWith('_checkpoint_facts.py'))
    .sort()
    .map(file => {
      const prefix = Object.keys(config.facts).find(p => file.startsWith(p));
      const group = prefix ? config.facts[prefix] : 'python';
      const run = (config.factsCommand[group] || config.factsCommand.python).replace('{file}', file);
      return {
        name: 'Checkpoint facts: ' + file.replace('_checkpoint_facts.py', ''),
        group,
        run,
        needs: config.factsNeeds[group],
        file,
      };
    });
  const all = [...config.checks, ...facts];
  for (const c of all) if (!config.groups.includes(c.group)) throw Error('Unknown group ' + c.group + ': ' + c.name);
  return config.groups.flatMap(g => all.filter(c => c.group === g));
}

function option(args, name, fallback) {
  const i = args.indexOf(name);
  return i < 0 ? fallback : args[i + 1];
}

function available(tool) {
  const probe =
    process.platform === 'win32' ? spawnSync('where', [tool]) : spawnSync('sh', ['-c', 'command -v ' + tool]);
  return probe.status === 0;
}

function main(args) {
  const groups = option(args, '--group', null)?.split(',');
  const match = option(args, '--match', null)?.toLowerCase();
  const values = {
    python: option(args, '--python', process.env.NOTEBOOK_PYTHON || 'python'),
    'science-python': option(
      args,
      '--science-python',
      process.env.NOTEBOOK_SCIENCE_PYTHON || process.env.NOTEBOOK_PYTHON || 'python',
    ),
    sql: option(args, '--sql', process.env.NOTEBOOK_SQL_ARGS || ''),
  };
  if (groups)
    for (const g of groups)
      if (!config.groups.includes(g)) throw Error('Unknown group ' + g + '; groups: ' + config.groups.join(', '));
  const selected = checks().filter(
    c =>
      (!groups || groups.includes(c.group)) &&
      (!args.includes('--fast') || !c.slow) &&
      (!match || (c.name + ' ' + c.run).toLowerCase().includes(match)),
  );
  const command = c => c.run.replace(/\{(python|science-python|sql)\}/g, (m, k) => values[k]);
  if (args.includes('--list')) {
    for (const c of selected) console.log(c.group.padEnd(13) + (c.slow ? 'slow ' : '     ') + command(c));
    return 0;
  }
  const ci = process.env.CI === 'true';
  let failed = 0,
    skipped = 0;
  for (const c of selected) {
    const missing = (c.needs || []).filter(t => (t === 'sql' ? !values.sql : !available(t)));
    if (missing.length) {
      if (ci) {
        failed++;
        console.log('FAIL ' + c.name + ' — needs ' + missing.join(', '));
      } else {
        skipped++;
        console.log('skip ' + c.name + ' — needs ' + missing.map(t => (t === 'sql' ? '--sql' : t)).join(', '));
      }
      continue;
    }
    // In CI the output streams into the job log; locally only a failure's tail is shown.
    if (ci) console.log('::group::' + c.name);
    const start = Date.now(),
      run = spawnSync(command(c), {
        cwd: root,
        shell: true,
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
        stdio: ci ? 'inherit' : 'pipe',
      });
    if (ci) console.log('::endgroup::');
    const seconds = ((Date.now() - start) / 1000).toFixed(0) + 's';
    if (run.status === 0) console.log('ok   ' + c.name + ' (' + seconds + ')');
    else {
      failed++;
      console.log('FAIL ' + c.name + ' (' + seconds + ')\n     ' + command(c));
      const tail = ((run.stdout || '') + (run.stderr || '') + (run.error ? String(run.error) : ''))
        .trim()
        .split('\n')
        .slice(-20);
      for (const line of tail) console.log('     | ' + line);
    }
  }
  console.log(
    `${selected.length - failed - skipped} passed, ${failed} failed, ${skipped} skipped of ${selected.length}`,
  );
  return failed ? 1 : 0;
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));
module.exports = { checks, config };
