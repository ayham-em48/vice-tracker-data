// Checks data.json before it goes live. Run locally with: node scripts/validate.mjs
// Pass a previous version's file to also check that the version went up and no ids vanished:
//   node scripts/validate.mjs previous-data.json
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

const data = load('data.json');
const previousPath = process.argv[2];
const errors = check(data, previousPath ? load(previousPath) : undefined);

if (errors.length) {
  console.error(`✖ data.json has ${errors.length} problem${errors.length > 1 ? 's' : ''}:\n  - ${errors.join('\n  - ')}`);
  process.exit(1);
}
const items = data.categories.reduce((n, c) => n + c.items.length, 0);
console.log(`✔ data.json is valid: version ${data.version}, ${data.categories.length} categories, ${items} items, ${data.cheats.length} cheats`);
