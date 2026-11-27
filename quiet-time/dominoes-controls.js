/* quiet time — dominoes: controls.
   pointer (mouse, pen, touch): drag a domino from the tray or the board onto the board; drop it
   back on the tray (or anywhere off the board) to take it off. A tap selects a domino; tapping
   it again turns it. With a domino selected, tap an empty cell to put it there.
   keyboard: tab to a domino, enter selects; r turns, f flips, delete returns it to the tray;
   arrows move a placed domino (or the placement cursor for a tray domino) and enter places it;
   escape lets go; ⌘/ctrl-z undoes. */
(function (root) {
  const DRAG_START = 6;   // pixels before a press becomes a drag

  const capture = (el, id) => { try { el.setPointerCapture(id); } catch { /* pointer already gone */ } };

  function attach(rootEl, api) {
    let press = null;   // { piece, id, x, y, half, dragging, ghost, from }

    rootEl.addEventListener('pointerdown', e => {
      const el = e.target.closest('[data-piece]');
      if (!el || e.button > 0) return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const view = api.view(+el.dataset.piece);
      // which half was grabbed decides where the domino lands
      const half = view.dir === 'h' ? (e.clientX - r.left < r.width / 2 ? 0 : 1) : (e.clientY - r.top < r.height / 2 ? 0 : 1);
      press = { piece: +el.dataset.piece, id: e.pointerId, x: e.clientX, y: e.clientY, half, dragging: false, el, from: el.dataset.where };
      capture(el, e.pointerId);
    });

    rootEl.addEventListener('pointermove', e => {
      if (!press || e.pointerId !== press.id) return;
      e.preventDefault();
      if (!press.dragging) {
        if (Math.hypot(e.clientX - press.x, e.clientY - press.y) < DRAG_START) return;
        press.dragging = true;
        startGhost(press, api);
      }
      moveGhost(press, e, api);
    });

    const finish = e => {
      if (!press || e.pointerId !== press.id) return;
      const p = press; press = null;
      if (!p.dragging) { if (e.type === 'pointerup') api.tapPiece(p.piece); return; }
      p.ghost.remove();
      p.el.classList.remove('dm-lifted');
      api.preview(null);
      if (e.type !== 'pointerup') return;
      const target = api.targetAt(p.piece, p.half, e.clientX, e.clientY);
      if (target && target.ok) api.placeAt(p.piece, target);
      else if (!target && p.from === 'board') api.toTray(p.piece);     // dropped off the board
      else api.refresh();
    };
    rootEl.addEventListener('pointerup', finish);
    rootEl.addEventListener('pointercancel', finish);
    rootEl.addEventListener('lostpointercapture', e => { if (press && press.dragging && e.pointerId === press.id) finish({ ...e, type: 'pointercancel', pointerId: e.pointerId }); });

    // taps on empty cells (placing a selected domino) and on the tray background
    rootEl.addEventListener('click', e => {
      if (e.target.closest('[data-piece]')) return;
      const cell = e.target.closest('[data-cell]');
      if (cell) { api.tapCell(+cell.dataset.cell); return; }
      if (e.target.closest('#dmTray')) api.tapTray();
    });
  }

  function startGhost(press, api) {
    const view = api.view(press.piece), S = api.cellSize();
    const g = document.createElement('div');
    g.className = 'dm-ghost';
    g.style.width = (view.dir === 'h' ? 2 * S : S) + 'px';
    g.style.height = (view.dir === 'h' ? S : 2 * S) + 'px';
    g.innerHTML = root.DMRender.dominoSVG(view.first, view.second, view.dir);
    document.body.append(g);
    press.ghost = g;
    press.el.classList.add('dm-lifted');
  }
  function moveGhost(press, e, api) {
    const view = api.view(press.piece), S = api.cellSize();
    // the grabbed half sits under the finger
    const offX = view.dir === 'h' ? (press.half + .5) * S : S / 2;
    const offY = view.dir === 'h' ? S / 2 : (press.half + .5) * S;
    press.ghost.style.transform = `translate(${e.clientX - offX}px, ${e.clientY - offY}px)`;
    const t = api.targetAt(press.piece, press.half, e.clientX, e.clientY);
    api.preview(t && t.c1 !== t.c2 ? { cells: [t.c1, t.c2], ok: t.ok } : null);
  }

  // keyboard: one listener for the app, active only while the dominoes board is on screen
  let api = null;
  function setKeyboardTarget(a) { api = a; }
  document.addEventListener('keydown', e => {
    if (!api || !document.getElementById('dmBoard') || e.target.closest?.('select,input,textarea') || document.querySelector('.qt-modal')) return;
    const mod = e.metaKey || e.ctrlKey;
    if (mod && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); api.undo(); return; }
    if (mod || e.altKey) return;
    const arrows = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    const enter = e.key === 'Enter' || e.key === ' ';
    if (enter && api.selection() != null && api.cursorActive()) { e.preventDefault(); api.placeAtCursor(); return; }
    const onPiece = e.target.closest?.('[data-piece]');
    if (enter && onPiece) { e.preventDefault(); api.tapPiece(+onPiece.dataset.piece); return; }
    if (api.selection() == null) {
      if (arrows[e.key] && e.target.closest?.('[data-piece]')) { e.preventDefault(); api.focusNext(e.target, arrows[e.key]); }
      return;
    }
    if (e.key === 'r' || e.key === 'R') { e.preventDefault(); api.rotate(); }
    else if (e.key === 'f' || e.key === 'F') { e.preventDefault(); api.flip(); }
    else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); api.removeSelected(); }
    else if (e.key === 'Escape') { e.preventDefault(); api.deselect(); }
    else if (arrows[e.key]) { e.preventDefault(); api.nudge(...arrows[e.key]); }
  });

  root.DMControls = { attach, setKeyboardTarget };
})(window);
