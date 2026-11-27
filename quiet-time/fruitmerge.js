/* quiet time — fruitmerge: the page.
   Builds the screen, runs the frame loop, keeps the score / next-fruit panel in step with the
   game, and autosaves. Games live in memory while you play and in local storage between visits. */
(function (root) {
  const G = root.FMGame, F = root.FMFruits;
  let fmMode = null;                  // 'classic' | 'endless'
  const fmStates = {};                // live games by mode
  let lastSave = 0, dirty = false, mapInfo = null;

  const current = () => fmStates[fmMode];
  function ensure(mode) {
    if (!fmStates[mode]) fmStates[mode] = root.FMSave.restore(root.FMSave.load(), mode);
    return fmStates[mode];
  }
  function saveNow() {
    if (!fmMode) return;
    root.FMSave.save(fmMode, fmStates);
    lastSave = performance.now(); dirty = false;
  }

  const fruitArt = (tier, cls = '') => F.svg(tier, `class="fm-art ${cls}" role="img" aria-label="${F.FRUITS[tier].name}"`);

  function confirmBox(title, text, yes, onYes) {
    if (document.getElementById('fmConfirm')) return;
    const mask = document.createElement('div');
    mask.id = 'fmConfirm'; mask.className = 'qt-modal';
    mask.innerHTML = `<div class="qt-dialog fm-dialog" role="dialog" aria-modal="true" aria-labelledby="fmConfirmTitle"><h2 id="fmConfirmTitle">${title}</h2><p>${text}</p><div class="controls"><button class="pill" id="fmNo" type="button">keep playing</button><button class="primary" id="fmYes" type="button">${yes}</button></div></div>`;
    document.body.append(mask);
    const close = () => mask.remove();
    mask.querySelector('#fmNo').onclick = close;
    mask.querySelector('#fmYes').onclick = () => { close(); onYes(); };
    mask.addEventListener('click', e => { if (e.target === mask) close(); });
    mask.querySelector('#fmNo').focus();
  }

  function restart() {
    fmStates[fmMode] = G.create(fmMode);
    saveNow(); hud(true);
  }
  function togglePause() {
    const s = current();
    if (s.over) return;
    s.paused = !s.paused; dirty = true; hud();
  }
  function setMode(mode) {
    if (mode === fmMode) return;
    saveNow();
    fmMode = mode;
    ensure(mode);
    saveNow();
    drawFruitmerge();
  }

  let shownNext = -1, shownMode = null;
  function hud(force) {
    const s = current();
    if (!document.getElementById('fmCanvas')) return;
    document.getElementById('fmScore').textContent = s.score;
    const cleared = document.getElementById('fmCleared');
    if (cleared) cleared.textContent = s.cleared;
    // the preview always shows the fruit after the one in your hand
    if (force || s.next !== shownNext || shownMode !== fmMode) {
      shownNext = s.next; shownMode = fmMode;
      const box = document.getElementById('fmNextArt');
      box.innerHTML = fruitArt(s.next);
      box.dataset.tier = s.next;
      box.title = 'next: ' + F.FRUITS[s.next].name;
    }
    const pause = document.getElementById('fmPause');
    pause.textContent = s.paused ? 'resume' : 'pause';
    pause.disabled = s.over;
    const overlay = document.getElementById('fmOverlay');
    const want = s.over ? 'over' : s.paused ? 'paused' : '';
    if (overlay.dataset.kind !== want) {
      overlay.dataset.kind = want;
      overlay.hidden = !want;
      if (want === 'over') {
        overlay.innerHTML = `<div class="fm-card"><p class="fm-card-title">the basket is full</p><p>score ${s.score}</p><button class="primary" id="fmAgain" type="button">play again</button></div>`;
        overlay.querySelector('#fmAgain').onclick = restart;
      } else if (want === 'paused') {
        overlay.innerHTML = `<div class="fm-card"><p class="fm-card-title">paused</p><button class="primary" id="fmResume" type="button">resume</button></div>`;
        overlay.querySelector('#fmResume').onclick = togglePause;
      } else overlay.innerHTML = '';
    }
    const look = document.getElementById('fmLookTop');
    if (look) look.classList.toggle('active', !s.follow);
  }

  function drawFruitmerge() {
    if (!fmMode) fmMode = root.FMSave.load().mode;
    const s = ensure(fmMode);
    const endless = fmMode === 'endless';
    shownNext = -1;
    layout('fruitmerge', '', `
      <div class="fm" id="fm" data-mode="${fmMode}">
        <div class="fm-bar">
          <div class="fm-modes" role="tablist" aria-label="mode">
            <button class="pill ${!endless ? 'active' : ''}" data-fm-mode="classic" role="tab" aria-selected="${!endless}" type="button">classic</button>
            <button class="pill ${endless ? 'active' : ''}" data-fm-mode="endless" role="tab" aria-selected="${endless}" type="button">endless</button>
          </div>
          <p class="fm-tally" aria-live="off">score <span id="fmScore">0</span>${endless ? ` · cleared <span id="fmCleared">0</span>` : ''}</p>
          <div class="fm-actions">
            <button class="pill" id="fmPause" type="button">pause</button>
            <button class="pill" id="fmRestart" type="button">restart</button>
          </div>
        </div>
        <div class="fm-play">
          <div class="fm-stage" id="fmStage">
            <div class="fm-canvas-wrap">
              <canvas id="fmCanvas" aria-label="fruitmerge basket. move to aim, click or press space to drop."></canvas>
              <div class="fm-overlay" id="fmOverlay" hidden></div>
            </div>
          </div>
          ${endless ? `<div class="fm-look" aria-label="look around the pile">
            <canvas id="fmMap" width="52" height="300" aria-label="stack map: drag to look up and down the pile"></canvas>
            <button class="pill fm-look-btn" id="fmLookUp" type="button" aria-label="look up">up</button>
            <button class="pill fm-look-btn" id="fmLookDown" type="button" aria-label="look down">down</button>
            <button class="pill fm-look-btn" id="fmLookTop" type="button" aria-label="back to the drop zone">top</button>
          </div>` : ''}
          <aside class="fm-side">
            <div class="fm-next" aria-live="polite"><span class="fm-label">next</span><div class="fm-next-art" id="fmNextArt"></div></div>
            <p class="fm-help fm-help-mouse">move to aim · click or space to drop${endless ? ' · scroll or the map to look around' : ''}</p>
            <p class="fm-help fm-help-touch">touch to aim · lift to drop${endless ? ' · two fingers or the map to look around' : ''}</p>
          </aside>
        </div>
        <section class="fm-guide" aria-label="fruit order, smallest to largest">
          <ol class="fm-guide-list">${F.FRUITS.map((f, i) => `<li><span class="fm-guide-pic" style="--s:${Math.round(24 + f.r * .42)}px">${fruitArt(i, 'fm-guide-art')}</span><span class="fm-guide-name">${f.name}</span></li>`).join('')}</ol>
          <p class="fm-guide-note">two alike make the next one${endless ? ' · two coconuts clear away' : ''}</p>
        </section>
      </div>`);

    document.querySelectorAll('[data-fm-mode]').forEach(b => b.onclick = () => setMode(b.dataset.fmMode));
    document.getElementById('fmPause').onclick = togglePause;
    document.getElementById('fmRestart').onclick = () => {
      const g = current();
      if (g.over || g.drops === 0) { restart(); return; }
      confirmBox(`start ${fmMode} over?`, `this ${fmMode} game will be cleared. the other mode keeps its fruit.`, 'start over', restart);
    };

    const canvas = document.getElementById('fmCanvas');
    const api = {
      state: current,
      dropped: () => { dirty = true; hud(); },
      togglePause,
      mapInfo: () => mapInfo
    };
    root.FMControls.attach(canvas, api);
    root.FMControls.setKeyboardTarget(api);
    if (endless) {
      root.FMControls.attachMap(document.getElementById('fmMap'), api);
      const step = 220;
      document.getElementById('fmLookUp').onclick = () => G.pan(current(), -step);
      document.getElementById('fmLookDown').onclick = () => G.pan(current(), step);
      document.getElementById('fmLookTop').onclick = () => G.returnToTop(current());
    }
    hud(true);

    const ctx = canvas.getContext('2d');
    const map = document.getElementById('fmMap');
    const mapCtx = map && map.getContext('2d');
    let last = performance.now(), acc = 0;
    const frame = now => {
      if (!canvas.isConnected) { saveNow(); return; }
      const g = current();
      // size the board to the space available, keeping the basket's proportions
      const stage = document.getElementById('fmStage');
      const view = root.FMRender.viewSize();
      const dpr = Math.min(2, root.devicePixelRatio || 1);
      const top = stage.getBoundingClientRect().top + scrollY;
      const maxH = Math.max(380, innerHeight - top - 24);
      const scale = Math.min(stage.clientWidth / view.w, maxH / view.h);
      const cssW = Math.floor(view.w * scale), cssH = Math.floor(view.h * scale);
      if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
        canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
        canvas.style.width = cssW + 'px'; canvas.style.height = cssH + 'px';
        if (map) { map.style.height = Math.max(160, cssH - 150) + 'px'; map.height = Math.round(Math.max(160, cssH - 150) * dpr); map.width = Math.round(52 * dpr); }
      }
      const dt = Math.min(.1, (now - last) / 1000); last = now;
      acc += dt;
      let n = 0;
      while (acc >= 1 / 60 && n < 4) { root.FMControls.tick(g, 1 / 60); G.step(g, 1 / 60); acc -= 1 / 60; n++; }
      if (n === 4) acc = 0;
      if (n && !g.paused && !g.over) dirty = true;
      root.FMRender.draw(ctx, g, scale * dpr);
      if (mapCtx) mapInfo = root.FMRender.drawMap(mapCtx, g);
      hud();
      if (dirty && now - lastSave > 1500) saveNow();
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  // leaving the page or hiding the app saves straight away
  addEventListener('pagehide', saveNow);
  document.addEventListener('visibilitychange', () => { if (document.hidden && document.getElementById('fmCanvas')) saveNow(); });

  root.drawFruitmerge = drawFruitmerge;
  root.FMPage = { current, states: fmStates, saveNow, mode: () => fmMode };
})(window);
