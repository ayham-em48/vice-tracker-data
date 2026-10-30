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

// Versions go up in steps of 0.1 (2.1, 2.2, ... 2.9, 3.0). It's a plain number, so 2.10 would equal 2.1.
const oneDecimal = v => typeof v === 'number' && Number.isFinite(v) && Math.abs(v * 10 - Math.round(v * 10)) < 1e-9;
const nextVersion = v => (Math.round(v * 10) + 1) / 10;
if (!oneDecimal(data.version) || data.version < 1) fail('"version" must be a number like 2.1, 1 or higher, with at most one decimal place');
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
    for (const f of ['character', 'giver']) if (item?.[f] !== undefined) text(item[f], at, f);
    if (item?.count !== undefined && !(Number.isInteger(item.count) && item.count >= 1)) fail(`${at}: "count" must be a whole number, 1 or higher`);
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

// Home screen cards. Card ids are their own namespace, so they may match category ids.
const CARD_TYPES = ['favorites', 'category', 'cheats'];
const STATUSES = ['live', 'partial', 'coming_soon', 'hidden'];
const BADGE_STYLES = ['new', 'hot', 'info'];
const categoryIds = new Set((data.categories ?? []).map(c => c?.id));
const maxLen = (v, n, at, field) => {
  if (v === undefined) return;
  if (typeof v !== 'string') fail(`${at}: "${field}" must be text`);
  else if (v.length > n) fail(`${at}: "${field}" is ${v.length} characters, max ${n}`);
};
if (data.cards !== undefined) {
  if (!Array.isArray(data.cards)) fail('"cards" must be a list');
  const cardIds = new Set();
  for (const [i, card] of (Array.isArray(data.cards) ? data.cards : []).entries()) {
    const at = `cards[${i}] (${card?.id ?? '?'})`;
    if (typeof card?.id !== 'string' || !ID.test(card.id)) fail(`${at}: id must be lowercase letters, numbers and dashes`);
    else if (cardIds.has(card.id)) fail(`${at}: card id "${card.id}" is used twice`);
    else cardIds.add(card.id);
    if (!CARD_TYPES.includes(card?.type)) fail(`${at}: "type" must be one of ${CARD_TYPES.join(', ')}`);
    if (card?.type === 'category' && !categoryIds.has(card.categoryId)) fail(`${at}: "categoryId" "${card.categoryId}" doesn't match any category id`);
    if (!Number.isInteger(card?.order)) fail(`${at}: "order" must be a whole number`);
    if (card?.status !== undefined && !STATUSES.includes(card.status)) fail(`${at}: "status" must be one of ${STATUSES.join(', ')}`);
    maxLen(card?.notice, 80, at, 'notice');
    maxLen(card?.comingSoonText, 60, at, 'comingSoonText');
    if (card?.title !== undefined) text(card.title, at, 'title');
    const b = card?.badge;
    if (b !== undefined) {
      maxLen(b?.label, 12, at, 'badge.label');
      if (b?.style !== undefined && !BADGE_STYLES.includes(b.style)) fail(`${at}: "badge.style" must be one of ${BADGE_STYLES.join(', ')}`);
      if (b?.expiresAt !== undefined && (typeof b.expiresAt !== 'string' || !DATE.test(b.expiresAt))) fail(`${at}: "badge.expiresAt" must be a date like 2026-11-26`);
    }
  }
}

if (data.ads !== undefined) {
  const ads = data.ads;
  if (typeof ads !== 'object' || ads === null || Array.isArray(ads)) fail('"ads" must be an object');
  else {
    for (const f of ['enabled', 'listBanner', 'detailBanner']) if (ads[f] !== undefined && typeof ads[f] !== 'boolean') fail(`ads: "${f}" must be true or false`);
    if (ads.nativeEvery !== undefined && !(Number.isInteger(ads.nativeEvery) && ads.nativeEvery >= 4)) fail('ads: "nativeEvery" must be a whole number, 4 or higher');
  }
}

const previousPath = process.argv[2];
if (previousPath) {
  const prev = load(previousPath);
  if (data.version <= prev.version) fail(`"version" is ${data.version} but the live file is already ${prev.version}: bump it to ${nextVersion(prev.version)} or the app will ignore this update`);
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
