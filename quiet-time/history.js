/* Quiet Time — the history paper.
   One feed. Every hand-written story (history-discoveries.js) carries a period text checked word for word.
   New papers (data/history-feed.json) appear sparingly: the authors' own open-licence abstract, shown only after
   it has been read (scripts/paper-review.mjs). The weekly refresh can queue papers and remove them, never publish them.
   Routes: #history and #history?d=<id>. The front page lists each entry as its headline, place and
   date, and the first sentence of its text; the older issues live on inside their stories. */
const HIST_FIRST = 7, HIST_MORE = 6;
const H_CATS = { everyday: 'everyday life', ideas: 'ideas and science', power: 'power and politics' };
let histState = { filter: 'all', shown: HIST_FIRST, scroll: 0, trail: [] };
let histFeed = null, histFeedTried = false;
const H_ESC = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const H_PLAIN = html => { const d = document.createElement('div'); d.innerHTML = html; return d.textContent; };
const hHttp = u => /^https?:\/\//.test(u || '') ? u : null;
const hLink = (href, text) => `<a href="${H_ESC(href)}" target="_blank" rel="noopener noreferrer">${text}</a>`;
const histD = id => HISTORY_DISCOVERIES.find(d => d.id === id);
const histPaper = id => histFeed?.items?.find(p => p.id === id);
const histIssue = d => d.issue ? HISTORY_ISSUES.find(i => i.id === d.issue) : null;
const histSource = (d, key) => histIssue(d)?.sources[key] || HISTORY_SOURCES[key];

// ---------------------------------------------------------------- routing
function histGo(hash) { if (location.hash === hash) render('history'); else location.hash = hash; }
function histOpen(id, follow) {
  if (!document.querySelector('.d-story')) histState.scroll = scrollY;
  histState.trail = follow ? [...histState.trail, id] : [id];
  histGo('#history?d=' + encodeURIComponent(id));
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
    else histFeed.items = histFeed.items.filter(p => p.title && p.abstract && H_CATS[p.category]);
    if (location.hash.startsWith('#history')) render('history'); // a full render keeps the page masthead
    return;
  }
  const q = location.hash.split('?')[1] || '';
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
// inline citations open the source list
function histGuard(root) {
  root.addEventListener('click', e => {
    const ref = e.target.closest('[data-hsrc]');
    if (ref) {
      e.preventDefault();
      const t = document.getElementById('hsrc-' + ref.dataset.hsrc);
      if (t) { let p = t.closest('details'); while (p) { p.open = true; p = p.parentElement.closest('details'); } t.scrollIntoView({ behavior: 'smooth', block: 'center' }); t.classList.remove('flash'); void t.offsetWidth; t.classList.add('flash'); }
      return;
    }
  });
}
function histWire(root) {
  histGuard(root);
  root.addEventListener('click', e => {
    const o = e.target.closest('[data-hopen]');
    if (o) histOpen(o.dataset.hopen);
    const f = e.target.closest('[data-hfollow]');
    if (f) histOpen(f.dataset.hfollow, true);
  });
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
  const raw = shuffle(papers);
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
// the first sentence of a piece of text, with citation markers and markup taken out
function histFirstSentence(text) {
  const plain = H_PLAIN(String(text || '').replace(/\s*\[\[[^\]]*\]\]/g, '')).replace(/\s+/g, ' ').trim();
  const sentences = plain.match(/[^.!?]+[.!?]+['’”")\]]*(?=\s+[A-Z‘“"(0-9]|\s*$)/g) || [plain];
  // a very short opener ("Micrographia appeared in 1665.") reads better with the sentence after it
  let out = '';
  for (const sentence of sentences) { out += (out ? ' ' : '') + sentence.trim(); if (out.length >= 60) break; }
  return out;
}
function histCardD(d) {
  return `<article class="d-card">
    <p class="d-kicker">${H_ESC(d.when)}</p>
    <h3 class="d-head"><button type="button" class="d-open" data-hopen="${d.id}">${H_ESC(d.head)}</button></h3>
    <p class="d-body">${H_ESC(histFirstSentence(d.story[0]))}</p>
  </article>`;
}
function histCardP(p) {
  return `<article class="d-card d-new">
    <p class="d-kicker">${p.date ? H_ESC(p.date.slice(0, 4)) + ' · ' : ''}new scholarship</p>
    <h3 class="d-head"><button type="button" class="d-open" data-hopen="${H_ESC(p.id)}">${H_ESC(p.title)}</button></h3>
    <p class="d-body">${H_ESC(histFirstSentence(p.abstract))}</p>
  </article>`;
}
const histCard = x => x.cat ? histCardD(x) : histCardP(x);

// ---------------------------------------------------------------- the feed
function histDrawFeed() {
  histState.trail = [];
  layout('', '', `<div class="h-paper d-paper">
    <header class="h-masthead">
      <h3 class="h-mast-title">the history paper</h3>
    </header>
    <div class="d-feed" id="hFeed"></div>
    <div class="d-end" id="hEnd"></div>
    ${histFeed?.as_of ? `<p class="d-colophon">new scholarship looked up ${H_ESC(histFeed.as_of)}. stories are checked by hand, so they change more slowly.</p>` : ''}
  </div>`);
  histWire(document.querySelector('.d-paper'));
  function fill() {
    const list = histCompose('all');
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
// every article opens under the paper's masthead, with a single way back to the front page
function histTrailBar() {
  return `<header class="h-masthead"><h3 class="h-mast-title">the history paper</h3></header>
  <nav class="d-trail" aria-label="back"><button type="button" class="d-link d-backbtn" id="hBack">← back</button></nav>`;
}
function histWireStory() {
  $('#hBack').onclick = () => histGo('#history');
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
  layout('', '', `<div class="h-paper d-paper d-story">
    ${histTrailBar()}
    <article>
      <p class="d-kicker">${H_ESC(d.when)}</p>
      <h3 class="d-title">${H_ESC(d.head)}</h3>
      ${body}
      <figure class="d-text">
        <p class="d-text-label">from the period</p>
        <blockquote class="h-excerpt">${x.text}<footer>— ${H_ESC(x.by)}, <em>${H_ESC(x.work)}</em>, ${H_ESC(x.written)}${x.translator ? `, trans. ${H_ESC(x.translator)}` : ''} ${xCite}</footer></blockquote>
      </figure>
      <p class="d-evidence">the text: ${H_ESC(verified)} ${H_ESC(H_CONTEXT[d.context])}</p>
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
  layout('', '', `<div class="h-paper d-paper d-story">
    ${histTrailBar()}
    <article>
      <p class="d-kicker">${p.date ? H_ESC(p.date.slice(0, 4)) + ' · ' : ''}new scholarship</p>
      <h3 class="d-title d-title-plain">${H_ESC(p.title)}</h3>
      <p class="d-byline">${H_ESC((p.authors || []).join(', '))}${p.source ? ` · <em>${H_ESC(p.source)}</em>` : ''}${p.date ? ` · ${H_ESC(p.date)}` : ''}</p>
      <p class="d-para">${H_ESC(p.abstract)}</p><p class="d-evidence">this is the authors’ own abstract (${H_ESC(p.abstract_license || 'open licence')}), not a summary by me. I read it and checked the paper’s record, but I haven’t read the full paper.</p>
      <p class="d-paperlinks">${link ? hLink(link, 'read the original ↗') : ''}</p>
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

