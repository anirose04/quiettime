/* quiet time — fruitmerge: controls.
   mouse: move to aim, click to drop. keyboard: ← → aim, space drops,
   ↑ ↓ / page up / page down look around the endless pile, home returns to the top.
   touch: one finger aims and lifting it drops; two fingers look around without dropping.
   wheel and the stack map only move the camera; they never drop fruit. While looking
   around, a tap or click just brings the camera back to the drop zone. */
(function (root) {
  const G = root.FMGame;
  const keys = { left: false, right: false };

  const capture = (el, id) => { try { el.setPointerCapture(id); } catch { /* pointer already gone */ } };

  function attach(canvas, api) {
    const touches = new Map();       // pointerId -> {x, y}
    let touchPlan = null;            // 'aim' | 'look' (one finger while looking around) | 'pan' (two fingers) | 'cancel'
    let lastPanY = null, touchesMoved = false;

    const toWorldX = clientX => {
      const r = canvas.getBoundingClientRect();
      const { w } = root.FMRender.viewSize();
      return (clientX - r.left) / r.width * w - root.FMRender.PAD;
    };
    const unitsPerPixel = () => root.FMRender.viewSize().w / canvas.getBoundingClientRect().width;
    const avgY = () => { let t = 0; for (const p of touches.values()) t += p.y; return t / touches.size; };

    canvas.addEventListener('pointerdown', e => {
      const s = api.state();
      if (e.pointerType === 'mouse') {
        if (e.button !== 0) return;
        s.dropX = toWorldX(e.clientX);
        if (G.inspecting(s)) G.returnToTop(s);
        else if (G.drop(s)) api.dropped();
        return;
      }
      e.preventDefault();
      capture(canvas, e.pointerId);
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touches.size === 1) {
        // while looking around the pile, one finger keeps looking; a plain tap returns to the top
        touchPlan = G.inspecting(s) ? 'look' : 'aim';
        touchesMoved = false;
        lastPanY = e.clientY;
        if (touchPlan === 'aim') s.dropX = toWorldX(e.clientX);
      } else {
        // a second finger means looking around: the pending drop is called off
        touchPlan = s.mode === 'endless' ? 'pan' : 'cancel';
        lastPanY = avgY();
      }
    });
    canvas.addEventListener('pointermove', e => {
      const s = api.state();
      if (e.pointerType === 'mouse') { s.dropX = toWorldX(e.clientX); return; }
      if (!touches.has(e.pointerId)) return;
      e.preventDefault();
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touchPlan === 'aim') s.dropX = toWorldX(e.clientX);
      else if (touchPlan === 'pan' || touchPlan === 'look') {
        const y = avgY();
        if (Math.abs(y - lastPanY) > 2 || touchesMoved) {
          touchesMoved = true;
          G.pan(s, -(y - lastPanY) * unitsPerPixel());
          lastPanY = y;
        }
      }
    });
    const lift = e => {
      if (!touches.has(e.pointerId)) return;
      touches.delete(e.pointerId);
      const s = api.state();
      if (touches.size === 0) {
        if (touchPlan === 'aim' && e.type === 'pointerup') { if (G.drop(s)) api.dropped(); }
        else if (touchPlan === 'look' && e.type === 'pointerup' && !touchesMoved) G.returnToTop(s);
        touchPlan = null; touchesMoved = false;
      } else lastPanY = avgY();
    };
    canvas.addEventListener('pointerup', lift);
    canvas.addEventListener('pointercancel', lift);
    canvas.addEventListener('wheel', e => {
      const s = api.state();
      if (s.mode !== 'endless') return;
      e.preventDefault();
      G.pan(s, e.deltaY * (e.deltaMode === 1 ? 30 : 1) * unitsPerPixel());
    }, { passive: false });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
  }

  // the stack map: grab the box and drag it to move the view; pressing elsewhere on the map jumps there
  function attachMap(mapCanvas, api) {
    let grab = null;   // world units between the pointer and the top of the view while dragging
    const at = e => {
      const r = mapCanvas.getBoundingClientRect();
      return (e.clientY - r.top) / r.height * mapCanvas.height;
    };
    const move = e => {
      const s = api.state(), info = api.mapInfo();
      if (!info || grab === null) return;
      G.pan(s, info.toWorld(at(e)) - grab - s.camTop);
    };
    mapCanvas.addEventListener('pointerdown', e => {
      const s = api.state(), info = api.mapInfo();
      if (!info) return;
      e.preventDefault();
      capture(mapCanvas, e.pointerId);
      const py = at(e);
      grab = py >= info.viewTop && py <= info.viewBottom ? info.toWorld(py) - s.camTop : G.VIEW_H / 2;
      move(e);
    });
    mapCanvas.addEventListener('pointermove', e => { if (grab !== null) { e.preventDefault(); move(e); } });
    const end = () => { grab = null; };
    mapCanvas.addEventListener('pointerup', end);
    mapCanvas.addEventListener('pointercancel', end);
  }

  // keyboard: one listener for the whole app, active only while the fruitmerge board is on screen
  let api = null;
  function setKeyboardTarget(a) { api = a; }
  const inField = e => e.target.closest?.('select,input,textarea');
  document.addEventListener('keydown', e => {
    if (!api || !document.getElementById('fmCanvas') || inField(e) || document.querySelector('.qt-modal')) return;
    const s = api.state();
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { keys.left = true; e.preventDefault(); if (!e.repeat) nudge(s, -1); }
    else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { keys.right = true; e.preventDefault(); if (!e.repeat) nudge(s, 1); }
    else if (e.key === ' ') {
      if (e.target.closest?.('button,summary,a')) return;   // space on a focused button is that button's
      e.preventDefault();
      if (e.repeat) return;
      if (G.inspecting(s)) G.returnToTop(s);
      else if (G.drop(s)) api.dropped();
    }
    else if (s.mode === 'endless' && (e.key === 'ArrowUp' || e.key === 'PageUp')) { e.preventDefault(); G.pan(s, e.key === 'PageUp' ? -G.VIEW_H * .8 : -60); }
    else if (s.mode === 'endless' && (e.key === 'ArrowDown' || e.key === 'PageDown')) { e.preventDefault(); G.pan(s, e.key === 'PageDown' ? G.VIEW_H * .8 : 60); }
    else if (s.mode === 'endless' && e.key === 'Home') { e.preventDefault(); G.returnToTop(s); }
  });
  document.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
  });
  window.addEventListener('blur', () => { keys.left = keys.right = false; });

  // a single tap of an arrow moves the aim a little; holding it slides smoothly (tick below)
  function nudge(s, dir) {
    const r = root.FMFruits.FRUITS[s.current].r;
    s.dropX = Math.max(r, Math.min(G.W - r, G.heldX(s) + dir * 14));
  }
  // called every frame: held arrow keys slide the aim
  function tick(s, dt) {
    const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    if (dir) {
      const r = root.FMFruits.FRUITS[s.current].r;
      s.dropX = Math.max(r, Math.min(G.W - r, G.heldX(s) + dir * 300 * dt));
    }
  }

  root.FMControls = { attach, attachMap, setKeyboardTarget, tick };
})(typeof window !== 'undefined' ? window : globalThis);
