/* quiet time — dominoes: saving and resuming.
   One local key, independent of every other game. Each difficulty keeps its own puzzle,
   placements, tray turns and recent undo history, plus one quietly pre-made next puzzle. */
(function (root) {
  const KEY = 'lg-dominoes';
  const P = root.DMPuzzles;
  const HISTORY_KEEP = 60;

  function read() {
    try { const v = JSON.parse(localStorage.getItem(KEY)); return v && typeof v === 'object' ? v : {}; } catch { return {}; }
  }
  function write(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* storage full or blocked */ } }

  // a puzzle from storage is only trusted if its shape is sound
  function puzzleOk(p) {
    if (!p || typeof p !== 'object' || !P.LEVELS[p.level] || !Array.isArray(p.cells) || !Array.isArray(p.regions) || !Array.isArray(p.pieces)) return false;
    if (!(p.rows > 0 && p.cols > 0) || p.cells.length !== p.pieces.length * 2) return false;
    if (!Array.isArray(p.solutions) || !p.solutions.length) return false;
    const cells = new Set(p.cells);
    const seen = new Set();
    for (const r of p.regions) {
      if (!Array.isArray(r.cells) || !['sum', 'eq', 'neq', 'gt', 'lt', 'none'].includes(r.type)) return false;
      for (const c of r.cells) { if (!cells.has(c) || seen.has(c)) return false; seen.add(c); }
    }
    return p.pieces.every((pc, i) => pc.id === i && pc.a >= 0 && pc.a <= 6 && pc.b >= 0 && pc.b <= 6);
  }
  function gameOk(g) {
    return g && puzzleOk(g.puzzle) && Array.isArray(g.placements) && root.DMValidate.wellFormed(g.puzzle, g.placements);
  }

  function load() {
    const raw = read();
    const level = P.LEVELS[raw.level] ? raw.level : 'gentle';
    const byLevel = {}, ready = {};
    for (const l of P.LEVEL_ORDER) {
      const g = raw.byLevel?.[l];
      if (gameOk(g)) {
        byLevel[l] = {
          puzzle: g.puzzle, placements: g.placements,
          tray: g.tray && typeof g.tray === 'object' ? g.tray : {},
          history: Array.isArray(g.history) ? g.history.filter(h => typeof h === 'string') : [],
          future: Array.isArray(g.future) ? g.future.filter(h => typeof h === 'string') : [],
          solved: !!g.solved
        };
      }
      if (puzzleOk(raw.ready?.[l])) ready[l] = raw.ready[l];
    }
    return { level, byLevel, ready };
  }

  function save(level, byLevel, ready) {
    const out = { v: 1, level, byLevel: {}, ready: {} };
    for (const l of P.LEVEL_ORDER) {
      const g = byLevel[l];
      if (g) out.byLevel[l] = { puzzle: g.puzzle, placements: g.placements, tray: g.tray, history: g.history.slice(-HISTORY_KEEP), future: g.future.slice(-HISTORY_KEEP), solved: g.solved };
      if (ready[l]) out.ready[l] = ready[l];
    }
    write(out);
  }

  root.DMSave = { KEY, load, save, puzzleOk };
})(window);
