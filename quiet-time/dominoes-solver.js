/* quiet time — dominoes: solver.
   Exhaustive backtracking search. At every step it looks at each uncovered cell, lists every
   domino (and way round) that could cover it together with a neighbour without breaking any
   region's rule, and branches on the cell with the fewest options. A cell with one option is a
   forced move; a cell with none ends that branch. Identical dominoes are treated as one choice,
   and a domino whose halves share a region (or are both rule-free) is only tried one way round,
   because no rule can tell the two apart: neither counts as a different solution.

   solve(puzzle, { limit, nodeLimit, fixed }) ->
     { solutions: [[{ c1, c2, v1, v2, piece }]], complete, nodes, guesses, branchWork } */
(function (root) {
  const P = root.DMPuzzles;

  function makeState(p) {
    const { regionOf, adj } = P.index(p);
    const size = p.rows * p.cols;
    const val = new Int8Array(size).fill(-1);
    const reg = p.regions.map(r => ({ type: r.type, n: r.n, size: r.cells.length, sum: 0, filled: 0, mask: 0 }));
    const regIdx = new Int16Array(size).fill(-1);
    for (const [c, i] of regionOf) if (p.regions[i].type !== 'none') regIdx[c] = i;
    // pieces with the same two values are interchangeable: keep one key per kind
    const kinds = [];
    const kindOf = p.pieces.map(pc => {
      const lo = Math.min(pc.a, pc.b), hi = Math.max(pc.a, pc.b);
      let k = kinds.findIndex(x => x.lo === lo && x.hi === hi);
      if (k < 0) { k = kinds.length; kinds.push({ lo, hi, left: 0, ids: [] }); }
      kinds[k].left++; kinds[k].ids.push(pc.id);
      return k;
    });
    return { p, val, reg, regIdx, adj, cells: p.cells, kinds, kindOf, placed: [] };
  }

  // would writing v into cell c keep its region satisfiable?
  function fits(st, c, v) {
    const ri = st.regIdx[c];
    if (ri < 0) return true;
    const R = st.reg[ri];
    const sum = R.sum + v, rem = R.size - R.filled - 1, bit = 1 << v;
    switch (R.type) {
      case 'sum': return sum <= R.n && sum + rem * 6 >= R.n;
      case 'lt': return sum < R.n;
      case 'gt': return sum + rem * 6 > R.n;
      case 'eq': return R.mask === 0 || R.mask === bit;
      case 'neq': return !(R.mask & bit);
      default: return true;
    }
  }
  function put(st, c, v) {
    st.val[c] = v;
    const ri = st.regIdx[c];
    if (ri >= 0) { const R = st.reg[ri]; R.sum += v; R.filled++; R.prevMask = R.prevMask || []; R.prevMask.push(R.mask); R.mask |= 1 << v; }
  }
  function take(st, c, v) {
    st.val[c] = -1;
    const ri = st.regIdx[c];
    if (ri >= 0) { const R = st.reg[ri]; R.sum -= v; R.filled--; R.mask = R.prevMask.pop(); }
  }
  // both halves, checked together (they may share a region)
  function tryPair(st, c, d, v1, v2) {
    if (!fits(st, c, v1)) return false;
    put(st, c, v1);
    const ok = fits(st, d, v2);
    take(st, c, v1);
    return ok;
  }

  function optionsFor(st, c, limit) {
    const opts = [];
    for (const d of st.adj.get(c)) {
      if (st.val[d] !== -1) continue;
      for (let k = 0; k < st.kinds.length; k++) {
        const K = st.kinds[k];
        if (!K.left) continue;
        // a flip no rule can see is the same solution: only the lower cell gets the lower value
        const free = st.regIdx[c] === st.regIdx[d];
        const tryLoHi = !free || K.lo === K.hi || c < d, tryHiLo = K.lo !== K.hi && (!free || c > d);
        if (tryLoHi && tryPair(st, c, d, K.lo, K.hi)) { opts.push([d, k, K.lo, K.hi]); if (opts.length > limit) return opts; }
        if (tryHiLo && tryPair(st, c, d, K.hi, K.lo)) { opts.push([d, k, K.hi, K.lo]); if (opts.length > limit) return opts; }
      }
    }
    return opts;
  }

  function place(st, c, d, k, v1, v2) {
    put(st, c, v1); put(st, d, v2); st.kinds[k].left--;
    st.placed.push({ c1: c, c2: d, v1, v2, kind: k });
  }
  function unplace(st) {
    const m = st.placed.pop();
    st.kinds[m.kind].left++; take(st, m.c2, m.v2); take(st, m.c1, m.v1);
  }

  // hand out real piece ids for a finished solution (identical pieces are interchangeable)
  function withPieces(st) {
    const used = st.kinds.map(() => 0);
    return st.placed.map(m => {
      const K = st.kinds[m.kind];
      return { c1: m.c1, c2: m.c2, v1: m.v1, v2: m.v2, piece: K.ids[used[m.kind]++] };
    });
  }

  function solve(p, opts = {}) {
    const limit = opts.limit ?? 2, nodeLimit = opts.nodeLimit ?? 200000;
    const st = makeState(p);
    const out = { solutions: [], complete: true, nodes: 0, guesses: 0, branchWork: 0 };
    // pre-placed dominoes (the player's, for hints): they must agree with the rules and the set
    for (const f of opts.fixed || []) {
      const lo = Math.min(f.v1, f.v2), hi = Math.max(f.v1, f.v2);
      const k = st.kinds.findIndex(K => K.lo === lo && K.hi === hi && K.left > 0);
      if (k < 0 || st.val[f.c1] !== -1 || st.val[f.c2] !== -1 || !tryPair(st, f.c1, f.c2, f.v1, f.v2)) {
        out.inconsistent = true; return out;
      }
      place(st, f.c1, f.c2, k, f.v1, f.v2);
    }
    const fixedCount = st.placed.length;

    function rec() {
      if (++out.nodes > nodeLimit) { out.complete = false; return true; }
      // choose the uncovered cell with the fewest ways to cover it
      let best = null, bestCell = -1;
      for (const c of st.cells) {
        if (st.val[c] !== -1) continue;
        const o = optionsFor(st, c, best ? best.length - 1 : 99);
        if (!o.length) return false;
        if (!best || o.length < best.length) { best = o; bestCell = c; if (o.length === 1) break; }
      }
      if (bestCell < 0) {
        const sol = withPieces(st);
        out.solutions.push(sol.slice(fixedCount));
        if (out.solutions.length === 1) out.full = sol;
        return out.solutions.length >= limit;
      }
      if (best.length > 1) { out.guesses++; out.branchWork += best.length - 1; }
      for (const [d, k, v1, v2] of best) {
        place(st, bestCell, d, k, v1, v2);
        const stop = rec();
        unplace(st);
        if (stop) return true;
      }
      return false;
    }
    rec();
    return out;
  }

  root.DMSolver = { solve };
})(typeof window !== 'undefined' ? window : globalThis);
