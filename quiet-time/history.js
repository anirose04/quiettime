/* Quiet Time — the history paper: a little magazine of things people wrote down.
   One feed. Every hand-written story (history-discoveries.js) carries a period text checked word for word.
   New papers (data/history-feed.json, refreshed weekly) appear sparingly: only the authors' own open-licence
   abstract or the bare listing. Nothing automated ever writes a finding.
   Routes: #history, #history?d=<id>, #history?saved. The older issues live on inside their stories, and
   everything personal stays on this device. */
const HIST_FIRST = 7, HIST_MORE = 6;
const H_CATS = { everyday: 'everyday life', ideas: 'ideas and science', power: 'power and politics' };
const H_REL = { same: 'the same events, from another side', linked: 'a documented connection', debate: 'part of the same argument', idea: 'same idea, different setting', cousin: 'a thematic cousin (no direct link)' };
let histState = { filter: 'all', shown: HIST_FIRST, scroll: 0, trail: [] };
let histFeed = null, histFeedTried = false;
const H_ESC = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const H_PLAIN = html => { const d = document.createElement('div'); d.innerHTML = html; return d.textContent; };
const hHttp = u => /^https?:\/\//.test(u || '') ? u : null;
const hLink = (href, text) => `<a href="${H_ESC(href)}" target="_blank" rel="noopener noreferrer">${text}</a>`;
const historyBoard = () => { const b = storage.get('history-board'); return Array.isArray(b) ? b : []; };
const histSaved = () => { const s = storage.get('history-saved'); return s && typeof s === 'object' ? s : {}; };
const histD = id => HISTORY_DISCOVERIES.find(d => d.id === id);
const histPaper = id => histFeed?.items?.find(p => p.id === id);
const histIssue = d => d.issue ? HISTORY_ISSUES.find(i => i.id === d.issue) : null;
const histSource = (d, key) => histIssue(d)?.sources[key] || HISTORY_SOURCES[key];

// ---------------------------------------------------------------- routing
function histGo(hash) { if (location.hash === hash) render('history'); else location.hash = hash; }
function histOpen(id, follow) {
  if (!document.querySelector('.d-story') && !document.querySelector('.d-saved')) histState.scroll = scrollY;
  histState.trail = follow ? [...histState.trail, id] : [id];
  histGo('#history?d=' + encodeURIComponent(id));
}
function histSurprise(follow) {
  const pool = HISTORY_DISCOVERIES.filter(d => !histState.trail.includes(d.id));
  histOpen(pool[Math.floor(Math.random() * pool.length)].id, follow);
}
async function drawHistory() {
  if (!histFeedTried) {
    histFeedTried = true;
    layout('', '', '<div class="h-paper d-paper"><p class="h-small">unfolding the paper…</p></div>');
    try {
      const r = await fetch('data/history-feed.json', { cache: 'no-cache', signal: AbortSignal.timeout(3000) });
      if (r.ok) histFeed = await r.json();
    } catch { /* the bundled stories are enough on their own */ }
    if (!Array.isArray(histFeed?.items)) histFeed = null;
    else histFeed.items = histFeed.items.filter(p => p.title && H_CATS[p.category]);
    if (location.hash.startsWith('#history')) render('history'); // a full render keeps the quiet-session panel
    return;
  }
  const q = location.hash.split('?')[1] || '';
  if (q === 'saved') return histDrawSaved();
  if (q.startsWith('d=')) {
    const id = decodeURIComponent(q.slice(2));
    if (histD(id) || histPaper(id)) {
      const at = histState.trail.indexOf(id);
      histState.trail = at >= 0 ? histState.trail.slice(0, at + 1) : [...histState.trail, id];
      return histD(id) ? histDrawStory(histD(id)) : histDrawPaper(histPaper(id));
    }
  }
  histDrawFeed();
}
// outside links never reach past a quiet session; inline citations open the source list
function histGuard(root) {
  root.addEventListener('click', e => {
    const ref = e.target.closest('[data-hsrc]');
    if (ref) {
      e.preventDefault();
      const t = document.getElementById('hsrc-' + ref.dataset.hsrc);
      if (t) { let p = t.closest('details'); while (p) { p.open = true; p = p.parentElement.closest('details'); } t.scrollIntoView({ behavior: 'smooth', block: 'center' }); t.classList.remove('flash'); void t.offsetWidth; t.classList.add('flash'); }
      return;
    }
    const a = e.target.closest('a[target="_blank"]');
    if (a && activeQuiet()) { e.preventDefault(); requestEarlyEnd(); }
  });
}
function histWire(root) {
  histGuard(root);
  root.addEventListener('click', e => {
    const s = e.target.closest('[data-hsave]');
    if (s) { const on = histToggleSave(s.dataset.hsave); s.classList.toggle('on', on); s.setAttribute('aria-pressed', String(on)); s.textContent = on ? 'saved ✿' : 'save'; return; }
    const o = e.target.closest('[data-hopen]');
    if (o) histOpen(o.dataset.hopen);
    const f = e.target.closest('[data-hfollow]');
    if (f) histOpen(f.dataset.hfollow, true);
  });
}
const histSaveBtn = id => { const on = !!histSaved()[id]; return `<button class="d-save${on ? ' on' : ''}" type="button" data-hsave="${H_ESC(id)}" aria-pressed="${on}">${on ? 'saved ✿' : 'save'}</button>`; };
function histToggleSave(id) {
  const s = histSaved();
  if (s[id]) delete s[id];
  else {
    const p = histPaper(id), today = new Date().toISOString().slice(0, 10);
    s[id] = p ? { savedAt: today, title: p.title, authors: p.authors, source: p.source, date: p.date, link: p.links?.doi || p.links?.landing || null } : today;
  }
  storage.set('history-saved', s);
  return !!s[id];
}

