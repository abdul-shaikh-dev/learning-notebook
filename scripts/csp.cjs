#!/usr/bin/env node
// Content Security Policy for every published page (#158). Pages carry it as a <meta http-equiv> tag because GitHub
// Pages cannot send headers. Scripts load only from the site itself; the one inline script (the theme script the
// practice studio pages embed) is allowed by its hash. Pyodide needs 'wasm-unsafe-eval'. Styles allow inline style
// attributes, which lessons, scenes and Mermaid diagrams set.
//
//   node scripts/csp.cjs --write <page.html>...   add or refresh the tag in source pages
//   node scripts/csp.cjs --check <page.html>...   fail when a page's tag is missing or stale
const fs = require('node:fs'),
  crypto = require('node:crypto');

const BASE = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
];

const inlineScripts = html =>
  [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(m => !/\bsrc=/.test(m[1])).map(m => m[2]);
const hash = source => "'sha256-" + crypto.createHash('sha256').update(source, 'utf8').digest('base64') + "'";

function policy(html) {
  const hashes = inlineScripts(html).map(hash);
  return BASE.map(d => (d.startsWith('script-src') && hashes.length ? d + ' ' + hashes.join(' ') : d)).join('; ');
}
const tag = html => '<meta http-equiv="Content-Security-Policy" content="' + policy(html) + '">';
const TAG = /<meta http-equiv="Content-Security-Policy" content="[^"]*">/;

// The expected tag, placed right after <meta charset>, so it applies before any script or stylesheet loads.
function withPolicy(html) {
  const bare = html.replace(TAG, '');
  const charset = bare.match(/<meta charset="[^"]*">/i);
  if (!charset) throw Error('A page needs <meta charset> before its policy');
  const at = charset.index + charset[0].length;
  return bare.slice(0, at) + tag(bare) + bare.slice(at);
}

function problem(html) {
  const found = html.match(TAG);
  if (!found) return 'has no Content-Security-Policy meta tag';
  if (withPolicy(html) !== html)
    return 'has a stale or misplaced Content-Security-Policy; run node scripts/csp.cjs --write';
  if (/\son[a-z]+=/i.test(html.replace(/<script\b[\s\S]*?<\/script>/gi, '')))
    return 'has an inline event handler, which the policy blocks';
  return null;
}

if (require.main === module) {
  const [mode, ...pages] = process.argv.slice(2);
  if (!['--write', '--check'].includes(mode) || !pages.length) throw Error('Usage: csp.cjs --write|--check <page>...');
  let failed = 0;
  for (const page of pages) {
    const html = fs.readFileSync(page, 'utf8');
    if (mode === '--write') fs.writeFileSync(page, withPolicy(html));
    else if (problem(html)) (failed++, console.error(page + ' ' + problem(html)));
  }
  process.exitCode = failed ? 1 : 0;
}
module.exports = { policy, withPolicy, problem, BASE };
