/* Quiet Time — the history paper. Small, sourced issues to read at leisure, plus a personal history board.
   Issue content lives in history-issues.js; answers and the board are stored on this device only. */
let historyView = { page: 'front', issue: null };
const H_ESC = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const H_PLAIN = html => { const d = document.createElement('div'); d.innerHTML = html; return d.textContent; };

function historyBoard() { const b = storage.get('history-board'); return Array.isArray(b) ? b : []; }
function historySaveBoard(b) { storage.set('history-board', b); }
function historyAnswers() { return storage.get('history-answers') || {}; }

// [[key|locator]] → a numbered citation that scrolls to the issue's source list
function historyCites(text, issue) {
  const keys = Object.keys(issue.sources);
  return text.replace(/\[\[([a-zA-Z0-9]+)(?:\|([^\]]+))?\]\]/g, (m, key, loc) => {
    const n = keys.indexOf(key) + 1;
    if (!n) return '';
    return `<a class="h-cite" href="#" data-src="${key}" title="${H_ESC(H_PLAIN(issue.sources[key].cite) + (loc ? ' — ' + loc : ''))}">[${n}${loc ? ', ' + H_ESC(loc) : ''}]</a>`;
  });
}

function drawHistory() {
  if (historyView.page === 'issue' && HISTORY_ISSUES.some(i => i.id === historyView.issue)) drawHistoryIssue(historyView.issue);
  else if (historyView.page === 'board') drawHistoryBoard();
  else drawHistoryFront();
}
function historyGuardLinks(root) {
  // outside links (sources) never slip past a quiet session; the in-page citations just scroll
  root.addEventListener('click', e => {
    const cite = e.target.closest('.h-cite');
    if (cite) {
      e.preventDefault();
      const target = document.getElementById('src-' + cite.dataset.src);
      if (target) { target.scrollIntoView({ behavior: 'smooth', block: 'center' }); target.classList.remove('flash'); void target.offsetWidth; target.classList.add('flash'); }
      return;
    }
    const a = e.target.closest('a[target="_blank"]');
    if (a && activeQuiet()) { e.preventDefault(); requestEarlyEnd(); }
  });
}

function drawHistoryFront() {
  historyView = { page: 'front', issue: null };
  const board = historyBoard();
  layout('the history paper', '', `
    <div class="h-paper h-front">
      <header class="h-masthead">
        <p class="h-mast-rule">est. in quiet time · read at leisure · no. 1 – ${HISTORY_ISSUES.length}</p>
        <h3 class="h-mast-title">the history paper</h3>
        <p class="h-mast-sub">small issues of curious history, each with a story, a real text from the period, a little question, and its sources.</p>
      </header>
      <ol class="h-issue-list">
        ${HISTORY_ISSUES.map(i => `<li><button class="h-issue-link" data-issue="${i.id}" type="button">
          <span class="h-no">no. ${i.no}</span><span class="h-issue-title">${H_ESC(i.title)}</span>
          <span class="h-issue-kicker">${H_ESC(i.kicker)}</span><span class="h-issue-period">${H_ESC(i.period)}</span></button></li>`).join('')}
      </ol>
      <div class="h-front-foot"><button class="pill" id="hBoard" type="button">history board · ${board.length} kept</button></div>
    </div>`);
  document.querySelectorAll('[data-issue]').forEach(b => b.onclick = () => { historyView = { page: 'issue', issue: b.dataset.issue }; drawHistoryIssue(b.dataset.issue); scrollTo({ top: 0 }); });
  $('#hBoard').onclick = () => { historyView = { page: 'board' }; drawHistoryBoard(); scrollTo({ top: 0 }); };
}

