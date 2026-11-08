/* Quiet Time — the psyc paper: a little magazine of psychology discoveries.
   One feed, three kinds of card, never mixed up:
   - checked stories and abstract-level notes (psyc-discoveries.js, hand-written, every claim cited)
   - new papers (data/psyc-feed.json, refreshed weekly): only the authors' own open-licence abstract or the
     bibliographic listing. Nothing automated ever writes a finding.
   Routes: #psyc, #psyc?d=<id>, #psyc?saved. Everything personal is stored locally. */
const PSYC_FIRST = 7, PSYC_MORE = 6;
let psycState = { filter: 'all', shown: PSYC_FIRST, scroll: 0, trail: [] };
let psycFeed = null, psycFeedTried = false;
const P_ESC = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const P_PLAIN = html => { const d = document.createElement('div'); d.innerHTML = html; return d.textContent; };
const pGet = (k, d) => { const v = storage.get(k); return v ?? d; };
const pState = () => { const s = pGet('psyc-feed-state', {}); s.saved ??= {}; s.read ??= {}; s.dismissed ??= {}; s.queue ??= {}; return s; };
const pSaved = () => { const s = pGet('psyc-saved', {}); return s && typeof s === 'object' ? s : {}; };
const pBoard = () => { const b = pGet('psyc-board', []); return Array.isArray(b) ? b : []; };
const pDoi = doi => 'https://doi.org/' + String(doi).split('/').map(encodeURIComponent).join('/');
const pHttp = u => /^https?:\/\//.test(u || '') ? u : null;
const P_CATS = ['cognitive', 'social', 'educational'];
const P_REL = {
  cites: 'it cites this', citedby: 'a later paper that cites it', failed: 'the study it failed to replicate',
  failedby: 'a replication that failed', replicates: 'the original it replicates', replicatedby: 'a replication that held up',
  challenges: 'the claim it challenges', challengedby: 'a direct challenge', idea: 'same idea, different setting',
  cousin: 'a thematic cousin (no direct link)'
};
const psycD = id => PSYC_DISCOVERIES.find(d => d.id === id);
const psycPaper = id => psycFeed?.items?.find(p => p.id === id);
const psycSeen = () => new Set(PSYC_DISCOVERIES.map(d => PSYC_BIB[d.bib]?.doi?.toLowerCase()));

// ---------------------------------------------------------------- routing
function psycGo(hash) { if (location.hash === hash) render('psyc'); else location.hash = hash; }
function psycOpen(id, follow) {
  if (!document.querySelector('.d-story') && !document.querySelector('.d-saved')) psycState.scroll = scrollY;
  psycState.trail = follow ? [...psycState.trail, id] : [id];
  psycGo('#psyc?d=' + encodeURIComponent(id));
}
function psycSurprise(follow) {
  const here = psycState.trail.at(-1);
  const pool = PSYC_DISCOVERIES.filter(d => d.level === 'checked' && !d.retracted && !psycState.trail.includes(d.id) && d.id !== here);
  psycOpen(pool[Math.floor(Math.random() * pool.length)].id, follow);
}
async function psycLoadFeed() {
  if (psycFeedTried) return;
  psycFeedTried = true;
  try {
    const r = await fetch('data/psyc-feed.json', { cache: 'no-cache', signal: AbortSignal.timeout(3000) });
    if (r.ok) psycFeed = await r.json();
  } catch { /* the bundled collection is enough on its own */ }
  if (!Array.isArray(psycFeed?.items)) psycFeed = null;
  else { const seen = psycSeen(); psycFeed.items = psycFeed.items.filter(p => p.title && P_CATS.includes(p.category) && !seen.has(String(p.doi).toLowerCase())); }
}
async function drawPsyc() {
  const q = location.hash.split('?')[1] || '';
  if (!psycFeedTried) {
    layout('', '', '<div class="h-paper d-paper"><p class="h-small">unfolding the paper…</p></div>');
    await psycLoadFeed();
    if (location.hash.startsWith('#psyc')) render('psyc'); // a full render keeps the quiet-session panel in place
    return;
  }
  if (q === 'saved') return psycDrawSaved();
  if (q.startsWith('d=')) {
    const id = decodeURIComponent(q.slice(2));
    if (psycD(id) || psycPaper(id)) {
      const at = psycState.trail.indexOf(id);
      psycState.trail = at >= 0 ? psycState.trail.slice(0, at + 1) : [...psycState.trail, id];
      return psycDrawItem(id);
    }
  }
  psycDrawFeed();
}
// outside links never reach past a quiet session; inline citations open the reference list
function psycGuard(root) {
  root.addEventListener('click', e => {
    const ref = e.target.closest('[data-ref],[data-src]');
    if (ref) {
      e.preventDefault();
      const t = document.getElementById(ref.dataset.ref ? 'dref-' + ref.dataset.ref : 'psrc-' + ref.dataset.src);
      if (t) { let p = t.closest('details'); while (p) { p.open = true; p = p.parentElement.closest('details'); } t.scrollIntoView({ behavior: 'smooth', block: 'center' }); t.classList.remove('flash'); void t.offsetWidth; t.classList.add('flash'); }
      return;
    }
    const a = e.target.closest('a[target="_blank"]');
    if (a && activeQuiet()) { e.preventDefault(); requestEarlyEnd(); }
  });
}
const pLink = (href, text, cls = '') => `<a ${cls ? `class="${cls}" ` : ''}href="${P_ESC(href)}" target="_blank" rel="noopener noreferrer">${text}</a>`;