// ---------------------------------------------------------------- what goes in the paper
// same order all week; balanced across kinds of history, with new papers kept to a quiet minority
function histCompose(filter) {
  const now = new Date();
  let a = now.getFullYear() * 100 + Math.floor((now - new Date(now.getFullYear(), 0, 1)) / 6048e5) + 7;
  const rand = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const shuffle = l => { const o = [...l]; for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } return o; };
  const cats = filter === 'all' ? shuffle(Object.keys(H_CATS)) : [filter];
  const pools = Object.fromEntries(cats.map(c => [c, shuffle(HISTORY_DISCOVERIES.filter(d => d.cat === c))]));
  const papers = (histFeed?.items || []).filter(p => cats.includes(p.category));
  const raw = [...shuffle(papers.filter(p => p.abstract)), ...shuffle(papers.filter(p => !p.abstract))];
  const related = (x, y) => !!x?.links?.some && !!y?.links?.some && (x.links.some(l => l[0] === y.id) || y.links.some(l => l[0] === x.id));
  const out = [];
  for (let n = 0; ; n++) {
    let item = null;
    if (n % 8 === 5 && raw.length) item = raw.shift();
    else for (const c of [cats[n % cats.length], ...cats]) {
      const pool = pools[c];
      if (!pool.length) continue;
      const i = pool.findIndex(x => !related(x, out.at(-1)));
      item = pool.splice(i >= 0 ? i : 0, 1)[0];
      break;
    }
    item ??= raw.shift();
    if (!item) return out;
    out.push(item);
  }
}