function drawHistoryIssue(id) {
  const issue = HISTORY_ISSUES.find(i => i.id === id);
  const c = t => historyCites(t, issue);
  const answers = historyAnswers()[id] || {};
  const kept = new Set(historyBoard().map(k => k.id));
  const bs = issue.bookshelf;
  const keys = Object.keys(issue.sources);
  layout('the history paper', '', `
    <div class="controls h-nav"><button class="pill" id="hFront" type="button">← all issues</button><button class="pill" id="hBoardBtn" type="button">history board</button></div>
    <article class="h-paper h-issue" id="hIssue">
      <header class="h-issue-head">
        <p class="h-mast-rule">the history paper · no. ${issue.no} · ${H_ESC(issue.period)}</p>
        <h3 class="h-headline">${H_ESC(issue.title)}</h3>
        <p class="h-kicker">${H_ESC(issue.kicker)}</p>
      </header>

      <section class="h-sec"><h4 class="h-sec-label"><span>01</span> / today's story</h4>
        ${issue.story.map(p => `<p class="h-text${p.kind ? ' h-interp' : ''}">${p.kind ? `<span class="h-kind">${H_ESC(p.kind)}</span>` : ''}${c(p.text)}</p>`).join('')}
      </section>

      <section class="h-sec"><h4 class="h-sec-label"><span>02</span> / from the bookshelf</h4>
        <p class="h-work"><em>${H_ESC(bs.work)}</em><br><span>${H_ESC(bs.author)} · ${H_ESC(bs.written)} · ${H_ESC(bs.genre)}</span></p>
        <blockquote class="h-excerpt">${bs.excerpt}<footer>— ${H_ESC(bs.locator)} ${bs.cite.map(k => c(`[[${k}]]`)).join(' ')}</footer></blockquote>
        <p class="h-verified">excerpt verified: ${H_ESC(bs.verified)}</p>
        <p class="h-text">${c(bs.about)}</p>
      </section>

      <section class="h-sec"><h4 class="h-sec-label"><span>03</span> / a little question</h4>
        ${issue.questions.map((q, qi) => `<div class="h-q" data-q="${qi}">
          <p class="h-q-text">${H_ESC(q.q)}</p>
          <div class="h-options">${q.options.map((o, oi) => `<button class="h-opt" type="button" data-o="${oi}">${H_ESC(o)}</button>`).join('')}</div>
          <div class="h-explain" hidden></div>
        </div>`).join('')}
      </section>

      <section class="h-sec"><h4 class="h-sec-label"><span>04</span> / a curious connection</h4>
        <p class="h-conn-title">${H_ESC(issue.connection.title)}</p>
        <p class="h-text">${c(issue.connection.text)}</p>
      </section>

      <section class="h-sec"><h4 class="h-sec-label"><span>05</span> / keep this</h4>
        <p class="h-small">one click puts it on your history board, with its sources. notes are optional.</p>
        <ul class="h-keep">${issue.keep.map(k => `<li><p class="h-keep-text">${H_ESC(k.text)}</p><p class="h-small">${H_ESC(k.explain)}</p>
          <button class="pill h-keep-btn${kept.has(k.id) ? ' active' : ''}" type="button" data-keep="${k.id}" aria-pressed="${kept.has(k.id)}">${kept.has(k.id) ? 'kept ✿' : 'keep'}</button></li>`).join('')}</ul>
      </section>

      <section class="h-sec h-sources"><h4 class="h-sec-label">sources</h4>
        <ol>${keys.map(k => `<li id="src-${k}"><span class="h-src-type">${H_ESC(issue.sources[k].type)}</span> ${issue.sources[k].cite} <a href="${issue.sources[k].url}" target="_blank" rel="noopener noreferrer">link ↗</a></li>`).join('')}</ol>
        <p class="h-small">labels such as “scholarly interpretation” mark a historian’s reading rather than an established fact. quotations keep their original wording.</p>
      </section>
    </article>`);
  $('#hFront').onclick = () => { drawHistoryFront(); scrollTo({ top: 0 }); };
  $('#hBoardBtn').onclick = () => { historyView = { page: 'board' }; drawHistoryBoard(); scrollTo({ top: 0 }); };
  const art = $('#hIssue');
  historyGuardLinks(art);
  art.querySelectorAll('.h-q').forEach(box => {
    const qi = +box.dataset.q;
    const show = oi => historyShowAnswer(issue, box, qi, oi);
    box.querySelectorAll('.h-opt').forEach(b => b.onclick = () => {
      const all = historyAnswers(); all[id] = { ...(all[id] || {}), [qi]: +b.dataset.o }; storage.set('history-answers', all);
      show(+b.dataset.o);
    });
    if (answers[qi] != null) show(answers[qi]);
  });
  art.querySelectorAll('[data-keep]').forEach(b => b.onclick = () => historyToggleKeep(issue, b));
}

