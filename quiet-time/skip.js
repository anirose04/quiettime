/* Quiet Time — skip. A little sprout skips down a tunnel among the stars.
   Walk onto a wall and the whole tunnel turns so that wall becomes the floor.
   Canvas only, local-only progress, no external dependencies. */
const SKIP_LEVELS = 10;
let skip = null;          // live game state
let skipKeys = { left: false, right: false };
let skipJumpQueued = 0;   // seconds left on a buffered jump press

function skipRand(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Each level is generated from its number, so it is the same every time you play it.
// A guaranteed path runs through every level; everything else is scenery and shortcuts.
function skipLevel(n) {
  const rnd = skipRand(n * 7919 + 13);
  const sides = n <= 4 ? 4 : n <= 7 ? 5 : 6;
  const len = 70 + n * 18;
  const density = Math.max(0.3, 0.9 - n * 0.065);
  const maxGap = n < 3 ? 1 : n < 6 ? 2 : 3;
  const rows = [];
  for (let r = 0; r < len + 14; r++) {
    rows.push(Array.from({ length: sides }, () => r < 10 || r >= len || rnd() < density));
  }
  let r = 10, safe = 0;
  while (r < len) {
    const run = 3 + Math.floor(rnd() * 4);
    for (let k = 0; k < run && r + k < len; k++) rows[r + k][safe] = true;
    r += run;
    const pick = rnd();
    if (pick < 0.42 && n > 1) {
      const gap = 1 + Math.floor(rnd() * maxGap);
      for (let k = 0; k < gap && r + k < len - 2; k++) rows[r + k][safe] = false;
      r += gap;
    } else if (pick < 0.8) {
      const next = (safe + (rnd() < 0.5 ? 1 : sides - 1)) % sides;
      for (let k = 0; k < 6 && r + k < len; k++) { rows[r + k][safe] = true; rows[r + k][next] = true; }
      safe = next; r += 6;
    }
  }
  return { n, sides, len, rows, speed: 7 + n * 0.45 };
}

function skipSaved() {
  const s = storage.get('skip') || {};
  const unlocked = Math.min(SKIP_LEVELS, Math.max(1, s.unlocked | 0));
  return { unlocked, level: Math.min(unlocked, Math.max(1, s.level | 0)), tries: s.tries | 0 };
}
function skipSave() { storage.set('skip', { unlocked: skip.unlocked, level: skip.level.n, tries: skip.tries }); }

function skipReset(levelNum, state = 'ready') {
  const saved = skipSaved();
  const level = skipLevel(levelNum);
  const side = 0;
  skip = {
    ...(skip || {}), unlocked: Math.max(saved.unlocked, skip?.unlocked || 1), tries: skip?.tries ?? saved.tries,
    level, state, z: 1, a: side + 0.5, h: 0, vh: 0, air: false, falling: false, coyote: 0, t: 0,
    rot: Math.PI / 2 - 2 * Math.PI * (side + 0.5) / level.sides
  };
  skipJumpQueued = 0;
  skipSave(); skipHud();
}

function skipSolid(row, side) {
  const rows = skip.level.rows;
  if (row < 0 || row >= rows.length) return true;
  return rows[row][((side % skip.level.sides) + skip.level.sides) % skip.level.sides];
}

function skipAct() {
  if (skip.state === 'playing') { skipJumpQueued = 0.14; return; }
  if (skip.state === 'cleared') {
    if (skip.level.n < SKIP_LEVELS) skipReset(skip.level.n + 1, 'playing');
    else skipReset(1, 'ready');
    return;
  }
  if (skip.state === 'fell') { skipReset(skip.level.n, 'playing'); return; }
  skip.state = 'playing'; skipHud();
}

function skipStep(dt) {
  const s = skip, L = s.level;
  s.t += dt;
  if (s.state !== 'playing') return;
  const width = 2 * Math.tan(Math.PI / L.sides);
  const lateral = 2.7 / width;
  const dir = (skipKeys.left ? 1 : 0) - (skipKeys.right ? 1 : 0);
  if (!s.falling) {
    s.a += dir * lateral * dt;
    s.a = ((s.a % L.sides) + L.sides) % L.sides;
  }
  s.z += L.speed * dt;
  skipJumpQueued = Math.max(0, skipJumpQueued - dt);

  const side = Math.floor(s.a), row = Math.floor(s.z);
  if (!s.air && !s.falling) {
    if (skipSolid(row, side)) s.coyote = 0;
    else if ((s.coyote += dt) > 0.08) { s.falling = true; s.vh = 0; }
    if (skipJumpQueued > 0 && !s.falling) { s.air = true; s.vh = 3.3; skipJumpQueued = 0; s.coyote = 0; }
  }
  if (s.air || s.falling) {
    s.vh -= 12.5 * dt;
    s.h += s.vh * dt;
    if (s.air && s.h <= 0) {
      if (skipSolid(row, side)) { s.h = 0; s.vh = 0; s.air = false; }
      else if (s.h < -0.06) { s.air = false; s.falling = true; }
    }
  }
  if (s.falling && s.h < -1.6) {
    s.state = 'fell'; s.tries++; skipSave(); skipHud();
  }
  if (s.z >= L.len + 5) {
    s.state = 'cleared';
    if (L.n < SKIP_LEVELS) s.unlocked = Math.max(s.unlocked, L.n + 1);
    skipSave(); skipHud();
  }
}

// colour helpers
const SKIP_BG = [27, 44, 33];
function skipMix(c, t) {
  return `rgb(${c.map((v, i) => Math.round(v + (SKIP_BG[i] - v) * t)).join(',')})`;
}

function skipDraw(ctx, W, H) {
  const s = skip, L = s.level, N = L.sides;
  // ease the tunnel round so the side underfoot becomes the floor
  const target = Math.PI / 2 - 2 * Math.PI * (Math.floor(s.a) + 0.5) / N;
  let diff = target - s.rot;
  diff = Math.atan2(Math.sin(diff), Math.cos(diff));
  s.rot += diff * Math.min(1, s.dtLast * 9);

  const g = ctx.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, W * 0.7);
  g.addColorStop(0, '#12221a'); g.addColorStop(1, '#22382a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // a few slow stars in the distance
  for (let i = 0; i < 40; i++) {
    const ang = i * 2.399 + s.rot, rad = (0.05 + ((i * 37) % 100) / 100 * 0.25) * W;
    ctx.fillStyle = `rgba(247,239,220,${0.15 + (i % 5) * 0.08})`;
    ctx.fillRect(W / 2 + Math.cos(ang) * rad, H * 0.45 + Math.sin(ang) * rad, 1.5, 1.5);
  }

  const cx = W / 2, cy = H * 0.45, F = H * 0.8, dp = 2.4, camZ = s.z - dp;
  const R = 1 / Math.cos(Math.PI / N);
  const verts = Array.from({ length: N + 1 }, (_, k) => {
    const th = s.rot + 2 * Math.PI * k / N;
    return [Math.cos(th) * R, Math.sin(th) * R];
  });
  const P = (v, z) => [cx + v[0] * F / z, cy + v[1] * F / z];
  const far = Math.floor(s.z) + 38, near = Math.floor(camZ);
  const drawRow = r => {
    let zA = r - camZ, zB = r + 1 - camZ;
    if (zB <= 0.3) return;
    zA = Math.max(zA, 0.3);
    const fog = Math.min(1, Math.max(0, (zA - 2) / 34));
    for (let i = 0; i < N; i++) {
      if (!skipSolid(r, i)) continue;
      const finish = r >= L.len;
      const base = finish ? [216, 180, 106] : (r + i) % 2 ? [128, 157, 116] : [112, 142, 103];
      const a = P(verts[i], zA), b = P(verts[i + 1], zA), c = P(verts[i + 1], zB), d = P(verts[i], zB);
      ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.lineTo(...c); ctx.lineTo(...d); ctx.closePath();
      ctx.fillStyle = skipMix(base, fog); ctx.fill();
      ctx.strokeStyle = skipMix([62, 88, 64], fog); ctx.lineWidth = 1; ctx.stroke();
    }
  };
  // far rows, then the sprout, then the rows in front of it (so a tumble disappears behind the edge)
  const split = Math.floor(s.z - 0.0001);
  for (let r = far; r >= split; r--) drawRow(r);
  skipDrawSprout(ctx, verts, P, dp, F);
  for (let r = split - 1; r >= near; r--) drawRow(r);

  // progress line along the top
  const prog = Math.min(1, s.z / (L.len + 5));
  ctx.fillStyle = 'rgba(247,239,220,.18)'; ctx.fillRect(16, 14, W - 32, 4);
  ctx.fillStyle = '#d8b46a'; ctx.fillRect(16, 14, (W - 32) * prog, 4);

  if (s.state !== 'playing') {
    const msg = {
      ready: [`level ${L.n}`, 'tap or press space to begin'],
      fell: ['a little tumble', 'tap or press space to try again'],
      cleared: L.n < SKIP_LEVELS ? ['level cleared ✿', `tap for level ${L.n + 1}`] : ['every level cleared ✿', 'tap to start again from level 1']
    }[s.state];
    ctx.fillStyle = 'rgba(18,34,26,.55)'; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center'; ctx.fillStyle = '#f7efdc';
    ctx.font = `${Math.round(Math.min(34, W / 14))}px 'Libre Baskerville', Georgia, serif`;
    ctx.fillText(msg[0], W / 2, H * 0.42);
    ctx.font = `${Math.round(Math.min(17, W / 26))}px 'DM Sans', system-ui, sans-serif`;
    ctx.fillStyle = '#d7e2d0'; ctx.fillText(msg[1], W / 2, H * 0.42 + 34);
  }
}

function skipDrawSprout(ctx, verts, P, dp, F) {
  const s = skip, side = Math.floor(s.a), f = s.a - side;
  const v0 = verts[side], v1 = verts[side + 1];
  const foot = [v0[0] + (v1[0] - v0[0]) * f, v0[1] + (v1[1] - v0[1]) * f];
  const mid = [(v0[0] + v1[0]) / 2, (v0[1] + v1[1]) / 2];
  const len = Math.hypot(...mid), nrm = [mid[0] / len, mid[1] / len];   // outward normal of this side
  const at = [foot[0] - nrm[0] * s.h, foot[1] - nrm[1] * s.h];
  const [x, y] = P(at, dp), [gx, gy] = P(foot, dp);
  const u = F / dp * 0.16, tilt = Math.atan2(nrm[1], nrm[0]) - Math.PI / 2;
  // soft shadow on the floor while in the air
  if (s.h > 0.02 && !s.falling) {
    ctx.save(); ctx.translate(gx, gy); ctx.rotate(tilt);
    ctx.fillStyle = 'rgba(20,35,26,.35)';
    ctx.beginPath(); ctx.ellipse(0, 0, u * 0.8 * (1 - s.h), u * 0.25, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
  const step = s.state === 'playing' && !s.air && !s.falling ? Math.sin(s.t * 18) : 0;
  // feet
  ctx.fillStyle = '#6b4f3c';
  ctx.beginPath(); ctx.ellipse(-u * 0.38, -u * 0.12 - Math.max(0, step) * u * 0.25, u * 0.28, u * 0.16, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(u * 0.38, -u * 0.12 - Math.max(0, -step) * u * 0.25, u * 0.28, u * 0.16, 0, 0, Math.PI * 2); ctx.fill();
  // body
  const bob = Math.abs(step) * u * 0.08;
  ctx.fillStyle = '#f7efdc';
  ctx.beginPath(); ctx.ellipse(0, -u * 1.0 - bob, u * 0.82, u * 0.78, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#c9b78f'; ctx.lineWidth = Math.max(1, u * 0.06); ctx.stroke();
  // cheeks and eyes
  ctx.fillStyle = '#e6a9b4';
  ctx.beginPath(); ctx.arc(-u * 0.42, -u * 0.86 - bob, u * 0.12, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(u * 0.42, -u * 0.86 - bob, u * 0.12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2f4a36';
  ctx.beginPath(); ctx.arc(-u * 0.22, -u * 1.05 - bob, u * 0.08, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(u * 0.22, -u * 1.05 - bob, u * 0.08, 0, Math.PI * 2); ctx.fill();
  // sprout on top
  ctx.strokeStyle = '#7f9c6c'; ctx.lineWidth = Math.max(1.5, u * 0.09); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, -u * 1.75 - bob); ctx.quadraticCurveTo(u * 0.05, -u * 2.05 - bob, 0, -u * 2.2 - bob); ctx.stroke();
  ctx.fillStyle = '#93b27c';
  ctx.beginPath(); ctx.ellipse(u * 0.25, -u * 2.2 - bob, u * 0.28, u * 0.13, -0.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-u * 0.22, -u * 2.12 - bob, u * 0.22, u * 0.11, 0.6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function skipHud() {
  const sel = $('#skipLevel');
  if (!sel || !skip) return;
  sel.innerHTML = Array.from({ length: skip.unlocked }, (_, i) => `<option value="${i + 1}">level ${i + 1}</option>`).join('');
  sel.value = skip.level.n;
  $('#skipInfo').textContent = `${skip.level.sides}-sided tunnel · ${skip.tries} tumbles so far`;
}

function drawSkip() {
  const saved = skipSaved();
  skip = null;
  skip = { unlocked: saved.unlocked, tries: saved.tries };
  layout('skip', '', `
    <div class="controls skip-bar">
      <select class="pill" id="skipLevel" aria-label="level"></select>
      <button class="pill" id="skipRestart" type="button">restart level</button>
      <span class="tag" id="skipInfo"></span>
    </div>
    <div class="skip-stage" id="skipStage">
      <canvas id="skipCanvas" aria-label="skip: a little sprout running down a tunnel. use left and right to move, space to jump."></canvas>
    </div>
    <div class="skip-pad" aria-label="touch controls">
      <button class="pill" data-skip="left" type="button" aria-label="move left">◀</button>
      <button class="pill" data-skip="jump" type="button" aria-label="jump">jump</button>
      <button class="pill" data-skip="right" type="button" aria-label="move right">▶</button>
    </div>
    <p class="muted skip-help">← → or a d to move, space or ↑ to jump. walk onto a wall and the tunnel turns with you.</p>`);
  skipReset(saved.level, 'ready');
  $('#skipLevel').onchange = e => skipReset(+e.target.value, 'ready');
  $('#skipRestart').onclick = () => skipReset(skip.level.n, 'ready');
  const canvas = $('#skipCanvas');
  canvas.onpointerdown = e => { e.preventDefault(); skipAct(); };
  document.querySelectorAll('[data-skip]').forEach(b => {
    const k = b.dataset.skip;
    const down = e => { e.preventDefault(); b.setPointerCapture?.(e.pointerId); if (k === 'jump') skipAct(); else skipKeys[k] = true; };
    const up = () => { if (k !== 'jump') skipKeys[k] = false; };
    b.onpointerdown = down; b.onpointerup = up; b.onpointercancel = up; b.onlostpointercapture = up;
  });
  const ctx = canvas.getContext('2d');
  let last = performance.now();
  const frame = now => {
    if (!canvas.isConnected) { skipKeys = { left: false, right: false }; return; }
    const stage = $('#skipStage'), dpr = Math.min(2, devicePixelRatio || 1);
    const W = stage.clientWidth, H = Math.round(Math.min(W * 0.66, innerHeight * 0.62));
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      canvas.style.height = H + 'px';
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const dt = Math.min(1 / 30, (now - last) / 1000); last = now;
    skip.dtLast = dt;
    skipStep(dt);
    skipDraw(ctx, W, H);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

const SKIP_KEYMAP = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };
document.addEventListener('keydown', e => {
  if (!$('#skipCanvas') || e.target.closest?.('select,input,textarea')) return;
  if (SKIP_KEYMAP[e.key]) { skipKeys[SKIP_KEYMAP[e.key]] = true; e.preventDefault(); }
  else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { e.preventDefault(); if (!e.repeat) skipAct(); }
});
document.addEventListener('keyup', e => { if (SKIP_KEYMAP[e.key]) skipKeys[SKIP_KEYMAP[e.key]] = false; });
window.addEventListener('blur', () => { skipKeys = { left: false, right: false }; });
