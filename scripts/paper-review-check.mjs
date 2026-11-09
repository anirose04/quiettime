#!/usr/bin/env node
/* Quiet Time — fails if anything can appear in the psyc or history paper without having been read.
     node scripts/paper-review-check.mjs            check; exits 1 on any unread item
     node scripts/paper-review-check.mjs --sign     after reading edited stories, record that they were read
   Feed papers are compared with review/decisions.json. Written stories, digests and their references are compared
   with review/stories.json, so an edited sentence counts as unread until someone has read it again. */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { REVIEW, ROOT, feedPath, fingerprint, loadDecisions, readJSON, sha, writeJSON } from './paper-review-lib.mjs';

const Q = f => readFile(path.join(ROOT, 'quiet-time', f), 'utf8');
const ctx = vm.createContext({});
vm.runInContext((await Promise.all(['psyc-issues.js', 'psyc-discovery-bib.js', 'psyc-discoveries.js', 'history-issues.js', 'history-discoveries.js'].map(Q))).join('\n') +
  '\nthis.PB=PSYC_BIB;this.PD=PSYC_DISCOVERIES;this.PI=PSYC_ISSUES;this.HD=HISTORY_DISCOVERIES;this.HS=HISTORY_SOURCES;this.HI=HISTORY_ISSUES;', ctx);
const { PB, PD, PI, HD, HS, HI } = ctx;

// everything hand-written that the two papers can display
const written = {};
const add = (key, value) => { written[key] = sha(JSON.stringify(value)); };
for (const d of PD) add(`psyc/story/${d.id}`, d);
for (const i of PI) add(`psyc/digest/${i.id}`, i);
for (const [k, b] of Object.entries(PB)) add(`psyc/source/${k}`, b);
for (const d of HD) add(`history/story/${d.id}`, d);
for (const i of HI) add(`history/issue/${i.id}`, i);
for (const [k, s] of Object.entries(HS)) add(`history/source/${k}`, s);

const SIGNED = path.join(REVIEW, 'stories.json');
if (process.argv.includes('--sign')) {
  const today = new Date().toISOString().slice(0, 10);
  const prev = await readJSON(SIGNED, { items: {} });
  const items = {};
  for (const [k, h] of Object.entries(written)) items[k] = prev.items[k]?.hash === h ? prev.items[k] : { hash: h, read: today, reader: 'Claude' };
  await writeJSON(SIGNED, { _about: 'What has been read, by fingerprint. Run paper-review-check.mjs --sign only after actually reading what changed.', items });
  console.log(`signed ${Object.keys(items).length} items`);
  process.exit(0);
}

const errors = [];
const signed = (await readJSON(SIGNED, { items: {} })).items;
for (const [k, h] of Object.entries(written)) {
  if (!signed[k]) errors.push(`${k}: never read`);
  else if (signed[k].hash !== h) errors.push(`${k}: changed since it was read`);
}
const decisions = await loadDecisions();
const counts = {};
for (const paper of ['psyc', 'history']) {
  const feed = await readJSON(feedPath(paper), { items: [] });
  counts[paper] = feed.items.length;
  const ids = new Set();
  for (const item of feed.items) {
    const d = decisions[paper][item.id];
    if (ids.has(item.id)) errors.push(`${paper} feed: duplicate ${item.id}`);
    ids.add(item.id);
    if (!d) errors.push(`${paper} feed: no reading record for ${item.id}`);
    else if (d.decision !== 'accept') errors.push(`${paper} feed: ${item.id} was rejected (${d.reason})`);
    else if (d.fingerprint !== fingerprint(item)) errors.push(`${paper} feed: ${item.id} changed since it was read`);
    if (!item.abstract) errors.push(`${paper} feed: ${item.id} has no abstract to read`);
    if (!item.doi) errors.push(`${paper} feed: ${item.id} has no DOI to check`);
  }
}
errors.forEach(e => console.error('UNREAD:', e));
if (errors.length) { console.error(`${errors.length} item(s) could appear unread`); process.exit(1); }
console.log(`everything readable has been read: ${Object.keys(written).length} written items, ${counts.psyc} psyc papers, ${counts.history} history papers`);
