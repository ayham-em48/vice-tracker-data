// Checks data.json before it goes live. Run locally with: node scripts/validate.mjs
// Pass a previous version's file to also check that the version went up and no ids vanished:
//   node scripts/validate.mjs previous-data.json
// With --force (used when the commit message contains "[submit anyway]"), problems are reported as
// warnings and the file is still published, as long as the app can load it at all.
// The rules themselves live in check.mjs, shared with the admin.html editor.
import { readFileSync } from 'node:fs';
import { check } from './check.mjs';

function load(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    console.error(`✖ ${path} is not valid JSON: ${e.message}`);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
const force = args.includes('--force');
const previousPath = args.find(a => !a.startsWith('--'));
const data = load('data.json');
const errors = check(data, previousPath ? load(previousPath) : undefined);
const list = `${errors.length} problem${errors.length > 1 ? 's' : ''}:\n  - ${errors.join('\n  - ')}`;

// The minimum the app needs to use the file at all (see isAppData in the app). Never skipped.
const loadable = data && typeof data.version === 'number' && Array.isArray(data.categories) && Array.isArray(data.cheats);

if (errors.length && force && loadable) {
  console.log(`⚠ Submitted anyway: data.json has ${list}`);
  for (const e of errors) console.log(`::warning title=data.json::${e}`);
} else if (errors.length) {
  if (force) console.error('✖ Can\'t submit anyway: the app needs "version" to be a number and "categories" and "cheats" to be lists.');
  console.error(`✖ data.json has ${list}`);
  process.exit(1);
}
const items = data.categories.reduce((n, c) => n + c.items.length, 0);
console.log(`✔ data.json ${errors.length ? 'published with warnings' : 'is valid'}: version ${data.version}, ${data.categories.length} categories, ${items} items, ${data.cheats.length} cheats`);
