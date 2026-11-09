#!/usr/bin/env node
/* Quiet Time — weekly new-scholarship refresh for the history paper.

   Retrieves bibliographic metadata only. It never writes a summary or a finding. The only prose it passes
   through is an article's own abstract, verbatim, when the record has a Creative Commons licence.
   Nothing it finds is published: new papers wait in review/history-queue.json until they have been read
   (scripts/paper-review.mjs). It can only remove from the live feed, never add to it.

   Providers: OpenAlex (journals, licences, abstracts; optional OPENALEX_API_KEY) and Crossref (retraction
   notices; optional CROSSREF_MAILTO).
   Output: review/history-queue.json, history-feed-status.json, and removals from quiet-time/data/history-feed.json.
   Usage:  node scripts/history-feed.mjs [--dry-run] [--offline-test] [--strict] */
import { readFile, writeFile } from 'node:fs/promises';
import { applyRefresh } from './paper-review-lib.mjs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'quiet-time', 'data');
const FEED = path.join(DATA, 'history-feed.json');
const STATUS = path.join(DATA, 'history-feed-status.json');
const SOURCES = path.join(DATA, 'history-discovery-sources.json');
const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]));
const TODAY = new Date();
const iso = d => d.toISOString().slice(0, 10);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const warnings = [];
const lastCall = {};
async function getJSON(url, provider, gapMs) {
  const wait = (lastCall[provider] || 0) + gapMs - Date.now();
  if (wait > 0) await sleep(wait);
  for (let attempt = 1; attempt <= 4; attempt++) {
    lastCall[provider] = Date.now();
    let res;
    try { res = await fetch(url, { headers: { 'User-Agent': 'quiet-time-history-feed/1.0 (+https://github.com/anirose04/quiettime)', Accept: 'application/json' }, signal: AbortSignal.timeout(30000) }); }
    catch (e) { if (attempt === 4) throw new Error(`${provider}: network error ${e.message}`); await sleep(2000 * attempt); continue; }
    if (res.ok) return res.json();
    if (res.status === 429 || res.status >= 500) { await sleep(Math.min(60, Number(res.headers.get('retry-after')) || 5 * attempt) * 1000); continue; }
    const err = new Error(`${provider} ${res.status}`); err.status = res.status; throw err;
  }
  throw new Error(`${provider}: gave up after repeated rate limiting`);
}
const abstractFrom = inv => {
  if (!inv) return '';
  const words = [];
  for (const [w, pos] of Object.entries(inv)) for (const p of pos) words[p] = w;
  return words.join(' ').replace(/^abstract\s+/i, '').replace(/\s+/g, ' ').trim();
};
const hash = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
function classify(text, words) {
  const t = text.toLowerCase();
  const scored = Object.entries(words).map(([c, list]) => [c, list.reduce((n, w) => n + (t.includes(w) ? 1 : 0), 0)]).sort((a, b) => b[1] - a[1]);
  return scored[0][1] >= 2 && scored[0][1] > scored[1][1] ? scored[0][0] : null;
}
async function main() {
  const S = JSON.parse(await readFile(SOURCES, 'utf8'));
  let previous = null;
  try { previous = JSON.parse(await readFile(FEED, 'utf8')); } catch { /* first run */ }
  const firstSeen = new Map((previous?.items || []).map(i => [i.id, i.first_seen]).filter(([, v]) => v));
  const since = iso(new Date(TODAY.getTime() - S.settings.window_days * 864e5));
  const works = [];
  for (let i = 0; i < S.journals.length; i += 10) {
    const u = new URL('https://api.openalex.org/works');
    const select = 'id,doi,display_name,publication_date,type,primary_location,best_oa_location,authorships,abstract_inverted_index,is_retracted';
    for (const [k, v] of Object.entries({ filter: `primary_location.source.issn:${S.journals.slice(i, i + 10).map(j => j.issn).join('|')},from_publication_date:${since},type:article,open_access.is_oa:true`, sort: 'publication_date:desc', per_page: 100, select })) u.searchParams.set(k, v);
    if (process.env.OPENALEX_API_KEY) u.searchParams.set('api_key', process.env.OPENALEX_API_KEY);
    try { works.push(...(await getJSON(u.toString(), 'openalex', process.env.OPENALEX_API_KEY ? 150 : 1100)).results); }
    catch (e) { warnings.push(`journals ${i}: ${e.message.slice(0, 120)}`); }
  }
  if (!works.length) throw new Error('no candidates retrieved from OpenAlex' + (warnings.length ? ' — ' + warnings[0] : ''));
  const rows = [];
  const titles = new Set();
  for (const w of works) {
    if (w.is_retracted) continue;
    const title = (w.display_name || '').replace(/<[^>]+>/g, '').trim();
    const low = title.toLowerCase();
    if (title.split(' ').length < 4 || S.exclude_title.some(x => low.includes(x)) || titles.has(low)) continue;
    titles.add(low);
    const abstract = abstractFrom(w.abstract_inverted_index);
    const license = w.best_oa_location?.license || w.primary_location?.license || null;
    const open = /^cc-by/.test(license || '') && !/nd/.test(license || '') && abstract.length >= 200;
    const category = classify(title + ' ' + abstract, S.classify);
    if (!category) continue;
    const doi = (w.doi || '').replace('https://doi.org/', '').toLowerCase() || null;
    rows.push({
      id: doi ? 'doi:' + doi : 'openalex:' + w.id.split('/').pop(), doi, title, category,
      authors: w.authorships.slice(0, 6).map(a => a.author?.display_name).filter(Boolean), author_count: w.authorships.length,
      source: w.primary_location?.source?.display_name || null, date: w.publication_date,
      abstract: open ? abstract : null, abstract_license: open ? license : null,
      links: { doi: doi ? 'https://doi.org/' + doi : null, landing: w.primary_location?.landing_page_url || null }
    });
  }
  const final = [];
  for (const cat of Object.keys(S.classify)) {
    const perSource = new Map();
    const inCat = rows.filter(r => r.category === cat).sort((a, b) => (a.abstract ? 0 : 1) - (b.abstract ? 0 : 1) || hash(a.id) - hash(b.id));
    for (const r of inCat) {
      if (final.filter(x => x.category === cat).length >= S.settings.max_per_category) break;
      const n = perSource.get(r.source) || 0;
      if (n >= S.settings.max_per_journal) continue;
      perSource.set(r.source, n + 1);
      final.push(r);
    }
  }
  const kept = [], retracted = new Set();
  const published = (previous?.items || []).filter(p => !final.some(f => f.id === p.id));
  for (const it of [...final, ...published]) {
    if (it.doi) {
      try {
        const u = new URL('https://api.crossref.org/works/' + encodeURIComponent(it.doi));
        if (process.env.CROSSREF_MAILTO) u.searchParams.set('mailto', process.env.CROSSREF_MAILTO);
        const m = (await getJSON(u.toString(), 'crossref', 400)).message;
        if ([...(m['updated-by'] || []), ...(m['update-to'] || [])].some(x => x.type === 'retraction')) { warnings.push(`dropped retracted ${it.doi}`); retracted.add(it.id); continue; }
      } catch (e) { if (e.status !== 404) warnings.push(`crossref ${it.doi}: ${e.message.slice(0, 80)}`); }
    }
    if (!final.includes(it)) continue;
    it.first_seen = firstSeen.get(it.id) || iso(TODAY);
    kept.push(it);
  }
  return { generated_at: new Date().toISOString(), windowDays: S.settings.window_days, candidates: works.length, usable: rows.length, retracted, items: kept };
}
if (args['offline-test']) globalThis.fetch = () => Promise.reject(new Error('simulated network failure'));
const startedAt = new Date().toISOString();
const writeStatus = async st => { if (!args['dry-run']) await writeFile(STATUS, JSON.stringify({ ...st, last_attempt: startedAt, warnings }, null, 2) + '\n'); };
try {
  const feed = await main();
  if (args['dry-run']) { console.log(JSON.stringify({ candidates: feed.candidates, usable: feed.usable, retracted: [...feed.retracted], warnings, sample: feed.items.slice(0, 12).map(i => [i.category, i.title.slice(0, 80), !!i.abstract]) }, null, 1)); process.exit(0); }
  const result = await applyRefresh('history', feed.items, { retracted: feed.retracted, windowDays: feed.windowDays, today: TODAY, warnings });
  await writeStatus({ ok: true, last_success: feed.generated_at, error: null, ...result });
  console.log(`history feed: ${result.published} published, ${result.queued} waiting to be read, ${result.removed} removed. warnings: ${warnings.length}`);
} catch (e) {
  let prior = {}; try { prior = JSON.parse(await readFile(STATUS, 'utf8')); } catch { /* first run */ }
  await writeStatus({ ok: false, last_success: prior.last_success || null, error: String(e.message || e).slice(0, 300) });
  console.error('history feed refresh failed; previous feed kept:', e.message);
  process.exit(args.strict ? 1 : 0);
}
