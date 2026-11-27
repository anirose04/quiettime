/* quiet time — dominoes: checking the board.
   A placement is { piece, c1, c2, v1, v2 }: the piece's value v1 sits on cell c1, v2 on c2.
   The board is judged only by the rules, never by comparing against a stored answer, so any
   arrangement that satisfies every rule is accepted. */
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

  root.DMValidate = { cellValues, wellFormed, evaluate };
})(typeof window !== 'undefined' ? window : globalThis);
