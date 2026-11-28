/* quiet time — fruitmerge: fruit definitions and illustrations.
   The tier order, sizes, colours, shapes and faces all live here, so a fruit can be retuned or
   redrawn without touching the physics or the game rules. r is the physics radius in world units
   (the basket is 600 wide); sizes run from 19 to 81 so neighbouring fruit feel close in size.
   Style: fruit first. Flat pastel fills, a moderately thin outline in a darker shade of each
   fruit's own colour, one soft highlight, simple botanical details, and a small face (dot eyes,
   or closed smiling eyes on a few) that grows with the fruit. Every SVG is a 100 × 100 box whose
   body stays inside the collision circle (centre 50,55, radius 38); only stems and leaves rise
   above it. */
(function (root) {
  const BODY_R = 38, BODY_Y = 55;
  const FACE = '#3b2c2a';
  // art = [area-equivalent radius, centre x, centre y] of the drawn body, measured from the SVG, so the
  // renderer can scale and centre each drawing to fill its collision circle (stems and leaves don't count)
  const FRUITS = [
    { id: 'blueberry', name: 'blueberry', r: 19, points: 1, base: '#8a9fe0', edge: '#5668ad', face: 1.35, art: [35.5, 49.88, 55.88] },
    { id: 'cherry', name: 'cherry', r: 24, points: 3, base: '#ef6f7c', edge: '#b8444f', face: 1.3, art: [32.9, 49.87, 59.39] },
    { id: 'strawberry', name: 'strawberry', r: 29, points: 6, base: '#f47474', edge: '#c24b4f', face: 1.3, art: [34.64, 49.88, 54.81] },
    { id: 'plum', name: 'plum', r: 34, points: 10, base: '#ad8ad9', edge: '#7c5dab', face: 1.32, art: [34.2, 49.88, 55.88] },
    { id: 'tangerine', name: 'tangerine', r: 39, points: 15, base: '#ffab5c', edge: '#d47e2f', face: 1.36, art: [34.41, 49.88, 57.88] },
    { id: 'apple', name: 'apple', r: 45, points: 21, base: '#f06a63', edge: '#b9423e', face: 1.42, art: [35.57, 49.88, 56.71] },
    { id: 'peach', name: 'peach', r: 51, points: 28, base: '#ffbf98', edge: '#d98a68', face: 1.48, art: [35.56, 49.88, 57.87] },
    { id: 'pear', name: 'pear', r: 57, points: 36, base: '#d7e37a', edge: '#9caa3f', face: 1.5, art: [29.18, 49.87, 62.19] },
    { id: 'watermelon', name: 'watermelon', r: 63, points: 45, base: '#7cc46e', edge: '#3f8443', face: 1.58, art: [36.5, 49.88, 54.88] },
    { id: 'coconut', name: 'coconut', r: 69, points: 55, base: '#b07c54', edge: '#6f4a2e', face: 1.66, art: [36.5, 49.88, 54.88] },
    { id: 'pineapple', name: 'pineapple', r: 75, points: 66, base: '#f5cd5b', edge: '#c39328', face: 1.74, art: [34.13, 49.88, 57.49] },
    { id: 'dragonfruit', name: 'dragon fruit', r: 81, points: 78, base: '#ef6a9c', edge: '#b23d6c', face: 1.8, blush: '#c93d72', art: [34.65, 49.87, 56.58] }
  ];
  // the illustrated fruit: one transparent PNG per fruit in assets/fruit (sized to the largest it is ever
  // drawn). pic = [radius, centre x, centre y] of the round body as a share of the image width (×100),
  // fitted to the outline while ignoring stems, leaves and crowns, so the body fills the collision circle.
  // The code-drawn SVG fruit below stay as a fallback if a picture can't load.
  const PIC = {
    blueberry: [36.59, 49.93, 50.1], cherry: [35.38, 49.69, 47.71], strawberry: [36.14, 49.82, 44.58],
    plum: [37.41, 49.99, 49.49], tangerine: [36.42, 49.92, 49.58], apple: [36.58, 49.94, 47.45],
    peach: [36.28, 50.06, 50.25], pear: [35.79, 49.98, 56.39], watermelon: [36.85, 49.9, 50.29],
    coconut: [36.84, 49.88, 49.97], pineapple: [37.05, 49.83, 48.38], dragonfruit: [37.84, 50.91, 51.77]
  };
  FRUITS.forEach((f, i) => { f.img = `assets/fruit/${String(i + 1).padStart(2, '0')}-${f.id}.png`; f.pic = PIC[f.id]; });
  const SPAWN_WEIGHTS = [30, 26, 20, 14, 10];
  const LEAF = '#86c46f', LEAF_EDGE = '#4f8a43', STEM = '#7a573a';

  // body silhouettes, each inside the collision circle
  const BODY = {
    blueberry: '<circle cx="50" cy="56" r="35.5"/>',
    cherry: '<path d="M50 33C38 25 17 33 16 57C15 77 31 91 50 91C69 91 85 77 84 57C83 33 62 25 50 33Z"/>',
    strawberry: '<path d="M50 24C71 22 87 33 86 50C85 70 66 90 50 92C34 90 15 70 14 50C13 33 29 22 50 24Z"/>',
    plum: '<ellipse cx="50" cy="56" rx="32.5" ry="36"/>',
    tangerine: '<ellipse cx="50" cy="58" rx="37" ry="32"/>',
    apple: '<path d="M50 31C56 22 83 21 86 47C89 70 71 92 59 91C55 90.5 53 89 50 89C47 89 45 90.5 41 91C29 92 11 70 14 47C17 21 44 22 50 31Z"/>',
    peach: '<path d="M50 21C57 27 87 29 87 57C87 78 70 92 50 92C30 92 13 78 13 57C13 29 43 27 50 21Z"/>',
    pear: '<path d="M50 22.8C57.8 22.8 61.7 28.7 62.7 37.5C63.6 47.2 71.5 52.1 76.3 60.9C82.5 72 75 92.5 50 92.5C25 92.5 17.5 72 23.7 60.9C28.6 52.1 36.4 47.2 37.3 37.5C38.3 28.7 42.2 22.8 50 22.8Z"/>',
    watermelon: '<circle cx="50" cy="55" r="36.5"/>',
    coconut: '<circle cx="50" cy="55" r="36.5"/>',
    pineapple: '<path d="M50 23C70 23 83 38 83 58C83 79 69 92 50 92C31 92 17 79 17 58C17 38 30 23 50 23Z"/>',
    dragonfruit: '<path d="M50 19C66 19 81.5 36 82.5 57C83.5 79 69 92.5 50 92.5C31 92.5 16.5 79 17.5 57C18.5 36 34 19 50 19Z"/>'
  };

  const stem = (d, w = 2.6) => `<path d="${d}" fill="none" stroke="${STEM}" stroke-width="${w}" stroke-linecap="round"/>`;
  const leaf = (x, y, a, s = 1) => `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})"><path d="M0 0C5-8 16-10 23-5C17 3 7 5 0 0Z" fill="${LEAF}" stroke="${LEAF_EDGE}" stroke-width="1.6" stroke-linejoin="round"/><path d="M3-1C9-3 14-4 18-4" fill="none" stroke="${LEAF_EDGE}" stroke-width="1.1" stroke-linecap="round"/></g>`;

  // inside = clipped to the body; top = drawn over the outline
  const DETAIL = {
    blueberry: f => ({
      // the calyx: a little five-pointed crown opening at the top
      inside: `<g transform="translate(50 27)"><path d="M0-7L2.2-2.6 7-2.2 3.4 1 4.6 6 0 3.4-4.6 6-3.4 1-7-2.2-2.2-2.6Z" fill="#4f5f9e" stroke="${f.edge}" stroke-width="1" stroke-linejoin="round"/><circle r="1.6" fill="#3d4a80"/></g>` +
        `<circle cx="66" cy="40" r="7" fill="#fff" opacity=".18"/>`
    }),
    cherry: f => ({
      inside: `<path d="M44 34Q50 38 56 34" fill="none" stroke="${f.edge}" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>`,
      top: stem('M50 34C50 24 54 13 63 5', 2.2)
    }),
    strawberry: f => ({
      inside: [[33, 46], [50, 43], [67, 46], [26, 58], [42, 57], [58, 57], [74, 58], [34, 70], [50, 70], [66, 70], [42, 82], [58, 82]]
        .map(([x, y]) => `<path d="M${x} ${y - 2.2}q1.6 2.4 0 4.4q-1.6-2 0-4.4z" fill="#ffe38c"/>`).join(''),
      top: `<path d="M50 31C45 33 35 33 28 28C33 26 38 25 41 25C37 21 35 18 36 14C41 16 46 19 50 23C54 19 59 16 64 14C65 18 63 21 59 25C62 25 67 26 72 28C65 33 55 33 50 31Z" fill="${LEAF}" stroke="${LEAF_EDGE}" stroke-width="1.5" stroke-linejoin="round"/>` + stem('M50 24V17', 2.4)
    }),
    plum: f => ({
      inside: `<path d="M51 22C57 28 61 35 62 44" fill="none" stroke="${f.edge}" stroke-width="2" stroke-linecap="round" opacity=".75"/>`,
      top: stem('M51 21C51 16 52 12 55 9', 2.4)
    }),
    tangerine: f => ({
      inside: [[38, 34], [46, 31], [56, 31], [64, 35], [30, 44], [72, 46], [26, 60], [76, 62], [34, 80], [66, 80]]
        .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1" fill="${f.edge}" opacity=".45"/>`).join(''),
      top: `<circle cx="50" cy="27" r="2.2" fill="#6e9a48" stroke="${LEAF_EDGE}" stroke-width="1"/>` + leaf(51, 25, -28, .75)
    }),
    apple: f => ({
      inside: `<path d="M44 29Q50 34 56 29" fill="none" stroke="${f.edge}" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>`,
      top: stem('M50 31C50 23 51 17 54 12') + leaf(53, 16, -30, .85)
    }),
    peach: f => ({
      inside: `<path d="M51 23C57 29 61 37 62 46" fill="none" stroke="${f.edge}" stroke-width="2.2" stroke-linecap="round" opacity=".85"/>`,
      top: leaf(50, 22, -150, .85)
    }),
    pear: f => ({
      inside: [[32, 80], [68, 80], [74, 70]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".8" fill="${f.edge}" opacity=".4"/>`).join(''),
      top: stem('M50 24C50 18 51 13 54 9') + leaf(53, 13, -22, .65)
    }),
    watermelon: f => ({
      inside: [-28, -14, 0, 14, 28].map(dx =>
        `<path d="M${50 + dx * .6} 15C${50 + dx * 1.15 - 4} 30 ${50 + dx * 1.15 + 4} 45 ${50 + dx * 1.2} 55S${50 + dx * 1.15 - 4} 80 ${50 + dx * .6} 95" fill="none" stroke="#3f8f45" stroke-width="5" stroke-linecap="round"/>`).join(''),
      top: `<circle cx="50" cy="19.5" r="2" fill="${STEM}"/>`
    }),
    coconut: f => {
      // a smooth shell with fine dark grain, and the coconut's three markings at the top
      const marks = `<g fill="#6b4529"><ellipse cx="50" cy="25" rx="2.4" ry="2.8"/><ellipse cx="44" cy="32" rx="2.4" ry="2.8"/><ellipse cx="56" cy="32" rx="2.4" ry="2.8"/></g>`;
      return { inside: coconutGrain() + marks };
    },
    pineapple: f => ({
      // criss-cross segments with a little dot in each diamond, and a spiky crown of leaves
      inside: [-36, -24, -12, 0, 12, 24, 36].map(o => `<path d="M${50 + o - 30} 20L${50 + o + 30} 96M${50 + o + 30} 20L${50 + o - 30} 96" stroke="${f.edge}" stroke-width="1.3" opacity=".5"/>`).join('') +
        [[50, 34], [38, 42], [62, 42], [28, 54], [72, 54], [30, 76], [70, 76], [42, 86], [58, 86]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.2" fill="${f.edge}" opacity=".55"/>`).join(''),
      top: `<g fill="${LEAF}" stroke="${LEAF_EDGE}" stroke-width="1.5" stroke-linejoin="round">` +
        `<path d="M41 26C35 20 30 15 27 10C34 12 40 16 45 22Z"/><path d="M59 26C65 20 70 15 73 10C66 12 60 16 55 22Z"/>` +
        `<path d="M45 25C42 17 41 10 42 3C47 8 50 15 50 22Z"/><path d="M55 25C58 17 59 10 58 3C53 8 50 15 50 22Z"/>` +
        `<path d="M47 25C47 16 49 8 50 1C52 8 53 16 53 25Z"/></g>`
    }),
    dragonfruit: f => {
      // a plump little dragon fruit: a few soft, curved leaves (bracts) grow out of the skin and point mostly
      // up, placed unevenly so it never reads as a flower or a sun. Each leaf is skin-pink where it leaves the
      // fruit and green at the tip, and has no line across its base, so it grows out of the body instead of
      // sitting on its edge. Three small ones on the front give it some roundness.
      const bract = (x, y, rot, len, w, bend) => {
        const id = 'db' + (uid++).toString(36);
        // the tip is a small rounded curl rather than a point
        const tl = w * .13;
        const left = `M${-w} 0C${-w * .95} ${-len * .45} ${bend * .4 - w * .35} ${-len * .8} ${bend - tl} ${-len + tl}Q${bend} ${-len - tl * .6} ${bend + tl} ${-len + tl * .9}`;
        const right = `C${bend * .5 + w * .3} ${-len * .7} ${w * .9} ${-len * .35} ${w} 0`;
        const shape = left + right + `Q0 ${w * .5} ${-w} 0Z`;
        return `<g transform="translate(${x} ${y}) rotate(${rot})"><clipPath id="${id}"><path d="${shape}"/></clipPath>` +
          `<path d="${shape}" fill="${f.base}"/>` +
          `<g clip-path="url(#${id})"><ellipse cx="${bend * .8}" cy="${-len * 1.05}" rx="${w * 1.5}" ry="${len * .56}" fill="${LEAF}"/></g>` +
          `<path d="${left}${right}" fill="none" stroke="${f.edge}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></g>`;
      };
      return {
        inside: bract(36, 40, -6, 12, 5.4, -2) + bract(30, 89, -14, 12, 5.6, -2) + bract(69, 88, 16, 11, 5.4, 2),
        top: bract(26, 46, -24, 18, 7.5, -3.5) + bract(22, 72, -30, 15, 7, -3) +
          bract(76, 54, 26, 17, 7.2, 3.5) + bract(77, 79, 34, 12.5, 6.2, 3) +
          bract(45, 23, -10, 16.5, 7, -3) + bract(58, 25, 16, 12, 6, 2.5)
      };
    }
  };

  // fine, curvy grain lines placed by hand so they look natural rather than even: different lengths,
  // spacing, lean and weight, like real husk fibres. Each follows the round shell (a meridian whose
  // position drifts a little from start to end) and none crosses the face or the three markings.
  function coconutGrain() {
    const R = 35, cx = 50, cy = 55;
    // [position at start, position at end (-1 left edge … 1 right edge), from y, to y, opacity, width]
    const strokes = [
      [-.93, -.86, 31, 79, .55, .8], [-.79, -.71, 25, 57, .7, .9], [-.69, -.63, 64, 88, .5, .8],
      [-.56, -.49, 33, 49, .7, .7], [-.45, -.39, 75, 90, .6, .9], [-.31, -.35, 39, 46, .45, .7],
      [-.17, -.11, 73, 86, .65, .8], [.04, .1, 77, 91, .5, .7], [.21, .17, 36, 47, .55, .8],
      [.27, .35, 72, 84, .7, .9], [.47, .57, 28, 50, .65, .8], [.59, .67, 70, 89, .7, .9],
      [.73, .81, 35, 72, .6, .8], [.88, .91, 45, 83, .5, .7]
    ];
    return strokes.map(([k0, k1, y0, y1, op, sw]) => {
      let d = '';
      for (let y = y0; y <= y1 + .01; y += 2) {
        const t = (y - y0) / (y1 - y0), k = k0 + (k1 - k0) * t;
        const w = Math.sqrt(Math.max(0, 1 - ((y - cy) / R) ** 2));
        d += (d ? 'L' : 'M') + (cx + k * R * w).toFixed(2) + ' ' + y.toFixed(2);
      }
      return `<path d="${d}" fill="none" stroke="#7f5434" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" opacity="${op}"/>`;
    }).join('');
  }

  // tiny dot eyes with a pinprick highlight and a small mouth, a little below the middle of the fruit
  const FACE_Y = { cherry: 61, strawberry: 56, tangerine: 60, peach: 59, pear: 65, pineapple: 60, dragonfruit: 61 };
  const SMILEY = new Set(['cherry', 'plum', 'peach', 'watermelon']);
  function face(f) {
    const cy = FACE_Y[f.id] ?? 58, s = f.face;
    // most fruit have dot eyes; a few have the closed, smiling ^ ^ eyes
    const eye = SMILEY.has(f.id)
      ? x => `<path d="M${x - 2.8} ${cy + 1}Q${x} ${cy - 2.6} ${x + 2.8} ${cy + 1}" fill="none" stroke="${FACE}" stroke-width="1.6" stroke-linecap="round"/>`
      : x => `<circle cx="${x}" cy="${cy}" r="2.5" fill="${FACE}"/><circle cx="${x + .8}" cy="${cy - .9}" r=".75" fill="#fff"/>`;
    const mouth = `<path d="M47.6 ${cy + 3.4}Q50 ${cy + 5.6} 52.4 ${cy + 3.4}" fill="none" stroke="${FACE}" stroke-width="1.5" stroke-linecap="round"/>`;
    const blush = f.blush ? `<ellipse cx="38.5" cy="${cy + 3.6}" rx="3.2" ry="1.8" fill="${f.blush}" opacity=".55"/><ellipse cx="61.5" cy="${cy + 3.6}" rx="3.2" ry="1.8" fill="${f.blush}" opacity=".55"/>` : '';
    return `<g transform="translate(50 ${cy}) scale(${s}) translate(-50 ${-cy})">${blush}${eye(42.5)}${eye(57.5)}${mouth}</g>`;
  }

  let uid = 0;
  function svg(tier, attrs = '') {
    const f = FRUITS[tier], id = 'fc' + (uid++).toString(36);
    const d = DETAIL[f.id](f), body = BODY[f.id];
    const sw = Math.max(1.5, Math.min(3.2, 2.2 * Math.sqrt(39 / f.r)));
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" ${attrs}>` +
      `<defs><clipPath id="${id}">${body}</clipPath></defs>` +
      (d.back || '') + `<g fill="${f.base}">${body}</g>` +
      `<g clip-path="url(#${id})">${d.inside || ''}<path d="M26 44C27 35 33 28 41 25" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" opacity=".45"/></g>` +
      `<g fill="none" stroke="${f.edge}" stroke-width="${sw}" stroke-linejoin="round">${body}</g>` +
      (d.top || '') + face(f) + `</svg>`;
  }

  function randomTier(rand = Math.random) {
    const total = SPAWN_WEIGHTS.reduce((a, b) => a + b, 0);
    let x = rand() * total;
    for (let i = 0; i < SPAWN_WEIGHTS.length; i++) { x -= SPAWN_WEIGHTS[i]; if (x < 0) return i; }
    return 0;
  }
  // the picture as an <img> for the page (the fruit order and the next box)
  const pic = (tier, attrs = '') => `<img src="${FRUITS[tier].img}" alt="${FRUITS[tier].name}" draggable="false" ${attrs}>`;
  root.FMFruits = { FRUITS, BODY_R, BODY_Y, SPAWN_WEIGHTS, svg, pic, randomTier, MAX_TIER: FRUITS.length - 1 };
})(typeof window !== 'undefined' ? window : globalThis);