function historyShowAnswer(issue, box, qi, oi) {
  const q = issue.questions[qi];
  box.querySelectorAll('.h-opt').forEach((b, i) => {
    b.classList.toggle('right', i === q.answer);
    b.classList.toggle('chosen', i === oi);
    b.setAttribute('aria-pressed', String(i === oi));
  });
  const ex = box.querySelector('.h-explain');
  ex.hidden = false;
  ex.innerHTML = `<p><strong>${oi === q.answer ? 'yes —' : 'not quite —'}</strong> ${historyCites(q.explain, issue)}</p><button class="textbtn h-again" type="button">ask me again</button>`;
  ex.querySelector('.h-again').onclick = () => {
    const all = historyAnswers(); if (all[issue.id]) { delete all[issue.id][qi]; storage.set('history-answers', all); }
    box.querySelectorAll('.h-opt').forEach(b => { b.classList.remove('right', 'chosen'); b.setAttribute('aria-pressed', 'false'); });
    ex.hidden = true; ex.innerHTML = '';
  };
}

function historyCard(issue, k) {
  return {
    id: k.id, issueId: issue.id, issueNo: issue.no, issueTitle: issue.title, period: issue.period,
    kind: k.kind, text: k.text, explain: k.explain, related: k.related,
    sources: k.cite.map(key => ({ cite: H_PLAIN(issue.sources[key].cite), url: issue.sources[key].url })),
    savedAt: new Date().toISOString().slice(0, 10), note: ''
  };
}
function historyToggleKeep(issue, btn) {
  const k = issue.keep.find(x => x.id === btn.dataset.keep);
  let board = historyBoard();
  const has = board.some(c => c.id === k.id);
  board = has ? board.filter(c => c.id !== k.id) : [historyCard(issue, k), ...board];
  historySaveBoard(board);
  btn.classList.toggle('active', !has);
  btn.setAttribute('aria-pressed', String(!has));
  btn.textContent = has ? 'keep' : 'kept ✿';
}

