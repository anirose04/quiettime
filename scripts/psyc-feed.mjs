#!/usr/bin/env node
/* Quiet Time — weekly new-paper refresh for the psyc paper.

   Retrieves bibliographic metadata only. It never writes a summary, a headline or a finding. The only
   prose it passes through is an article's own abstract, verbatim, when the record has a Creative Commons
   licence; every other paper appears as a bare listing. Connections come only from reference lists.

   Providers (official APIs only):
   - OpenAlex  https://api.openalex.org — search, licences, abstracts, reference lists.
       Optional env OPENALEX_API_KEY (free, raises the daily budget).
   - Crossref  https://api.crossref.org — retraction and correction notices.
       Optional env CROSSREF_MAILTO joins the polite pool.

   Output: quiet-time/data/psyc-feed.json (only replaced after a successful run) and
           quiet-time/data/psyc-feed-status.json (always written).
   Usage:  node scripts/psyc-feed.mjs [--dry-run] [--today=YYYY-MM-DD] [--offline-test] [--strict] */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'quiet-time', 'data');
const FEED = path.join(DATA, 'psyc-feed.json');
const STATUS = path.join(DATA, 'psyc-feed-status.json');
const SOURCES = path.join(DATA, 'psyc-discovery-sources.json');
const COLLECTION = path.join(DATA, 'psyc-collection.json');
const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]));
const TODAY = args.today ? new Date(args.today + 'T12:00:00Z') : new Date();
const iso = d => d.toISOString().slice(0, 10);
const daysAgo = n => iso(new Date(TODAY.getTime() - n * 864e5));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const UA = 'quiet-time-psyc-feed/2.0 (+https://github.com/anirose04/quiettime)';
const stats = { openalex: { calls: 0, key_used: !!process.env.OPENALEX_API_KEY }, crossref: { calls: 0, polite: !!process.env.CROSSREF_MAILTO } };
const warnings = [];
const t0 = Date.now();
const log = m => console.error(`[${((Date.now() - t0) / 1000).toFixed(0)}s] ${m}`);

const lastCall = {};
async function getJSON(url, provider, gapMs) {
  const wait = (lastCall[provider] || 0) + gapMs - Date.now();
  if (wait > 0) await sleep(wait);
  for (let attempt = 1; attempt <= 5; attempt++) {
    lastCall[provider] = Date.now();
    stats[provider].calls++;
    let res;
    try { res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(30000) }); }
    catch (e) { log(`${provider}: network error (attempt ${attempt}/5)`); if (attempt === 5) throw new Error(`${provider}: network error ${e.message}`); await sleep(2000 * attempt); continue; }
    if (res.ok) return res.json();
    if (res.status === 429 || res.status >= 500) {
      const ra = Number(res.headers.get('retry-after')) || 5 * attempt;
      log(`${provider} ${res.status}: waiting ${Math.min(90, ra)}s (attempt ${attempt}/5)`);
      await sleep(Math.min(90, ra) * 1000 + 500);
      continue;
    }
    const err = new Error(`${provider} ${res.status}: ${(await res.text()).slice(0, 200)}`); err.status = res.status; throw err;
  }
  throw new Error(`${provider}: gave up after repeated rate limiting`);
}
const OA_SELECT = 'id,doi,display_name,publication_date,type,primary_location,best_oa_location,authorships,primary_topic,abstract_inverted_index,referenced_works,is_retracted';
function oa(params) {
  const u = new URL('https://api.openalex.org/works');
  for (const [k, v] of Object.entries({ ...params, select: OA_SELECT })) u.searchParams.set(k, v);
  if (process.env.OPENALEX_API_KEY) u.searchParams.set('api_key', process.env.OPENALEX_API_KEY);
  return getJSON(u.toString(), 'openalex', process.env.OPENALEX_API_KEY ? 150 : 1100);
}
function abstractFrom(inv) {
  if (!inv) return '';
  const words = [];
  for (const [w, pos] of Object.entries(inv)) for (const p of pos) words[p] = w;
  return words.join(' ').replace(/^abstract\s+/i, '').replace(/\s+/g, ' ').trim();
}
const norm = s => (s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const hasAny = (text, terms) => { const t = ' ' + text.toLowerCase() + ' '; return terms.some(x => t.includes(x)); };

function classify(text, words) {
  const t = text.toLowerCase();
  const score = Object.fromEntries(Object.entries(words).map(([c, list]) => [c, list.reduce((n, w) => n + (t.includes(w) ? 1 : 0), 0)]));
  // education and social vocabulary are specific; "learning" and "cognitive" are everywhere, so they only win alone
  if (score.educational >= 2) return 'educational';
  if (score.social >= 2) return 'social';
  if (score.cognitive >= 2) return 'cognitive';
  return null;
}
// a cheap stable hash, so that a week's selection doesn't depend on API response order
const hash = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };

