/* quiet time — dominoes: drawing.
   The board is one SVG (cream tiles, pastel regions with dashed inset outlines). Dominoes are
   buttons laid over it, and the rule badges sit in a second SVG on top so they stay readable.
   All sizes come from S, the pixel size of one cell. */
(function (root) {
  const P = root.DMPuzzles;
  const PAD = .34;            // board margin, in cells (room for badges at the edge)

  const PIPS = {
    0: [], 1: [[50, 50]], 2: [[28, 28], [72, 72]], 3: [[28, 28], [50, 50], [72, 72]],
    4: [[28, 28], [72, 28], [28, 72], [72, 72]], 5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
    6: [[28, 25], [72, 25], [28, 50], [72, 50], [28, 75], [72, 75]]
  };
  function pips(v, ox, oy, rotate) {
    return PIPS[v].map(([x, y]) => {
      const [px, py] = rotate ? [y, x] : [x, y];
      return `<circle cx="${ox + px}" cy="${oy + py}" r="8.6"/>`;
    }).join('');
  }
  // a domino tile: first value on the left (h) or top (v)
  function dominoSVG(first, second, dir) {
    const h = dir === 'h';
    const w = h ? 200 : 100, ht = h ? 100 : 200;
    return `<svg viewBox="0 0 ${w} ${ht}" aria-hidden="true" class="dm-tile">` +
      `<rect x="3" y="3" width="${w - 6}" height="${ht - 6}" rx="16" class="dm-tile-body"/>` +
      `<rect x="9" y="9" width="${w - 18}" height="${ht - 18}" rx="11" class="dm-tile-inset"/>` +
      (h ? `<path d="M100 16v68" class="dm-tile-line"/>` : `<path d="M16 100h68" class="dm-tile-line"/>`) +
      `<g class="dm-pips">${pips(first, 0, 0, h)}${h ? pips(second, 100, 0, true) : pips(second, 0, 100, false)}</g></svg>`;
  }

  function geometry(p, S) {
    const pad = Math.round(S * PAD);
    return { S, pad, width: p.cols * S + pad * 2, height: p.rows * S + pad * 2, x: c => pad + (c % p.cols) * S, y: c => pad + Math.floor(c / p.cols) * S };
  }

  // dashed outline drawn just inside a region, joined neatly at inner and outer corners
  function outlinePath(p, cells, g, inset) {
    const set = new Set(cells), segs = [];
    const has = (r, c) => r >= 0 && c >= 0 && r < p.rows && c < p.cols && set.has(r * p.cols + c);
    for (const cell of cells) {
      const r = Math.floor(cell / p.cols), c = cell % p.cols;
      const x0 = g.x(cell), y0 = g.y(cell), x1 = x0 + g.S, y1 = y0 + g.S;
      const end = (sideIn, diagIn) => (!sideIn ? inset : diagIn ? -inset : 0);
      if (!has(r - 1, c)) segs.push(`M${x0 + end(has(r, c - 1), has(r - 1, c - 1))} ${y0 + inset}H${x1 - end(has(r, c + 1), has(r - 1, c + 1))}`);
      if (!has(r + 1, c)) segs.push(`M${x0 + end(has(r, c - 1), has(r + 1, c - 1))} ${y1 - inset}H${x1 - end(has(r, c + 1), has(r + 1, c + 1))}`);
      if (!has(r, c - 1)) segs.push(`M${x0 + inset} ${y0 + end(has(r - 1, c), has(r - 1, c - 1))}V${y1 - end(has(r + 1, c), has(r + 1, c - 1))}`);
      if (!has(r, c + 1)) segs.push(`M${x1 - inset} ${y0 + end(has(r - 1, c), has(r - 1, c + 1))}V${y1 - end(has(r + 1, c), has(r + 1, c + 1))}`);
    }
    return segs.join('');
  }

  // board: tiles + regions. marks: { bad:Set(regionIdx), focus:Set(regionIdx), cursor:cell, preview:[c1,c2]|null }
  function boardSVG(p, S, marks = {}) {
    const g = geometry(p, S);
    const { regionOf } = P.index(p);
    const inset = Math.max(3, S * .07);
    let out = `<svg class="dm-board-svg" width="${g.width}" height="${g.height}" viewBox="0 0 ${g.width} ${g.height}" aria-hidden="true">`;
    // the board itself: a cream plate that follows the shape of the cells
    const lip = Math.max(5, S * .1);
    out += `<g class="dm-plate">${p.cells.map(c => `<rect x="${g.x(c) - lip}" y="${g.y(c) - lip}" width="${S + lip * 2}" height="${S + lip * 2}" rx="${lip * 1.6}"/>`).join('')}</g>`;
    for (const c of p.cells) {
      const ri = regionOf.get(c), reg = ri === undefined ? null : p.regions[ri];
      const col = reg && reg.color != null ? P.COLORS[reg.color] : null;
      out += `<rect x="${g.x(c) + 1.5}" y="${g.y(c) + 1.5}" width="${S - 3}" height="${S - 3}" rx="${S * .12}" class="dm-cell${col ? '' : ' dm-cell-plain'}"${col ? ` style="fill:${col.fill}"` : ''} data-cell="${c}"/>`;
    }
    p.regions.forEach((reg, i) => {
      if (reg.type === 'none') return;
      const col = P.COLORS[reg.color ?? 0];
      const cls = ['dm-outline', marks.bad?.has(i) ? 'bad' : '', marks.focus?.has(i) ? 'focus' : ''].join(' ');
      out += `<path d="${outlinePath(p, reg.cells, g, inset)}" class="${cls}" style="stroke:${col.edge}"/>`;
    });
    if (marks.preview) {
      const [a, b] = marks.preview, lo = Math.min(a, b), hi = Math.max(a, b);
      const x = g.x(lo), y = g.y(lo), w = (hi - lo === 1 ? 2 : 1) * S, h = (hi - lo === 1 ? 1 : 2) * S;
      out += `<rect x="${x + 3}" y="${y + 3}" width="${w - 6}" height="${h - 6}" rx="${S * .16}" class="dm-preview${marks.previewOk === false ? ' no' : ''}"/>`;
    }
    if (marks.cursor != null && P.index(p).onBoard.has(marks.cursor)) {
      out += `<rect x="${g.x(marks.cursor) + 4}" y="${g.y(marks.cursor) + 4}" width="${S - 8}" height="${S - 8}" rx="${S * .14}" class="dm-cursor"/>`;
    }
    return out + '</svg>';
  }

  // badges: a small diamond at the lower-right corner of each region's last cell
  function badgesSVG(p, S, marks = {}) {
    const g = geometry(p, S);
    let out = `<svg class="dm-badges" width="${g.width}" height="${g.height}" viewBox="0 0 ${g.width} ${g.height}" aria-hidden="true">`;
    const r = Math.max(11, S * .25);
    p.regions.forEach((reg, i) => {
      if (reg.type === 'none') return;
      const col = P.COLORS[reg.color ?? 0];
      const anchor = [...reg.cells].sort((a, b) => (Math.floor(b / p.cols) - Math.floor(a / p.cols)) || (b % p.cols - a % p.cols))[0];
      const cx = g.x(anchor) + S - r * .55, cy = g.y(anchor) + S - r * .55;
      const text = P.label(reg);
      const cls = ['dm-badge', marks.bad?.has(i) ? 'bad' : '', marks.focus?.has(i) ? 'focus' : '', marks.ok?.has(i) ? 'ok' : ''].join(' ');
      out += `<g class="${cls}" transform="translate(${cx} ${cy})"><rect x="${-r * .78}" y="${-r * .78}" width="${r * 1.56}" height="${r * 1.56}" rx="${r * .28}" transform="rotate(45)" style="fill:${col.badge}"/>` +
        `<text text-anchor="middle" dominant-baseline="central" font-size="${text.length > 2 ? r * .7 : r * .92}">${text}</text></g>`;
    });
    return out + '</svg>';
  }

  root.DMRender = { PAD, dominoSVG, geometry, boardSVG, badgesSVG, outlinePath };
})(window);