// ---------------------------------------------------------------- what goes in the paper
// same order all week; balanced across fields and across kinds of evidence, not personalised and not ranked by engagement
function psycSeeded() {
  const now = new Date(), start = new Date(now.getFullYear(), 0, 1);
  let a = now.getFullYear() * 100 + Math.floor((now - start) / 6048e5);
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function psycCompose(filter) {
  const rand = psycSeeded();
  const shuffle = l => { const a = [...l]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const cats = filter === 'all' ? shuffle(P_CATS) : [filter];
  const pools = {};
  for (const c of cats) {
    const ds = PSYC_DISCOVERIES.filter(d => d.cat === c && !d.retracted);
    const papers = (psycFeed?.items || []).filter(p => p.category === c);
    pools[c] = {
      checked: shuffle(ds.filter(d => d.level === 'checked')),
      note: shuffle(ds.filter(d => d.level === 'abstract' && !d.isNew)),
      recent: shuffle(ds.filter(d => d.isNew && d.level === 'abstract')),
      raw: [...shuffle(papers.filter(p => p.abstract)), ...shuffle(papers.filter(p => !p.abstract))]
    };
  }
  const pattern = ['checked', 'recent', 'checked', 'note', 'checked', 'raw', 'checked', 'note'];
  const edges = x => x.cat ? x.links.map(l => l[0]) : x.cites_collection || [];
  const related = (a, b) => !!a && !!b && (edges(a).includes(b.id) || edges(b).includes(a.id));
  const take = (kind, cat, prev) => {
    const orders = [[kind, cat], ...cats.filter(c => c !== cat).map(c => [kind, c]), ...['checked', 'recent', 'note', 'raw'].flatMap(k => cats.map(c => [k, c]))];
    for (const [k, c] of orders) {
      const pool = pools[c][k];
      if (!pool.length) continue;
      const i = pool.findIndex(x => !related(x, prev));
      return pool.splice(i >= 0 ? i : 0, 1)[0];
    }
    return null;
  };
  const out = [];
  for (let n = 0; ; n++) {
    const item = take(pattern[n % pattern.length], cats[n % cats.length], out.at(-1));
    if (!item) return out;
    out.push(item);
  }
}

// ---------------------------------------------------------------- cards
const psycIsSaved = id => !!pSaved()[id] || !!pState().saved[id];
const psycSaveBtn = id => { const on = psycIsSaved(id); return `<button class="d-save${on ? ' on' : ''}" type="button" data-save="${P_ESC(id)}" aria-pressed="${on}">${on ? 'saved ✿' : 'save'}</button>`; };
function psycToggleSave(id) {
  const p = psycPaper(id), st = pState();
  if (st.saved[id]) { delete st.saved[id]; storage.set('psyc-feed-state', st); return false; }
  if (psycD(id)) {
    const s = pSaved();
    if (s[id]) delete s[id]; else s[id] = new Date().toISOString().slice(0, 10);
    storage.set('psyc-saved', s);
    return !!s[id];
  }
  if (!p) return false;
  st.saved[id] = { id, doi: p.doi, title: p.title, authors: p.authors, author_count: p.author_count, source: p.source, year: (p.date || '').slice(0, 4), date: p.date, publication_status: p.status, links: p.links, status: 'discovered', savedAt: new Date().toISOString().slice(0, 10), note: '' };
  storage.set('psyc-feed-state', st);
  return true;
}
function psycWireSaves(root) {
  root.addEventListener('click', e => {
    const b = e.target.closest('[data-save]');
    if (!b) return;
    const on = psycToggleSave(b.dataset.save);
    b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); b.textContent = on ? 'saved ✿' : 'save';
  });
}
const psycBy = p => { const a = p.authors || [], last = n => String(n).split(' ').pop(); return a.length ? (p.author_count > 2 || a.length > 2 ? `${last(a[0])} et al.` : a.map(last).join(' & ')) : 'authors unknown'; };
const psycHasNotice = d => (PSYC_BIB[d.bib]?.updates || []).length > 0;
function psycCardD(d) {
  const b = PSYC_BIB[d.bib];
  const kicker = [d.cat, d.isNew ? 'recent' : d.classic ? 'older classic' : '', d.note || ''].filter(Boolean).join(' · ');
  return `<article class="d-card" data-cat="${d.cat}">
    <p class="d-kicker">${P_ESC(kicker)}</p>
    <h3 class="d-head"><button type="button" class="d-open" data-open="${d.id}">${P_ESC(d.head)}</button></h3>
    <p class="d-body">${d.card}</p>
    <p class="d-foot"><span class="d-source">${pLink(pDoi(b.doi), `${P_ESC(b.short)}, ${b.year} ↗`)}${d.level === 'abstract' ? ' · from the abstract' : ''}</span>
      <span class="d-acts">${psycSaveBtn(d.id)}<button type="button" class="d-more" data-open="${d.id}">${d.level === 'checked' ? 'the full story →' : 'a little more →'}</button></span></p>
  </article>`;
}
function psycExcerpt(text) {
  const words = String(text).split(/\s+/);
  if (words.length <= 90) return text;
  const head = words.slice(0, 90).join(' ');
  const end = Math.max(head.lastIndexOf('. '), head.lastIndexOf('? '));
  return end > 200 ? head.slice(0, end + 1) : head + '…';
}
function psycCardP(p) {
  const pre = /preprint/.test(p.status);
  const link = pHttp(p.links?.doi) || pHttp(p.links?.landing);
  return `<article class="d-card d-new" data-cat="${P_ESC(p.category)}">
    <p class="d-kicker">${P_ESC(p.category)} · just published${pre ? ' · preprint, not peer reviewed' : ''}</p>
    <h3 class="d-head"><button type="button" class="d-open" data-open="${P_ESC(p.id)}">${P_ESC(p.title)}</button></h3>
    ${p.abstract ? `<p class="d-body"><span class="d-quote-mark">in the authors’ words, not checked by me:</span> ${P_ESC(psycExcerpt(p.abstract))}</p>` : '<p class="d-body d-listing">Only the listing so far. I haven’t seen what it found, so I won’t guess.</p>'}
    <p class="d-foot"><span class="d-source">${link ? pLink(link, `${P_ESC(psycBy(p))}, ${P_ESC((p.date || '').slice(0, 4))} ↗`) : `${P_ESC(psycBy(p))}, ${P_ESC((p.date || '').slice(0, 4))}`}</span>
      <span class="d-acts">${psycSaveBtn(p.id)}<button type="button" class="d-more" data-open="${P_ESC(p.id)}">${p.abstract ? 'the abstract →' : 'the listing →'}</button></span></p>
  </article>`;
}
const psycCard = x => x.cat ? psycCardD(x) : psycCardP(x);

// ---------------------------------------------------------------- the feed
function psycDrawFeed() {
  psycState.trail = [];
  const { filter } = psycState;
  layout('', '', `<div class="h-paper d-paper">
    <header class="h-masthead">
      <p class="h-mast-rule">a little magazine of things people found out</p>
      <h3 class="h-mast-title">the psyc paper</h3>
    </header>
    <div class="d-bar">
      <div class="d-filters" role="group" aria-label="show">${['all', ...P_CATS].map(c => `<button type="button" class="d-filter${filter === c ? ' on' : ''}" data-filter="${c}" ${c !== 'all' ? `data-cat="${c}"` : ''} aria-pressed="${filter === c}">${c}</button>`).join('')}</div>
      <div class="d-bar-right"><button type="button" class="d-link" id="pSurprise">surprise me</button><button type="button" class="d-link" id="pSavedLink">saved</button></div>
    </div>
    <div class="d-feed" id="pFeed"></div>
    <div class="d-end" id="pEnd"></div>
    ${psycFeed?.as_of ? `<p class="d-colophon">new papers looked up ${P_ESC(psycFeed.as_of)}. stories are checked by hand, so they change more slowly.</p>` : ''}
  </div>`);
  const root = document.querySelector('.d-paper');
  psycWireSaves(root); psycGuard(root);
  root.addEventListener('click', e => { const o = e.target.closest('[data-open]'); if (o) psycOpen(o.dataset.open); });
  $('#pSurprise').onclick = () => psycSurprise(false);
  $('#pSavedLink').onclick = () => { psycState.scroll = scrollY; psycGo('#psyc?saved'); };
  root.querySelectorAll('[data-filter]').forEach(b => b.onclick = () => {
    psycState.filter = b.dataset.filter; psycState.shown = PSYC_FIRST;
    root.querySelectorAll('[data-filter]').forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); });
    fill();
  });
  function fill() {
    const list = psycCompose(psycState.filter);
    $('#pFeed').innerHTML = list.slice(0, psycState.shown).map(psycCard).join('');
    $('#pEnd').innerHTML = psycState.shown < list.length
      ? '<button type="button" class="d-morebtn" id="pMore">more discoveries</button>'
      : '<p class="d-rest">that’s all that’s on the shelf for now.</p>';
    const more = $('#pMore');
    if (more) more.onclick = () => {
      const from = psycState.shown; psycState.shown += PSYC_MORE; fill();
      $('#pFeed').children[from]?.querySelector('.d-open')?.focus({ preventScroll: true });
    };
  }
  fill();
  const y = psycState.scroll;
  if (y) queueMicrotask(() => scrollTo({ top: y, behavior: 'instant' })); // runs just after render() has reset the scroll
}

