/* quiet time — fruitmerge: drawing.
   The SVG illustrations are rasterised once per size into small offscreen canvases, then
   stamped onto the board each frame with the fruit's position and spin. */
(function (root) {
  const { FRUITS, BODY_R, BODY_Y, svg } = root.FMFruits;
  const G = root.FMGame;
  const PAD = 16;                          // world units of margin on each side of the basket
  const CREAM = '#f5eedb', CREAM_DEEP = '#ebe1c6', RIM = '#cbbd98', SAGE = '#8ea283', ROSE = '#c98494';

  const images = FRUITS.map((_, t) => {
    const img = new Image();
    img.decoding = 'async';
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg(t));
    return img;
  });
  const cache = new Map();
  function sprite(tier, px) {
    const img = images[tier];
    if (!img.complete || !img.naturalWidth) return null;
    const want = Math.max(8, Math.ceil(px));
    const hit = cache.get(tier);
    if (hit && hit.px >= want * .9 && hit.px <= want * 1.25) return hit.canvas;
    const c = document.createElement('canvas');
    c.width = c.height = want;
    c.getContext('2d').drawImage(img, 0, 0, want, want);
    cache.set(tier, { px: want, canvas: c });
    return c;
  }

  function viewSize() { return { w: G.W + PAD * 2, h: G.VIEW_H }; }

  function fruit(ctx, tier, x, y, r, angle, k, alpha = 1, scale = 1) {
    // k = screen pixels per world unit (already includes devicePixelRatio)
    const box = r / BODY_R * 100 * k * scale;
    const spr = sprite(tier, (FRUITS[tier].r / BODY_R) * 100 * k);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(angle);
    if (spr) ctx.drawImage(spr, -box * .5, -box * BODY_Y / 100, box, box);
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

    // soft effects: a ring when fruit merge, a fade and a few motes when two coconuts clear
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

  // the stack map for endless: the whole pile squeezed into a narrow strip, with the view marked
  function drawMap(ctx, s) {
    const w = ctx.canvas.width, h = ctx.canvas.height;
    ctx.clearRect(0, 0, w, h);
    const { minTop } = G.camRange(s);
    const worldTop = Math.min(minTop, s.camTop) - 20, worldBottom = G.FLOOR + 10;
    const k = Math.min(h / (worldBottom - worldTop), (w - 8) / G.W);
    const ox = (w - G.W * k) / 2;
    const my = y => h - (worldBottom - y) * k;
    ctx.fillStyle = '#f5eedb22';
    ctx.fillRect(ox, my(worldTop), G.W * k, (worldBottom - worldTop) * k);
    for (const b of s.world.bodies) {
      ctx.fillStyle = FRUITS[b.tier].base;
      ctx.beginPath(); ctx.arc(ox + b.x * k, my(b.y), Math.max(1.2, b.r * k), 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = '#f5eedb'; ctx.lineWidth = 2;
    const vy0 = my(s.camTop), vy1 = my(s.camTop + G.VIEW_H);
    ctx.strokeRect(1, Math.max(1, vy0), w - 2, Math.min(h - 1, vy1) - Math.max(1, vy0));
    return { worldTop, worldBottom, k, toWorld: py => worldBottom - (h - py) / k };
  }

  root.FMRender = { PAD, draw, drawMap, viewSize, images };
})(typeof window !== 'undefined' ? window : globalThis);
