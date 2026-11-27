/* quiet time — dominoes: checking the board, and hints.
   A placement is { piece, c1, c2, v1, v2 }: the piece's value v1 sits on cell c1, v2 on c2.
   The board is judged only by the rules, never by comparing against a stored answer, so any
   arrangement that satisfies every rule is accepted. Hints use the solver's complete list of
   solutions, so a hint only calls a move "certain" when every remaining solution agrees. */
(function (root) {
  const P = root.DMPuzzles;

  function cellValues(placements) {
    const m = new Map();
    for (const pl of placements) { m.set(pl.c1, pl.v1); m.set(pl.c2, pl.v2); }
    return m;
  }

  // structural sanity: each domino on two neighbouring board cells, no overlaps, each piece once
  function wellFormed(p, placements) {
    const { onBoard, adj } = P.index(p);
    const usedCells = new Set(), usedPieces = new Set();
    for (const pl of placements) {
      const piece = p.pieces[pl.piece];
      if (!piece || usedPieces.has(pl.piece)) return false;
      if (!onBoard.has(pl.c1) || !onBoard.has(pl.c2) || !adj.get(pl.c1).includes(pl.c2)) return false;
      if (usedCells.has(pl.c1) || usedCells.has(pl.c2)) return false;
      const ok = (pl.v1 === piece.a && pl.v2 === piece.b) || (pl.v1 === piece.b && pl.v2 === piece.a);
      if (!ok) return false;
      usedCells.add(pl.c1); usedCells.add(pl.c2); usedPieces.add(pl.piece);
    }
    return true;
  }

  // region by region: 'ok' (full and satisfied), 'bad' (already impossible), 'open'
  function evaluate(p, placements) {
    const vals = cellValues(placements);
    const regions = p.regions.map(reg => {
      if (reg.type === 'none') return 'ok';
      const have = reg.cells.filter(c => vals.has(c)).map(c => vals.get(c));
      const empty = reg.cells.length - have.length;
      if (!empty) return P.satisfied(reg, have) ? 'ok' : 'bad';
      return P.stillPossible(reg, have, empty) ? 'open' : 'bad';
    });
    const covered = p.cells.filter(c => vals.has(c)).length;
    const formed = wellFormed(p, placements);
    const solved = formed && covered === p.cells.length && placements.length === p.pieces.length && regions.every(s => s === 'ok');
    return { regions, covered, total: p.cells.length, placed: placements.length, pieces: p.pieces.length, solved, formed };
  }

  const inSolution = (p, sol, pl) => sol.some(sp => P.samePlacement(p, pl, sp));

  // what a hint can honestly say about the current board
  function analyse(p, placements) {
    const sols = p.solutions || [];
    const consistent = sols.filter(sol => placements.every(pl => inSolution(p, sol, pl)));
    if (!consistent.length) {
      // something on the board is not part of any solution that keeps the rest
      const never = placements.filter(pl => !sols.some(sol => inSolution(p, sol, pl)));
      if (never.length) return { kind: 'wrong', placements: never, alone: true };
      let best = sols[0], bestHits = -1;
      for (const sol of sols) {
        const hits = placements.filter(pl => inSolution(p, sol, pl)).length;
        if (hits > bestHits) { best = sol; bestHits = hits; }
      }
      return { kind: 'wrong', placements: placements.filter(pl => !inSolution(p, best, pl)), alone: false };
    }
    const covered = new Set(placements.flatMap(pl => [pl.c1, pl.c2]));
    const open = sol => sol.filter(sp => !covered.has(sp.c1) && !covered.has(sp.c2));
    // certain = in every solution that is still possible
    const certain = open(consistent[0]).filter(sp => consistent.every(sol => inSolution(p, sol, sp)));
    const pool = certain.length ? certain : open(consistent[0]);
    if (!pool.length) return { kind: 'done' };
    // prefer the most hemmed-in spot: few free neighbours, small rule regions
    const { adj } = P.index(p);
    const score = sp => {
      let s = 0;
      for (const c of [sp.c1, sp.c2]) {
        s += adj.get(c).filter(n => !covered.has(n) && n !== sp.c1 && n !== sp.c2).length * 2;
        const ri = P.ruleRegion(p, c);
        s += ri < 0 ? 3 : p.regions[ri].cells.length;
      }
      return s;
    };
    const target = [...pool].sort((a, b) => score(a) - score(b))[0];
    return { kind: 'move', target, certain: certain.length > 0, alternatives: consistent.length };
  }

  // the piece (not on the board) that a solution placement needs
  function pieceFor(p, sp, placements) {
    const used = new Set(placements.map(pl => pl.piece));
    const pc = p.pieces.find(x => !used.has(x.id) &&
      Math.min(x.a, x.b) === Math.min(sp.v1, sp.v2) && Math.max(x.a, x.b) === Math.max(sp.v1, sp.v2));
    return pc ? pc.id : -1;
  }

  // the rule region to point at for a nudge
  function regionFor(p, sp) {
    const ids = [sp.c1, sp.c2].map(c => P.ruleRegion(p, c)).filter(i => i >= 0);
    if (ids.length) return ids.sort((a, b) => p.regions[a].cells.length - p.regions[b].cells.length)[0];
    // both halves rule-free: point at a rule region next to them instead
    const { adj } = P.index(p);
    for (const c of [sp.c1, sp.c2]) for (const n of adj.get(c)) { const i = P.ruleRegion(p, n); if (i >= 0) return i; }
    return -1;
  }

  root.DMValidate = { cellValues, wellFormed, evaluate, analyse, pieceFor, regionFor };
})(typeof window !== 'undefined' ? window : globalThis);