// ---------------------------------------------------------------- cards
function histCardD(d) {
  const src = histSource(d, d.main), by = d.excerpt?.by || histIssue(d)?.bookshelf.author || '';
  return `<article class="d-card" data-cat="${d.cat}">
    <p class="d-kicker">${H_ESC(H_CATS[d.cat])} · ${H_ESC(d.when)}</p>
    <h3 class="d-head"><button type="button" class="d-open" data-hopen="${d.id}">${H_ESC(d.head)}</button></h3>
    <p class="d-body">${d.card}</p>
    <p class="d-foot"><span class="d-source">${hLink(src.url, `${H_ESC(by)} ↗`)}</span>
      <span class="d-acts">${histSaveBtn(d.id)}<button type="button" class="d-more" data-hopen="${d.id}">the story and the text →</button></span></p>
  </article>`;
}
function histCardP(p) {
  const link = hHttp(p.links?.doi) || hHttp(p.links?.landing);
  const words = String(p.abstract || '').split(/\s+/);
  const excerpt = words.length > 80 ? words.slice(0, 80).join(' ') + '…' : p.abstract;
  const by = `${H_ESC((p.authors || [])[0] || 'author unknown')}${(p.author_count || 0) > 1 ? ' and others' : ''}, ${H_ESC((p.date || '').slice(0, 4))}`;
  return `<article class="d-card d-new" data-cat="${H_ESC(p.category)}">
    <p class="d-kicker">${H_ESC(H_CATS[p.category])} · new scholarship</p>
    <h3 class="d-head"><button type="button" class="d-open" data-hopen="${H_ESC(p.id)}">${H_ESC(p.title)}</button></h3>
    ${p.abstract ? `<p class="d-body"><span class="d-quote-mark">in the authors’ words, not checked by me:</span> ${H_ESC(excerpt)}</p>` : '<p class="d-body d-listing">Only the listing so far. I haven’t seen what it argues, so I won’t guess.</p>'}
    <p class="d-foot"><span class="d-source">${link ? hLink(link, `${by} ↗`) : by}</span>
      <span class="d-acts">${histSaveBtn(p.id)}<button type="button" class="d-more" data-hopen="${H_ESC(p.id)}">${p.abstract ? 'the abstract →' : 'the listing →'}</button></span></p>
  </article>`;
}
const histCard = x => x.cat ? histCardD(x) : histCardP(x);

// ---------------------------------------------------------------- the feed
function histDrawFeed() {
  histState.trail = [];
  layout('', '', `<div class="h-paper d-paper">
    <header class="h-masthead">
      <p class="h-mast-rule">a little magazine of things people wrote down</p>
      <h3 class="h-mast-title">the history paper</h3>
    </header>
    <div class="d-bar">
      <div class="d-filters" role="group" aria-label="show">${[['all', 'all'], ...Object.entries(H_CATS)].map(([k, l]) => `<button type="button" class="d-filter${histState.filter === k ? ' on' : ''}" data-hfilter="${k}" ${k !== 'all' ? `data-cat="${k}"` : ''} aria-pressed="${histState.filter === k}">${l}</button>`).join('')}</div>
      <div class="d-bar-right"><button type="button" class="d-link" id="hSurprise">surprise me</button><button type="button" class="d-link" id="hSavedLink">saved</button></div>
    </div>
    <div class="d-feed" id="hFeed"></div>
    <div class="d-end" id="hEnd"></div>
    ${histFeed?.as_of ? `<p class="d-colophon">new scholarship looked up ${H_ESC(histFeed.as_of)}. stories are checked by hand, so they change more slowly.</p>` : ''}
  </div>`);
  histWire(document.querySelector('.d-paper'));
  $('#hSurprise').onclick = () => histSurprise(false);
  $('#hSavedLink').onclick = () => { histState.scroll = scrollY; histGo('#history?saved'); };
  document.querySelectorAll('[data-hfilter]').forEach(b => b.onclick = () => {
    histState.filter = b.dataset.hfilter; histState.shown = HIST_FIRST;
    document.querySelectorAll('[data-hfilter]').forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); });
    fill();
  });
  function fill() {
    const list = histCompose(histState.filter);
    $('#hFeed').innerHTML = list.slice(0, histState.shown).map(histCard).join('');
    $('#hEnd').innerHTML = histState.shown < list.length
      ? '<button type="button" class="d-morebtn" id="hMore">more discoveries</button>'
      : '<p class="d-rest">that’s all that’s on the shelf for now.</p>';
    const more = $('#hMore');
    if (more) more.onclick = () => { const from = histState.shown; histState.shown += HIST_MORE; fill(); $('#hFeed').children[from]?.querySelector('.d-open')?.focus({ preventScroll: true }); };
  }
  fill();
  const y = histState.scroll;
  if (y) queueMicrotask(() => scrollTo({ top: y, behavior: 'instant' }));
}