async function main() {
  const S = JSON.parse(await readFile(SOURCES, 'utf8'));
  const collection = JSON.parse(await readFile(COLLECTION, 'utf8')).items;
  const byOpenAlex = new Map(collection.map(c => [c.openalex, c]));
  const known = new Set(collection.map(c => String(c.doi).toLowerCase()));
  let previous = null;
  try { previous = JSON.parse(await readFile(FEED, 'utf8')); } catch { /* first run */ }
  const firstSeen = new Map((previous?.items || []).map(i => [i.id, i.first_seen]).filter(([, v]) => v));
  const since = daysAgo(S.settings.window_days);
  const types = 'type:article|review';
  const cands = new Map();
  const add = (works, cat) => { for (const w of works || []) if (!cands.has(w.id)) cands.set(w.id, { w, cat }); };

  const fetchSet = async (journals, cat, pages = 1) => {
    const issns = journals.map(j => j.issn).join('|');
    for (let page = 1; page <= pages; page++) {
      try { add((await oa({ filter: `primary_location.source.issn:${issns},from_publication_date:${since},${types},has_abstract:true`, sort: 'publication_date:desc', per_page: 100, page })).results, cat); }
      catch (e) { warnings.push(`${cat || 'general'} journals page ${page}: ${e.message.slice(0, 120)}`); break; }
    }
  };
  for (const cat of Object.keys(S.journals)) { log(`journals: ${cat}`); await fetchSet(S.journals[cat], cat, 2); }
  log('general journals');
  await fetchSet(S.general_journals, null, 3);
  // new papers that cite the collection, wherever they appear: this is what grows the rabbit holes
  log('citing the collection');
  const ids = collection.map(c => c.openalex);
  for (let i = 0; i < ids.length; i += 40) {
    try { add((await oa({ filter: `cites:${ids.slice(i, i + 40).join('|')},from_publication_date:${since},${types},has_abstract:true,primary_topic.field.id:32`, per_page: 100 })).results, null); }
    catch (e) { warnings.push(`citing works: ${e.message.slice(0, 120)}`); break; }
  }
  // a small share of preprints, always labelled as such
  log('preprints');
  try {
    add((await oa({ filter: `type:preprint,from_publication_date:${daysAgo(120)},has_abstract:true,primary_location.source.id:S4306401687`, sort: 'publication_date:desc', per_page: 100 })).results, null);
  } catch (e) { warnings.push(`preprints: ${e.message.slice(0, 120)}`); }

  if (!cands.size) throw new Error('no candidates retrieved from OpenAlex' + (warnings.length ? ' — ' + warnings[0] : ''));

  const journalCat = new Map(Object.entries(S.journals).flatMap(([c, l]) => l.map(j => [j.issn, c])));
  const listedIssns = new Set([...Object.values(S.journals).flat(), ...S.general_journals].map(j => j.issn));
  const rows = [];
  const seenTitles = new Set();
  for (const { w, cat } of cands.values()) {
    if (w.is_retracted) continue;
    const doi = (w.doi || '').replace('https://doi.org/', '').toLowerCase() || null;
    if (doi && known.has(doi)) continue;
    const title = (w.display_name || '').replace(/<[^>]+>/g, '').trim();
    const abstract = abstractFrom(w.abstract_inverted_index);
    if (!title || title.split(' ').length < 4 || hasAny(title, S.exclude_title)) continue;
    if (hasAny(title + ' ' + abstract, S.exclude_text)) continue;
    if (abstract.length < 200) continue;
    const key = norm(title).split(' ').slice(0, 14).join(' ');
    if (seenTitles.has(key)) continue;
    seenTitles.add(key);
    const src = w.primary_location?.source || {};
    // a field journal decides the category, however the paper was found; general journals rely on the classifier
    const category = (src.issn || []).map(i => journalCat.get(i)).find(Boolean) || cat || classify(title + ' ' + abstract, S.classify);
    if (!category) continue;
    const preprint = w.type === 'preprint' || /psyarxiv|arxiv|osf preprints|edarxiv|socarxiv/i.test(src.display_name || '');
    const license = w.best_oa_location?.license || w.primary_location?.license || null;
    const openAbstract = /^cc-by/.test(license || '') && !/nd/.test(license || '') ? abstract : null;
    const cites = (w.referenced_works || []).map(r => byOpenAlex.get(r.split('/').pop())?.id).filter(Boolean);
    rows.push({
      id: doi ? 'doi:' + doi : 'openalex:' + w.id.split('/').pop(), doi, openalex: w.id.split('/').pop(),
      title, category, status: preprint ? 'preprint (not peer reviewed)' : 'journal article',
      authors: w.authorships.slice(0, 8).map(a => a.author?.display_name).filter(Boolean), author_count: w.authorships.length,
      source: src.display_name || null, date: w.publication_date,
      abstract: openAbstract, abstract_license: openAbstract ? license : null,
      links: { doi: doi ? 'https://doi.org/' + doi : null, landing: w.primary_location?.landing_page_url || null, oa: w.best_oa_location?.pdf_url || w.best_oa_location?.landing_page_url || null },
      cites_collection: [...new Set(cites)], topic: w.primary_topic?.display_name || null, listed: listedIssns.has(src.issn_l) || (src.issn || []).some(i => listedIssns.has(i)),
      first_seen: null
    });
  }
  log(`candidates ${cands.size}; usable ${rows.length}`);

  // balance fields and topics. Order within a topic comes from the hash, not from citations, altmetrics or anything engagement-shaped
  const final = [];
  for (const cat of Object.keys(S.journals)) {
    const inCat = rows.filter(r => r.category === cat);
    const pre = inCat.filter(r => r.status.startsWith('preprint'));
    const pub = inCat.filter(r => !r.status.startsWith('preprint'));
    // prefer the last six months and papers with a readable abstract; a limited share may be papers citing the collection, because those grow the rabbit holes
    const weight = r => (r.abstract ? 0 : 2) + ((TODAY - new Date(r.date)) / 864e5 > 183 ? 1 : 0);
    const order = l => l.sort((a, b) => weight(a) - weight(b) || hash(a.id) - hash(b.id));
    const perTopic = new Map();
    const picked = [];
    const cap = S.settings.max_per_category;
    const room = Math.ceil(cap * (1 - S.settings.preprint_share));
    const take = (list, limit) => {
      for (const r of list) {
        if (picked.length >= limit) break;
        if (picked.includes(r)) continue;
        const n = perTopic.get(r.topic) || 0;
        if (r.topic && n >= S.settings.max_per_topic) continue;
        perTopic.set(r.topic, n + 1);
        picked.push(r);
      }
    };
    // no single study in the collection gets to pull in more than two new papers
    const perCited = new Map();
    const citing = order(pub.filter(r => r.cites_collection.length && r.listed)).filter(r => {
      const k = r.cites_collection[0], n = perCited.get(k) || 0;
      if (n >= 2) return false;
      perCited.set(k, n + 1);
      return true;
    });
    take(citing, Math.ceil(room * S.settings.citing_share));
    take(order(pub.filter(r => r.listed)), room);
    final.push(...picked, ...order(pre).slice(0, cap - picked.length));
  }

  // retraction and correction notices from Crossref; retracted papers never appear
  const mailto = process.env.CROSSREF_MAILTO;
  const kept = [];
  for (const it of final) {
    if (it.doi) {
      try {
        const u = new URL('https://api.crossref.org/works/' + encodeURIComponent(it.doi));
        if (mailto) u.searchParams.set('mailto', mailto);
        const m = (await getJSON(u.toString(), 'crossref', mailto ? 250 : 700)).message;
        const notices = [...(m['updated-by'] || []), ...(m['update-to'] || [])].map(x => x.type);
        if (notices.includes('retraction') || /^retract/i.test(m.title?.[0] || '')) { warnings.push(`dropped retracted ${it.doi}`); continue; }
        if (m.type === 'posted-content') it.status = 'preprint (not peer reviewed)';
      } catch (e) { if (e.status !== 404) warnings.push(`crossref ${it.doi}: ${e.message.slice(0, 80)}`); }
    }
    it.first_seen = firstSeen.get(it.id) || iso(TODAY);
    delete it.topic; delete it.listed;
    kept.push(it);
  }
  return {
    generated_at: new Date().toISOString(), as_of: iso(TODAY), window_days: S.settings.window_days,
    about: 'Bibliographic records only. abstract is the authors\' own text, included only for CC BY records. Nothing here has been read, reviewed or verified.',
    counts: { candidates: cands.size, usable: rows.length, items: kept.length, with_abstract: kept.filter(i => i.abstract).length, citing_collection: kept.filter(i => i.cites_collection.length).length },
    items: kept
  };
}

