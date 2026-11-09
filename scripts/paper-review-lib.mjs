/* Quiet Time — shared rules for the reading gate on the psyc and history papers.

   Nothing reaches a reader until it has been read. The weekly refresh only ever adds to a private queue
   (review/<paper>-queue.json, outside the published site). A paper moves to quiet-time/data/<paper>-feed.json
   only through scripts/paper-review.mjs, which records the decision in review/decisions.json along with a
   fingerprint of the exact title and abstract that were read. If either later changes, the paper leaves the
   feed and goes back in the queue. scripts/paper-review-check.mjs enforces all of this. */
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DATA = path.join(ROOT, 'quiet-time', 'data');
export const REVIEW = path.join(ROOT, 'review');
export const feedPath = paper => path.join(DATA, `${paper}-feed.json`);
export const queuePath = paper => path.join(REVIEW, `${paper}-queue.json`);
export const DECISIONS = path.join(REVIEW, 'decisions.json');
export const FEED_ABOUT = 'Every item here was read before publication: the title and abstract, checked against the paper\'s Crossref record. The full papers were not read unless a decision in review/decisions.json says so. abstract is the authors\' own text under an open licence.';

export const sha = s => createHash('sha256').update(s).digest('hex').slice(0, 16);
export const fingerprint = item => sha(JSON.stringify([item.title, item.abstract]));

export const readJSON = async (file, fallback) => {
  try { return JSON.parse(await readFile(file, 'utf8')); }
  catch (e) { if (e.code === 'ENOENT' && fallback !== undefined) return fallback; throw e; }
};
export const writeJSON = (file, value) => writeFile(file, JSON.stringify(value, null, 1) + '\n');
export const loadDecisions = () => readJSON(DECISIONS, { _about: 'Every feed paper that has been read, and what was decided. Written by scripts/paper-review.mjs.', psyc: {}, history: {} });

// After a refresh: remove what is no longer what was read, or has been retracted, and queue what is new.
// Removing is always safe to do automatically. Adding never is.
export async function applyRefresh(paper, candidates, { retracted = new Set(), windowDays, today, warnings = [] }) {
  const decisions = await loadDecisions();
  const decided = decisions[paper];
  const feed = await readJSON(feedPath(paper), { items: [] });
  const oldQueue = (await readJSON(queuePath(paper), { items: [] })).items;
  const fresh = new Map(candidates.map(c => [c.id, c]));
  const cutoff = new Date(today.getTime() - windowDays * 864e5).toISOString().slice(0, 10);
  const stamp = today.toISOString().slice(0, 10);

  const kept = [], removed = [], requeue = [];
  for (const item of feed.items) {
    const latest = fresh.get(item.id);
    if (retracted.has(item.id)) {
      decided[item.id] = { decision: 'reject', reason: 'retracted after publication here', fingerprint: fingerprint(item), date: stamp, reader: 'automatic' };
      removed.push(`retracted: ${item.id}`);
    } else if (latest && fingerprint(latest) !== fingerprint(item)) {
      delete decided[item.id];
      requeue.push(latest);
      removed.push(`changed since it was read: ${item.id}`);
    } else if (item.date && item.date < cutoff) {
      removed.push(`aged out: ${item.id}`);
    } else kept.push(item);
  }
  const inFeed = new Set(kept.map(i => i.id));
  const queued = new Map(oldQueue.filter(i => !retracted.has(i.id) && !decided[i.id] && (!i.date || i.date >= cutoff)).map(i => [i.id, i]));
  for (const c of [...candidates, ...requeue]) {
    if (retracted.has(c.id) || inFeed.has(c.id)) continue;
    // a paper turned down stays down unless its abstract has changed
    if (decided[c.id] && decided[c.id].fingerprint === fingerprint(c)) continue;
    if (decided[c.id]) delete decided[c.id];
    queued.set(c.id, { ...c, first_seen: queued.get(c.id)?.first_seen || c.first_seen || stamp });
  }
  removed.forEach(r => warnings.push(r));
  await writeJSON(feedPath(paper), { ...feed, about: FEED_ABOUT, last_refreshed: today.toISOString(), counts: { items: kept.length }, items: kept });
  await writeJSON(queuePath(paper), { _about: 'Waiting to be read. Nothing here is published. Decide with scripts/paper-review.mjs.', items: [...queued.values()] });
  await writeJSON(DECISIONS, decisions);
  return { published: kept.length, queued: queued.size, removed: removed.length };
}
