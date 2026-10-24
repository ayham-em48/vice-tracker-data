// Checks data.json before it goes live. Run locally with: node scripts/validate.mjs
// Pass a previous version's file to also check that the version went up and no ids vanished:
//   node scripts/validate.mjs previous-data.json
import { readFileSync } from 'node:fs';

const errors = [];
const fail = msg => errors.push(msg);

function load(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    console.error(`✖ ${path} is not valid JSON: ${e.message}`);
    process.exit(1);
  }
}

const data = load('data.json');
const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const seen = new Map();

function checkId(id, where) {
  if (typeof id !== 'string' || !ID.test(id)) return fail(`${where}: id "${id}" must be lowercase letters, numbers and dashes`);
  if (seen.has(id)) return fail(`${where}: id "${id}" is already used by ${seen.get(id)}`);
  seen.set(id, where);
}
const text = (v, where, field) => {
  if (typeof v !== 'string' || !v.trim()) fail(`${where}: "${field}" is missing or empty`);
};

if (!Number.isInteger(data.version) || data.version < 1) fail('"version" must be a whole number, 1 or higher');
if (typeof data.updatedAt !== 'string' || !DATE.test(data.updatedAt)) fail('"updatedAt" must be a date like 2026-10-24');

if (!Array.isArray(data.categories) || !data.categories.length) fail('"categories" must be a non-empty list');
for (const [ci, cat] of (data.categories ?? []).entries()) {
  const where = `categories[${ci}] (${cat?.name ?? '?'})`;
  checkId(cat?.id, where);
  text(cat?.name, where, 'name');
  if (!Array.isArray(cat?.items)) { fail(`${where}: "items" must be a list`); continue; }
  for (const [ii, item] of cat.items.entries()) {
    const at = `${where} > items[${ii}] (${item?.name ?? '?'})`;
    checkId(item?.id, at);
    text(item?.name, at, 'name');
    if (item?.description !== undefined && typeof item.description !== 'string') fail(`${at}: "description" must be text`);
    if (item?.spoiler !== undefined && typeof item.spoiler !== 'boolean') fail(`${at}: "spoiler" must be true or false`);
  }
}

if (!Array.isArray(data.cheats)) fail('"cheats" must be a list (use [] for none)');
for (const [i, c] of (data.cheats ?? []).entries()) {
  const at = `cheats[${i}] (${c?.name ?? '?'})`;
  checkId(c?.id, at);
  text(c?.name, at, 'name');
  text(c?.effect, at, 'effect');
  const codes = c?.codes ?? {};
  const platforms = Object.keys(codes);
  if (!platforms.length) fail(`${at}: "codes" needs at least one of playstation / xbox`);
  for (const p of platforms) {
    if (p !== 'playstation' && p !== 'xbox') fail(`${at}: unknown platform "${p}" (use playstation or xbox)`);
    else text(codes[p], at, `codes.${p}`);
  }
}

const previousPath = process.argv[2];
if (previousPath) {
  const prev = load(previousPath);
  if (data.version <= prev.version) fail(`"version" is ${data.version} but the live file is already ${prev.version}: bump it to ${prev.version + 1} or the app will ignore this update`);
  const ids = p => [...p.categories.flatMap(c => [c.id, ...c.items.map(i => i.id)]), ...p.cheats.map(c => c.id)];
  const now = new Set(ids(data));
  const gone = ids(prev).filter(id => !now.has(id));
  if (gone.length) fail(`these ids were removed or renamed, which wipes players' progress on them: ${gone.join(', ')}`);
}

if (errors.length) {
  console.error(`✖ data.json has ${errors.length} problem${errors.length > 1 ? 's' : ''}:\n  - ${errors.join('\n  - ')}`);
  process.exit(1);
}
const items = data.categories.reduce((n, c) => n + c.items.length, 0);
console.log(`✔ data.json is valid: version ${data.version}, ${data.categories.length} categories, ${items} items, ${data.cheats.length} cheats`);