async function writeStatus(st) {
  let prev = {}; try { prev = JSON.parse(await readFile(STATUS, 'utf8')); } catch { /* first run */ }
  if (!args['dry-run']) await writeFile(STATUS, JSON.stringify({ ...prev, ...st, providers: stats, warnings }, null, 2) + '\n');
}
if (args['offline-test']) globalThis.fetch = () => Promise.reject(new Error('simulated network failure'));
const startedAt = new Date().toISOString();
try {
  const feed = await main();
  if (args['dry-run']) { console.log(JSON.stringify({ counts: feed.counts, warnings, sample: feed.items.slice(0, 8).map(i => [i.category, i.title.slice(0, 80), !!i.abstract]) }, null, 1)); process.exit(0); }
  await writeFile(FEED, JSON.stringify(feed, null, 1) + '\n');
  await writeStatus({ ok: true, last_attempt: startedAt, last_success: feed.generated_at, error: null });
  console.log(`psyc feed: ${feed.items.length} items (${feed.counts.candidates} candidates). warnings: ${warnings.length}`);
} catch (e) {
  // keep the previous feed untouched; the app simply goes on showing it
  await writeStatus({ ok: false, last_attempt: startedAt, error: String(e.message || e).slice(0, 300) });
  console.error('psyc feed refresh failed; previous feed kept:', e.message);
  process.exit(args.strict ? 1 : 0);
}
