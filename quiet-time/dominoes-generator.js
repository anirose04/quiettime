/* quiet time — dominoes: puzzle generator.
   1. grow a connected board by laying dominoes next to each other (so a tiling always exists)
   2. give those dominoes distinct values from a double-six set
   3. carve the cells into small connected regions (some left without a rule)
   4. write each region's rule from the values the hidden solution puts there
   5. run the solver over the finished puzzle: it must be solvable, and we prefer exactly one
      solution; difficulty is measured by how much guessing the solver needed
   6. anything that misses the level's range is thrown away and we try again.
   Everything comes from the seed, so the same id always rebuilds the same puzzle. */
(function (root) {
  const P = root.DMPuzzles, S = root.DMSolver;

  // board size, region shapes and rule mix per level; difficulty is the solver's guess count
  const CONFIG = {
    gentle: {
      dominoes: [4, 5], box: [4, 4], sizes: [1, 2, 2, 2, 3], blank: .08,
      rules: { sum: 6, eq: 2, neq: 1, gt: 1, lt: 1 }, eqBias: .5, slack: 1,
      guesses: [0, 2], work: [0, 3]
    },
    thoughtful: {
      dominoes: [6, 7], box: [5, 5], sizes: [1, 2, 2, 3, 3], blank: .14,
      rules: { sum: 5, eq: 2, neq: 2, gt: 2, lt: 2 }, eqBias: .5, slack: 2,
      guesses: [2, 8], work: [2, 12]
    },
    tricky: {
      dominoes: [8, 9], box: [6, 5], sizes: [2, 2, 3, 3, 4], blank: .18,
      rules: { sum: 4, eq: 2, neq: 2, gt: 3, lt: 3 }, eqBias: .45, slack: 3,
      guesses: [7, 45], work: [8, 70]
    },
    'extra tricky': {
      dominoes: [10, 12], box: [6, 6], sizes: [2, 3, 3, 4, 4, 5], blank: .22,
      rules: { sum: 3, eq: 2, neq: 3, gt: 3, lt: 3 }, eqBias: .4, slack: 4,
      guesses: [28, 3000], work: [36, 6000]
    }
  };

  const SOFT = { gentle: 1, thoughtful: 2, tricky: 3, 'extra tricky': 4 };
  const hiddenPairs = new WeakMap();
  const pairsOf = puzzle => hiddenPairs.get(puzzle) || [];
  const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];
  const between = (rand, [lo, hi]) => lo + Math.floor(rand() * (hi - lo + 1));
  function shuffle(rand, a) { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function weighted(rand, weights) {
    const entries = Object.entries(weights).filter(([, w]) => w > 0);
    let x = rand() * entries.reduce((a, [, w]) => a + w, 0);
    for (const [k, w] of entries) { x -= w; if (x < 0) return k; }
    return entries[0][0];
  }

  // 1. lay dominoes one by one, each touching the shape so far; compact shapes are favoured a little
  function growTiling(rand, count, [R, C]) {
    const occ = new Set(), pairs = [];
    const id = (r, c) => r * C + c;
    const r0 = Math.floor(rand() * R), c0 = Math.floor(rand() * (C - 1));
    pairs.push([id(r0, c0), id(r0, c0 + 1)]); occ.add(id(r0, c0)); occ.add(id(r0, c0 + 1));
    while (pairs.length < count) {
      const cands = [];
      for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
        for (const [dr, dc] of [[0, 1], [1, 0]]) {
          const r2 = r + dr, c2 = c + dc;
          if (r2 >= R || c2 >= C) continue;
          const a = id(r, c), b = id(r2, c2);
          if (occ.has(a) || occ.has(b)) continue;
          let touch = 0;
          for (const [x, y] of [[r, c], [r2, c2]]) for (const [er, ec] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const rr = x + er, cc = y + ec;
            if (rr >= 0 && rr < R && cc >= 0 && cc < C && occ.has(id(rr, cc))) touch++;
          }
          if (touch) cands.push({ a, b, w: touch * touch });
        }
      }
      if (!cands.length) return null;
      let x = rand() * cands.reduce((s, k) => s + k.w, 0), chosen = cands[0];
      for (const k of cands) { x -= k.w; if (x < 0) { chosen = k; break; } }
      pairs.push([chosen.a, chosen.b]); occ.add(chosen.a); occ.add(chosen.b);
    }
    // trim to the bounding box
    let minR = R, maxR = 0, minC = C, maxC = 0;
    for (const x of occ) { const r = Math.floor(x / C), c = x % C; minR = Math.min(minR, r); maxR = Math.max(maxR, r); minC = Math.min(minC, c); maxC = Math.max(maxC, c); }
    const rows = maxR - minR + 1, cols = maxC - minC + 1;
    const re = x => (Math.floor(x / C) - minR) * cols + (x % C - minC);
    return { rows, cols, pairs: pairs.map(([a, b]) => [re(a), re(b)]) };
  }

  // 3. regions: grow small connected groups; sometimes prefer equal neighbours so "=" regions appear
  function carveRegions(rand, cfg, shape, values) {
    const cells = shuffle(rand, shape.cells);
    const owner = new Map();
    const regions = [];
    const p = { rows: shape.rows, cols: shape.cols };
    const onBoard = new Set(shape.cells);
    for (const start of cells) {
      if (owner.has(start)) continue;
      const target = pick(rand, cfg.sizes);
      const wantEq = rand() < cfg.eqBias;
      const reg = [start];
      owner.set(start, regions.length);
      while (reg.length < target) {
        const frontier = [];
        for (const c of reg) for (const n of P.neighbours(p, c)) if (onBoard.has(n) && !owner.has(n) && !frontier.includes(n)) frontier.push(n);
        if (!frontier.length) break;
        const same = frontier.filter(n => values.get(n) === values.get(start));
        const next = wantEq && same.length ? pick(rand, same) : pick(rand, frontier);
        reg.push(next); owner.set(next, regions.length);
      }
      regions.push(reg);
    }
    return regions;
  }

  // 4. a rule for each region, true for the hidden solution
  function ruleFor(rand, cfg, cells, values) {
    const vals = cells.map(c => values.get(c));
    const sum = vals.reduce((a, b) => a + b, 0);
    const allEq = vals.length > 1 && vals.every(v => v === vals[0]);
    const allDiff = vals.length > 1 && new Set(vals).size === vals.length;
    if (rand() < cfg.blank) return { type: 'none' };
    if (allEq && rand() < .85) return { type: 'eq' };
    const w = { ...cfg.rules };
    if (!allDiff) w.neq = 0;
    w.eq = 0;
    if (sum === 0) w.gt = 0;
    if (vals.length === 1) w.neq = 0;
    const type = weighted(rand, w);
    const slack = 1 + Math.floor(rand() * cfg.slack);
    if (type === 'gt') return { type, n: Math.max(0, sum - slack) };
    if (type === 'lt') return { type, n: sum + slack };
    if (type === 'neq') return { type };
    return { type: 'sum', n: sum };
  }

  // colour regions so neighbours differ; rule-less cells stay plain
  function colourRegions(rand, puzzle) {
    const { regionOf } = P.index(puzzle);
    const order = shuffle(rand, P.COLORS.map((_, i) => i));
    puzzle.regions.forEach((reg, i) => {
      if (reg.type === 'none') { reg.color = null; return; }
      // neighbours, including corner-to-corner ones, get different colours
      const near = new Set();
      const around = c => {
        const r = Math.floor(c / puzzle.cols), col = c % puzzle.cols, out = [];
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          const rr = r + dr, cc = col + dc;
          if ((dr || dc) && rr >= 0 && cc >= 0 && rr < puzzle.rows && cc < puzzle.cols) out.push(rr * puzzle.cols + cc);
        }
        return out;
      };
      for (const c of reg.cells) for (const n of around(c)) {
        const j = regionOf.get(n);
        if (j !== undefined && j !== i && puzzle.regions[j].color != null) near.add(puzzle.regions[j].color);
      }
      reg.color = order.find(k => !near.has(k)) ?? order[i % order.length];
    });
  }

  function attempt(rand, level) {
    const cfg = CONFIG[level];
    const count = between(rand, cfg.dominoes);
    const t = growTiling(rand, count, cfg.box);
    if (!t) return null;
    const cells = t.pairs.flat().sort((a, b) => a - b);
    // 2. distinct dominoes from the double-six set, laid with a random way round
    const set = [];
    for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) set.push([a, b]);
    const chosen = shuffle(rand, set).slice(0, count);
    const values = new Map();
    const pieces = chosen.map(([a, b], i) => ({ id: i, a, b }));
    t.pairs.forEach(([c1, c2], i) => {
      const [a, b] = rand() < .5 ? chosen[i] : [chosen[i][1], chosen[i][0]];
      values.set(c1, a); values.set(c2, b);
    });
    const groups = carveRegions(rand, cfg, { rows: t.rows, cols: t.cols, cells }, values);
    const regions = groups.map(g => ({ ...ruleFor(rand, cfg, g, values), cells: g.sort((a, b) => a - b) }));
    const puzzle = { level, rows: t.rows, cols: t.cols, cells, regions, pieces: shuffle(rand, pieces).map((pc, i) => ({ ...pc, id: i })) };
    hiddenPairs.set(puzzle, t.pairs);
    return { puzzle, values };
  }

  function connectedParts(puzzle, cells) {
    const left = new Set(cells), parts = [];
    while (left.size) {
      const start = left.values().next().value, part = [start];
      left.delete(start);
      for (let i = 0; i < part.length; i++) for (const n of P.neighbours(puzzle, part[i])) if (left.has(n)) { left.delete(n); part.push(n); }
      parts.push(part.sort((a, b) => a - b));
    }
    return parts;
  }
  // the same kind of rule, rewritten for a smaller set of cells (true for the hidden solution)
  function rewrite(reg, cells, hidden) {
    const vals = cells.map(c => hidden.get(c)), sum = vals.reduce((a, b) => a + b, 0);
    const oldSum = reg.cells.map(c => hidden.get(c)).reduce((a, b) => a + b, 0);
    let rule;
    if (reg.type === 'none') rule = { type: 'none' };
    else if (cells.length === 1 && (reg.type === 'eq' || reg.type === 'neq')) rule = { type: 'sum', n: sum };
    else if (reg.type === 'sum') rule = { type: 'sum', n: sum };
    else if (reg.type === 'gt') rule = sum > 0 ? { type: 'gt', n: Math.max(0, sum - (oldSum - reg.n)) } : { type: 'sum', n: 0 };
    else if (reg.type === 'lt') rule = { type: 'lt', n: sum + (reg.n - oldSum) };
    else rule = { type: reg.type };
    return { ...rule, cells };
  }
  function splitOff(rand, level, puzzle, hidden, rival) {
    const gentle = level === 'tricky' || level === 'extra tricky';
    let choices = puzzle.cells.filter(c => hidden.get(c) !== rival.get(c) && puzzle.regions.find(r => r.cells.includes(c)).cells.length > 1);
    if (!choices.length) choices = puzzle.cells.filter(c => hidden.get(c) !== rival.get(c));
    if (!choices.length) return false;
    const cell = pick(rand, choices);
    const i = puzzle.regions.findIndex(r => r.cells.includes(cell));
    const reg = puzzle.regions[i];
    const h = hidden.get(cell), x = rival.get(cell);
    // a one-cell region that the rival breaks: an inequality on harder levels, else the exact number
    let rule = { type: 'sum', n: h };
    if (gentle && h > x && rand() < .7) rule = { type: 'gt', n: x + Math.floor(rand() * (h - x)) };
    else if (gentle && h < x && rand() < .7) rule = { type: 'lt', n: h + 1 + Math.floor(rand() * (x - h)) };
    const rest = reg.cells.filter(c => c !== cell);
    const parts = connectedParts(puzzle, rest).map(part => rewrite(reg, part, hidden));
    puzzle.regions.splice(i, 1, { ...rule, cells: [cell] }, ...parts);
    delete puzzle._ix;
    return true;
  }

  // 5a. while the solver finds another solution, tighten one region's rule so the hidden solution
  //     still fits but that rival does not. Harder levels prefer the gentlest tightening.
  function refine(rand, level, puzzle, values) {
    const cfg = CONFIG[level];
    for (let round = 0; round < 28; round++) {
      delete puzzle._ix;
      // a puzzle still this open after many rounds rarely comes good: give up on it early
      const res = S.solve(puzzle, { limit: 2, nodeLimit: round < 6 ? 30000 : 12000 });
      if (!res.complete || !res.solutions.length) { refine.reason = res.complete ? 'none' : 'incomplete'; return null; }
      // compare with flips that no rule can see written the same way (lower cell, lower value)
      const canon = pairs => {
        const m = new Map();
        for (const [c1, c2, v1, v2] of pairs) {
          if (P.flipFree(puzzle, c1, c2) && (c1 < c2) !== (v1 <= v2)) { m.set(c1, v2); m.set(c2, v1); }
          else { m.set(c1, v1); m.set(c2, v2); }
        }
        return m;
      };
      const hidden = canon(pairsOf(puzzle).map(([c1, c2]) => [c1, c2, values.get(c1), values.get(c2)]));
      const rival = res.solutions.map(sol => canon(sol.map(x => [x.c1, x.c2, x.v1, x.v2])))
        .find(m => puzzle.cells.some(c => m.get(c) !== hidden.get(c)));
      if (!rival) { refine.reason = 'tiling'; return res.solutions.length === 1 ? res : null; }   // only tiling differs: no rule can help
      const options = [];
      for (const reg of puzzle.regions) {
        // rules always come from the one concrete hidden solution, so they can never contradict each other
        const h = reg.cells.map(c => values.get(c)), x = reg.cells.map(c => rival.get(c));
        if ([...h].sort().join() === [...x].sort().join()) continue;   // same numbers: no rule can separate them
        const hs = h.reduce((a, b) => a + b, 0), xs = x.reduce((a, b) => a + b, 0);
        const hEq = h.length > 1 && h.every(v => v === h[0]), xEq = x.every(v => v === x[0]);
        const hDiff = h.length > 1 && new Set(h).size === h.length, xDiff = new Set(x).size === x.length;
        // harder levels lean towards the softest tightening (an inequality, = or ≠) over an exact sum
        const add = (rule, soft) => options.push({ reg, rule, w: soft ? SOFT[level] : 1 });
        if (reg.type === 'gt' && xs < hs) add({ type: 'gt', n: Math.max(xs, hs - 1 - Math.floor(rand() * Math.max(0, hs - 1 - xs))) }, true);
        if (reg.type === 'lt' && xs > hs) add({ type: 'lt', n: Math.min(xs, hs + 1 + Math.floor(rand() * Math.max(0, xs - hs - 1))) }, true);
        if (reg.type === 'none' || reg.type === 'gt' || reg.type === 'lt' || reg.type === 'neq' || reg.type === 'eq') {
          if (xs > hs && hs + 1 <= xs) add({ type: 'lt', n: hs + 1 }, true);
          if (xs < hs) add({ type: 'gt', n: hs - 1 }, true);
        }
        if (hEq && !xEq) add({ type: 'eq' }, true);
        if (hDiff && !xDiff) add({ type: 'neq' }, true);
        if (xs !== hs) add({ type: 'sum', n: hs }, false);
      }
      if (!options.length) {
        // the rival puts the same numbers in every region, just in other cells: no rule can tell
        // them apart, so give one disagreeing cell a region (and a rule) of its own
        if (!splitOff(rand, level, puzzle, values, rival)) { refine.reason = 'no options'; return null; }
        continue;
      }
      let r = rand() * options.reduce((a, o) => a + o.w, 0), chosen = options[0];
      for (const o of options) { r -= o.w; if (r < 0) { chosen = o; break; } }
      chosen.reg.type = chosen.rule.type;
      if (chosen.rule.n === undefined) delete chosen.reg.n; else chosen.reg.n = chosen.rule.n;
    }
    refine.reason = 'rounds';
    return null;
  }

  function grade(puzzle) {
    const res = S.solve(puzzle, { limit: 2, nodeLimit: 60000 });
    return res;
  }

  function generate(level, seed, opts = {}) {
    if (!CONFIG[level]) level = 'gentle';
    const cfg = CONFIG[level];
    const rand = P.rng(seed);
    const maxAttempts = opts.maxAttempts ?? 400;
    let fallback = null;
    for (let i = 0; i < maxAttempts; i++) {
      const made = attempt(rand, level);
      if (!made) continue;
      const puzzle = made.puzzle;
      if (!refine(rand, level, puzzle, made.values)) continue;
      delete puzzle._ix;
      const res = grade(puzzle);
      if (!res.complete || !res.solutions.length) continue;
      const inRange = res.guesses >= cfg.guesses[0] && res.guesses <= cfg.guesses[1] && res.branchWork >= cfg.work[0] && res.branchWork <= cfg.work[1];
      if (res.solutions.length === 1 && inRange) return finish(puzzle, res, seed, i + 1, true);
      // keep the best near miss in case nothing perfect turns up (still fully solver-checked)
      if (res.solutions.length === 1 && (!fallback || Math.abs(res.guesses - cfg.guesses[0]) < Math.abs(fallback.res.guesses - cfg.guesses[0]))) fallback = { puzzle, res, i };
    }
    if (fallback) return finish(fallback.puzzle, fallback.res, seed, fallback.i + 1, true);
    // extremely unlikely: accept a puzzle with a few solutions, all of them listed
    for (let i = 0; i < 200; i++) {
      const made = attempt(rand, level);
      if (!made) continue;
      const puzzle = made.puzzle;
      const res = S.solve(puzzle, { limit: 6, nodeLimit: 120000 });
      if (res.complete && res.solutions.length) return finish(puzzle, res, seed, maxAttempts + i + 1, false);
    }
    return null;
  }

  function finish(puzzle, res, seed, attempts, unique) {
    colourRegions(P.rng(seed ^ 0x5bd1e995), puzzle);
    puzzle.seed = seed;
    puzzle.id = P.LEVELS[puzzle.level].code + '-' + seed;
    puzzle.solutions = res.solutions.map(sol => sol.map(({ c1, c2, v1, v2 }) => ({ c1, c2, v1, v2 })));
    puzzle.unique = unique && res.solutions.length === 1;
    puzzle.stats = { guesses: res.guesses, work: res.branchWork, nodes: res.nodes, attempts };
    delete puzzle._ix;
    return puzzle;
  }

  function fromId(id) {
    const m = /^([gtkx])-(\d+)$/.exec(String(id || ''));
    if (!m) return null;
    return generate(P.CODE_TO_LEVEL[m[1]], Number(m[2]));
  }
  function newSeed() { return Math.floor(Math.random() * 1e9) + 1; }

  root.DMGenerator = { CONFIG, generate, fromId, newSeed, attempt, refine };
})(typeof window !== 'undefined' ? window : globalThis);
