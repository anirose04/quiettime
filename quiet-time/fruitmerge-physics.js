/* quiet time — fruitmerge: a small circle physics engine.
   Only what a basket of fruit needs: round bodies with mass and spin, gravity, two side walls
   that go up forever, and a floor.
   It is a position-based solver run in many small substeps ("small steps" XPBD style): each
   substep moves every fruit, finds touching pairs, lets the game react (merges), pushes
   overlaps apart weighted by mass, applies static/dynamic friction to the sliding at each
   contact (which is what makes fruit roll and stack), then derives velocities from how far
   things actually moved and adds a gentle bounce. Deep piles stay calm this way, and the final
   clamp keeps every fruit inside the walls. */
(function (root) {
  const TOUCH = .75;
  function createWorld(o) {
    return {
      width: o.width, floor: o.floor, gravity: o.gravity ?? 1500,
      substeps: o.substeps ?? 12,
      restitution: .18, bounceMin: 160,       // only real impacts bounce; resting fruit never does
      depenetration: 220,                     // the most two touching fruit may fly apart beyond a real bounce
      staticFriction: .55, friction: .4,
      maxSpeed: 2600, bodies: [], onContacts: null
    };
  }

  function setMass(b) {
    b.m = b.r * b.r;            // flat discs: mass grows with area
    b.inv = 1 / b.m;
    b.invI = 1 / (0.5 * b.m * b.r * b.r);
  }

  function addBody(world, o) {
    const b = {
      id: o.id, tier: o.tier, x: o.x, y: o.y, vx: o.vx || 0, vy: o.vy || 0, a: o.a || 0, w: o.w || 0,
      r: o.r, targetR: o.targetR ?? o.r, grow: o.grow || 0, dead: false,
      landed: !!o.landed, born: o.born || 0, popT: o.popT ?? -9, soft: o.soft || 0,
      px: o.x, py: o.y, pa: o.a || 0
    };
    // born mid-substep (a merge): give it a matching previous position so it keeps its velocity
    const h = world.h || 0;
    b.px = b.x - b.vx * h; b.py = b.y - b.vy * h; b.pa = b.a - b.w * h;
    setMass(b);
    world.bodies.push(b);
    return b;
  }

  function findContacts(world) {
    const bs = world.bodies, out = [];
    // nearly sorted from the previous substep, so this is cheap
    bs.sort((p, q) => (p.y - p.r) - (q.y - q.r));
    for (let i = 0; i < bs.length; i++) {
      const a = bs[i];
      if (a.dead) continue;
      const bottom = a.y + a.r;
      for (let j = i + 1; j < bs.length; j++) {
        const b = bs[j];
        if (b.y - b.r > bottom + TOUCH) break;
        if (b.dead) continue;
        // a hair of tolerance: fruit resting exactly side by side still count as touching (and merge)
        const dx = b.x - a.x, rr = a.r + b.r + TOUCH;
        if (dx > rr || dx < -rr) continue;
        const dy = b.y - a.y;
        if (dx * dx + dy * dy >= rr * rr) continue;
        out.push({ a, b, vn: 0 });
      }
      // walls and the floor: b = null and a fixed outward normal
      if (a.x - a.r < TOUCH) out.push({ a, b: null, wx: -1, wy: 0, vn: 0 });
      if (a.x + a.r > world.width - TOUCH) out.push({ a, b: null, wx: 1, wy: 0, vn: 0 });
      if (a.y + a.r > world.floor - TOUCH) out.push({ a, b: null, wx: 0, wy: 1, vn: 0 });
    }
    return out;
  }

  // normal from a towards b (or into the wall), and how deep they overlap right now
  function geometry(world, c) {
    const a = c.a, b = c.b;
    if (!b) {
      c.nx = c.wx; c.ny = c.wy;
      c.pen = c.wx < 0 ? a.r - a.x : c.wx > 0 ? a.x + a.r - world.width : a.y + a.r - world.floor;
      return;
    }
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy);
    c.nx = d > 1e-6 ? dx / d : 0; c.ny = d > 1e-6 ? dy / d : 1;
    c.pen = a.r + b.r - d;
  }

  // normal velocity of b against a (positive = separating)
  function normalVel(c) {
    const a = c.a, b = c.b;
    return (b ? b.vx * c.nx + b.vy * c.ny : 0) - (a.vx * c.nx + a.vy * c.ny);
  }

  const isSoft = b => b.soft > 0 || b.r < b.targetR;

  function solveContact(world, c) {
    geometry(world, c);
    let pen = c.pen;
    if (pen <= 0) return;
    c.touching = true;
    // a freshly merged (or still growing) fruit makes room gently: a small fruit caught in the crevice
    // it appeared over is eased aside over a few frames instead of being squeezed out like a seed
    const soft = isSoft(c.a) || (c.b && isSoft(c.b));
    if (soft) pen = Math.min(pen, world.depenetration * world.h + pen * .04);
    const a = c.a, b = c.b, nx = c.nx, ny = c.ny;
    const wA = a.inv, wB = b ? b.inv : 0;
    // 1. push apart, fully, so fruit never stay overlapped
    const dn = pen / (wA + wB);
    a.x -= nx * dn * wA; a.y -= ny * dn * wA;
    if (b) { b.x += nx * dn * wB; b.y += ny * dn * wB; }
    // 2. friction: undo (some of) the sliding of the two touching surfaces during this substep
    const tx = -ny, ty = nx;
    let rel = -((a.x - a.px) * tx + (a.y - a.py) * ty) - (a.a - a.pa) * a.r;
    if (b) rel += (b.x - b.px) * tx + (b.y - b.py) * ty - (b.a - b.pa) * b.r;
    const wAt = wA + a.r * a.r * a.invI, wBt = b ? wB + b.r * b.r * b.invI : 0;
    let lt = -rel / (wAt + wBt);
    const slide = Math.abs(rel), limit = c.pen;
    if (slide > world.staticFriction * limit) lt *= Math.min(1, world.friction * limit / slide);
    a.x -= tx * lt * wA; a.y -= ty * lt * wA; a.a -= a.invI * a.r * lt;
    if (b) { b.x += tx * lt * wB; b.y += ty * lt * wB; b.a -= b.invI * b.r * lt; }
  }

  // the safety net that keeps every fruit in the basket
  function clampInside(world, b) {
    if (!(Number.isFinite(b.x) && Number.isFinite(b.y))) { b.x = world.width / 2; b.y = world.floor - b.r; b.vx = b.vy = b.w = 0; b.px = b.x; b.py = b.y; }
    if (b.x < b.r) b.x = b.r;
    if (b.x > world.width - b.r) b.x = world.width - b.r;
    if (b.y > world.floor - b.r) b.y = world.floor - b.r;
  }

  function substep(world, h) {
    let bs = world.bodies;
    for (const b of bs) {
      if (b.r < b.targetR) { b.r = Math.min(b.targetR, b.r + b.grow * h); setMass(b); }
      if (b.soft > 0) b.soft -= h;
      b.vy += world.gravity * h;
      b.px = b.x; b.py = b.y; b.pa = b.a;
      b.x += b.vx * h; b.y += b.vy * h; b.a += b.w * h;
    }
    let contacts = findContacts(world);
    if (world.onContacts && contacts.length) {
      world.onContacts(contacts);
      contacts = contacts.filter(c => !c.a.dead && !(c.b && c.b.dead));
      bs = world.bodies;
    }
    for (const c of contacts) {
      geometry(world, c); c.vn = normalVel(c); c.touching = false;
    }
    for (const c of contacts) solveContact(world, c);
    const max = world.maxSpeed, damp = 1 - .04 * h, angDamp = 1 - .6 * h;
    for (const b of bs) {
      if (b.dead) continue;
      clampInside(world, b);
      b.vx = (b.x - b.px) / h * damp; b.vy = (b.y - b.py) / h * damp; b.w = (b.a - b.pa) / h * angDamp;
      const sp = Math.hypot(b.vx, b.vy);
      if (sp > max) { b.vx *= max / sp; b.vy *= max / sp; }
    }
    // settle how fast each touching pair separates: a gentle bounce for real impacts only, and never
    // faster than that bounce plus a slow drift. Untangling an overlap (a merge spawning a bigger fruit,
    // a fruit growing, a pile settling) moves fruit apart but must not fling them across the basket
    for (const c of contacts) {
      if (!c.touching) continue;
      const a = c.a, b = c.b, wA = a.inv, wB = b ? b.inv : 0;
      const vn = normalVel(c);
      const bounce = c.vn < -world.bounceMin ? -world.restitution * c.vn : 0;
      const most = bounce + world.depenetration;
      let target = vn;
      if (vn < bounce && bounce > 0) target = bounce;
      else if (vn > most) target = most;
      if (target === vn) continue;
      const j = (target - vn) / (wA + wB);
      a.vx -= c.nx * j * wA; a.vy -= c.ny * j * wA;
      if (b) { b.vx += c.nx * j * wB; b.vy += c.ny * j * wB; }
    }
    if (bs.some(b => b.dead)) world.bodies = bs.filter(b => !b.dead);
  }

  function step(world, dt) {
    const h = dt / world.substeps;
    world.h = h;
    for (let i = 0; i < world.substeps; i++) substep(world, h);
    world.h = 0;
  }

  root.FMPhysics = { createWorld, addBody, step, setMass };
})(typeof window !== 'undefined' ? window : globalThis);
