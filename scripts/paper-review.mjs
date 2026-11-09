#!/usr/bin/env node
/* Quiet Time — the reading desk. This is the only way a paper reaches the psyc or history feed.
     node scripts/paper-review.mjs list psyc            print everything waiting, in full, to be read
     node scripts/paper-review.mjs decide psyc file.json   apply decisions:
       { "accept": ["doi:…"], "reject": { "doi:…": "why" }, "recategorise": { "doi:…": "social" }, "note": "…" }
   Anything left undecided stays in the queue. A paper with no abstract can't be read, so it can't be accepted. */
import { readFile } from 'node:fs/promises';
import { DECISIONS, FEED_ABOUT, feedPath, fingerprint, loadDecisions, queuePath, readJSON, writeJSON } from './paper-review-lib.mjs';

const [, , cmd, paper, file] = process.argv;
if (!['psyc', 'history'].includes(paper) || !['list', 'decide'].includes(cmd) || (cmd === 'decide' && !file)) {
  console.error('usage: paper-review.mjs list <psyc|history> | decide <psyc|history> <decisions.json>');
  process.exit(2);
}
const CATS = { psyc: ['cognitive', 'social', 'educational'], history: ['everyday', 'ideas', 'power'] }[paper];
const queue = await readJSON(queuePath(paper), { items: [] });

if (cmd === 'list') {
  console.log(`${queue.items.length} ${paper} papers waiting to be read`);
  for (const i of queue.items) {
    console.log(`\n${i.id} | ${i.category} | ${i.source} | ${i.date} | ${i.status || 'journal article'} | licence: ${i.abstract_license || 'none'} | ${(i.authors || []).join(', ')}`);
    console.log(`T: ${i.title}`);
    console.log(`A: ${i.abstract || '(NO ABSTRACT: cannot be accepted)'}`);
  }
  process.exit(0);
}

const d = JSON.parse(await readFile(file, 'utf8'));
const decisions = await loadDecisions();
const feed = await readJSON(feedPath(paper), { items: [] });
const today = new Date().toISOString().slice(0, 10);
const byId = new Map(queue.items.map(i => [i.id, i]));
const accepted = [], problems = [];
for (const id of d.accept || []) {
  const item = byId.get(id);
  if (!item) { problems.push(`not in the queue: ${id}`); continue; }
  if (!item.abstract) { problems.push(`no abstract, so it can't have been read: ${id}`); continue; }
  const cat = d.recategorise?.[id];
  if (cat && !CATS.includes(cat)) { problems.push(`unknown category ${cat}: ${id}`); continue; }
  accepted.push({ ...item, category: cat || item.category });
}
for (const id of Object.keys(d.reject || {})) if (!byId.has(id)) problems.push(`not in the queue: ${id}`);
if (problems.length) { problems.forEach(p => console.error(p)); process.exit(1); }

for (const item of accepted) {
  decisions[paper][item.id] = { decision: 'accept', basis: 'title and abstract read; record checked on Crossref', fingerprint: fingerprint(item), date: today, reader: 'Claude', ...(d.note ? { note: d.note } : {}) };
  feed.items.push(item);
  byId.delete(item.id);
}
for (const [id, reason] of Object.entries(d.reject || {})) {
  decisions[paper][id] = { decision: 'reject', reason, fingerprint: fingerprint(byId.get(id)), date: today, reader: 'Claude' };
  byId.delete(id);
}
await writeJSON(feedPath(paper), { ...feed, about: FEED_ABOUT, counts: { items: feed.items.length }, items: feed.items });
await writeJSON(queuePath(paper), { ...queue, items: [...byId.values()] });
await writeJSON(DECISIONS, decisions);
console.log(`${paper}: accepted ${accepted.length}, rejected ${Object.keys(d.reject || {}).length}, ${byId.size} still waiting. Feed now has ${feed.items.length}.`);
