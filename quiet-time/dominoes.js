/* quiet time — dominoes: the page.
   Holds the game for each difficulty, applies moves (with undo), checks the board against the
   rules, and asks the worker for new puzzles. No timers or scores. */
(function (root) {
  const P = root.DMPuzzles, V = root.DMValidate, R = root.DMRender;
  let dm = null;          // { level, byLevel, ready }
  let ui = { sel: null, cursor: null, preview: null, marks: {}, note: '', loading: false, S: 56 };

  const game = () => dm.byLevel[dm.level];
  const save = () => root.DMSave.save(dm.level, dm.byLevel, dm.ready);

  // ---- making puzzles (off the main thread when possible) ----
  let worker = null, jobs = new Map(), jobSeq = 0;
  function makePuzzle(level) {
    const seed = root.DMGenerator.newSeed();
    if (worker === null) {
      try {
        worker = new Worker('dominoes-worker.js');
        worker.onmessage = e => { const done = jobs.get(e.data.job); jobs.delete(e.data.job); done?.(e.data.puzzle); };
        worker.onerror = () => { worker = false; for (const [, done] of jobs) done(null); jobs.clear(); };
      } catch { worker = false; }
    }
    return new Promise(resolve => {
      const local = () => setTimeout(() => resolve(root.DMGenerator.generate(level, seed)), 30);
      if (!worker) return local();
      const job = ++jobSeq;
      jobs.set(job, puzzle => (puzzle ? resolve(puzzle) : local()));
      worker.postMessage({ job, level, seed });
    });
  }
  const prefetching = {};
  function prefetch(level) {
    if (dm.ready[level] || prefetching[level]) return;
    prefetching[level] = true;
    makePuzzle(level).then(p => { prefetching[level] = false; if (p && dm) { dm.ready[level] = p; save(); } });
  }
  function fresh(puzzle) {
    return { puzzle, placements: [], tray: {}, history: [], future: [], solved: false };
  }
  async function newPuzzle(level) {
    ui.sel = null; ui.cursor = null; ui.marks = {}; ui.note = '';
    if (dm.ready[level]) {
      dm.byLevel[level] = fresh(dm.ready[level]);
      dm.ready[level] = null;
    } else {
      ui.loading = true; render();
      const p = await makePuzzle(level);
      ui.loading = false;
      if (!p) { ui.note = 'that puzzle would not come together. try new puzzle again.'; render(); return; }
      dm.byLevel[level] = fresh(p);
    }
    save();
    if (dm.level === level) render();
    prefetch(level);
  }

  // ---- reading the board ----
  function placementOf(piece) { return game().placements.find(pl => pl.piece === piece) || null; }
  function trayTurn(piece) { return game().tray[piece] || { dir: 'h', flip: false }; }
  // how a domino currently looks: first value left/top
  function view(piece) {
    const g = game(), pc = g.puzzle.pieces[piece], pl = placementOf(piece);
    if (pl) {
      const lo = Math.min(pl.c1, pl.c2);
      const dir = Math.abs(pl.c1 - pl.c2) === 1 ? 'h' : 'v';
      return { first: lo === pl.c1 ? pl.v1 : pl.v2, second: lo === pl.c1 ? pl.v2 : pl.v1, dir, placed: pl };
    }
    const t = trayTurn(piece);
    return { first: t.flip ? pc.b : pc.a, second: t.flip ? pc.a : pc.b, dir: t.dir, placed: null };
  }
  function occupiedBy(cell) {
    const pl = game().placements.find(x => x.c1 === cell || x.c2 === cell);
    return pl ? pl.piece : -1;
  }
  // can this domino take these two cells?
  function fits(piece, c1, c2) {
    const p = game().puzzle, { onBoard, adj } = P.index(p);
    if (!onBoard.has(c1) || !onBoard.has(c2) || !adj.get(c1).includes(c2)) return false;
    const a = occupiedBy(c1), b = occupiedBy(c2);
    return (a < 0 || a === piece) && (b < 0 || b === piece);
  }
  // first-half cell for a domino whose `half` lies on `cell`
  function cellsFor(dir, half, cell) {
    const cols = game().puzzle.cols, step = dir === 'h' ? 1 : cols;
    const first = half === 0 ? cell : cell - step;
    if (dir === 'h' && Math.floor(first / cols) !== Math.floor((first + 1) / cols)) return null;
    if (first < 0) return null;
    return [first, first + step];
  }

  // ---- changing the board (every change can be undone) ----
  const snapshot = () => JSON.stringify({ placements: game().placements, tray: game().tray });
  function remember() {
    const g = game();
    g.history.push(snapshot());
    if (g.history.length > 200) g.history.shift();
    g.future = [];
  }
  function restoreSnap(json) {
    const g = game(), s = JSON.parse(json);
    g.placements = s.placements; g.tray = s.tray;
  }
  function changed(note = '') {
    const g = game();
    ui.marks = ui.keepMarks ? ui.marks : {};
    ui.keepMarks = false;
    const ev = V.evaluate(g.puzzle, g.placements);
    const was = g.solved;
    g.solved = ev.solved;
    ui.note = g.solved ? '' : note;
    if (g.solved && !was) { ui.sel = null; ui.cursor = null; }
    save(); render();
  }
  function put(piece, c1, c2, v1, v2) {
    const g = game();
    g.placements = g.placements.filter(pl => pl.piece !== piece);
    g.placements.push({ piece, c1, c2, v1, v2 });
  }
  function placeAt(piece, t) {
    if (!t || !t.ok || game().solved) return false;
    const v = view(piece);
    remember();
    // first value goes on the top/left cell, whichever way round the spot runs
    const lo = Math.min(t.c1, t.c2), hi = Math.max(t.c1, t.c2);
    put(piece, lo, hi, v.first, v.second);
    ui.sel = piece; ui.cursor = null;
    changed();
    return true;
  }
  function toTray(piece) {
    const g = game(), pl = placementOf(piece);
    if (!pl || g.solved) return;
    remember();
    const v = view(piece);
    g.placements = g.placements.filter(x => x.piece !== piece);
    // it keeps the way it was turned on the board
    const pc = g.puzzle.pieces[piece];
    g.tray[piece] = { dir: v.dir, flip: !(v.first === pc.a && v.second === pc.b) };
    if (ui.sel === piece) ui.sel = null;
    changed();
  }

  // turning: a quarter turn clockwise, keeping one half where it is if there is room
  function rotate() {
    const g = game(), piece = ui.sel;
    if (piece == null || g.solved) return;
    const pl = placementOf(piece);
    if (!pl) {
      const t = trayTurn(piece);
      remember();
      g.tray[piece] = t.dir === 'h' ? { dir: 'v', flip: t.flip } : { dir: 'h', flip: !t.flip };
      changed();
      return;
    }
    const cols = g.puzzle.cols;
    const turn = (pivot, other) => {
      const dr = Math.floor(other / cols) - Math.floor(pivot / cols), dc = other % cols - pivot % cols;
      const nr = Math.floor(pivot / cols) + dc, nc = pivot % cols - dr;   // clockwise on screen: right -> down -> left -> up
      if (nc < 0 || nc >= cols || nr < 0 || nr >= g.puzzle.rows) return -1;
      return nr * cols + nc;
    };
    // clockwise around the first half; failing that, around the second
    const tries = [];
    const a2 = turn(pl.c1, pl.c2);
    if (a2 >= 0) tries.push({ c1: pl.c1, c2: a2, v1: pl.v1, v2: pl.v2 });
    const b1 = turn(pl.c2, pl.c1);
    if (b1 >= 0) tries.push({ c1: b1, c2: pl.c2, v1: pl.v1, v2: pl.v2 });
    const ok = tries.find(t => fits(piece, t.c1, t.c2));
    if (!ok) { ui.note = 'no room to turn it here.'; render(); return; }
    remember();
    put(piece, ok.c1, ok.c2, ok.v1, ok.v2);
    changed();
  }
  function flip() {
    const g = game(), piece = ui.sel;
    if (piece == null || g.solved) return;
    remember();
    const pl = placementOf(piece);
    if (pl) put(piece, pl.c1, pl.c2, pl.v2, pl.v1);
    else { const t = trayTurn(piece); g.tray[piece] = { dir: t.dir, flip: !t.flip }; }
    changed();
  }
  function removeSelected() { if (ui.sel != null && placementOf(ui.sel)) toTray(ui.sel); }

  function undo() {
    const g = game();
    if (!g.history.length) return;
    restoreSnap(g.history.pop());
    ui.sel = null; ui.cursor = null;
    changed('undone.');
  }
  // ---- taps, cursor, keyboard slides ----
  function tapPiece(piece) {
    if (game().solved) return;
    if (ui.sel === piece) { rotate(); return; }
    ui.sel = piece;
    ui.cursor = placementOf(piece) ? null : firstFreeCell();
    ui.note = '';
    render();
  }
  function firstFreeCell() {
    const g = game();
    return g.puzzle.cells.find(c => occupiedBy(c) < 0) ?? null;
  }
  // put the selected domino on a tapped cell (its first half there, or its second if that fits better)
  function tapCell(cell) {
    const g = game();
    if (g.solved) return;
    const occupant = occupiedBy(cell);
    if (occupant >= 0) { tapPiece(occupant); return; }
    if (ui.sel == null) { ui.note = 'pick a domino first, then a spot for it.'; render(); return; }
    const v = view(ui.sel);
    for (const half of [0, 1]) {
      const cs = cellsFor(v.dir, half, cell);
      if (cs && fits(ui.sel, cs[0], cs[1])) { placeAt(ui.sel, { c1: cs[0], c2: cs[1], ok: true }); return; }
    }
    ui.note = 'it doesn’t fit there that way round. tap it to turn it.'; render();
  }
  function tapTray() {
    if (ui.sel != null && placementOf(ui.sel)) toTray(ui.sel);
    else if (ui.sel != null) { ui.sel = null; ui.cursor = null; render(); }
  }
  function deselect() { ui.sel = null; ui.cursor = null; ui.note = ''; render(); }

  // where a dragged domino would land under the pointer (null when off the board)
  // where a dragged domino would land: the nearest open spot, the way round it is held, within about
  // a cell and a half of where it is let go, so it never needs to be lined up exactly.
  // null = dropped well off the board.
  function targetAt(piece, half, x, y) {
    const board = document.getElementById('dmBoard');
    if (!board) return null;
    const p = game().puzzle, r = board.getBoundingClientRect(), S = ui.S;
    const g = R.geometry(p, S), dir = view(piece).dir;
    // the centre of the held domino, in board-cell units
    const hx = (x - r.left - g.pad) / S + (dir === 'h' ? (half === 0 ? .5 : -.5) : 0);
    const hy = (y - r.top - g.pad) / S + (dir === 'v' ? (half === 0 ? .5 : -.5) : 0);
    if (hx < -.6 || hy < -.6 || hx > p.cols + .6 || hy > p.rows + .6) return null;
    // the nearest open spot, kept the way round it is being held
    const step = dir === 'h' ? 1 : p.cols;
    let best = null, bestD = Infinity;
    for (const c of p.cells) {
      const row = Math.floor(c / p.cols), col = c % p.cols;
      if (dir === 'h' && col === p.cols - 1) continue;
      const cx = col + (dir === 'h' ? 1 : .5), cy = row + (dir === 'v' ? 1 : .5);
      const dist = Math.hypot(cx - hx, cy - hy);
      if (dist < bestD && fits(piece, c, c + step)) { best = c; bestD = dist; }
    }
    if (best !== null && bestD <= 1.5) return { c1: best, c2: best + step, ok: true };
    // nothing open close by: show where it is, in rose, and let it go back
    const col = Math.max(0, Math.min(p.cols - 1, Math.floor(hx - (dir === 'h' ? .5 : 0)))), row = Math.max(0, Math.min(p.rows - 1, Math.floor(hy - (dir === 'v' ? .5 : 0))));
    const c = row * p.cols + col, onBoard = P.index(p).onBoard;
    const other = c + step;
    if (!onBoard.has(c) || !onBoard.has(other) || (dir === 'h' && col === p.cols - 1)) return { c1: c, c2: c, ok: false };
    return { c1: c, c2: other, ok: false };
  }

  function slide(dr, dc) {
    const g = game(), p = g.puzzle, piece = ui.sel;
    if (piece == null || g.solved) return;
    const pl = placementOf(piece);
    const shift = c => {
      const r = Math.floor(c / p.cols) + dr, cc = c % p.cols + dc;
      return r < 0 || cc < 0 || r >= p.rows || cc >= p.cols ? -1 : r * p.cols + cc;
    };
    if (pl) {
      const a = shift(pl.c1), b = shift(pl.c2);
      if (a < 0 || b < 0 || !fits(piece, a, b)) { ui.note = 'no room to slide that way.'; render(); return; }
      remember(); put(piece, a, b, pl.v1, pl.v2); changed();
      return;
    }
    // a tray domino: move the placement cursor over the board's cells
    let c = ui.cursor ?? firstFreeCell();
    for (let i = 0; i < Math.max(p.rows, p.cols); i++) {
      const n = shift(c);
      if (n < 0) break;
      c = n;
      if (P.index(p).onBoard.has(c)) break;
    }
    ui.cursor = c; render();
  }
  function cursorActive() { return ui.sel != null && !placementOf(ui.sel) && ui.cursor != null; }
  function placeAtCursor() { if (cursorActive()) tapCell(ui.cursor); }
  function focusNext(from, [dr, dc]) {
    const all = [...document.querySelectorAll('[data-piece]')];
    const i = all.indexOf(from.closest('[data-piece]'));
    const next = all[(i + (dr + dc > 0 ? 1 : -1) + all.length) % all.length];
    next?.focus();
  }

  // ---- check ----
  function check() {
    const g = game(), ev = V.evaluate(g.puzzle, g.placements);
    if (ev.solved) { ui.note = ''; render(); return; }
    const bad = new Set(ev.regions.map((s, i) => (s === 'bad' ? i : -1)).filter(i => i >= 0));
    ui.marks = { bad };
    const left = ev.total - ev.covered;
    ui.note = bad.size
      ? `${bad.size === 1 ? 'one region doesn’t' : bad.size + ' regions don’t'} work with what’s there now (outlined).`
      : left ? `everything so far fits · ${left} ${left === 1 ? 'cell' : 'cells'} to go.` : 'every cell is covered, but something still needs a look.';
    render();
  }
  // ---- confirm dialog ----
  function confirmBox(title, text, yes, onYes) {
    if (document.getElementById('dmConfirm')) return;
    const mask = document.createElement('div');
    mask.id = 'dmConfirm'; mask.className = 'qt-modal';
    mask.innerHTML = `<div class="qt-dialog" role="dialog" aria-modal="true" aria-labelledby="dmConfirmTitle"><h2 id="dmConfirmTitle">${title}</h2><p>${text}</p><div class="controls"><button class="pill" id="dmNo" type="button">keep this one</button><button class="primary" id="dmYes" type="button">${yes}</button></div></div>`;
    document.body.append(mask);
    const close = () => mask.remove();
    mask.querySelector('#dmNo').onclick = close;
    mask.querySelector('#dmYes').onclick = () => { close(); onYes(); };
    mask.addEventListener('click', e => { if (e.target === mask) close(); });
    mask.querySelector('#dmNo').focus();
  }
  const unfinished = () => { const g = game(); return g && !g.solved && g.placements.length > 0; };

  // ---- drawing ----
  const stacked = () => matchMedia('(max-width:820px),(orientation:portrait) and (max-width:1024px)').matches;
  function sizeCells() {
    const host = document.getElementById('dmHost');
    const p = game()?.puzzle;
    if (!host || !p) return;
    // side by side: the board gets what the 300px tray leaves; stacked: the full width
    const w = host.clientWidth - (stacked() ? 0 : 326);
    const top = host.getBoundingClientRect().top + scrollY;
    const h = Math.max(300, innerHeight - Math.min(top, 260) - (stacked() ? 230 : 40));
    const span = n => n + R.PAD * 2;
    ui.S = Math.max(34, Math.min(84, Math.floor(Math.min(w / span(p.cols), h / span(p.rows)))));
  }

  function dominoButton(piece, where, style = '') {
    const v = view(piece);
    const cls = ['dm-domino', `dm-${v.dir}`, ui.sel === piece ? 'selected' : ''].join(' ');
    const label = `domino ${v.first} and ${v.second}${where === 'board' ? ', on the board' : ', in the tray'}${ui.sel === piece ? ', selected' : ''}`;
    return `<button class="${cls}" type="button" data-piece="${piece}" data-where="${where}" style="${style}" aria-label="${label}" aria-pressed="${ui.sel === piece}">${R.dominoSVG(v.first, v.second, v.dir)}</button>`;
  }

  function render() {
    const host = document.getElementById('dmHost');
    if (!host) return;
    const g = game();
    const levelSel = document.getElementById('dmLevel');
    if (levelSel) levelSel.value = dm.level;
    if (!g || ui.loading) {
      host.innerHTML = `<div class="dm-loading">setting out a ${dm.level} puzzle…</div>`;
      updateButtons();
      return;
    }
    sizeCells();
    // redrawing replaces the buttons; keep keyboard focus on the same domino
    const focused = document.activeElement?.closest?.('[data-piece]');
    if (focused && ui.focusAfter == null) ui.focusAfter = ui.sel ?? +focused.dataset.piece;
    const p = g.puzzle, S = ui.S, geo = R.geometry(p, S);
    const marks = { ...ui.marks };
    if (ui.preview) { marks.preview = ui.preview.cells; marks.previewOk = ui.preview.ok; }
    if (cursorActive()) marks.cursor = ui.cursor;
    if (g.solved) marks.ok = new Set(p.regions.map((_, i) => i));
    const placed = g.placements.map(pl => {
      const lo = Math.min(pl.c1, pl.c2), h = Math.abs(pl.c1 - pl.c2) === 1;
      const inset = Math.max(2, S * .05);
      return dominoButton(pl.piece, 'board', `left:${geo.x(lo) + inset}px;top:${geo.y(lo) + inset}px;width:${(h ? 2 : 1) * S - inset * 2}px;height:${(h ? 1 : 2) * S - inset * 2}px`);
    }).join('');
    const T = Math.max(26, Math.round(S * .7));
    const trayPieces = p.pieces.filter(pc => !placementOf(pc.id)).map(pc => {
      const v = view(pc.id);
      return dominoButton(pc.id, 'tray', `width:${(v.dir === 'h' ? 2 : 1) * T}px;height:${(v.dir === 'h' ? 1 : 2) * T}px`);
    }).join('');
    const cellMarks = ui.marks.cells ? [...ui.marks.cells].map(c => `<div class="dm-cell-glow" style="left:${geo.x(c)}px;top:${geo.y(c)}px;width:${S}px;height:${S}px"></div>`).join('') : '';
    host.innerHTML = `
      <div class="dm-play${g.solved ? ' solved' : ''}">
        <div class="dm-board-col" id="dmBoardCol">
          <div class="dm-board" id="dmBoard" style="width:${geo.width}px;height:${geo.height}px" role="group" aria-label="puzzle board, ${p.cells.length} cells">
            ${R.boardSVG(p, S, marks)}${cellMarks}
            <div class="dm-layer">${placed}</div>
            ${R.badgesSVG(p, S, marks)}
          </div>
        </div>
        <div class="dm-tray-col">
          <div class="dm-tray" id="dmTray" aria-label="tray">${trayPieces || (g.solved ? '' : '<p class="dm-empty">all dominoes are on the board.</p>')}</div>
          <p class="dm-note" id="dmNote" aria-live="polite">${ui.note}</p>
          ${g.solved ? `<div class="dm-done" role="status"><p class="dm-done-title">solved</p><p>every region is content.</p><button class="primary" id="dmNextPuzzle" type="button">new puzzle</button></div>` : ''}
          <p class="dm-id">puzzle ${p.id}${p.unique ? '' : ' · more than one answer'}</p>
        </div>
      </div>`;
    const next = document.getElementById('dmNextPuzzle');
    if (next) next.onclick = () => newPuzzle(dm.level);
    updateButtons();
    if (ui.focusAfter != null) { document.querySelector(`[data-piece="${ui.focusAfter}"]`)?.focus(); ui.focusAfter = null; }
  }

  function updateButtons() {
    const g = game();
    const set = (id, on) => { const b = document.getElementById(id); if (b) b.disabled = !on; };
    const busy = ui.loading || !g;
    set('dmUndo', !busy && g.history.length > 0 && !g.solved);
    set('dmReset', !busy && g.placements.length > 0 && !g.solved);
    set('dmCheck', !busy && !g.solved);
  }

  function drawDominoes() {
    if (!dm) dm = root.DMSave.load();
    ui.sel = null; ui.cursor = null; ui.preview = null; ui.marks = {};
    layout('dominoes', '', `
      <div class="dm" id="dm">
        <div class="dm-bar">
          <select class="pill" id="dmLevel" aria-label="difficulty">${P.LEVEL_ORDER.map(l => `<option value="${l}">${l}</option>`).join('')}</select>
          <button class="pill" id="dmUndo" type="button">undo</button>
          <button class="pill" id="dmReset" type="button">reset</button>
          <button class="pill" id="dmCheck" type="button">check</button>
          <button class="pill" id="dmNew" type="button">new puzzle</button>
        </div>
        <div id="dmHost"></div>
      </div>`);
    document.getElementById('dmLevel').onchange = e => setLevel(e.target.value);
    document.getElementById('dmNew').onclick = () => {
      if (unfinished()) confirmBox('start a new puzzle?', 'this one will be set aside and its dominoes cleared.', 'new puzzle', () => newPuzzle(dm.level));
      else newPuzzle(dm.level);
    };
    document.getElementById('dmCheck').onclick = check;
    document.getElementById('dmUndo').onclick = undo;
    document.getElementById('dmReset').onclick = () => confirmBox('take every domino off?', 'the board will be cleared. undo can bring it back.', 'reset', () => {
      remember(); game().placements = []; ui.sel = null; changed('the board is clear.');
    });
    const api = {
      view, cellSize: () => ui.S, targetAt, placeAt, toTray, tapPiece, tapCell, tapTray,
      preview: pv => { const same = JSON.stringify(pv) === JSON.stringify(ui.preview); ui.preview = pv; if (!same) redrawBoardOnly(); },
      refresh: render, selection: () => ui.sel, rotate, flip, removeSelected, deselect, undo,
      slide, cursorActive, placeAtCursor, focusNext
    };
    root.DMControls.attach(document.getElementById('dm'), api);
    root.DMControls.setKeyboardTarget(api);
    if (game()) { render(); prefetch(dm.level); } else newPuzzle(dm.level);
  }

  // while dragging, only the board's SVG (for the landing preview) is redrawn
  function redrawBoardOnly() {
    const board = document.getElementById('dmBoard'), g = game();
    if (!board || !g) return;
    const marks = { ...ui.marks };
    if (ui.preview) { marks.preview = ui.preview.cells; marks.previewOk = ui.preview.ok; }
    const old = board.querySelector('.dm-board-svg');
    const tmp = document.createElement('div');
    tmp.innerHTML = R.boardSVG(g.puzzle, ui.S, marks);
    old.replaceWith(tmp.firstChild);
  }

  function setLevel(level) {
    if (!P.LEVELS[level] || level === dm.level) return;
    dm.level = level;
    ui.sel = null; ui.cursor = null; ui.marks = {}; ui.note = '';
    save();
    if (game()) { render(); prefetch(level); } else newPuzzle(level);
  }

  let resizeTimer = 0;
  addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { if (document.getElementById('dmHost') && !document.querySelector('.dm-ghost')) render(); }, 120); });

  root.drawDominoes = drawDominoes;
  root.DMPage = { state: () => dm, ui: () => ui, game, newPuzzle, check, undo, rotate, flip, tapPiece, tapCell, toTray, placeAt, setLevel };
})(window);