// ---------------------------------------------------------------- a story
function psycTrailBar() {
  const trail = psycState.trail;
  const label = id => { const d = psycD(id), p = psycPaper(id), t = d ? d.head : p?.title || ''; const w = t.split(' '); return w.slice(0, 5).join(' ') + (w.length > 5 ? '…' : ''); };
  return `<nav class="d-trail" aria-label="the path you took">
    <button type="button" class="d-link d-backbtn" id="pBack">← back</button>
    <span class="d-crumbs"><button type="button" class="d-crumb" data-crumb="">the paper</button>${trail.map((id, i) => i === trail.length - 1 ? `<span class="d-sep">›</span><span class="d-crumb here" aria-current="page">${P_ESC(label(id))}</span>` : `<span class="d-sep">›</span><button type="button" class="d-crumb" data-crumb="${P_ESC(id)}">${P_ESC(label(id))}</button>`).join('')}</span>
  </nav>`;
}
function psycWireTrail() {
  const toFeed = () => psycGo('#psyc');
  $('#pBack').onclick = () => { const t = psycState.trail; if (t.length > 1) psycGo('#psyc?d=' + encodeURIComponent(t[t.length - 2])); else toFeed(); };
  document.querySelectorAll('[data-crumb]').forEach(b => b.onclick = () => b.dataset.crumb ? psycGo('#psyc?d=' + encodeURIComponent(b.dataset.crumb)) : toFeed());
}
function psycCiteText(text, refs) {
  return String(text).replace(/\[\[(\w+)(?:\|([^\]]+))?\]\]/g, (m, key, loc) => {
    if (!PSYC_BIB[key]) return '';
    if (!refs.includes(key)) refs.push(key);
    const n = refs.indexOf(key) + 1;
    return `<a class="h-cite" href="${P_ESC(pDoi(PSYC_BIB[key].doi))}" data-ref="${key}" title="${P_ESC(`${PSYC_BIB[key].short} (${PSYC_BIB[key].year})${loc ? ', ' + loc : ''}`)}">[${n}]</a>`;
  });
}
function psycReference(key) {
  const b = PSYC_BIB[key];
  const notices = (b.updates || []).map(u => pLink(pDoi(u.doi), u.type === 'retraction' ? 'retraction notice ↗' : u.type.replace(/_/g, ' ') + ' notice ↗')).join(' · ');
  return `<li id="dref-${key}">${b.apa} ${pLink(pDoi(b.doi), `doi:${P_ESC(b.doi)}`)}${pHttp(b.oa) ? ` · ${pLink(b.oa, 'free copy ↗')}` : ''}${notices ? ` · ${notices}` : ''}</li>`;
}
function psycCitedByNew(d) { return (psycFeed?.items || []).filter(p => (p.cites_collection || []).includes(d.id)); }
function psycHoles(d) {
  const curated = d.links.map(([to, rel, why]) => {
    const t = psycD(to);
    return `<li class="d-hole" data-cat="${t.cat}"><p class="d-rel">${P_ESC(P_REL[rel])}</p>
      <button type="button" class="d-hole-go" data-follow="${t.id}">${P_ESC(t.head)}</button><p class="d-why">${why}</p></li>`;
  });
  const fresh = psycCitedByNew(d).slice(0, 1).map(p => `<li class="d-hole" data-cat="${P_ESC(p.category)}"><p class="d-rel">a new paper that cites it</p>
      <button type="button" class="d-hole-go" data-follow="${P_ESC(p.id)}">${P_ESC(p.title)}</button><p class="d-why">Picked up from its reference list. Citing a paper does not mean agreeing with it, and I haven’t read this one.</p></li>`);
  return [...curated, ...fresh].join('');
}
const psycEvidence = d => d.level === 'checked' ? `${d.design}. checked against the paper itself.` : `${d.design}. from the abstract only; I haven’t checked the full text.`;
function psycDrawItem(id) {
  const d = psycD(id);
  if (d) return psycDrawStory(d);
  return psycDrawPaper(psycPaper(id));
}
function psycDrawStory(d) {
  const b = PSYC_BIB[d.bib], refs = [d.bib];
  const body = d.story.map(p => `<p class="d-para">${psycCiteText(p, refs)}</p>`).join('');
  const how = (d.how || []).map(p => `<p>${psycCiteText(p, refs)}</p>`).join('');
  const numbers = (d.numbers || []).map(p => `<p>${psycCiteText(p, refs)}</p>`).join('');
  const issue = d.digest && PSYC_ISSUES.find(i => i.id === d.digest);
  layout('', '', `<div class="h-paper d-paper d-story" data-cat="${d.cat}">
    ${psycTrailBar()}
    <article>
      <p class="d-kicker">${P_ESC([d.cat, d.note || ''].filter(Boolean).join(' · '))}</p>
      <h3 class="d-title">${P_ESC(d.head)}</h3>
      <p class="d-byline">${pLink(pDoi(b.doi), `${P_ESC(b.short)}, ${b.year} ↗`)}</p>
      ${d.retracted ? '<p class="d-retracted">This article has been retracted. It appears here only because the story of its failure is worth knowing.</p>' : ''}
      ${d.level === 'abstract' ? `<p class="d-para d-lede">${psycCiteText(d.card + ` [[${d.bib}|abstract]]`, refs)}</p>` : body}
      <p class="d-evidence">${P_ESC(psycEvidence(d))}</p>
      <div class="d-storyacts">${psycSaveBtn(d.id)}</div>
      <section class="d-holes"><h4 class="d-sec">where this goes next</h4><ul>${psycHoles(d)}</ul>
        <p class="d-holes-foot"><button type="button" class="d-link" id="pSurprise">somewhere completely different</button> <button type="button" class="d-link" id="pToFeed">back to the paper</button></p></section>
      <div class="d-extra">
        ${d.level === 'abstract' ? `<details><summary>what the abstract says, more exactly</summary><div class="d-detail">${body}</div></details>` : ''}
        ${how ? `<details><summary>how they did it</summary><div class="d-detail">${how}</div></details>` : ''}
        ${numbers ? `<details><summary>the precise results</summary><div class="d-detail">${numbers}</div></details>` : ''}
        ${issue ? `<details><summary>the longer digest</summary><div class="d-detail">${psycDigest(issue)}</div></details>` : ''}
        <details><summary>full references</summary><ol class="d-refs">${refs.map(psycReference).join('')}</ol></details>
      </div>
    </article>
  </div>`);
  psycWireStory();
}
function psycDrawPaper(p) {
  const link = pHttp(p.links?.doi) || pHttp(p.links?.landing), pre = /preprint/.test(p.status);
  const authors = (p.authors || []).join(', ') + (p.author_count > (p.authors || []).length ? ', and others' : '');
  const cited = (p.cites_collection || []).map(psycD).filter(Boolean).slice(0, 3);
  layout('', '', `<div class="h-paper d-paper d-story" data-cat="${P_ESC(p.category)}">
    ${psycTrailBar()}
    <article>
      <p class="d-kicker">${P_ESC(p.category)} · just published${pre ? ' · preprint, not peer reviewed' : ''}</p>
      <h3 class="d-title d-title-plain">${P_ESC(p.title)}</h3>
      <p class="d-byline">${P_ESC(authors)}${p.source ? ` · <em>${P_ESC(p.source)}</em>` : ''}${p.date ? ` · ${P_ESC(p.date)}` : ''}</p>
      ${p.abstract ? `<p class="d-para">${P_ESC(p.abstract)}</p><p class="d-evidence">this is the authors’ own abstract (${P_ESC(p.abstract_license || 'open licence')}), reproduced automatically. nobody has checked it against the full paper, and it is not a summary by me.</p>` : '<p class="d-para d-listing">Only the listing so far. I haven’t seen what it found, so I won’t guess.</p>'}
      <p class="d-paperlinks">${link ? pLink(link, 'read the original ↗') : ''}${pHttp(p.links?.oa) ? ` · ${pLink(p.links.oa, 'free copy ↗')}` : ''}</p>
      <div class="d-storyacts">${psycSaveBtn(p.id)}</div>
      <section class="d-holes"><h4 class="d-sec">where this goes next</h4>
        ${cited.length ? `<ul>${cited.map(t => `<li class="d-hole" data-cat="${t.cat}"><p class="d-rel">in its reference list</p><button type="button" class="d-hole-go" data-follow="${t.id}">${P_ESC(t.head)}</button><p class="d-why">This new paper cites it, according to its OpenAlex record. Citing a paper does not mean agreeing with it.</p></li>`).join('')}</ul>` : '<p class="d-why">No verified connection to anything here yet, so I’ve left this empty rather than invent one.</p>'}
        <p class="d-holes-foot"><button type="button" class="d-link" id="pSurprise">somewhere completely different</button> <button type="button" class="d-link" id="pToFeed">back to the paper</button></p></section>
    </article>
  </div>`);
  psycWireStory();
}
function psycWireStory() {
  const root = document.querySelector('.d-story');
  psycWireTrail(); psycWireSaves(root); psycGuard(root);
  root.querySelectorAll('[data-follow]').forEach(b => b.onclick = () => psycOpen(b.dataset.follow, true));
  $('#pSurprise').onclick = () => psycSurprise(true);
  $('#pToFeed').onclick = () => psycGo('#psyc');
}
// the original digests, kept whole for anyone who wants them; the quizzes are not shown
function psycCites(text, issue) {
  const keys = Object.keys(issue.sources);
  return String(text).replace(/\[\[([a-zA-Z0-9]+)(?:\|([^\]]+))?\]\]/g, (m, key, loc) => {
    const n = keys.indexOf(key) + 1;
    if (!n) return '';
    const bib = PSYC_BIB[issue.sources[key].bib];
    return `<a class="h-cite" href="#" data-src="${key}" title="${P_ESC(P_PLAIN(bib.apa) + (loc ? ' — ' + loc : ''))}">[${n}${loc ? ', ' + P_ESC(loc) : ''}]</a>`;
  });
}
function psycDigest(issue) {
  const c = t => psycCites(t, issue), t = issue.study.table;
  const para = p => `<p>${p.kind ? `<em>${P_ESC(p.kind)}:</em> ` : ''}${c(p.text)}${p.flag ? `<span class="p-flag"><strong>reader’s note:</strong> ${P_ESC(p.flag)}</span>` : ''}</p>`;
  return `<p>${P_ESC(issue.verification)}</p>
    <h5>the question</h5>${issue.question.map(para).join('')}
    <h5>inside the study</h5><p>${c(issue.study.intro)}</p>
    <div class="p-table-wrap"><table class="p-table"><thead><tr>${t.head.map(h => `<th>${P_ESC(h)}</th>`).join('')}</tr></thead><tbody>${t.rows.map(r => `<tr>${r.map(x => `<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    ${issue.study.notes.map(n => `<p>${c(n)}</p>`).join('')}
    <h5>what they found</h5>${issue.found.map(para).join('')}
    <h5>why it matters</h5>${issue.matters.map(para).join('')}
    <h5>${P_ESC(issue.connection.relation)}</h5><p>${c(issue.connection.text)}</p>
    <h5>digest sources</h5><ol class="d-refs">${Object.entries(issue.sources).map(([k, s]) => { const b = PSYC_BIB[s.bib]; return `<li id="psrc-${k}">${b.apa} ${pLink(pDoi(b.doi), `doi:${P_ESC(b.doi)}`)}</li>`; }).join('')}</ol>`;
}

// ---------------------------------------------------------------- saved
function psycDrawSaved() {
  const saved = pSaved(), st = pState(), board = pBoard();
  const ds = Object.keys(saved).map(psycD).filter(Boolean);
  const papers = Object.values(st.saved);
  const queue = Object.values(st.queue);
  const paperRow = s => { const l = pHttp(s.links?.doi) || pHttp(s.links?.oa); return `<li class="d-saved-row" data-sid="${P_ESC(s.id)}"><p class="d-saved-title">${psycPaper(s.id) ? `<button type="button" class="d-hole-go" data-open="${P_ESC(s.id)}">${P_ESC(s.title)}</button>` : P_ESC(s.title)}</p>
      <p class="d-why">${P_ESC((s.authors || []).slice(0, 3).join(', '))}${(s.authors || []).length > 3 ? ' and others' : ''}${typeof s.source === 'string' ? ` · ${P_ESC(s.source)}` : ''}${s.year ? ` · ${P_ESC(s.year)}` : ''}. a saved listing; not read or summarised here.</p>
      ${s.note ? `<p class="d-why">your note: ${P_ESC(s.note)}</p>` : ''}
      <p class="d-saved-acts">${l ? pLink(l, 'the original ↗') : ''} <button type="button" class="d-link" data-unsave="${P_ESC(s.id)}">remove</button></p></li>`; };
  layout('', '', `<div class="h-paper d-paper d-saved">
    <nav class="d-trail"><button type="button" class="d-link d-backbtn" id="pBack">← the paper</button></nav>
    <h3 class="d-title">saved</h3>
    ${ds.length || papers.length ? '' : '<p class="d-para">Nothing here yet. Tap “save” on anything you’d like to come back to.</p>'}
    <div class="d-feed" id="pSavedCards">${ds.map(psycCard).join('')}</div>
    ${papers.length ? `<ul class="d-saved-list">${papers.map(paperRow).join('')}</ul>` : ''}
    ${board.length || queue.length ? `<details class="d-older"><summary>from the older version of the paper</summary><div class="d-detail">
      ${board.map(k => `<div class="d-saved-row"><p class="d-rel">${P_ESC(k.kind)}${k.issueTitle ? ` · from “${P_ESC(k.issueTitle)}”` : ''}</p><p>${P_ESC(k.text)}</p>${k.note ? `<p class="d-why">your note: ${P_ESC(k.note)}</p>` : ''}${(k.citations || []).map(c => `<p class="d-why">${P_ESC(c.apa)}</p>`).join('')}</div>`).join('')}
      ${queue.map(q => `<div class="d-saved-row"><p class="d-rel">from your reading list</p><p class="d-saved-title">${P_ESC(q.title)}</p>${q.note ? `<p class="d-why">your note: ${P_ESC(q.note)}</p>` : ''}${pHttp(q.links?.doi) ? `<p class="d-why">${pLink(q.links.doi, 'the original ↗')}</p>` : ''}</div>`).join('')}
    </div></details>` : ''}
    <p class="d-colophon"><button type="button" class="d-link" id="pExport">keep a copy</button> <label class="d-link d-import">bring a copy back<input type="file" id="pImport" accept="application/json,.json" hidden></label> <span id="pMsg" aria-live="polite"></span></p>
  </div>`);
  const root = document.querySelector('.d-saved');
  psycWireSaves(root); psycGuard(root);
  root.addEventListener('click', e => { const o = e.target.closest('[data-open]'); if (o) psycOpen(o.dataset.open); });
  root.querySelectorAll('[data-unsave]').forEach(b => b.onclick = () => { const s = pState(); delete s.saved[b.dataset.unsave]; storage.set('psyc-feed-state', s); psycDrawSaved(); });
  $('#pBack').onclick = () => psycGo('#psyc');
  $('#pExport').onclick = () => {
    const text = JSON.stringify({ app: 'quiet time', kind: 'psyc-paper-notes', version: 2, exported: new Date().toISOString(), saved: pSaved(), kept: pBoard(), feedState: pState(), answers: pGet('psyc-answers', {}) }, null, 2);
    const u = URL.createObjectURL(new Blob([text], { type: 'application/json' })), a = document.createElement('a');
    a.href = u; a.download = 'psyc-paper-saved.json'; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 2000);
  };
  $('#pImport').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const d = JSON.parse(await f.text());
      if (d.kind !== 'psyc-paper-notes') throw new Error('not a psyc paper copy');
      const s = pSaved();
      for (const [id, v] of Object.entries(d.saved || {})) if (psycD(id) && !s[id] && typeof v === 'string') s[id] = v;
      storage.set('psyc-saved', s);
      const kept = pBoard(), ids = new Set(kept.map(k => k.id));
      (d.kept || []).filter(k => k && typeof k.id === 'string' && typeof k.text === 'string' && !ids.has(k.id)).forEach(k => kept.push({ ...k, citations: (k.citations || []).map(c => ({ apa: String(c.apa || ''), doi: String(c.doi || '') })) }));
      storage.set('psyc-board', kept);
      const st = pState(), inc = d.feedState || {};
      for (const k of ['saved', 'queue']) for (const [id, v] of Object.entries(inc[k] || {})) if (!st[k][id] && v && typeof v.title === 'string') st[k][id] = { ...v, links: { doi: /^https:\/\/doi\.org\//.test(v.links?.doi || '') ? v.links.doi : null, oa: pHttp(v.links?.oa) } };
      for (const k of ['read', 'dismissed']) for (const [id, v] of Object.entries(inc[k] || {})) st[k][id] ??= v;
      storage.set('psyc-feed-state', st);
      psycDrawSaved();
      $('#pMsg').textContent = 'brought back.';
    } catch (err) { $('#pMsg').textContent = 'that file could not be read: ' + err.message; }
  };
}