function drawHistoryBoard(query = '') {
  historyView = { page: 'board' };
  layout('history board', '', `
    <div class="controls h-nav"><button class="pill" id="hFront" type="button">← the history paper</button>
      <input class="pill h-search" id="hSearch" type="search" placeholder="search your board" aria-label="search your history board" value="${H_ESC(query)}">
      <button class="pill" id="hExport" type="button">export (.json)</button>
      <label class="pill h-import">import<input type="file" id="hImport" accept="application/json,.json" hidden></label></div>
    <p class="h-board-msg" id="hMsg" aria-live="polite"></p>
    <div class="h-board" id="hCards"></div>`);
  $('#hFront').onclick = () => { drawHistoryFront(); scrollTo({ top: 0 }); };
  const render = () => historyRenderCards($('#hSearch').value.trim().toLowerCase());
  $('#hSearch').oninput = render;
  $('#hExport').onclick = () => {
    const blob = new Blob([JSON.stringify({ app: 'quiet time', kind: 'history-board', version: 1, exported: new Date().toISOString(), cards: historyBoard() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = 'history-board.json'; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  $('#hImport').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      const cards = (Array.isArray(data) ? data : data.cards || []).filter(c => c && typeof c.id === 'string' && typeof c.text === 'string');
      const board = historyBoard(), byId = new Map(board.map(c => [c.id, c]));
      let added = 0;
      for (const c of cards) {
        const clean = {
          id: c.id, issueId: String(c.issueId || ''), issueNo: c.issueNo, issueTitle: String(c.issueTitle || ''), period: String(c.period || ''),
          kind: String(c.kind || ''), text: c.text, explain: String(c.explain || ''), related: String(c.related || ''),
          sources: Array.isArray(c.sources) ? c.sources.filter(s => s && s.cite).map(s => ({ cite: String(s.cite), url: /^https?:\/\//.test(s.url || '') ? s.url : '' })) : [],
          savedAt: String(c.savedAt || ''), note: String(c.note || '')
        };
        if (byId.has(c.id)) { const cur = byId.get(c.id); if (!cur.note && clean.note) cur.note = clean.note; }
        else { byId.set(c.id, clean); board.push(clean); added++; }
      }
      historySaveBoard(board);
      $('#hMsg').textContent = `imported ${added} new card${added === 1 ? '' : 's'}${cards.length - added ? ` (${cards.length - added} already here)` : ''}.`;
      render();
    } catch { $('#hMsg').textContent = 'that file could not be read as a history board backup.'; }
    e.target.value = '';
  };
  historyGuardLinks($('#hCards'));
  render();
}
function historyRenderCards(q) {
  const board = historyBoard();
  const list = board.filter(c => !q || [c.text, c.explain, c.related, c.period, c.issueTitle, c.note, ...(c.sources || []).map(s => s.cite)].join(' ').toLowerCase().includes(q));
  const box = $('#hCards');
  box.innerHTML = !board.length ? '<p class="h-empty">nothing kept yet. open an issue and press “keep” on anything you’d like to remember.</p>'
    : !list.length ? '<p class="h-empty">no cards match that search.</p>'
    : list.map(c => `<article class="h-card" data-id="${H_ESC(c.id)}">
      <p class="h-card-meta">${H_ESC(c.kind)} · ${H_ESC(c.period)}</p>
      <p class="h-card-text">${H_ESC(c.text)}</p>
      <p class="h-small">${H_ESC(c.explain)}</p>
      <p class="h-small"><strong>related:</strong> ${H_ESC(c.related)}</p>
      <details class="h-card-src"><summary>sources</summary><ul>${(c.sources || []).map(s => `<li>${H_ESC(s.cite)} ${s.url ? `<a href="${H_ESC(s.url)}" target="_blank" rel="noopener noreferrer">link ↗</a>` : ''}</li>`).join('')}</ul></details>
      <p class="h-small">from <button class="textbtn h-open" type="button" data-issue="${H_ESC(c.issueId)}">no. ${H_ESC(c.issueNo)} · ${H_ESC(c.issueTitle)}</button>${c.savedAt ? ` · kept ${H_ESC(c.savedAt)}` : ''}</p>
      <textarea class="h-note" rows="2" placeholder="a note, if you like" aria-label="optional note">${H_ESC(c.note)}</textarea>
      <button class="textbtn h-remove" type="button">remove</button>
    </article>`).join('');
  box.querySelectorAll('.h-card').forEach(card => {
    const id = card.dataset.id;
    card.querySelector('.h-note').onchange = e => { const b = historyBoard(); const c = b.find(x => x.id === id); if (c) { c.note = e.target.value; historySaveBoard(b); } };
    card.querySelector('.h-remove').onclick = () => { historySaveBoard(historyBoard().filter(x => x.id !== id)); historyRenderCards($('#hSearch').value.trim().toLowerCase()); };
    const open = card.querySelector('.h-open');
    open.onclick = () => { if (HISTORY_ISSUES.some(i => i.id === open.dataset.issue)) { historyView = { page: 'issue', issue: open.dataset.issue }; drawHistoryIssue(open.dataset.issue); scrollTo({ top: 0 }); } };
  });
}
