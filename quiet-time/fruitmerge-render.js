/* quiet time — fruitmerge: drawing.
   The fruit pictures are scaled once per size into small offscreen canvases, then stamped onto
   the board each frame with the fruit's position and spin. If a picture can't load, the
   code-drawn SVG version of that fruit is used instead. */
(function (root) {
  const { FRUITS, BODY_R, BODY_Y, svg } = root.FMFruits;
  const G = root.FMGame;
  const PAD = 16;                          // world units of margin on each side of the basket
  const CREAM = '#f5eedb', CREAM_DEEP = '#ebe1c6', RIM = '#cbbd98', SAGE = '#8ea283', ROSE = '#c98494';

  const images = FRUITS.map((f, t) => {
    const img = new Image();
    img.decoding = 'async';
    img.onerror = () => { img.onerror = null; img.dataset.svg = '1'; cache.delete(t); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg(t)); };
    img.src = f.img;
    return img;
  });
  const cache = new Map();
  function sprite(tier, px) {
    const img = images[tier];
    if (!img.complete || !img.naturalWidth) return null;
    const want = Math.max(8, Math.ceil(px));
    const hit = cache.get(tier);
    if (hit && hit.px >= want * .9 && hit.px <= want * 1.25) return hit.canvas;
    // big pictures are halved step by step so a small sprite stays smooth instead of jagged
    let src = img, size = img.naturalWidth;
    while (size / 2 >= want * 1.5) {
      const half = document.createElement('canvas');
      half.width = half.height = Math.round(size / 2);
      const hx = half.getContext('2d'); hx.imageSmoothingQuality = 'high';
      hx.drawImage(src, 0, 0, half.width, half.height);
      src = half; size = half.width;
    }
    const c = document.createElement('canvas');
    c.width = c.height = want;
    const cx = c.getContext('2d'); cx.imageSmoothingQuality = 'high';
    cx.drawImage(src, 0, 0, want, want);
    cache.set(tier, { px: want, canvas: c });
    return c;
  }

  function viewSize() { return { w: G.W + PAD * 2, h: G.VIEW_H }; }

  function fruit(ctx, tier, x, y, r, angle, k, alpha = 1, scale = 1) {
    // k = screen pixels per world unit (already includes devicePixelRatio)
    // the drawn body (outline included) just fills the collision circle, so touching fruit look touching
    const usingSvg = images[tier].dataset.svg === '1';
    const [artR, artX, artY] = (usingSvg ? FRUITS[tier].art : FRUITS[tier].pic) || [BODY_R, 50, BODY_Y];
    // exactly the collision circle, so two fruit only look touching when they are (the SVG's outline sits half outside its path)
    const fill = 100 / (artR + (usingSvg ? 1 : 0));
    const box = r * fill * k * scale;
    const spr = sprite(tier, FRUITS[tier].r * fill * k);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(angle);
    if (spr) ctx.drawImage(spr, -box * artX / 100, -box * artY / 100, box, box);
    else { ctx.fillStyle = FRUITS[tier].base; ctx.beginPath(); ctx.arc(0, 0, r * k * scale, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }

  function roundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + h - r); ctx.quadraticCurveTo(x, y + h, x + r, y + h);
    ctx.lineTo(x + w - r, y + h); ctx.quadraticCurveTo(x + w, y + h, x + w, y + h - r);
    ctx.lineTo(x + w, y);
  }

  // where a straight drop from x would first touch the pile
  function landingY(s, x, r) {
    let best = G.FLOOR;
    for (const b of s.world.bodies) {
      const dx = Math.abs(b.x - x), reach = b.r + r;
      if (dx < reach) best = Math.min(best, b.y - Math.sqrt(reach * reach - dx * dx));
    }
    return best;
  }

  function draw(ctx, s, k, opts = {}) {
    const cw = ctx.canvas.width, ch = ctx.canvas.height;
    const sx = x => (x + PAD) * k, sy = y => (y - s.camTop) * k;
    ctx.clearRect(0, 0, cw, ch);

    // the basket: a soft cream tray. classic has a rim at y = 0; endless walls run on up
    const top = s.mode === 'classic' ? 0 : s.camTop - 40;
    const x0 = sx(0), x1 = sx(G.W), y0 = Math.max(-20, sy(top)), y1 = sy(G.FLOOR);
    if (y0 < y1) {
      const grad = ctx.createLinearGradient(0, y0, 0, y1);
      grad.addColorStop(0, s.mode === 'classic' ? CREAM : CREAM_DEEP);
      grad.addColorStop(Math.min(1, Math.max(0, (sy(G.FLOOR - 300) - y0) / Math.max(1, y1 - y0))), CREAM);
      grad.addColorStop(1, CREAM);
      ctx.fillStyle = grad;
      roundRectPath(ctx, x0, y0, x1 - x0, y1 - y0, 18 * k);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = RIM; ctx.lineWidth = 3 * k; ctx.lineJoin = 'round';
      roundRectPath(ctx, x0, y0, x1 - x0, y1 - y0, 18 * k); ctx.stroke();
    }
    if (s.mode === 'classic') {
      // a gentle line the pile should stay under; it warms to rose while the pile lingers above it
      const ly = sy(G.LINE), warm = Math.min(1, s.overT / 2.4);
      ctx.save();
      ctx.setLineDash([7 * k, 7 * k]);
      ctx.strokeStyle = warm > 0 ? ROSE : SAGE;
      ctx.globalAlpha = .5 + .5 * warm;
      ctx.lineWidth = 2 * k;
      ctx.beginPath(); ctx.moveTo(x0 + 6 * k, ly); ctx.lineTo(x1 - 6 * k, ly); ctx.stroke();
      ctx.restore();
    } else {
      // little height marks on the walls so a tall pile still reads as tall
      ctx.save();
      ctx.strokeStyle = RIM; ctx.lineWidth = 2 * k; ctx.globalAlpha = .8;
      ctx.fillStyle = '#9a8e6c'; ctx.font = `${11 * k}px 'Courier Prime', monospace`; ctx.textBaseline = 'middle';
      const first = Math.ceil((G.FLOOR - (s.camTop + G.VIEW_H)) / 200) * 200;
      for (let h = Math.max(200, first); G.FLOOR - h > s.camTop - 40; h += 200) {
        const yy = sy(G.FLOOR - h);
        ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x0 + 9 * k, yy); ctx.moveTo(x1, yy); ctx.lineTo(x1 - 9 * k, yy); ctx.stroke();
        ctx.fillText(String(h / 100), x0 + 13 * k, yy);
      }
      ctx.restore();
    }

    // drop guide and the fruit waiting to be dropped
    if (!s.over && !opts.hideHeld) {
      const f = FRUITS[s.current], hx = G.heldX(s), ready = s.cooldown <= 0;
      const land = landingY(s, hx, f.r);
      if (land > s.dropY + f.r) {
        ctx.save();
        ctx.setLineDash([3 * k, 8 * k]);
        ctx.strokeStyle = '#7e8f72'; ctx.globalAlpha = ready ? .55 : .25; ctx.lineWidth = 2 * k; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(sx(hx), sy(s.dropY + f.r + 4)); ctx.lineTo(sx(hx), sy(land)); ctx.stroke();
        ctx.restore();
      }
      const bob = Math.sin(s.time * 2.2) * 1.5;
      fruit(ctx, s.current, sx(hx), sy(s.dropY + bob), f.r, 0, k, ready ? 1 : .35 + .65 * (1 - s.cooldown / G.COOLDOWN) * .6);
    }

    // fruit in the basket
    for (const b of s.world.bodies) {
      if (b.dead) continue;
      const yy = sy(b.y);
      if (yy < -b.r * 3 * k || yy > ch + b.r * 3 * k) continue;
      const pt = s.time - b.popT;
      const pop = pt >= 0 && pt < .26 ? 1 + .1 * Math.sin(Math.PI * pt / .26) : 1;
      fruit(ctx, b.tier, sx(b.x), yy, b.r, b.a, k, 1, pop);
    }

    // soft effects: a ring when fruit merge, a fade and a few motes when the two biggest fruit clear
    for (const e of s.effects) {
      const p = (s.time - e.t0);
      if (e.type === 'ring' && p < .45) {
        const q = p / .45;
        ctx.save();
        ctx.globalAlpha = .45 * (1 - q);
        ctx.strokeStyle = '#fffaf0'; ctx.lineWidth = 3 * k * (1 - q) + k;
        ctx.beginPath(); ctx.arc(sx(e.x), sy(e.y), (e.r + 6 + 18 * q) * k, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      } else if (e.type === 'fade' && p < .7) {
        const q = p / .7;
        fruit(ctx, e.tier, sx(e.x), sy(e.y - 10 * q), FRUITS[e.tier].r, e.rot, k, (1 - q) * (1 - q), 1 + .18 * q);
      } else if (e.type === 'sparkle' && p < 1.1) {
        const q = p / 1.1;
        ctx.save();
        for (let i = 0; i < 9; i++) {
          const ang = i / 9 * Math.PI * 2 + e.seed;
          const dist = (e.r * .6 + 70 * q) * k;
          ctx.globalAlpha = .7 * (1 - q);
          ctx.fillStyle = i % 3 === 0 ? '#f3d9a6' : i % 3 === 1 ? '#fffaf0' : '#cfe0c3';
          ctx.beginPath(); ctx.arc(sx(e.x) + Math.cos(ang) * dist, sy(e.y) + Math.sin(ang) * dist - 20 * q * k, (4 - 2.5 * q) * k, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }
    }
  }

  // the stack map for endless: a slim slider for the whole basket, floor at the bottom and the drop zone
  // at the top. A soft fill shows how high the pile reaches, small marks match the height marks on the
  // basket walls, and the box with grip lines is the part on screen; drag it to look around
  function rrect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function drawMap(ctx, s) {
    const w = ctx.canvas.width, h = ctx.canvas.height, u = w / 52;
    ctx.clearRect(0, 0, w, h);
    const { minTop } = G.camRange(s);
    const worldTop = minTop - 10, worldBottom = G.FLOOR + 10;
    const ky = h / (worldBottom - worldTop);
    const my = y => (y - worldTop) * ky;
    // the pile
    const py = Math.max(0, my(Math.min(G.FLOOR, s.pileTop)));
    if (py < h) {
      ctx.fillStyle = '#f5eedb21';
      rrect(ctx, 7 * u, py, w - 14 * u, my(G.FLOOR) - py, 5 * u); ctx.fill();
      ctx.strokeStyle = '#f5eedb59'; ctx.lineWidth = 1.2 * u; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(10 * u, py); ctx.lineTo(w - 10 * u, py); ctx.stroke();
    }
    // height marks, as on the basket walls
    ctx.strokeStyle = '#f5eedb3d'; ctx.lineWidth = 1.2 * u; ctx.lineCap = 'round';
    ctx.fillStyle = '#f5eedb66'; ctx.font = `${8.5 * u}px 'Courier Prime', monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let m = 200; G.FLOOR - m > worldTop + 8; m += 200) {
      const yy = my(G.FLOOR - m);
      ctx.beginPath(); ctx.moveTo(2 * u, yy); ctx.lineTo(6 * u, yy); ctx.moveTo(w - 2 * u, yy); ctx.lineTo(w - 6 * u, yy); ctx.stroke();
      if (h / (worldBottom - worldTop) * 200 > 22 * u) ctx.fillText(String(m / 100), w / 2, yy);
    }
    // the view: a box you can grab
    const vy0 = Math.max(1.5 * u, my(s.camTop)), vy1 = Math.min(h - 1.5 * u, my(s.camTop + G.VIEW_H));
    ctx.fillStyle = '#f5eedb1c';
    rrect(ctx, 2.5 * u, vy0, w - 5 * u, vy1 - vy0, 6 * u); ctx.fill();
    ctx.strokeStyle = '#f5eedbcc'; ctx.lineWidth = 1.6 * u; ctx.stroke();
    const mid = (vy0 + vy1) / 2;
    ctx.strokeStyle = '#f5eedbb3'; ctx.lineWidth = 1.4 * u;
    ctx.beginPath();
    for (const d of [-4, 0, 4]) { ctx.moveTo(w / 2 - 7 * u, mid + d * u); ctx.lineTo(w / 2 + 7 * u, mid + d * u); }
    ctx.stroke();
    return { worldTop, worldBottom, ky, viewTop: vy0, viewBottom: vy1, toWorld: py => worldTop + py / ky };
  }

  root.FMRender = { PAD, draw, drawMap, viewSize, images };
})(typeof window !== 'undefined' ? window : globalThis);