// ---------------------------------------------------------------- a story
function histTrailBar() {
  const label = id => { const t = histD(id)?.head || histPaper(id)?.title || ''; const w = t.split(' '); return w.slice(0, 5).join(' ') + (w.length > 5 ? '…' : ''); };
  const trail = histState.trail;
  return `<nav class="d-trail" aria-label="the path you took">
    <button type="button" class="d-link d-backbtn" id="hBack">← back</button>
    <span class="d-crumbs"><button type="button" class="d-crumb" data-hcrumb="">the paper</button>${trail.map((id, i) => i === trail.length - 1 ? `<span class="d-sep">›</span><span class="d-crumb here" aria-current="page">${H_ESC(label(id))}</span>` : `<span class="d-sep">›</span><button type="button" class="d-crumb" data-hcrumb="${H_ESC(id)}">${H_ESC(label(id))}</button>`).join('')}</span>
  </nav>`;
}
function histWireStory() {
  const t = histState.trail;
  $('#hBack').onclick = () => t.length > 1 ? histGo('#history?d=' + encodeURIComponent(t[t.length - 2])) : histGo('#history');
  document.querySelectorAll('[data-hcrumb]').forEach(b => b.onclick = () => histGo(b.dataset.hcrumb ? '#history?d=' + encodeURIComponent(b.dataset.hcrumb) : '#history'));
  $('#hSurprise').onclick = () => histSurprise(true);
  $('#hToFeed').onclick = () => histGo('#history');
  histWire(document.querySelector('.d-story'));
}
const H_CONTEXT = {
  scholarly: 'the surrounding facts were checked against the scholarly sources below.',
  reference: 'the surrounding facts come from the reference works below, not original research.',
  text: 'this rests mostly on the text itself, which shows what the writer said, not that it happened.'
};
function histDrawStory(d) {
  const refs = [], issue = histIssue(d);
  const cite = text => String(text).replace(/\[\[(\w+)(?:\|([^\]]+))?\]\]/g, (m, key, loc) => {
    const s = histSource(d, key);
    if (!s) return '';
    if (!refs.includes(key)) refs.push(key);
    return `<a class="h-cite" href="${H_ESC(s.url)}" data-hsrc="${key}" title="${H_ESC(H_PLAIN(s.cite) + (loc ? ' — ' + loc : ''))}">[${refs.indexOf(key) + 1}]</a>`;
  });
  const body = d.story.map(p => `<p class="d-para">${cite(p)}</p>`).join('');
  const x = issue ? { text: issue.bookshelf.excerpt, work: issue.bookshelf.work, by: issue.bookshelf.author, written: issue.bookshelf.written, locator: issue.bookshelf.locator } : d.excerpt;
  const verified = issue ? issue.bookshelf.verified : 'checked word for word against the linked text.';
  const xSource = issue ? issue.bookshelf.cite[0] : x.source;
  const xCite = cite(`[[${xSource}|${x.locator}]]`);
  const refList = refs.map(k => { const s = histSource(d, k); return `<li id="hsrc-${k}"><span class="h-src-type">${H_ESC(s.type)}</span> ${s.cite} ${hLink(s.url, 'link ↗')}</li>`; }).join('');
  layout('', '', `<div class="h-paper d-paper d-story" data-cat="${d.cat}">
    ${histTrailBar()}
    <article>
      <p class="d-kicker">${H_ESC(H_CATS[d.cat])} · ${H_ESC(d.when)}</p>
      <h3 class="d-title">${H_ESC(d.head)}</h3>
      ${body}
      <figure class="d-text">
        <p class="d-text-label">from the period</p>
        <blockquote class="h-excerpt">${x.text}<footer>— ${H_ESC(x.by)}, <em>${H_ESC(x.work)}</em>, ${H_ESC(x.written)}${x.translator ? `, trans. ${H_ESC(x.translator)}` : ''} ${xCite}</footer></blockquote>
      </figure>
      <p class="d-evidence">the text: ${H_ESC(verified)} ${H_ESC(H_CONTEXT[d.context])}</p>
      <div class="d-storyacts">${histSaveBtn(d.id)}</div>
      <section class="d-holes"><h4 class="d-sec">where this goes next</h4><ul>${d.links.map(([to, rel, why]) => { const t = histD(to); return `<li class="d-hole" data-cat="${t.cat}"><p class="d-rel">${H_ESC(H_REL[rel])}</p><button type="button" class="d-hole-go" data-hfollow="${t.id}">${H_ESC(t.head)}</button><p class="d-why">${why}</p></li>`; }).join('')}</ul>
        <p class="d-holes-foot"><button type="button" class="d-link" id="hSurprise">somewhere completely different</button> <button type="button" class="d-link" id="hToFeed">back to the paper</button></p></section>
      <div class="d-extra">
        ${issue ? `<details><summary>the longer issue</summary><div class="d-detail">${histLongIssue(issue)}</div></details>` : ''}
        <details><summary>sources</summary><ol class="d-refs">${refList}</ol></details>
      </div>
    </article>
  </div>`);
  histWireStory();
}
function histDrawPaper(p) {
  const link = hHttp(p.links?.doi) || hHttp(p.links?.landing);
  layout('', '', `<div class="h-paper d-paper d-story" data-cat="${H_ESC(p.category)}">
    ${histTrailBar()}
    <article>
      <p class="d-kicker">${H_ESC(H_CATS[p.category])} · new scholarship</p>
      <h3 class="d-title d-title-plain">${H_ESC(p.title)}</h3>
      <p class="d-byline">${H_ESC((p.authors || []).join(', '))}${p.source ? ` · <em>${H_ESC(p.source)}</em>` : ''}${p.date ? ` · ${H_ESC(p.date)}` : ''}</p>
      ${p.abstract ? `<p class="d-para">${H_ESC(p.abstract)}</p><p class="d-evidence">this is the authors’ own abstract (${H_ESC(p.abstract_license || 'open licence')}), reproduced automatically. nobody has checked it, and it is not a summary by me.</p>` : '<p class="d-para d-listing">Only the listing so far. I haven’t seen what it argues, so I won’t guess.</p>'}
      <p class="d-paperlinks">${link ? hLink(link, 'read the original ↗') : ''}</p>
      <div class="d-storyacts">${histSaveBtn(p.id)}</div>
      <section class="d-holes"><h4 class="d-sec">where this goes next</h4><p class="d-why">I haven’t read this one, so I’ve left this empty rather than invent a connection.</p>
        <p class="d-holes-foot"><button type="button" class="d-link" id="hSurprise">somewhere completely different</button> <button type="button" class="d-link" id="hToFeed">back to the paper</button></p></section>
    </article>
  </div>`);
  histWireStory();
}
// the original issues, kept whole for anyone who wants them; the quizzes are not shown
function histLongIssue(issue) {
  const keys = Object.keys(issue.sources);
  const c = t => String(t).replace(/\[\[([a-zA-Z0-9]+)(?:\|([^\]]+))?\]\]/g, (m, key, loc) => {
    const n = keys.indexOf(key) + 1;
    return n ? `<a class="h-cite" href="${H_ESC(issue.sources[key].url)}" data-hsrc="${key}" title="${H_ESC(H_PLAIN(issue.sources[key].cite) + (loc ? ' — ' + loc : ''))}">[${loc ? H_ESC(loc) : key}]</a>` : '';
  });
  return `<h5>the story</h5>${issue.story.map(p => `<p>${p.kind ? `<em>${H_ESC(p.kind)}:</em> ` : ''}${c(p.text)}</p>`).join('')}
    <h5>about the text</h5><p>${c(issue.bookshelf.about)}</p>
    <h5>${H_ESC(issue.connection.title)}</h5><p>${c(issue.connection.text)}</p>`;
}

