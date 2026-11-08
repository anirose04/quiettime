/* Quiet Time — the psyc paper. Two sections that never mix their claims:
   - the literature: curated, verified digests (psyc-issues.js)
   - fresh off the press: a weekly discovery feed of bibliographic records (data/psyc-feed.json)
   Plus an archive (digests, kept findings, saved papers) and a review queue. Everything personal is stored locally. */
let psycView = { page: 'front', issue: null };
let psycFeed = null, psycFeedStatus = null, psycFeedError = null;
const P_ESC = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const P_PLAIN = html => { const d = document.createElement('div'); d.innerHTML = html; return d.textContent; };
const pGet = (k, d) => { const v = storage.get(k); return v ?? d; };
const pState = () => { const s = pGet('psyc-feed-state', {}); s.saved ??= {}; s.read ??= {}; s.dismissed ??= {}; s.queue ??= {}; return s; };
const pSaveState = s => storage.set('psyc-feed-state', s);
const pBoard = () => { const b = pGet('psyc-board', []); return Array.isArray(b) ? b : []; };
const pPrefs = () => ({ window: 90, sort: 'weighted', preprints: true, reviewsOnly: false, newlyOnly: false, showRead: true, showDismissed: false, ...pGet('psyc-feed-prefs', {}) });
const P_STATUS = {
  discovered: 'bibliographic record retrieved and checked enough to identify the work',
  reviewed: 'methods, results and discussion actually examined',
  'verified digest': 'summary checked against the article; every substantive claim cited'
};

// ---------------------------------------------------------------- shared helpers
function psycCites(text, issue) {
  const keys = Object.keys(issue.sources);
  return String(text).replace(/\[\[([a-zA-Z0-9]+)(?:\|([^\]]+))?\]\]/g, (m, key, loc) => {
    const n = keys.indexOf(key) + 1;
    if (!n) return '';
    const bib = PSYC_BIB[issue.sources[key].bib];
    return `<a class="h-cite" href="#" data-src="${key}" title="${P_ESC(P_PLAIN(bib.apa) + (loc ? ' — ' + loc : ''))}">[${n}${loc ? ', ' + P_ESC(loc) : ''}]</a>`;
  });
}
function psycGuard(root) {
  root.addEventListener('click', e => {
    const cite = e.target.closest('.h-cite');
    if (cite) {
      e.preventDefault();
      const t = document.getElementById('psrc-' + cite.dataset.src);
      if (t) { t.scrollIntoView({ behavior: 'smooth', block: 'center' }); t.classList.remove('flash'); void t.offsetWidth; t.classList.add('flash'); }
      return;
    }
    const a = e.target.closest('a[target="_blank"]');
    if (a && activeQuiet()) { e.preventDefault(); requestEarlyEnd(); }
  });
}
function psycNav(active) {
  const tabs = [['front', 'the literature'], ['feed', 'fresh off the press'], ['archive', 'archive'], ['queue', 'review queue']];
  return `<nav class="p-tabs" aria-label="psyc paper sections">${tabs.map(([k, l]) => `<button class="p-tab${active === k ? ' active' : ''}" data-ptab="${k}" type="button" ${active === k ? 'aria-current="page"' : ''}>${l}</button>`).join('')}</nav>`;
}
function psycWireNav() {
  document.querySelectorAll('[data-ptab]').forEach(b => b.onclick = () => { psycView = { page: b.dataset.ptab }; drawPsyc(); scrollTo({ top: 0 }); });
}
const pDoiLink = doi => doi ? `<a href="https://doi.org/${P_ESC(doi)}" target="_blank" rel="noopener noreferrer">doi:${P_ESC(doi)}</a>` : '';

function drawPsyc() {
  const p = psycView.page;
  if (p === 'issue' && PSYC_ISSUES.some(i => i.id === psycView.issue)) return drawPsycIssue(psycView.issue);
  if (p === 'feed') return drawPsycFeed();
  if (p === 'archive') return drawPsycArchive();
  if (p === 'queue') return drawPsycQueue();
  drawPsycFront();
}

// ---------------------------------------------------------------- the literature
function drawPsycFront() {
  psycView = { page: 'front' };
  layout('the psyc paper', '', `${psycNav('front')}
    <div class="h-paper p-front">
      <header class="h-masthead">
        <p class="h-mast-rule">the literature · verified digests · ${PSYC_ISSUES.length} issues</p>
        <h3 class="h-mast-title">the psyc paper</h3>
        <p class="h-mast-sub">one empirical article per issue: what was asked, how it was tested, what was actually found, and where it sits in the literature.</p>
      </header>
      <ol class="h-issue-list">${PSYC_ISSUES.map(i => { const b = PSYC_BIB[i.featured]; return `<li><button class="h-issue-link" data-issue="${i.id}" type="button">
        <span class="h-no">no. ${i.no}</span><span class="h-issue-title">${P_ESC(i.title)}</span>
        <span class="h-issue-kicker">${P_ESC(i.theme)} — ${P_ESC(i.kicker)}</span>
        <span class="h-issue-period">${P_PLAIN(b.apa).split(').')[0]}) · <span class="p-badge verified">${P_ESC(i.status)}</span></span></button></li>`; }).join('')}</ol>
      <p class="h-small p-vocab">${Object.entries(P_STATUS).map(([k, v]) => `<strong>${k}</strong>: ${v}`).join(' · ')}</p>
    </div>`);
  psycWireNav();
  document.querySelectorAll('[data-issue]').forEach(b => b.onclick = () => { psycView = { page: 'issue', issue: b.dataset.issue }; drawPsyc(); scrollTo({ top: 0 }); });
}

