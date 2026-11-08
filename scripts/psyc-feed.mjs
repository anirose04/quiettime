#!/usr/bin/env node
/* Quiet Time — "fresh off the press" discovery feed for the psyc paper.

   Retrieves bibliographic metadata only. It never writes research summaries and never marks
   anything as reviewed or verified: every item it produces has status "discovered".

   Providers (official APIs only):
   - OpenAlex  https://api.openalex.org  — search, citation links (referenced_works), topics, OA locations.
       Optional env OPENALEX_API_KEY (free key, raises the daily budget 10x; anonymous search can be
       rate-limited under load). Requests are spaced and retried on 429/5xx using Retry-After.
   - Crossref  https://api.crossref.org  — online-first vs issue dates, deposit dates, work type,
       preprint <-> article relations, corrections. Optional env CROSSREF_MAILTO joins the polite pool.
   - PubMed E-utilities https://eutils.ncbi.nlm.nih.gov — publication types (Meta-Analysis,
       Systematic Review, Review) for items indexed in PubMed. Optional env NCBI_API_KEY, NCBI_EMAIL.

   Output: quiet-time/data/psyc-feed.json (only replaced after a successful run) and
           quiet-time/data/psyc-feed-status.json (always written: last attempt, last success, warnings).
   Usage:  node scripts/psyc-feed.mjs [--dry-run] [--today=YYYY-MM-DD] [--offline-test]           */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'quiet-time', 'data');
const FEED = path.join(DATA, 'psyc-feed.json');
const STATUS = path.join(DATA, 'psyc-feed-status.json');
const WATCH = path.join(DATA, 'psyc-watchlists.json');
const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]));
const TODAY = args.today ? new Date(args.today + 'T12:00:00Z') : new Date();
const iso = d => d.toISOString().slice(0, 10);
const daysAgo = n => iso(new Date(TODAY.getTime() - n * 864e5));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const UA = 'quiet-time-psyc-feed/1.0 (+https://github.com/anirose04/quiettime)';
const stats = { openalex: { calls: 0, key_used: !!process.env.OPENALEX_API_KEY }, crossref: { calls: 0, polite: !!process.env.CROSSREF_MAILTO }, pubmed: { calls: 0, key_used: !!process.env.NCBI_API_KEY } };
const warnings = [];
const t0 = Date.now();
const log = m => console.error(`[${((Date.now() - t0) / 1000).toFixed(0)}s] ${m}`);

// ---------------------------------------------------------------- http
let lastCall = {};
async function getJSON(url, provider, gapMs) {
  const wait = (lastCall[provider] || 0) + gapMs - Date.now();
  if (wait > 0) await sleep(wait);
  for (let attempt = 1; attempt <= 5; attempt++) {
    lastCall[provider] = Date.now();
    stats[provider].calls++;
    let res;
    try { res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(30000) }); }
    catch (e) { log(`${provider}: ${e.name === 'TimeoutError' ? 'timed out' : 'network error'} (attempt ${attempt}/5)`); if (attempt === 5) throw new Error(`${provider}: network error ${e.message}`); await sleep(2000 * attempt); continue; }
    if (res.ok) return res.json();
    if (res.status === 429 || res.status >= 500) {
      const ra = Number(res.headers.get('retry-after')) || 5 * attempt;
      log(`${provider} ${res.status}: waiting ${Math.min(90, ra)}s (attempt ${attempt}/5)`);
      await sleep(Math.min(90, ra) * 1000 + 500);
      continue;
    }
    const body = (await res.text()).slice(0, 200);
    const err = new Error(`${provider} ${res.status}: ${body}`); err.status = res.status; throw err;
  }
  throw new Error(`${provider}: gave up after repeated rate limiting`);
}
const OA_SELECT = 'id,doi,title,display_name,publication_date,created_date,type,primary_location,locations,best_oa_location,open_access,authorships,primary_topic,topics,keywords,abstract_inverted_index,referenced_works,is_retracted';
function oaURL(params) {
  const u = new URL('https://api.openalex.org/works');
  for (const [k, v] of Object.entries({ ...params, select: OA_SELECT })) u.searchParams.set(k, v);
  if (process.env.OPENALEX_API_KEY) u.searchParams.set('api_key', process.env.OPENALEX_API_KEY);
  return u.toString();
}
const oa = params => getJSON(oaURL(params), 'openalex', process.env.OPENALEX_API_KEY ? 150 : 1100);

