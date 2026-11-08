/* Quiet Time — data garden. Learn R by answering real research questions with open data.
   R runs in the browser through webR (loaded from its CDN the first time a lesson opens).
   Progress, code and field notes stay on this device. Lessons live in garden-lessons.js. */
const WEBR_URL = 'https://webr.r-wasm.org/v0.6.0/webr.mjs';
let webR = null, webRReady = null, gardenPkgs = new Set(), gardenFiles = new Set();
let gardenView = { lesson: null };
let gardenBusy = false;
let gardenLoading = false, gardenToken = 0;
let gardenQueue = Promise.resolve();   // R runs one thing at a time, in order

function gardenState() {
  const s = storage.get('garden') || {};
  s.progress ??= {};
  return s;
}
function gardenSave(s) { storage.set('garden', s); }
function lessonProgress(id) {
  const s = gardenState();
  return s.progress[id] || { step: 0, code: {}, done: false, note: '' };
}
function setLessonProgress(id, p) { const s = gardenState(); s.progress[id] = p; gardenSave(s); }
const gardenEsc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- R in the browser ----------
function gardenStatus(text, busy = true) {
  const el = $('#rStatus');
  if (el) { el.textContent = text; el.classList.toggle('busy', busy); }
}
async function gardenR() {
  if (webRReady) return webRReady;
  webRReady = (async () => {
    gardenStatus('waking up R… (the first time takes a little while)');
    const { WebR } = await import(WEBR_URL);
    webR = new WebR();
    await webR.init();
    gardenStatus('R is ready', false);
    return webR;
  })();
  webRReady.catch(() => { webRReady = null; });
  return webRReady;
}
async function gardenPrepare(lesson) {
  await gardenR();
  const pk = (lesson.packages || []).filter(p => !gardenPkgs.has(p));
  if (pk.length) {
    gardenStatus(`fetching ${pk.join(' and ')} (first time only)…`);
    await webR.installPackages(pk, { quiet: true });
    pk.forEach(p => gardenPkgs.add(p));
  }
  for (const f of lesson.data || []) {
    if (gardenFiles.has(f)) continue;
    gardenStatus(`loading ${f}…`);
    const res = await fetch('data/' + f);
    if (!res.ok) throw new Error('could not load ' + f);
    await webR.FS.writeFile('/home/web_user/' + f, new Uint8Array(await res.arrayBuffer()));
    gardenFiles.add(f);
  }
}
// run code, returning printed text, plots and any error
function gardenRun(code, opts) {
  const job = gardenQueue.then(() => gardenRunNow(code, opts));
  gardenQueue = job.catch(() => { });
  return job;
}
async function gardenRunNow(code, { quiet = false } = {}) {
  const shelter = await new webR.Shelter();
  const out = { lines: [], images: [], error: null };
  try {
    const cap = await shelter.captureR(code, {
      withAutoprint: true, captureStreams: true, captureConditions: true,
      captureGraphics: quiet ? false : { width: 560, height: 340, bg: '#fdfbf3' }
    });
    for (const o of cap.output) {
      if (o.type === 'stdout' || o.type === 'stderr') out.lines.push({ type: o.type, text: o.data });
      else {
        let msg = o.type;
        try { const m = await o.data.get('message'); msg = (await m.toJs()).values[0]; } catch { }
        if (o.type === 'error') out.error = msg;
        else out.lines.push({ type: o.type, text: (o.type === 'warning' ? 'warning: ' : '') + msg.replace(/\n$/, '') });
      }
    }
    out.images = cap.images || [];
  } catch (e) {
    out.error = e.message || String(e);
  } finally {
    await shelter.purge();
  }
  return out;
}
function gardenCheck(expr) {
  if (!expr) return Promise.resolve(true);
  const job = gardenQueue.then(() => webR.evalRBoolean(`isTRUE(tryCatch({${expr}}, error = function(e) FALSE))`)).catch(() => false);
  gardenQueue = job.catch(() => { });
  return job;
}

