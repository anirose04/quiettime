/* quiet time — dominoes: puzzle definitions.
   A puzzle is a set of board cells (row-major index r * cols + c), regions of cells with a rule,
   and the dominoes to place. All puzzles are original and generated locally from a seed.

   puzzle = {
     id: 'g-1234', level: 'gentle', seed, rows, cols,
     cells: [cell indices on the board],
     regions: [{ type: 'sum'|'eq'|'neq'|'gt'|'lt'|'none', n, cells: [...], color }],
     pieces: [{ id, a, b }],                       // values 0–6
     solutions: [[{ c1, c2, v1, v2 }...]...],      // every solution (the search was exhaustive)
     unique: true|false
   } */
(function (root) {
  const LEVELS = {
    gentle: { label: 'gentle', code: 'g' },
    thoughtful: { label: 'thoughtful', code: 't' },
    tricky: { label: 'tricky', code: 'k' },
    'extra tricky': { label: 'extra tricky', code: 'x' }
  };
  const LEVEL_ORDER = ['gentle', 'thoughtful', 'tricky', 'extra tricky'];
  const CODE_TO_LEVEL = Object.fromEntries(LEVEL_ORDER.map(l => [LEVELS[l].code, l]));

  // soft green, dusty rose, lavender, muted teal, pale orange, blue-gray
  const COLORS = [
    { id: 'green', fill: '#cfe0c0', edge: '#6f8f5f', badge: '#5f7f51' },
    { id: 'rose', fill: '#ecc9cf', edge: '#a8687a', badge: '#9a5a6c' },
    { id: 'lavender', fill: '#d9d0ea', edge: '#7d6ea6', badge: '#6f6198' },
    { id: 'teal', fill: '#c2dfdb', edge: '#4f8a84', badge: '#467d77' },
    { id: 'orange', fill: '#f4d9b8', edge: '#b9834c', badge: '#a87440' },
    { id: 'bluegray', fill: '#cdd6e0', edge: '#64768c', badge: '#596a80' }
  ];

  // seeded random numbers, so a puzzle id always rebuilds the same puzzle
  function rng(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function label(region) {
    switch (region.type) {
      case 'sum': return String(region.n);
      case 'eq': return '=';
      case 'neq': return '≠';
      case 'gt': return '>' + region.n;
      case 'lt': return '<' + region.n;
      default: return '';
    }
  }
  function describe(region) {
    switch (region.type) {
      case 'sum': return `these cells add up to ${region.n}`;
      case 'eq': return 'every cell here shows the same number';
      case 'neq': return 'every cell here shows a different number';
      case 'gt': return `these cells add up to more than ${region.n}`;
      case 'lt': return `these cells add up to less than ${region.n}`;
      default: return 'no rule here';
    }
  }

  // does a complete set of values satisfy the rule?
  function satisfied(region, values) {
    const sum = values.reduce((a, b) => a + b, 0);
    switch (region.type) {
      case 'sum': return sum === region.n;
      case 'eq': return values.every(v => v === values[0]);
      case 'neq': return new Set(values).size === values.length;
      case 'gt': return sum > region.n;
      case 'lt': return sum < region.n;
      default: return true;
    }
  }
  // can a partial set of values (some cells still empty) still end up satisfying it?
  function stillPossible(region, values, emptyCount, maxValue = 6) {
    const sum = values.reduce((a, b) => a + b, 0);
    switch (region.type) {
      case 'sum': return sum <= region.n && sum + emptyCount * maxValue >= region.n;
      case 'eq': return values.every(v => v === values[0]);
      case 'neq': return new Set(values).size === values.length && values.length + emptyCount <= 7;
      case 'gt': return sum + emptyCount * maxValue > region.n;
      case 'lt': return sum < region.n;
      default: return true;
    }
  }

  function neighbours(p, cell) {
    const r = Math.floor(cell / p.cols), c = cell % p.cols, out = [];
    if (r > 0) out.push(cell - p.cols);
    if (c < p.cols - 1) out.push(cell + 1);
    if (r < p.rows - 1) out.push(cell + p.cols);
    if (c > 0) out.push(cell - 1);
    return out;
  }

  // lookups the solver and the board both need
  function index(p) {
    if (p._ix) return p._ix;
    const onBoard = new Set(p.cells);
    const regionOf = new Map();
    p.regions.forEach((reg, i) => reg.cells.forEach(c => regionOf.set(c, i)));
    const adj = new Map(p.cells.map(c => [c, neighbours(p, c).filter(n => onBoard.has(n))]));
    Object.defineProperty(p, '_ix', { value: { onBoard, regionOf, adj }, enumerable: false, configurable: true });
    return p._ix;
  }

  // the rule-bearing region of a cell, or -1 for cells with no rule
  function ruleRegion(p, cell) {
    const i = index(p).regionOf.get(cell);
    return i === undefined || p.regions[i].type === 'none' ? -1 : i;
  }
  // every rule only looks at which numbers are in a region, never where, so a domino whose two
  // halves share a region (or are both rule-free) reads the same either way round
  function flipFree(p, c1, c2) { return ruleRegion(p, c1) === ruleRegion(p, c2); }

  // is placement a the same move as solution placement b (allowing a flip that no rule can see)?
  function samePlacement(p, a, b) {
    if (a.c1 === b.c1 && a.c2 === b.c2 && a.v1 === b.v1 && a.v2 === b.v2) return true;
    if (a.c1 === b.c2 && a.c2 === b.c1 && a.v1 === b.v2 && a.v2 === b.v1) return true;
    const sameCells = (a.c1 === b.c1 && a.c2 === b.c2) || (a.c1 === b.c2 && a.c2 === b.c1);
    return sameCells && flipFree(p, a.c1, a.c2) &&
      Math.min(a.v1, a.v2) === Math.min(b.v1, b.v2) && Math.max(a.v1, a.v2) === Math.max(b.v1, b.v2);
  }

  root.DMPuzzles = { LEVELS, LEVEL_ORDER, CODE_TO_LEVEL, COLORS, rng, label, describe, satisfied, stillPossible, neighbours, index, ruleRegion, flipFree, samePlacement };
})(typeof window !== 'undefined' ? window : globalThis);