function drawPsycIssue(id) {
  const issue = PSYC_ISSUES.find(i => i.id === id);
  const c = t => psycCites(t, issue);
  const bib = PSYC_BIB[issue.featured];
  const answers = pGet('psyc-answers', {})[id] || {};
  const kept = new Set(pBoard().map(k => k.id));
  const keys = Object.keys(issue.sources);
  const para = p => `<p class="h-text${p.kind ? ' h-interp' : ''}">${p.kind ? `<span class="h-kind">${P_ESC(p.kind)}</span>` : ''}${c(p.text)}${p.flag ? `<span class="p-flag"><strong>reader’s note:</strong> ${P_ESC(p.flag)}</span>` : ''}</p>`;
  const t = issue.study.table;
  layout('the psyc paper', '', `${psycNav('front')}
    <div class="controls h-nav"><button class="pill" id="pBack" type="button">← all issues</button></div>
    <article class="h-paper p-issue" id="pIssue">
      <header class="h-issue-head">
        <p class="h-mast-rule">the psyc paper · no. ${issue.no} · ${P_ESC(issue.theme)}</p>
        <h3 class="h-headline">${P_ESC(issue.title)}</h3>
        <p class="h-kicker">${P_ESC(issue.kicker)}</p>
      </header>
      <div class="p-featured">
        <p class="p-ref">${bib.apa} ${pDoiLink(bib.doi)}</p>
        <p class="h-small">published online ${P_ESC(bib.online)} · journal issue ${P_ESC(bib.issue)} · ${P_ESC(bib.oa)}</p>
        <p class="h-small"><span class="p-badge verified">${P_ESC(issue.status)}</span> checked ${P_ESC(issue.verifiedOn)}. ${P_ESC(issue.verification)}</p>
      </div>
      <section class="h-sec"><h4 class="h-sec-label"><span>01</span> / the research question</h4>${issue.question.map(para).join('')}</section>
      <section class="h-sec"><h4 class="h-sec-label"><span>02</span> / inside the study</h4>
        <p class="h-text">${c(issue.study.intro)}</p>
        <div class="p-table-wrap"><table class="p-table"><thead><tr>${t.head.map(h => `<th>${P_ESC(h)}</th>`).join('')}</tr></thead>
        <tbody>${t.rows.map(r => `<tr>${r.map(x => `<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
        <p class="h-small">${c(t.cite)}</p>
        ${issue.study.notes.map(n => `<p class="h-text p-note">${c(n)}</p>`).join('')}
      </section>
      <section class="h-sec"><h4 class="h-sec-label"><span>03</span> / what they found</h4>${issue.found.map(para).join('')}</section>
      <section class="h-sec"><h4 class="h-sec-label"><span>04</span> / why it matters</h4>${issue.matters.map(para).join('')}</section>
      <section class="h-sec"><h4 class="h-sec-label"><span>05</span> / a little question</h4>
        ${issue.questions.map((q, qi) => `<div class="h-q" data-q="${qi}"><p class="h-q-text">${q.q}</p>
          <div class="h-options">${q.options.map((o, oi) => `<button class="h-opt" type="button" data-o="${oi}">${P_ESC(o)}</button>`).join('')}</div>
          <div class="h-explain" hidden></div></div>`).join('')}
      </section>
      <section class="h-sec"><h4 class="h-sec-label"><span>06</span> / the literature connection</h4>
        <p class="h-conn-title">${P_ESC(issue.connection.relation)}</p>
        <p class="p-ref">${PSYC_BIB[issue.connection.bib].apa} ${pDoiLink(PSYC_BIB[issue.connection.bib].doi)}</p>
        <p class="h-text">${c(issue.connection.text)}</p>
      </section>
      <section class="h-sec"><h4 class="h-sec-label"><span>07</span> / keep this</h4>
        <p class="h-small">one click saves it to your archive with its full citation. notes are optional.</p>
        <ul class="h-keep">${issue.keep.map(k => `<li><p class="h-small p-kind">${P_ESC(k.kind)}</p><p class="h-keep-text">${P_ESC(k.text)}</p>
          <button class="pill h-keep-btn${kept.has(k.id) ? ' active' : ''}" type="button" data-keep="${k.id}" aria-pressed="${kept.has(k.id)}">${kept.has(k.id) ? 'kept ✿' : 'keep'}</button></li>`).join('')}</ul>
      </section>
      <section class="h-sec" id="pNearby"><h4 class="h-sec-label">new research nearby</h4><p class="h-small">loading the discovery feed…</p></section>
      <section class="h-sec h-sources"><h4 class="h-sec-label">sources</h4>
        <ol>${keys.map(k => { const b = PSYC_BIB[issue.sources[k].bib]; return `<li id="psrc-${k}"><span class="h-src-type">${P_ESC(issue.sources[k].type)}</span> ${b.apa} ${pDoiLink(b.doi)}</li>`; }).join('')}</ol>
        <p class="h-small">locators name the study, section or page each claim was checked against. statistics are copied from the article text; values shown only in figures are not reported.</p>
      </section>
    </article>`);
  psycWireNav();
  $('#pBack').onclick = () => { psycView = { page: 'front' }; drawPsyc(); scrollTo({ top: 0 }); };
  const art = $('#pIssue');
  psycGuard(art);
  art.querySelectorAll('.h-q').forEach(box => {
    const qi = +box.dataset.q;
    box.querySelectorAll('.h-opt').forEach(b => b.onclick = () => {
      const all = pGet('psyc-answers', {}); all[id] = { ...(all[id] || {}), [qi]: +b.dataset.o }; storage.set('psyc-answers', all);
      psycShowAnswer(issue, box, qi, +b.dataset.o);
    });
    if (answers[qi] != null) psycShowAnswer(issue, box, qi, answers[qi]);
  });
  art.querySelectorAll('[data-keep]').forEach(b => b.onclick = () => {
    const k = issue.keep.find(x => x.id === b.dataset.keep);
    let board = pBoard();
    const has = board.some(x => x.id === k.id);
    board = has ? board.filter(x => x.id !== k.id) : [{
      id: k.id, kind: k.kind, text: k.text, issue: issue.id, issueNo: issue.no, issueTitle: issue.title,
      citations: k.cite.map(key => { const bb = PSYC_BIB[issue.sources[key].bib]; return { apa: P_PLAIN(bb.apa), doi: bb.doi }; }),
      tags: issue.tags, savedAt: new Date().toISOString().slice(0, 10), note: ''
    }, ...board];
    storage.set('psyc-board', board);
    b.classList.toggle('active', !has); b.setAttribute('aria-pressed', String(!has)); b.textContent = has ? 'keep' : 'kept ✿';
  });
  psycNearby(issue);
}
function psycShowAnswer(issue, box, qi, oi) {
  const q = issue.questions[qi];
  box.querySelectorAll('.h-opt').forEach((b, i) => { b.classList.toggle('right', i === q.answer); b.classList.toggle('chosen', i === oi); b.setAttribute('aria-pressed', String(i === oi)); });
  const ex = box.querySelector('.h-explain');
  ex.hidden = false;
  ex.innerHTML = `<p><strong>${oi === q.answer ? 'yes —' : 'not quite —'}</strong> ${psycCites(q.explain, issue)}</p><button class="textbtn h-again" type="button">ask me again</button>`;
  ex.querySelector('.h-again').onclick = () => {
    const all = pGet('psyc-answers', {}); if (all[issue.id]) { delete all[issue.id][qi]; storage.set('psyc-answers', all); }
    box.querySelectorAll('.h-opt').forEach(b => { b.classList.remove('right', 'chosen'); b.setAttribute('aria-pressed', 'false'); });
    ex.hidden = true; ex.innerHTML = '';
  };
}
async function psycNearby(issue) {
  const box = $('#pNearby');
  await psycLoadFeed();
  if (!box.isConnected) return;
  const ids = new Set([issue.featured, issue.connection.bib, ...Object.values(issue.sources).map(s => s.bib)].map(k => PSYC_BIB[k]).filter(Boolean));
  const keysWanted = new Set([...ids].map(b => Object.keys(PSYC_BIB).find(k => PSYC_BIB[k] === b)));
  const doisWanted = new Set([...ids].map(b => b.doi.toLowerCase()));
  const items = (psycFeed?.items || []).filter(it => it.connections.cites_foundational.some(k => keysWanted.has(k)) || it.connections.cites_collection.some(d => doisWanted.has(String(d).toLowerCase())));
  box.innerHTML = `<h4 class="h-sec-label">new research nearby</h4>
    <p class="h-small">recent papers from the discovery feed that cite this issue’s featured or foundational articles (OpenAlex citation records). <strong>discovered only</strong> — citing a paper does not mean agreeing with it, and none of these has been reviewed.</p>
    ${psycFeed ? (items.length ? `<div class="p-cards">${items.slice(0, 6).map(psycCard).join('')}</div>` : '<p class="h-small">no recent citing papers in the current feed.</p>') : `<p class="h-small">${P_ESC(psycFeedError || 'the feed is not available offline yet.')}</p>`}`;
  psycWireCards(box, () => psycNearby(issue));
  psycGuard(box);
}

// ---------------------------------------------------------------- fresh off the press
async function psycLoadFeed(force) {
  if (psycFeed && !force) return;
  try {
    const [f, s] = await Promise.all([fetch('data/psyc-feed.json', { cache: 'no-cache' }), fetch('data/psyc-feed-status.json', { cache: 'no-cache' })]);
    if (!f.ok) throw new Error('feed file not found (' + f.status + ')');
    psycFeed = await f.json();
    psycFeedStatus = s.ok ? await s.json() : null;
    psycFeedError = null;
  } catch (e) { psycFeedError = 'the discovery feed could not be loaded: ' + e.message; }
}
const pAge = d => Math.max(0, (Date.now() - new Date(d)) / 864e5);
function psycCard(it) {
  const st = pState();
  const saved = !!st.saved[it.id], read = !!st.read[it.id], queued = !!st.queue[it.id];
  const authors = it.authors.slice(0, 6).join(', ') + (it.author_count > 6 ? `, … (${it.author_count} authors)` : '');
  const d = it.dates;
  const dateLine = [
    d.online ? `online ${d.online}` : (d.openalex_publication ? `published ${d.openalex_publication}` : ''),
    d.online_first && d.issue ? `issue ${d.issue}` : '',
    it.newly_indexed ? `newly indexed ${d.indexed_openalex} (published earlier)` : ''
  ].filter(Boolean).join(' · ');
  const conn = [
    ...it.connections.cites_foundational.map(k => { const f = (psycFeed?.foundational || []).find(x => x.key === k); return `cites ${P_ESC(f ? f.label.split(',')[0] : k)}`; }),
    ...(it.connections.cites_collection.length ? [`cites ${it.connections.cites_collection.length} paper(s) in your collection`] : []),
    ...(it.flags.replication_in_title ? ['title describes a replication (not checked)'] : []),
    ...(it.versions?.preprint ? [`other version: ${/^10\./.test(String(it.versions.preprint)) ? `<a href="https://doi.org/${P_ESC(it.versions.preprint)}" target="_blank" rel="noopener noreferrer">${P_ESC(it.versions.preprint)}</a>` : P_ESC(it.versions.preprint)} (${P_ESC(it.versions.basis || '')})`] : []), ...(it.versions?.published_version ? [`published version: ${P_ESC(it.versions.published_version)}`] : []),
    ...(it.flags.update_notice ? [`publisher notice: ${P_ESC(it.flags.update_notice)}`] : [])
  ];
  return `<article class="p-card${read ? ' read' : ''}" data-id="${P_ESC(it.id)}">
    <p class="p-card-meta"><span class="p-badge">discovered</span> <span class="p-badge ${/not peer reviewed/.test(it.publication_status) ? 'pre' : ''}">${P_ESC(it.publication_status)}</span>${it.article_type !== 'article' && it.article_type !== 'preprint' ? ` <span class="p-badge kind">${P_ESC(it.article_type)}</span>` : ''}</p>
    <h4 class="p-card-title">${P_ESC(it.title)}</h4>
    <p class="p-card-line">${P_ESC(authors)}</p>
    <p class="p-card-line"><em>${P_ESC(it.source.name || 'source unknown')}</em>${dateLine ? ' · ' + P_ESC(dateLine) : ''}</p>
    <p class="p-card-line">${P_ESC(it.classification)}${it.article_type_basis && it.article_type !== 'article' && it.article_type !== 'preprint' ? ` type from ${P_ESC(it.article_type_basis)}.` : ''}</p>
    ${conn.length ? `<p class="p-card-line p-conn">${conn.join(' · ')}</p>` : ''}
    <p class="p-card-links">${it.links.doi ? `<a href="${P_ESC(it.links.doi)}" target="_blank" rel="noopener noreferrer">open original ↗</a>` : it.links.landing ? `<a href="${P_ESC(it.links.landing)}" target="_blank" rel="noopener noreferrer">open original ↗</a>` : ''}
      ${it.links.oa ? ` · <a href="${P_ESC(it.links.oa)}" target="_blank" rel="noopener noreferrer">open-access copy${it.links.oa_version ? ' (' + P_ESC(it.links.oa_version.replace('Version', ' version')) + ')' : ''} ↗</a>` : ''}</p>
    <div class="p-actions">
      <button class="textbtn" data-act="save" type="button" aria-pressed="${saved}">${saved ? 'saved ✿' : 'save'}</button>
      <button class="textbtn" data-act="read" type="button" aria-pressed="${read}">${read ? 'read ✓' : 'mark read'}</button>
      <button class="textbtn" data-act="queue" type="button" aria-pressed="${queued}">${queued ? 'in review queue' : 'add to review queue'}</button>
      <button class="textbtn" data-act="dismiss" type="button">${st.dismissed[it.id] ? 'undismiss' : 'dismiss'}</button>
    </div>
  </article>`;
}
function psycSnapshot(it) {
  return { id: it.id, doi: it.doi, title: it.title, authors: it.authors, author_count: it.author_count, source: it.source.name, year: (it.dates.primary || '').slice(0, 4), date: it.dates.primary, publication_status: it.publication_status, article_type: it.article_type, links: it.links, classification: it.classification, status: 'discovered' };
}
function psycWireCards(root, rerender) {
  root.querySelectorAll('.p-card [data-act]').forEach(b => b.onclick = () => {
    const id = b.closest('.p-card').dataset.id;
    const it = (psycFeed?.items || []).find(x => x.id === id) || Object.values(pState().saved).find(x => x.id === id);
    const st = pState(); const act = b.dataset.act;
    if (act === 'save') st.saved[id] ? delete st.saved[id] : (st.saved[id] = { ...psycSnapshot(it), savedAt: new Date().toISOString().slice(0, 10), note: '' });
    if (act === 'read') st.read[id] ? delete st.read[id] : (st.read[id] = new Date().toISOString().slice(0, 10));
    if (act === 'dismiss') st.dismissed[id] ? delete st.dismissed[id] : (st.dismissed[id] = new Date().toISOString().slice(0, 10));
    if (act === 'queue') st.queue[id] ? delete st.queue[id] : (st.queue[id] = { ...psycSnapshot(it), queuedAt: new Date().toISOString().slice(0, 10), stage: 'queued', note: '' });
    pSaveState(st);
    rerender();
  });
}
async function drawPsycFeed() {
  psycView = { page: 'feed' };
  layout('the psyc paper', '', `${psycNav('feed')}<div class="h-paper p-feed"><p class="h-small">loading…</p></div>`);
  psycWireNav();
  await psycLoadFeed();
  if (psycView.page !== 'feed') return;
  const pr = pPrefs();
  const st = pState();
  const status = psycFeedStatus || {};
  const lastOk = status.last_success || psycFeed?.generated_at;
  const stale = lastOk ? Math.floor(pAge(lastOk)) : null;
  const notice = !psycFeed ? `<p class="p-notice">${P_ESC(psycFeedError)}</p>` :
    `${status.ok === false ? `<p class="p-notice">the last refresh attempt (${P_ESC((status.last_attempt || '').slice(0, 10))}) failed: ${P_ESC(status.error || 'unknown error')}. showing the previous feed.</p>` : ''}
     ${stale != null && stale > 10 ? `<p class="p-notice">this list was last updated ${stale} days ago and may not be current.</p>` : ''}`;
  const box = document.querySelector('.p-feed');
  box.innerHTML = `
    <header class="h-masthead">
      <p class="h-mast-rule">fresh off the press · discovery feed · ${psycFeed ? `last successful update ${P_ESC((lastOk || '').slice(0, 10))}` : 'not loaded'}</p>
      <h3 class="h-mast-title p-feed-title">fresh off the press</h3>
      <p class="h-mast-sub">recent papers matched to your watchlists. every card is a <strong>discovered</strong> bibliographic record — not reviewed, not summarised.</p>
    </header>
    ${notice}
    <div class="p-controls">
      <fieldset class="p-seg"><legend>published within</legend>${[30, 90, 180].map(n => `<label><input type="radio" name="pWin" value="${n}" ${pr.window === n ? 'checked' : ''}> ${n} days</label>`).join('')}</fieldset>
      <label class="p-ctl">sort <select id="pSort" class="pill">${[['weighted', 'relevance-weighted recent'], ['newest', 'newest publication'], ['discovered', 'recently discovered'], ['relevance', 'relevance to my topics'], ['author', 'author'], ['journal', 'journal']].map(([v, l]) => `<option value="${v}" ${pr.sort === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <input id="pSearch" class="pill h-search" type="search" placeholder="search titles, authors, journals" aria-label="search the feed">
      <div class="p-checks">
        <label><input type="checkbox" id="pPre" ${pr.preprints ? 'checked' : ''}> include preprints</label>
        <label><input type="checkbox" id="pRev" ${pr.reviewsOnly ? 'checked' : ''}> reviews and meta-analyses only</label>
        <label><input type="checkbox" id="pNew" ${pr.newlyOnly ? 'checked' : ''}> newly indexed only</label>
        <label><input type="checkbox" id="pShowRead" ${pr.showRead ? 'checked' : ''}> show read</label>
        <label><input type="checkbox" id="pShowDis" ${pr.showDismissed ? 'checked' : ''}> show dismissed</label>
      </div>
    </div>
    <p class="h-small" id="pCount"></p>
    <div class="p-cards" id="pCards"></div>
    <p class="h-small p-provenance">sources: OpenAlex (search, citations, open-access locations), Crossref (online, issue and deposit dates; preprint relations), PubMed (publication types). relevance is a match to your watchlists, not a judgment of quality; recency and citation counts are not quality signals either.</p>`;
  const savePr = patch => storage.set('psyc-feed-prefs', { ...pPrefs(), ...patch });
  box.querySelectorAll('input[name="pWin"]').forEach(r => r.onchange = () => { savePr({ window: +r.value }); renderList(); });
  $('#pSort').onchange = e => { savePr({ sort: e.target.value }); renderList(); };
  [['pPre', 'preprints'], ['pRev', 'reviewsOnly'], ['pNew', 'newlyOnly'], ['pShowRead', 'showRead'], ['pShowDis', 'showDismissed']].forEach(([id, k]) => $('#' + id).onchange = e => { savePr({ [k]: e.target.checked }); renderList(); });
  $('#pSearch').oninput = renderList;
  psycGuard(box);
  function renderList() {
    if (!psycFeed) return;
    const p = pPrefs(), s = pState(), q = ($('#pSearch').value || '').trim().toLowerCase();
    const inFeed = new Set(psycFeed.items.map(i => i.doi || i.openalex));
    let list = psycFeed.items.filter(it =>
      !(it.versions?.published_version && inFeed.has(String(it.versions.published_version).toLowerCase())) &&
      (it.newly_indexed ? true : pAge(it.dates.primary) <= p.window) &&
      (p.preprints || !/not peer reviewed/.test(it.publication_status)) &&
      (!p.reviewsOnly || ['review', 'meta-analysis', 'systematic review'].includes(it.article_type)) &&
      (!p.newlyOnly || it.newly_indexed) &&
      (p.showRead || !s.read[it.id]) && (p.showDismissed || !s.dismissed[it.id]) &&
      (!q || [it.title, it.authors.join(' '), it.source.name, it.classification].join(' ').toLowerCase().includes(q)));
    const by = {
      weighted: (a, b) => b.relevance.score / (1 + pAge(b.dates.primary) / 60) - a.relevance.score / (1 + pAge(a.dates.primary) / 60),
      newest: (a, b) => String(b.dates.primary).localeCompare(String(a.dates.primary)),
      discovered: (a, b) => String(b.discovered_at).localeCompare(String(a.discovered_at)) || b.relevance.score - a.relevance.score,
      relevance: (a, b) => b.relevance.score - a.relevance.score,
      author: (a, b) => String(a.authors[0] || '').split(' ').pop().localeCompare(String(b.authors[0] || '').split(' ').pop()),
      journal: (a, b) => String(a.source.name || '~').localeCompare(String(b.source.name || '~'))
    };
    list.sort(by[p.sort] || by.weighted);
    $('#pCount').textContent = `${list.length} of ${psycFeed.items.length} papers shown.`;
    $('#pCards').innerHTML = list.length ? list.map(psycCard).join('') : '<p class="h-small">nothing matches these filters.</p>';
    psycWireCards($('#pCards'), renderList);
  }
  renderList();
}

// ---------------------------------------------------------------- archive
function psycArchiveEntries() {
  const st = pState();
  const digests = PSYC_ISSUES.map(i => ({ type: 'digest', status: i.status, id: 'digest:' + i.id, title: i.title, text: P_PLAIN(PSYC_BIB[i.featured].apa), year: PSYC_BIB[i.featured].year, tags: i.tags, issue: i.id, doi: PSYC_BIB[i.featured].doi }));
  const kept = pBoard().map(k => ({ type: 'kept', status: 'from a verified digest', id: k.id, title: k.kind, text: k.text, year: null, tags: k.tags, issue: k.issue, citations: k.citations, note: k.note }));
  const saved = Object.values(st.saved).map(s => ({ type: 'saved', status: st.queue[s.id]?.stage === 'reviewed' ? 'reviewed' : 'discovered', id: s.id, title: s.title, text: `${s.authors.slice(0, 3).join(', ')}${s.author_count > 3 ? ' et al.' : ''} · ${s.source || ''}`, year: +s.year || null, tags: { topic: [s.classification.replace(/^topic match: /, '').split(/[;(]/)[0].trim()], authors: s.authors.map(a => a.split(' ').pop()), framework: [], method: [] }, doi: s.doi, note: s.note }));
  return [...digests, ...kept, ...saved];
}
function psycAPA(s) {
  const au = s.authors.map(a => { const parts = a.split(' '); const last = parts.pop(); return `${last}, ${parts.map(p => p[0] + '.').join(' ')}`; });
  const list = au.length > 1 ? au.slice(0, -1).join(', ') + ', & ' + au.at(-1) : au[0];
  return `${list}${s.author_count > s.authors.length ? ', et al.' : ''} (${s.year || 'n.d.'}). ${s.title}. ${s.source || ''}.${s.doi ? ' https://doi.org/' + s.doi : ''} [discovered; not reviewed]`;
}
function drawPsycArchive() {
  psycView = { page: 'archive' };
  layout('the psyc paper', '', `${psycNav('archive')}
    <div class="h-paper p-archive">
      <header class="h-masthead"><p class="h-mast-rule">archive · digests, kept findings and saved papers</p><h3 class="h-mast-title p-feed-title">the archive</h3></header>
      <div class="p-controls">
        <input id="aSearch" class="pill h-search" type="search" placeholder="search the archive" aria-label="search the archive">
        <label class="p-ctl">organise by <select id="aGroup" class="pill">${[['none', 'nothing'], ['topic', 'research topic'], ['authors', 'author'], ['year', 'publication year'], ['framework', 'theoretical framework'], ['method', 'methodological approach']].map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></label>
      </div>
      <div id="aList"></div>
      <div class="h-sec"><h4 class="h-sec-label">bibliography and backups</h4>
        <div class="controls"><button class="pill" id="aBib" type="button">download bibliography (.txt)</button><button class="pill" id="aExport" type="button">export notes (.json)</button><label class="pill h-import">import<input type="file" id="aImport" accept="application/json,.json" hidden></label><button class="pill" id="aDois" type="button">copy DOIs for the related watchlist</button></div>
        <p class="h-small" id="aMsg" aria-live="polite"></p>
      </div>
    </div>`);
  psycWireNav();
  const render = () => {
    const q = $('#aSearch').value.trim().toLowerCase(), g = $('#aGroup').value;
    const entries = psycArchiveEntries().filter(e => !q || [e.title, e.text, e.note, ...(e.tags?.topic || []), ...(e.tags?.authors || [])].join(' ').toLowerCase().includes(q));
    const groups = new Map();
    for (const e of entries) {
      const keys = g === 'none' ? ['all'] : g === 'year' ? [String(e.year || 'year unknown')] : (e.tags?.[g]?.length ? e.tags[g] : ['unclassified']);
      for (const k of keys) { if (!groups.has(k)) groups.set(k, []); groups.get(k).push(e); }
    }
    $('#aList').innerHTML = entries.length ? [...groups.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0]))).map(([k, list]) => `
      ${g === 'none' ? '' : `<h4 class="h-sec-label p-group">${P_ESC(k)}</h4>`}
      ${list.map(e => `<div class="p-arch" data-aid="${P_ESC(e.id)}" data-atype="${e.type}">
        <p class="p-card-meta"><span class="p-badge ${e.type === 'digest' || e.type === 'kept' ? 'verified' : ''}">${P_ESC(e.status)}</span> <span class="h-small">${e.type === 'digest' ? 'digest' : e.type === 'kept' ? 'kept from no. ' + P_ESC(PSYC_ISSUES.find(i => i.id === e.issue)?.no || '') : 'saved paper'}</span></p>
        <p class="p-arch-title">${e.type === 'digest' ? `<button class="textbtn p-open" data-issue="${e.issue}" type="button">${P_ESC(e.title)}</button>` : P_ESC(e.title)}</p>
        <p class="h-small">${P_ESC(e.text)}</p>
        ${e.citations ? `<p class="h-small">${e.citations.map(c => P_ESC(c.apa)).join(' · ')}</p>` : ''}
        ${e.type !== 'digest' ? `<textarea class="h-note" rows="2" placeholder="a note, if you like" aria-label="optional note">${P_ESC(e.note || '')}</textarea><button class="textbtn p-remove" type="button">remove</button>` : ''}
      </div>`).join('')}`).join('') : '<p class="h-small">nothing here yet. keep findings from digests or save papers from the feed.</p>';
    $('#aList').querySelectorAll('.p-open').forEach(b => b.onclick = () => { psycView = { page: 'issue', issue: b.dataset.issue }; drawPsyc(); scrollTo({ top: 0 }); });
    $('#aList').querySelectorAll('.p-arch').forEach(row => {
      const id = row.dataset.aid, type = row.dataset.atype;
      row.querySelector('.h-note')?.addEventListener('change', e => {
        if (type === 'kept') { const b = pBoard(); const k = b.find(x => x.id === id); if (k) { k.note = e.target.value; storage.set('psyc-board', b); } }
        else { const s = pState(); if (s.saved[id]) { s.saved[id].note = e.target.value; pSaveState(s); } }
      });
      row.querySelector('.p-remove')?.addEventListener('click', () => {
        if (type === 'kept') storage.set('psyc-board', pBoard().filter(x => x.id !== id));
        else { const s = pState(); delete s.saved[id]; pSaveState(s); }
        render();
      });
    });
  };
  $('#aSearch').oninput = render; $('#aGroup').onchange = render;
  const download = (text, name, type) => { const blob = new Blob([text], { type }); const u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 2000); };
  $('#aBib').onclick = () => {
    const st = pState();
    const verified = [...new Set(PSYC_ISSUES.flatMap(i => Object.values(i.sources).map(s => s.bib)))].map(k => P_PLAIN(PSYC_BIB[k].apa) + ' https://doi.org/' + PSYC_BIB[k].doi);
    const saved = Object.values(st.saved).map(psycAPA);
    download(['the psyc paper — bibliography', '', 'cited in verified digests:', ...verified.sort(), '', 'saved from the discovery feed (discovered; not reviewed):', ...saved.sort()].join('\n'), 'psyc-paper-bibliography.txt', 'text/plain');
  };
  $('#aExport').onclick = () => download(JSON.stringify({ app: 'quiet time', kind: 'psyc-paper-notes', version: 1, exported: new Date().toISOString(), kept: pBoard(), feedState: pState(), answers: pGet('psyc-answers', {}) }, null, 2), 'psyc-paper-notes.json', 'application/json');
  $('#aImport').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const d = JSON.parse(await f.text());
      if (d.kind !== 'psyc-paper-notes') throw new Error('not a psyc paper backup');
      const board = pBoard(), ids = new Set(board.map(b => b.id));
      (d.kept || []).filter(k => k && typeof k.id === 'string' && typeof k.text === 'string' && !ids.has(k.id)).forEach(k => board.push({ ...k, citations: (k.citations || []).map(c => ({ apa: String(c.apa || ''), doi: String(c.doi || '') })) }));
      storage.set('psyc-board', board);
      const st = pState(), inc = d.feedState || {};
      const okStr = v => typeof v === 'string';
      for (const k of ['saved', 'queue']) for (const [id, v] of Object.entries(inc[k] || {})) if (!st[k][id] && v && okStr(v.title)) st[k][id] = { ...v, links: { doi: /^https:\/\/doi\.org\//.test(v.links?.doi || '') ? v.links.doi : null, oa: /^https?:\/\//.test(v.links?.oa || '') ? v.links.oa : null } };
      for (const k of ['read', 'dismissed']) for (const [id, v] of Object.entries(inc[k] || {})) st[k][id] ??= v;
      pSaveState(st);
      $('#aMsg').textContent = 'backup merged.'; render();
    } catch (err) { $('#aMsg').textContent = 'that file could not be imported: ' + err.message; }
    e.target.value = '';
  };
  $('#aDois').onclick = async () => {
    const dois = [...new Set([...Object.values(pState().saved).map(s => s.doi), ...PSYC_ISSUES.map(i => PSYC_BIB[i.featured].doi)].filter(Boolean))];
    const text = JSON.stringify(dois, null, 2);
    try { await navigator.clipboard.writeText(text); $('#aMsg').textContent = `copied ${dois.length} DOIs — paste them into "related" → "dois" in data/psyc-watchlists.json.`; }
    catch { $('#aMsg').textContent = text; }
  };
  render();
}

// ---------------------------------------------------------------- review queue
function drawPsycQueue() {
  psycView = { page: 'queue' };
  const st = pState();
  const list = Object.values(st.queue);
  layout('the psyc paper', '', `${psycNav('queue')}
    <div class="h-paper p-queue">
      <header class="h-masthead"><p class="h-mast-rule">review queue · from discovery to a verified digest</p><h3 class="h-mast-title p-feed-title">review queue</h3>
      <p class="h-mast-sub">a paper moves on only when someone has actually read it. ${Object.entries(P_STATUS).map(([k, v]) => `<strong>${k}</strong>: ${v}.`).join(' ')}</p></header>
      ${list.length ? list.map(q => `<div class="p-arch" data-qid="${P_ESC(q.id)}">
        <p class="p-card-meta"><span class="p-badge${q.stage === 'reviewed' ? ' verified' : ''}">${q.stage === 'reviewed' ? 'reviewed' : 'discovered'}</span> <span class="h-small">queued ${P_ESC(q.queuedAt)}${q.reviewedAt ? ' · reviewed ' + P_ESC(q.reviewedAt) : ''}</span></p>
        <p class="p-arch-title">${P_ESC(q.title)}</p>
        <p class="h-small">${P_ESC(psycAPA(q).replace(' [discovered; not reviewed]', ''))}</p>
        <p class="p-card-links">${q.links?.doi ? `<a href="${P_ESC(q.links.doi)}" target="_blank" rel="noopener noreferrer">open original ↗</a>` : ''}${q.links?.oa ? ` · <a href="${P_ESC(q.links.oa)}" target="_blank" rel="noopener noreferrer">open-access copy ↗</a>` : ''}</p>
        <textarea class="h-note" rows="3" placeholder="reading notes: design, key results, limitations (optional)" aria-label="reading notes">${P_ESC(q.note || '')}</textarea>
        <div class="p-actions">${q.stage === 'reviewed' ? '<button class="textbtn" data-q="unreview" type="button">undo reviewed</button>' : '<button class="textbtn" data-q="review" type="button">mark reviewed…</button>'}
          <button class="textbtn" data-q="draft" type="button">export for a digest draft</button><button class="textbtn" data-q="remove" type="button">remove from queue</button></div>
      </div>`).join('') : '<p class="h-small">the queue is empty. add papers from “fresh off the press”.</p>'}
      <p class="h-small">a “digest draft” export bundles the bibliographic record and your notes. it is <em>not</em> a verified digest: verified digests are written separately, checked claim by claim against the article, and added to the literature by hand.</p>
    </div>`);
  psycWireNav();
  const root = document.querySelector('.p-queue');
  psycGuard(root);
  root.querySelectorAll('[data-qid]').forEach(row => {
    const id = row.dataset.qid;
    row.querySelector('.h-note').onchange = e => { const s = pState(); if (s.queue[id]) { s.queue[id].note = e.target.value; pSaveState(s); } };
    row.querySelectorAll('[data-q]').forEach(b => b.onclick = () => {
      const s = pState(), q = s.queue[id]; if (!q) return;
      if (b.dataset.q === 'review') {
        if (!confirm('mark as reviewed only after reading the methods, results and discussion of the full article. continue?')) return;
        q.stage = 'reviewed'; q.reviewedAt = new Date().toISOString().slice(0, 10);
      }
      if (b.dataset.q === 'unreview') { q.stage = 'queued'; delete q.reviewedAt; }
      if (b.dataset.q === 'remove') delete s.queue[id];
      if (b.dataset.q === 'draft') {
        const blob = new Blob([JSON.stringify({ kind: 'psyc-digest-draft', status: q.stage === 'reviewed' ? 'reviewed' : 'discovered', note: 'draft input only — a verified digest requires claim-level checking against the article', record: q }, null, 2)], { type: 'application/json' });
        const u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = 'digest-draft-' + (q.doi || q.id).replace(/[^a-z0-9]+/gi, '-') + '.json'; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 2000);
        return;
      }
      pSaveState(s); drawPsycQueue();
    });
  });
}