// ---------------------------------------------------------------- text helpers
const norm = s => (s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const titleKey = s => norm(s).split(' ').slice(0, 14).join(' ');
function abstractFrom(inv) {
  if (!inv) return '';
  const words = [];
  for (const [w, pos] of Object.entries(inv)) for (const p of pos) words[p] = w;
  return words.join(' ');
}
function hasTerm(text, term) {
  const t = ' ' + norm(text) + ' ', q = norm(term);
  if (!q) return false;
  return /^[a-z0-9]{1,4}$/.test(q) ? new RegExp(`(^| )${q}s?( |$)`).test(t) : t.includes(' ' + q);
}
const BROAD = new Set(['familiarity', 'accessibility', 'attribution', 'calibration', 'uncertainty', 'heuristics', 'resolution', 'discounting', 'fluency', 'jol', 'jols', 'spacing', 'restudy', 'theory based', 'experience based']);
function searchString(terms) {
  const picked = terms.filter(t => { const n = norm(t); return !BROAD.has(n) && (n.includes(' ') || n.length >= 10); });
  return picked.map(t => `"${t}"`).join(' OR ');
}
const PREPRINT_SERVERS = /psyarxiv|osf preprints|arxiv|edarxiv|biorxiv|medrxiv|ssrn|research square|preprints\.org|socarxiv|metaarxiv/i;
const FIELD_IDS = { Psychology: 32, 'Social Sciences': 33, Neuroscience: 28, Medicine: 27 };

// ---------------------------------------------------------------- main
async function main() {
  const watch = JSON.parse(await readFile(WATCH, 'utf8'));
  const S = watch.settings;
  let previous = null;
  try { previous = JSON.parse(await readFile(FEED, 'utf8')); } catch { }
  const firstSeen = new Map((previous?.items || []).map(i => [i.id, i.discovered_at]));
  const since = daysAgo(S.window_days);
  const fieldFilter = `primary_topic.field.id:${S.fields.map(f => FIELD_IDS[f]).filter(Boolean).join('|')}`;
  const types = 'type:article|review|preprint';
  const candidates = new Map(); // openalex id -> { work, via:Set }
  const add = (works, via) => { for (const w of works || []) { const c = candidates.get(w.id) || { work: w, via: new Set() }; c.via.add(via); candidates.set(w.id, c); } };

  // 1. topics (relevance-sorted search, psychology-adjacent fields only)
  for (const t of watch.topics) {
    const q = searchString(t.terms);
    log(`topic: ${t.label}`);
    if (!q) continue;
    try { add((await oa({ search: q, filter: `from_publication_date:${since},${types},${fieldFilter}`, per_page: 100 })).results, 'topic'); }
    catch (e) { warnings.push(`topic "${t.label}": ${e.message}`); }
  }
  // 2. works citing foundational papers
  const found = watch.foundational.filter(f => f.openalex);
  try { add((await oa({ filter: `cites:${found.map(f => f.openalex).join('|')},from_publication_date:${since},${types}`, per_page: 100 })).results, 'cites-foundational'); }
  catch (e) { warnings.push(`citing foundational works: ${e.message}`); }
  // 3. related research: works citing papers in the collection
  let relatedIds = [];
  if (watch.related?.dois?.length) {
    try {
      const r = await oa({ filter: `doi:${watch.related.dois.join('|')}`, per_page: 50 });
      relatedIds = r.results.map(w => ({ id: w.id.split('/').pop(), doi: (w.doi || '').replace('https://doi.org/', '') }));
      if (relatedIds.length) add((await oa({ filter: `cites:${relatedIds.map(x => x.id).join('|')},from_publication_date:${since},${types}`, per_page: 100 })).results, 'cites-collection');
    } catch (e) { warnings.push(`related research: ${e.message}`); }
  }
  // 4. watched authors
  const authorIds = watch.authors.flatMap(a => a.openalex);
  try { add((await oa({ filter: `authorships.author.id:${authorIds.join('|')},from_publication_date:${since},${types}`, per_page: 100 })).results, 'author'); }
  catch (e) { warnings.push(`authors: ${e.message}`); }
  // 5. watched journals (newest first; relevance is decided by scoring, not by the journal)
  const issns = watch.journals.map(j => j.issn);
  for (const page of [1, 2]) {
    try { add((await oa({ filter: `primary_location.source.issn:${issns.join('|')},from_publication_date:${since},${types}`, sort: 'publication_date:desc', per_page: 100, page })).results, 'journal'); }
    catch (e) { warnings.push(`journals page ${page}: ${e.message}`); break; }
  }
  // 6. newly indexed: older works added to OpenAlex recently (may be unavailable without a key)
  try {
    add((await oa({ filter: `from_created_date:${daysAgo(S.newly_indexed_days)},to_publication_date:${since},primary_location.source.issn:${issns.join('|')},${types}`, per_page: 100 })).results, 'newly-indexed');
  } catch (e) { warnings.push(`newly indexed works could not be queried (${e.status || ''}): this filter may need an OpenAlex API key`); }

  if (!candidates.size) throw new Error('no candidates retrieved from OpenAlex' + (warnings.length ? ' — ' + warnings[0] : ''));

  // ---------------------------------------------------------- score and filter
  const watchAuthors = new Map(watch.authors.flatMap(a => a.openalex.map(id => [id, a.name])));
  const watchIssn = new Map(watch.journals.map(j => [j.issn, j.name]));
  const foundById = new Map(found.map(f => [f.openalex, f]));
  const relatedById = new Map(relatedIds.map(r => [r.id, r]));
  const scored = [];
  for (const { work: w, via } of candidates.values()) {
    if (w.is_retracted) continue;
    const title = w.display_name || w.title || '';
    const abstract = abstractFrom(w.abstract_inverted_index);
    const kw = [...(w.keywords || []).map(k => k.display_name), ...(w.topics || []).map(t => t.display_name)].join(' ; ');
    const fieldName = w.primary_topic?.field?.display_name;
    const matched = { title: [], abstract: [], keywords: [] };
    for (const t of watch.topics) {
      if (t.terms.some(x => hasTerm(title, x))) matched.title.push(t.label);
      else if (t.terms.some(x => hasTerm(abstract, x))) matched.abstract.push(t.label);
      else if (t.terms.some(x => hasTerm(kw, x))) matched.keywords.push(t.label);
    }
    const topicScore = 3 * matched.title.length + matched.abstract.length + matched.keywords.length;
    const refs = new Set((w.referenced_works || []).map(r => r.split('/').pop()));
    const cites = [...refs].filter(r => foundById.has(r)).map(r => foundById.get(r).key);
    const citesCollection = [...refs].filter(r => relatedById.has(r)).map(r => relatedById.get(r).doi);
    const authorsWatched = [...new Set(w.authorships.map(a => watchAuthors.get(a.author?.id?.split('/').pop())).filter(Boolean))];
    const src = w.primary_location?.source || {};
    const journalWatched = (src.issn || []).map(i => watchIssn.get(i)).find(Boolean) || null;
    const excluded = watch.exclude_terms.some(x => hasTerm(title, x));
    const anchored = watch.require_any.some(x => norm(title + ' ' + abstract).includes(norm(x)));
    const inField = !fieldName || S.fields.includes(fieldName);
    // keyword matches alone are not enough: need a title match or two separate topics, or a topic plus an independent signal
    const signals = (authorsWatched.length ? 1 : 0) + (cites.length || citesCollection.length ? 1 : 0);
    let score = topicScore + 3 * Math.min(authorsWatched.length, 1) + 2 * Math.min(cites.length + citesCollection.length, 2) + (journalWatched ? 1 : 0);
    const topicOK = matched.title.length >= 1 || (matched.abstract.length + matched.keywords.length) >= 2 || (topicScore >= 1 && signals >= 1);
    if (excluded) score -= 5;
    if (!topicOK || !anchored || !inField || score < S.min_relevance) continue;
    scored.push({ w, via, title, abstract, matched, topicScore, score, cites, citesCollection, authorsWatched, journalWatched, src });
  }
  scored.sort((a, b) => b.score - a.score);
  let kept = scored.slice(0, S.max_items * 2);

  // ---------------------------------------------------------- normalise + dedupe
  const items = [];
  const byKey = new Map();
  for (const s of kept) {
    const w = s.w;
    const doi = (w.doi || '').replace('https://doi.org/', '').toLowerCase() || null;
    const isRepo = s.src.type === 'repository';
    const isPreprint = w.type === 'preprint' || (isRepo && PREPRINT_SERVERS.test(s.src.display_name || ''));
    const item = {
      id: doi ? 'doi:' + doi : 'openalex:' + w.id.split('/').pop(),
      doi, openalex: w.id.split('/').pop(),
      title: s.title,
      authors: w.authorships.slice(0, 10).map(a => a.author?.display_name).filter(Boolean),
      author_count: w.authorships.length,
      source: { name: s.src.display_name || null, issn: s.src.issn_l || null, type: s.src.type || null },
      status: 'discovered',
      publication_status: isPreprint ? 'preprint (not peer reviewed)' : isRepo ? 'repository version (not peer reviewed)' : (s.src.type === 'journal' ? 'journal article' : (w.type || 'other')),
      article_type: w.type === 'review' ? 'review' : (isPreprint ? 'preprint' : 'article'),
      article_type_basis: 'OpenAlex type',
      dates: { openalex_publication: w.publication_date, indexed_openalex: w.created_date },
      links: {
        doi: doi ? 'https://doi.org/' + doi : null,
        landing: w.primary_location?.landing_page_url || null,
        oa: w.best_oa_location?.pdf_url || w.best_oa_location?.landing_page_url || null,
        oa_version: w.best_oa_location?.version || null,
        oa_license: w.best_oa_location?.license || null,
        oa_host: w.best_oa_location?.source?.display_name || null
      },
      relevance: { score: s.score, matched: s.matched, watched_authors: s.authorsWatched, watched_journal: s.journalWatched, found_via: [...s.via] },
      connections: { cites_foundational: s.cites, cites_collection: s.citesCollection },
      flags: { replication_in_title: /\breplicat/i.test(s.title), meta_or_review_in_title: /meta-?analy|systematic review|scoping review/i.test(s.title) },
      abstract_available: !!s.abstract,
      versions: {}
    };
    // classification: a sentence built only from matched topics (never from findings)
    const labels = [...s.matched.title, ...s.matched.abstract, ...s.matched.keywords];
    item.classification = labels.length ? `topic match: ${labels[0]}${labels.length > 1 ? `; also ${labels.slice(1, 3).join(', ')}` : ''} (from ${s.matched.title.length ? 'title' : s.matched.abstract.length ? 'abstract' : 'keywords'} metadata).` : 'matched through watched authors or citations.';
    const tk = titleKey(item.title) + '|' + norm((item.authors[0] || '').split(' ').pop());
    const tOnly = norm(item.title).split(' ').length >= 6 ? 'to:' + titleKey(item.title) : null;
    const dupe = (doi && byKey.get('doi:' + doi)) || byKey.get('t:' + tk) || (tOnly && byKey.get(tOnly));
    if (dupe) {
      const notPR = x => /not peer reviewed/.test(x.publication_status);
      if (notPR(dupe) !== notPR(item)) {
        const [pre, pub] = notPR(dupe) ? [dupe, item] : [item, dupe];
        pre.versions.published_version = pub.doi || pub.openalex; pub.versions.preprint = pre.doi || pre.openalex;
        pre.versions.basis = pub.versions.basis = 'same normalised title' + (byKey.get('t:' + tk) ? ' and first author' : '');
        items.push(item);
      } else { dupe.relevance.found_via = [...new Set([...dupe.relevance.found_via, ...item.relevance.found_via])]; (dupe.versions.duplicates ??= []).push(item.doi || item.openalex); }
      continue;
    }
    if (doi) byKey.set('doi:' + doi, item);
    byKey.set('t:' + tk, item);
    if (tOnly) byKey.set(tOnly, item);
    items.push(item);
  }

  log(`candidates: ${candidates.size}; passed relevance: ${scored.length}; items: ${items.length}`);
  // ---------------------------------------------------------- Crossref: dates, types, relations
  const mailto = process.env.CROSSREF_MAILTO;
  for (const it of items.filter(i => i.doi)) {
    try {
      const u = new URL('https://api.crossref.org/works/' + encodeURIComponent(it.doi));
      if (mailto) u.searchParams.set('mailto', mailto);
      const m = (await getJSON(u.toString(), 'crossref', mailto ? 250 : 700)).message;
      const dp = x => x?.['date-parts']?.[0]?.filter(Boolean).map((n, i) => i ? String(n).padStart(2, '0') : n).join('-') || null;
      it.dates.online = dp(m['published-online']);
      it.dates.issue = dp(m['published-print']) || dp(m['journal-issue']?.['published-print']);
      it.dates.crossref_deposit = dp(m.created);
      if (m.type === 'posted-content' && m.subtype === 'preprint') { it.publication_status = 'preprint (not peer reviewed)'; it.article_type = 'preprint'; }
      const rel = m.relation || {};
      if (rel['has-preprint']) it.versions.preprint = rel['has-preprint'][0]?.id, it.versions.basis = 'Crossref relation';
      if (rel['is-preprint-of']) it.versions.published_version = rel['is-preprint-of'][0]?.id, it.versions.basis = 'Crossref relation';
      if (m['update-to']?.length) it.flags.update_notice = m['update-to'].map(u => u.type).join(', ');
    } catch (e) { if (e.status !== 404) warnings.push(`crossref ${it.doi}: ${e.message.slice(0, 80)}`); }
  }

  // ---------------------------------------------------------- PubMed: publication types
  const dois = items.filter(i => i.doi).map(i => i.doi);
  const nk = process.env.NCBI_API_KEY, ne = process.env.NCBI_EMAIL;
  const ncbi = (p, extra) => { const u = new URL('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/' + p); for (const [k, v] of Object.entries({ ...extra, retmode: 'json', tool: 'quiet-time-psyc-feed' })) u.searchParams.set(k, v); if (nk) u.searchParams.set('api_key', nk); if (ne) u.searchParams.set('email', ne); return u.toString(); };
  for (let i = 0; i < dois.length; i += 20) {
    const chunk = dois.slice(i, i + 20);
    try {
      const s = await getJSON(ncbi('esearch.fcgi', { db: 'pubmed', term: chunk.map(d => `"${d}"[AID]`).join(' OR '), retmax: 40 }), 'pubmed', nk ? 120 : 400);
      const ids = s.esearchresult?.idlist || [];
      if (!ids.length) continue;
      const sum = await getJSON(ncbi('esummary.fcgi', { db: 'pubmed', id: ids.join(',') }), 'pubmed', nk ? 120 : 400);
      for (const id of ids) {
        const r = sum.result?.[id]; if (!r) continue;
        const d = (r.articleids || []).find(a => a.idtype === 'doi')?.value?.toLowerCase();
        const it = items.find(x => x.doi === d); if (!it) continue;
        it.pmid = id;
        const pt = (r.pubtype || []).map(String);
        it.pubmed_types = pt;
        if (pt.includes('Meta-Analysis')) { it.article_type = 'meta-analysis'; it.article_type_basis = 'PubMed publication type'; }
        else if (pt.includes('Systematic Review')) { it.article_type = 'systematic review'; it.article_type_basis = 'PubMed publication type'; }
        else if (pt.includes('Review') && it.article_type !== 'preprint') { it.article_type = 'review'; it.article_type_basis = 'PubMed publication type'; }
      }
    } catch (e) { warnings.push(`pubmed: ${e.message.slice(0, 80)}`); break; }
  }
  for (const it of items) {
    if (it.article_type === 'article' && it.flags.meta_or_review_in_title) { it.article_type = /meta-?analy/i.test(it.title) ? 'meta-analysis' : 'systematic review'; it.article_type_basis = 'title wording'; }
    // dates: prefer the original online date; mark online-first and newly indexed separately
    const online = it.dates.online || it.dates.openalex_publication;
    it.dates.primary = online;
    it.dates.online_first = !!(it.dates.online && it.dates.issue && it.dates.issue > it.dates.online.slice(0, it.dates.issue.length));
    const pubAge = (TODAY - new Date(online)) / 864e5, idxAge = (TODAY - new Date(it.dates.indexed_openalex)) / 864e5;
    it.newly_indexed = idxAge <= S.newly_indexed_days && pubAge > S.window_days;
    it.discovered_at = firstSeen.get(it.id) || iso(TODAY);
  }
  const final = items.filter(i => i.newly_indexed || (TODAY - new Date(i.dates.primary)) / 864e5 <= S.window_days)
    .filter(i => S.include_preprints || !i.publication_status.startsWith('preprint'))
    .sort((a, b) => b.relevance.score - a.relevance.score).slice(0, S.max_items);

  return {
    generated_at: new Date().toISOString(), as_of: iso(TODAY), window_days: S.window_days,
    status_vocabulary: { discovered: 'bibliographic record retrieved and checked enough to identify the work — nothing in this feed has been reviewed or verified' },
    providers: { openalex: 'search, citations, topics, open-access locations', crossref: 'online/issue/deposit dates, types, preprint relations, update notices', pubmed: 'publication types where indexed' },
    counts: { candidates: candidates.size, passed_relevance: scored.length, items: final.length },
    foundational: found.map(f => ({ key: f.key, label: f.label, openalex: f.openalex, doi: f.doi })),
    items: final
  };
}

async function writeStatus(st) {
  let prev = {}; try { prev = JSON.parse(await readFile(STATUS, 'utf8')); } catch { }
  const out = { ...prev, ...st, providers: stats, warnings };
  if (!args['dry-run']) await writeFile(STATUS, JSON.stringify(out, null, 2) + '\n');
  return out;
}

if (args['offline-test']) globalThis.fetch = () => Promise.reject(new Error('simulated network failure'));
const startedAt = new Date().toISOString();
try {
  const feed = await main();
  if (args['dry-run']) { console.log(JSON.stringify({ counts: feed.counts, warnings, sample: feed.items.slice(0, 5).map(i => [i.relevance.score, i.title, i.source.name, i.dates.primary]) }, null, 2)); process.exit(0); }
  await writeFile(FEED, JSON.stringify(feed, null, 1) + '\n');
  await writeStatus({ ok: true, last_attempt: startedAt, last_success: feed.generated_at, error: null });
  console.log(`psyc feed: ${feed.items.length} items (${feed.counts.candidates} candidates). warnings: ${warnings.length}`);
} catch (e) {
  // keep the previous feed untouched; record the failure so the app can say the list is stale
  await writeStatus({ ok: false, last_attempt: startedAt, error: String(e.message || e).slice(0, 300) });
  console.error('psyc feed refresh failed; previous feed kept:', e.message);
  process.exit(args.strict ? 1 : 0);
}