// ---------------------------------------------------------------- saved
function histDrawSaved() {
  const saved = histSaved(), board = historyBoard();
  const ds = Object.keys(saved).map(histD).filter(Boolean);
  const papers = Object.entries(saved).filter(([id, v]) => !histD(id) && v && typeof v === 'object');
  layout('', '', `<div class="h-paper d-paper d-saved">
    <nav class="d-trail"><button type="button" class="d-link d-backbtn" id="hBack">← the paper</button></nav>
    <h3 class="d-title">saved</h3>
    ${ds.length || papers.length || board.length ? '' : '<p class="d-para">Nothing here yet. Tap “save” on anything you’d like to come back to.</p>'}
    <div class="d-feed">${ds.map(histCard).join('')}</div>
    ${papers.length ? `<ul class="d-saved-list">${papers.map(([id, v]) => `<li class="d-saved-row"><p class="d-saved-title">${H_ESC(v.title)}</p><p class="d-why">${H_ESC((v.authors || []).slice(0, 3).join(', '))}${v.source ? ` · ${H_ESC(v.source)}` : ''}. a saved listing; not read or summarised here.</p><p class="d-saved-acts">${hHttp(v.link) ? hLink(v.link, 'the original ↗') : ''} <button type="button" class="d-link" data-hunsave="${H_ESC(id)}">remove</button></p></li>`).join('')}</ul>` : ''}
    ${board.length ? `<details class="d-older" open><summary>from your history board</summary><div class="d-detail">${board.map(k => `<div class="d-saved-row" data-kid="${H_ESC(k.id)}"><p class="d-rel">${H_ESC(k.kind)}${k.period ? ` · ${H_ESC(k.period)}` : ''}</p><p>${H_ESC(k.text)}</p>${k.explain ? `<p class="d-why">${H_ESC(k.explain)}</p>` : ''}${(k.sources || []).map(s => `<p class="d-why">${H_ESC(s.cite)} ${hHttp(s.url) ? hLink(s.url, 'link ↗') : ''}</p>`).join('')}<textarea class="h-note" rows="2" placeholder="a note, if you like" aria-label="optional note">${H_ESC(k.note || '')}</textarea><p class="d-saved-acts"><button type="button" class="d-link" data-kremove>remove</button></p></div>`).join('')}</div></details>` : ''}
    <p class="d-colophon"><button type="button" class="d-link" id="hExport">keep a copy</button> <label class="d-link d-import">bring a copy back<input type="file" id="hImport" accept="application/json,.json" hidden></label> <span id="hMsg" aria-live="polite"></span></p>
  </div>`);
  const root = document.querySelector('.d-saved');
  histWire(root);
  $('#hBack').onclick = () => histGo('#history');
  root.querySelectorAll('[data-hunsave]').forEach(b => b.onclick = () => { const s = histSaved(); delete s[b.dataset.hunsave]; storage.set('history-saved', s); histDrawSaved(); });
  root.querySelectorAll('[data-kid]').forEach(row => {
    const id = row.dataset.kid;
    row.querySelector('.h-note').onchange = e => { const b = historyBoard(); const k = b.find(x => x.id === id); if (k) { k.note = e.target.value; storage.set('history-board', b); } };
    row.querySelector('[data-kremove]').onclick = () => { storage.set('history-board', historyBoard().filter(x => x.id !== id)); histDrawSaved(); };
  });
  $('#hExport').onclick = () => {
    const text = JSON.stringify({ app: 'quiet time', kind: 'history-board', version: 2, exported: new Date().toISOString(), cards: historyBoard(), saved: histSaved(), answers: storage.get('history-answers') || {} }, null, 2);
    const u = URL.createObjectURL(new Blob([text], { type: 'application/json' })), a = document.createElement('a');
    a.href = u; a.download = 'history-paper-saved.json'; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 2000);
  };
  $('#hImport').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      const cards = (Array.isArray(data) ? data : data.cards || []).filter(c => c && typeof c.id === 'string' && typeof c.text === 'string');
      const board = historyBoard(), byId = new Map(board.map(c => [c.id, c]));
      for (const c of cards) {
        const clean = { id: c.id, issueId: String(c.issueId || ''), issueNo: c.issueNo, issueTitle: String(c.issueTitle || ''), period: String(c.period || ''), kind: String(c.kind || ''), text: c.text, explain: String(c.explain || ''), related: String(c.related || ''), sources: Array.isArray(c.sources) ? c.sources.filter(s => s && s.cite).map(s => ({ cite: String(s.cite), url: hHttp(s.url) || '' })) : [], savedAt: String(c.savedAt || ''), note: String(c.note || '') };
        if (byId.has(c.id)) { const cur = byId.get(c.id); if (!cur.note && clean.note) cur.note = clean.note; } else { byId.set(c.id, clean); board.push(clean); }
      }
      storage.set('history-board', board);
      const s = histSaved();
      for (const [id, v] of Object.entries(data.saved || {})) if (!s[id] && (histD(id) ? typeof v === 'string' : v && typeof v.title === 'string')) s[id] = histD(id) ? v : { savedAt: String(v.savedAt || ''), title: v.title, authors: Array.isArray(v.authors) ? v.authors.map(String) : [], source: String(v.source || ''), date: String(v.date || ''), link: hHttp(v.link) };
      storage.set('history-saved', s);
      histDrawSaved();
      $('#hMsg').textContent = 'brought back.';
    } catch { $('#hMsg').textContent = 'that file could not be read.'; }
  };
}
