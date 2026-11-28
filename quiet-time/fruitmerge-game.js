/* quiet time — fruitmerge: game state and rules.
   Owns the world for one mode (classic or endless): dropping, the current and next fruit,
   merges and chain reactions, clearing two of the biggest fruit (endless only), the classic overflow rule,
   the endless drop height and camera, and turning a game into plain data and back. */
(function (root) {
  const { FRUITS, MAX_TIER, randomTier } = root.FMFruits;
  const W = 600;                 // basket width in world units
  const FLOOR = 600;             // basket floor; the classic basket runs from y = 0 down to here
  const LINE = 46;               // classic overflow line
  const DROP_Y = -66;            // where the current fruit waits in classic (and at the start of endless)
  const VIEW_TOP = -134;         // top of the classic view
  const VIEW_H = FLOOR + 18 - VIEW_TOP;  // the camera always shows this much height
  const ENDLESS_GAP = 175;       // endless: the waiting fruit sits this far above the highest settled fruit
  const COOLDOWN = .5;           // a short breath between drops
  const OVER_GRACE = 2.4;        // classic: seconds the settled pile may stay above the line
  const CLEAR_POINTS = 100;      // endless: two of the biggest fruit (dragon fruit) meeting

  function create(mode, rand = Math.random) {
    const s = {
      v: 1, mode, score: 0, cleared: 0, over: false, paused: false, time: 0, overT: 0, nextId: 1,
      current: randomTier(rand), next: randomTier(rand), dropX: W / 2, dropY: DROP_Y, cooldown: 0,
      camTop: VIEW_TOP, follow: true, pileTop: FLOOR, drops: 0, merges: 0, effects: [], rand
    };
    attachWorld(s, []);
    return s;
  }

  function attachWorld(s, bodies) {
    s.world = root.FMPhysics.createWorld({ width: W, floor: FLOOR, gravity: 1500 });
    s.world.onContacts = contacts => onContacts(s, contacts);
    for (const b of bodies) root.FMPhysics.addBody(s.world, b);
  }

  // every touching pair passes through here once per substep, before it is resolved.
  // a fruit marked dead is skipped by every later pair, so no fruit can merge twice or be counted twice.
  function onContacts(s, contacts) {
    for (const c of contacts) {
      const a = c.a, b = c.b;
      // "landed" = resting on the floor or on other fruit; brushing a side wall on the way down doesn't count
      if (!b) { if (c.wy === 1) a.landed = true; continue; }
      a.landed = b.landed = true;
      if (a.dead || b.dead || a.tier !== b.tier) continue;
      if (a.tier < MAX_TIER) merge(s, a, b);
      else if (s.mode === 'endless') clearBiggest(s, a, b);
      // classic: two dragon fruit simply rest against each other
    }
  }

  function merge(s, a, b) {
    a.dead = b.dead = true;
    const tier = a.tier + 1, f = FRUITS[tier];
    const startR = Math.max(a.r, b.r);
    root.FMPhysics.addBody(s.world, {
      id: s.nextId++, tier, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2,
      vx: (a.vx + b.vx) / 2, vy: (a.vy + b.vy) / 2, a: (a.a + b.a) / 2, w: 0,
      r: startR, targetR: f.r, grow: (f.r - startR) / .14, landed: true, born: s.time, popT: s.time, soft: .35
    });
    s.score += f.points;
    s.merges++;
    s.effects.push({ type: 'ring', x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, r: f.r, t0: s.time, tier });
  }

  function clearBiggest(s, a, b) {
    a.dead = b.dead = true;
    s.cleared += 2;
    s.score += CLEAR_POINTS;
    for (const c of [a, b]) s.effects.push({ type: 'fade', x: c.x, y: c.y, r: c.r, rot: c.a, t0: s.time, tier: c.tier });
    s.effects.push({ type: 'sparkle', x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, r: a.r, t0: s.time, seed: s.cleared });
  }

  function heldX(s) {
    const r = FRUITS[s.current].r;
    return Math.max(r, Math.min(W - r, s.dropX));
  }
  function canDrop(s) { return !s.over && !s.paused && s.cooldown <= 0; }

  function drop(s) {
    if (!canDrop(s)) return false;
    const tier = s.current, f = FRUITS[tier];
    root.FMPhysics.addBody(s.world, { id: s.nextId++, tier, x: heldX(s), y: s.dropY, vy: 60, r: f.r, born: s.time });
    // the preview fruit moves into the hand, and a fresh one is chosen for the preview right away
    s.current = s.next;
    s.next = randomTier(s.rand || Math.random);
    s.cooldown = COOLDOWN;
    s.drops++;
    return true;
  }

  function step(s, dt) {
    if (!s.paused && !s.over) {
      s.time += dt;
      s.cooldown = Math.max(0, s.cooldown - dt);
      root.FMPhysics.step(s.world, dt);
      updatePile(s, dt);
      if (s.mode === 'classic') checkOverflow(s, dt);
    }
    updateCamera(s, dt);
    s.effects = s.effects.filter(e => s.time - e.t0 < 1.2);
  }

  function updatePile(s, dt) {
    let top = FLOOR;
    for (const b of s.world.bodies) if (b.landed && b.y - b.r < top && b.vy * b.vy + b.vx * b.vx < 160000) top = b.y - b.r;
    s.pileTop = top;
    if (s.mode !== 'endless') { s.dropY = DROP_Y; return; }
    const target = Math.min(DROP_Y, top - ENDLESS_GAP);
    // rise at once so the waiting fruit never sinks into the pile; settle back down gently
    s.dropY = target < s.dropY ? target : s.dropY + (target - s.dropY) * Math.min(1, dt * 1.5);
  }

  function checkOverflow(s, dt) {
    let above = false;
    for (const b of s.world.bodies) {
      // only settled fruit count: it has touched something, it is not brand new, and it is nearly still
      if (b.landed && s.time - b.born > 1 && b.y - b.r < LINE && Math.hypot(b.vx, b.vy) < 90) { above = true; break; }
    }
    s.overT = above ? s.overT + dt : Math.max(0, s.overT - dt * 2);
    if (s.overT > OVER_GRACE) { s.over = true; s.overT = OVER_GRACE; }
  }

  // camera limits for endless: from just above the waiting fruit down to the floor
  function camRange(s) {
    const maxTop = VIEW_TOP;  // the classic view, with the floor at the bottom
    const minTop = Math.min(VIEW_TOP, s.dropY - (DROP_Y - VIEW_TOP));
    return { minTop, maxTop };
  }
  function followTop(s) { return camRange(s).minTop; }

  function updateCamera(s, dt) {
    if (s.mode !== 'endless') { s.camTop = VIEW_TOP; s.follow = true; return; }
    const { minTop, maxTop } = camRange(s);
    if (s.follow) s.camTop += (followTop(s) - s.camTop) * Math.min(1, dt * 5);
    s.camTop = Math.max(minTop - 40, Math.min(maxTop, s.camTop));
  }

  function pan(s, dy) {
    if (s.mode !== 'endless') return;
    const { minTop, maxTop } = camRange(s);
    s.camTop = Math.max(minTop, Math.min(maxTop, s.camTop + dy));
    s.follow = s.camTop <= minTop + 2;
  }
  function returnToTop(s) { s.follow = true; }
  function inspecting(s) { return s.mode === 'endless' && !s.follow; }

  // ---- save / restore as plain data ----
  function serialize(s) {
    return {
      v: 1, mode: s.mode, score: s.score, cleared: s.cleared, over: s.over, paused: s.paused,
      time: s.time, overT: s.overT, nextId: s.nextId, current: s.current, next: s.next,
      dropX: s.dropX, dropY: s.dropY, cooldown: s.cooldown, camTop: s.camTop, follow: s.follow,
      drops: s.drops, merges: s.merges,
      // full precision on purpose: the game resumes exactly where it stopped, so nothing new touches
      bodies: s.world.bodies.filter(b => !b.dead).map(b => [b.id, b.tier, b.x, b.y, b.vx, b.vy, b.a, b.w, b.r, b.targetR, b.landed ? 1 : 0, b.born])
    };
  }

  const num = (v, d) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
  const tierOk = t => Number.isInteger(t) && t >= 0 && t <= MAX_TIER;

  function restore(data, mode) {
    if (!data || data.v !== 1 || data.mode !== mode || !Array.isArray(data.bodies)) return null;
    const s = create(mode);
    s.score = Math.max(0, num(data.score, 0));
    s.cleared = Math.max(0, num(data.cleared, 0));
    s.over = mode === 'classic' && !!data.over;
    s.paused = false;   // there is no pause any more; an old saved pause just resumes
    s.time = num(data.time, 0);
    s.overT = num(data.overT, 0);
    s.current = tierOk(data.current) ? data.current : s.current;
    s.next = tierOk(data.next) ? data.next : s.next;
    s.dropX = num(data.dropX, W / 2);
    s.dropY = num(data.dropY, DROP_Y);
    s.cooldown = Math.min(COOLDOWN, num(data.cooldown, 0));
    s.camTop = num(data.camTop, VIEW_TOP);
    s.follow = data.follow !== false;
    s.drops = num(data.drops, 0);
    s.merges = num(data.merges, 0);
    const seen = new Set(), bodies = [];
    let maxId = 0;
    for (const row of data.bodies) {
      if (!Array.isArray(row) || row.length < 12) continue;
      const [id, tier, x, y, vx, vy, a, w, r, targetR, landed, born] = row;
      if (!tierOk(tier) || seen.has(id) || ![x, y, r].every(Number.isFinite)) continue;
      seen.add(id);
      maxId = Math.max(maxId, num(id, 0));
      const tr = FRUITS[tier].r;
      const rr = Math.max(4, Math.min(tr, num(r, tr)));
      bodies.push({
        id, tier, x: Math.max(rr, Math.min(W - rr, x)), y: Math.min(FLOOR - rr, y), vx: num(vx, 0), vy: num(vy, 0),
        a: num(a, 0), w: num(w, 0), r: rr, targetR: tr, grow: rr < tr ? (tr - rr) / .14 : 0, landed: !!landed, born: num(born, 0)
      });
    }
    attachWorld(s, bodies);
    s.nextId = Math.max(num(data.nextId, 1), maxId + 1);
    updatePile(s, 0);
    if (mode === 'endless') s.dropY = Math.min(num(data.dropY, DROP_Y), s.pileTop - ENDLESS_GAP, DROP_Y);
    return s;
  }

  root.FMGame = {
    W, FLOOR, LINE, DROP_Y, VIEW_TOP, VIEW_H, ENDLESS_GAP, COOLDOWN,
    create, drop, step, canDrop, heldX, pan, returnToTop, inspecting, camRange, serialize, restore
  };
})(typeof window !== 'undefined' ? window : globalThis);