// ---------- plants ----------
const PLANT_COLORS = { fern: '#8fb07a', tulip: '#d98ba0', daisy: '#f4ead2', sunflower: '#e2b64f', lavender: '#a99bd1', poppy: '#d9735f', bluebell: '#7f9fd6', clover: '#9bc48a' };
function plantSVG(kind, stage) {
  const c = PLANT_COLORS[kind] || '#8fb07a';
  const soil = '<ellipse cx="40" cy="72" rx="26" ry="6" fill="#5b4433"/>';
  if (stage === 0) return `<svg viewBox="0 0 80 80" class="plant">${soil}<ellipse cx="40" cy="67" rx="5" ry="3.4" fill="#c9a77a"/></svg>`;
  if (stage === 1) return `<svg viewBox="0 0 80 80" class="plant">${soil}<path d="M40 70V50" stroke="#7f9c6c" stroke-width="3" stroke-linecap="round"/><ellipse cx="33" cy="50" rx="8" ry="4" fill="#93b27c" transform="rotate(-25 33 50)"/><ellipse cx="47" cy="47" rx="8" ry="4" fill="#93b27c" transform="rotate(25 47 47)"/></svg>`;
  const stem = '<path d="M40 70V34" stroke="#7f9c6c" stroke-width="3" stroke-linecap="round"/><ellipse cx="31" cy="55" rx="9" ry="4" fill="#93b27c" transform="rotate(-25 31 55)"/><ellipse cx="49" cy="50" rx="9" ry="4" fill="#93b27c" transform="rotate(25 49 50)"/>';
  let bloom;
  if (kind === 'tulip') bloom = `<path d="M30 30q0-14 10-16q10 2 10 16q-10 8-20 0z" fill="${c}"/><path d="M40 14v16" stroke="#00000022"/>`;
  else if (kind === 'fern') bloom = `<path d="M40 34q-14-10-12-26M40 34q14-10 12-26M40 34V8" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  else if (kind === 'lavender') bloom = [0, 1, 2, 3, 4].map(i => `<ellipse cx="${40 + (i % 2 ? 3 : -3)}" cy="${30 - i * 5}" rx="4" ry="3" fill="${c}"/>`).join('');
  else if (kind === 'bluebell') bloom = `<path d="M40 34q8-6 10-18" stroke="#7f9c6c" stroke-width="2.5" fill="none"/>${[[48, 20], [44, 30], [51, 12]].map(([x, y]) => `<path d="M${x - 4} ${y}q4-8 8 0q-1 4-4 4t-4-4z" fill="${c}"/>`).join('')}`;
  else if (kind === 'clover') bloom = [0, 120, 240].map(a => `<circle cx="${40 + 7 * Math.cos((a - 90) * Math.PI / 180)}" cy="${26 + 7 * Math.sin((a - 90) * Math.PI / 180)}" r="7" fill="${c}"/>`).join('');
  else {
    const petals = Array.from({ length: kind === 'poppy' ? 5 : 10 }, (_, i) => {
      const a = i * 360 / (kind === 'poppy' ? 5 : 10);
      return `<ellipse cx="40" cy="${kind === 'poppy' ? 18 : 16}" rx="${kind === 'poppy' ? 8 : 4.5}" ry="${kind === 'poppy' ? 9 : 9}" fill="${c}" transform="rotate(${a} 40 28)"/>`;
    }).join('');
    bloom = petals + `<circle cx="40" cy="28" r="${kind === 'sunflower' ? 7 : 5}" fill="${kind === 'sunflower' ? '#6b4f3c' : kind === 'poppy' ? '#2f3a2f' : '#e2b64f'}"/>`;
  }
  return `<svg viewBox="0 0 80 80" class="plant">${soil}${stem}${bloom}</svg>`;
}

// ---------- garden overview ----------
function drawGarden() {
  gardenView.lesson ? drawLesson(gardenView.lesson) : drawGardenHome();
}
function drawGardenHome() {
  gardenView.lesson = null;
  const s = gardenState();
  const doneCount = GARDEN_LESSONS.filter(l => s.progress[l.id]?.done).length;
  layout('data garden', '', `
    <p class="garden-intro">learn R by answering real research questions with open data from published studies. each question is a seed; answer it and it blooms. no timers, no grades — just you, some data, and curiosity.</p>
    <div class="controls garden-bar"><span class="tag">${doneCount} of ${GARDEN_LESSONS.length} in bloom</span><button class="pill" id="gJournal" type="button">field journal</button><span class="r-status" id="rStatus">${webR ? 'R is ready' : 'R wakes up when you open a seed'}</span></div>
    ${GARDEN_UNITS.map(u => {
      const ls = GARDEN_LESSONS.filter(l => l.unit === u.id);
      return `<section class="garden-bed"><div class="bed-head"><h3>${gardenEsc(u.title)}</h3><p>${u.blurb}</p></div>
      <div class="bed-plots">${ls.length ? ls.map(l => {
        const p = s.progress[l.id], stage = p?.done ? 2 : p?.step ? 1 : 0;
        return `<button class="plot" data-lesson="${l.id}" type="button">${plantSVG(l.plant, stage)}<span class="plot-title">${gardenEsc(l.title)}</span><span class="plot-q">${gardenEsc(l.question)}</span></button>`;
      }).join('') : '<p class="muted bed-soon">seeds coming soon</p>'}</div></section>`;
    }).join('')}
    <p class="muted garden-credits">data: ${Object.values(GARDEN_DATA).map(d => `<a href="${d.url}" target="_blank" rel="noopener noreferrer">${gardenEsc(d.short)}</a> (${d.license})`).join(' · ')}. course paths follow <a href="https://ocw.mit.edu/" target="_blank" rel="noopener noreferrer">MIT OpenCourseWare</a>; lessons are original and link to the matching OCW material.</p>`);
  document.querySelectorAll('[data-lesson]').forEach(b => b.onclick = () => { gardenView.lesson = b.dataset.lesson; drawLesson(b.dataset.lesson); scrollTo({ top: 0 }); });
  $('#gJournal').onclick = drawJournal;
}
function drawJournal() {
  const s = gardenState();
  const notes = GARDEN_LESSONS.filter(l => s.progress[l.id]?.note);
  layout('field journal', '', `<button class="pill" id="gBack" type="button">← back to the garden</button>
    <div class="journal">${notes.length ? notes.map(l => `<article class="journal-entry"><h3>${gardenEsc(l.title)}</h3><p class="muted">${gardenEsc(l.question)}</p><p>${gardenEsc(s.progress[l.id].note)}</p></article>`).join('') : '<p class="muted">your conclusions will collect here as your seeds bloom.</p>'}</div>
    ${notes.length ? '<button class="pill" id="gJournalSave" type="button">download journal</button>' : ''}`);
  $('#gBack').onclick = drawGardenHome;
  const save = $('#gJournalSave');
  if (save) save.onclick = () => exportWriting(notes.map(l => `${l.title}\n${l.question}\n\n${s.progress[l.id].note}\n`).join('\n---\n\n'), 'data-garden-journal.txt');
}

// ---------- a lesson ----------
async function drawLesson(id) {
  const lesson = GARDEN_LESSONS.find(l => l.id === id);
  if (!lesson) return drawGardenHome();
  const p = lessonProgress(id);
  const token = ++gardenToken;
  gardenLoading = true;
  const data = (lesson.cite || []).map(k => GARDEN_DATA[k]).filter(Boolean);
  layout(lesson.title, '', `
    <button class="pill" id="gBack" type="button">← garden</button>
    <div class="lesson-head">${plantSVG(lesson.plant, p.done ? 2 : 1)}<div><p class="lesson-unit">${gardenEsc(GARDEN_UNITS.find(u => u.id === lesson.unit).title)}</p><p class="lesson-q">${gardenEsc(lesson.question)}</p></div></div>
    <p class="r-status busy" id="rStatus">${webR ? 'getting this seed ready…' : 'waking up R…'}</p>
    <div id="steps"></div>
    <div id="lessonEnd"></div>
    <div class="lesson-foot">
      ${data.map(d => `<p class="muted">data: ${d.cite} <a href="${d.url}" target="_blank" rel="noopener noreferrer">source</a> · ${d.license}</p>`).join('')}
      ${(lesson.deeper || []).length ? `<p class="muted">go deeper: ${lesson.deeper.map(d => `<a href="${d.url}" target="_blank" rel="noopener noreferrer">${gardenEsc(d.label)}</a>`).join(' · ')}</p>` : ''}
      <button class="pill" id="gExport" type="button">download my code (.R)</button>
    </div>`);
  $('#gBack').onclick = () => { gardenView.lesson = null; gardenToken++; drawGardenHome(); };
  $('#gExport').onclick = () => exportLessonCode(lesson);
  renderSteps(lesson);
  try {
    await gardenPrepare(lesson);
    if (token !== gardenToken) return;
    gardenStatus('getting this seed ready…');
    // fresh workspace for each lesson: setup, then replay the steps already done
    await gardenRun('rm(list = ls())\n' + (lesson.setup || ''), { quiet: true });
    const prog = lessonProgress(id);
    for (let i = 0; i < Math.min(prog.step, lesson.steps.length); i++) {
      if (token !== gardenToken) return;
      const st = lesson.steps[i];
      if (!st.code) continue;
      const r = await gardenRun(prog.code[i] ?? st.solution ?? st.code, { quiet: true });
      if (r.error && st.solution) await gardenRun(st.solution, { quiet: true });
    }
    if (token !== gardenToken) return;
    gardenLoading = false;
    gardenStatus('R is ready', false);
    document.querySelectorAll('.run-btn').forEach(b => b.disabled = false);
  } catch (e) {
    if (token === gardenToken) gardenStatus('R could not start: ' + (e.message || e) + '. check your connection and reopen this seed.', false);
  }
}

function renderSteps(lesson) {
  const p = lessonProgress(lesson.id);
  const box = $('#steps');
  const upto = Math.min(p.step, lesson.steps.length - 1);
  box.innerHTML = lesson.steps.slice(0, p.done ? lesson.steps.length : upto + 1).map((st, i) => {
    const passed = p.done || i < p.step;
    return `<section class="step ${passed ? 'passed' : 'current'}" data-step="${i}">
      <div class="step-text">${st.text}</div>
      ${st.code ? `<textarea class="code" spellcheck="false" autocapitalize="off" aria-label="R code for step ${i + 1}" rows="${Math.max(2, (p.code[i] ?? st.code).split('\n').length)}">${gardenEsc(p.code[i] ?? st.code)}</textarea>
      <div class="controls step-bar"><button class="primary run-btn" type="button" ${webR && !gardenBusy && !gardenLoading ? '' : 'disabled'}>run ▸</button>${st.hint ? '<button class="pill hint-btn" type="button">hint</button>' : ''}<button class="pill answer-btn" type="button" hidden>show answer</button><span class="step-ok">${passed ? '✓ done' : ''}</span></div>
      <p class="hint" hidden>${st.hint || ''}</p>
      <div class="output"></div>`
      : (passed ? '' : '<div class="controls"><button class="primary next-btn" type="button">continue</button></div>')}
    </section>`;
  }).join('');
  box.querySelectorAll('.step').forEach(sec => {
    const i = +sec.dataset.step, st = lesson.steps[i];
    const ta = sec.querySelector('textarea');
    sec.querySelector('.next-btn')?.addEventListener('click', () => advanceStep(lesson, i));
    sec.querySelector('.hint-btn')?.addEventListener('click', () => { sec.querySelector('.hint').hidden = false; });
    sec.querySelector('.answer-btn')?.addEventListener('click', () => { ta.value = st.solution; fitArea(ta); ta.focus(); });
    if (ta) {
      ta.addEventListener('input', () => fitArea(ta));
      ta.addEventListener('keydown', e => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); runStep(lesson, i, sec); }
        if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); const s = ta.selectionStart; ta.setRangeText('  ', s, ta.selectionEnd, 'end'); }
      });
      sec.querySelector('.run-btn').addEventListener('click', () => runStep(lesson, i, sec));
    }
  });
  if (p.done) drawLessonEnd(lesson);
  else if (p.step >= lesson.steps.length) drawLessonEnd(lesson);
}
function fitArea(ta) { ta.rows = Math.max(2, ta.value.split('\n').length); }

async function runStep(lesson, i, sec) {
  if (gardenBusy || gardenLoading || !webR) return;
  const st = lesson.steps[i], ta = sec.querySelector('textarea'), outBox = sec.querySelector('.output');
  const code = ta.value;
  gardenBusy = true;
  document.querySelectorAll('.run-btn').forEach(b => b.disabled = true);
  outBox.innerHTML = '<p class="muted">running…</p>';
  const r = await gardenRun(code);
  outBox.innerHTML = '';
  if (r.lines.length) {
    const pre = document.createElement('pre');
    pre.className = 'r-out';
    pre.innerHTML = r.lines.map(l => `<span class="${l.type}">${gardenEsc(l.text)}</span>`).join('\n');
    outBox.append(pre);
  }
  for (const img of r.images) {
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height; c.className = 'r-plot';
    c.getContext('2d').drawImage(img, 0, 0);
    outBox.append(c);
  }
  const p = lessonProgress(lesson.id);
  p.code[i] = code;
  const msg = document.createElement('p');
  msg.className = 'step-msg';
  let passed = false;
  if (r.error) {
    msg.classList.add('err');
    msg.textContent = code.includes('___') ? 'fill in the ___ blank first, then run.' : 'R says: ' + r.error;
  } else if (await gardenCheck(st.check)) {
    passed = true;
    msg.classList.add('good');
    msg.textContent = st.success || 'lovely — that works.';
    if (i >= p.step) p.step = i + 1;
    p.tries = 0;
  } else {
    msg.textContent = st.retry || 'that ran, but it is not quite the answer yet. have another look.';
  }
  if (!passed) p.tries = (p.tries || 0) + 1;
  outBox.append(msg);
  setLessonProgress(lesson.id, p);
  gardenBusy = false;
  document.querySelectorAll('.run-btn').forEach(b => b.disabled = gardenLoading);
  if (passed) {
    sec.classList.replace('current', 'passed');
    sec.querySelector('.step-ok').textContent = '✓ done';
    // offer the next step if it is not on screen yet
    if (!document.querySelector(`[data-step="${i + 1}"]`) && !$('#lessonEnd').innerHTML) {
      const nb = document.createElement('div');
      nb.className = 'controls next-row';
      nb.innerHTML = `<button class="primary next-btn" type="button">${i + 1 < lesson.steps.length ? 'next step' : 'finish'}</button>`;
      outBox.append(nb);
      nb.querySelector('button').onclick = () => { nb.remove(); revealNext(lesson); };
    }
  } else if (p.tries >= 2 && st.solution) {
    sec.querySelector('.answer-btn').hidden = false;
  }
}
function advanceStep(lesson, i) {
  const p = lessonProgress(lesson.id);
  if (i >= p.step) { p.step = i + 1; setLessonProgress(lesson.id, p); }
  revealNext(lesson);
}
function revealNext(lesson) {
  const keep = [...document.querySelectorAll('.step .output')].map(o => o.innerHTML);
  const canv = [...document.querySelectorAll('.step')].map(s => [...s.querySelectorAll('canvas')]);
  renderSteps(lesson);
  // keep earlier outputs on screen
  document.querySelectorAll('.step').forEach((s, i) => {
    const o = s.querySelector('.output');
    if (o && keep[i] != null) { o.innerHTML = keep[i]; s.querySelectorAll('.output canvas').forEach(c => c.remove()); canv[i]?.forEach(c => o.insertBefore(c, o.querySelector('.step-msg'))); o.querySelectorAll('.next-row').forEach(n => n.remove()); }
  });
  const cur = document.querySelector('.step.current') || $('#lessonEnd');
  cur?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  cur?.querySelector('textarea')?.focus({ preventScroll: true });
}
function drawLessonEnd(lesson) {
  const p = lessonProgress(lesson.id);
  const end = $('#lessonEnd');
  end.innerHTML = `<section class="step note-step">
    <div class="step-text"><p><strong>field note.</strong> ${lesson.note}</p></div>
    <textarea class="note-area" rows="4" aria-label="field note">${gardenEsc(p.note || '')}</textarea>
    <div class="controls"><button class="primary" id="gPlant" type="button">${p.done ? 'update note' : 'plant it ✿'}</button>${p.done ? '<span class="step-ok">in bloom</span>' : ''}</div>
  </section>`;
  $('#gPlant').onclick = () => {
    const note = end.querySelector('textarea').value.trim();
    if (!note) { end.querySelector('textarea').focus(); return; }
    const q = lessonProgress(lesson.id);
    q.note = note; q.done = true; q.doneAt ??= new Date().toISOString().slice(0, 10);
    setLessonProgress(lesson.id, q);
    gardenView.lesson = null;
    drawGardenHome();
    const plot = document.querySelector(`[data-lesson="${lesson.id}"]`);
    plot?.classList.add('just-bloomed');
    plot?.scrollIntoView({ block: 'center' });
  };
}
function exportLessonCode(lesson) {
  const p = lessonProgress(lesson.id);
  const data = (lesson.cite || []).map(k => GARDEN_DATA[k]).filter(Boolean);
  const lines = [`# ${lesson.title}`, `# question: ${lesson.question}`, ...data.map(d => `# data: ${d.cite.replace(/<[^>]+>/g, '')} ${d.url} (${d.license})`), '# from the quiet time data garden', ''];
  if (lesson.setup) lines.push('# setup', lesson.setup.trim(), '');
  lesson.steps.forEach((st, i) => {
    if (!st.code) return;
    lines.push(`# step ${i + 1}`, (p.code[i] ?? st.code).trim(), '');
  });
  if (p.note) lines.push('# my field note:', ...p.note.split('\n').map(l => '# ' + l));
  exportWriting(lines.join('\n'), lesson.id + '.R');
}
