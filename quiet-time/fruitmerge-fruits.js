/* quiet time — fruitmerge: fruit definitions and illustrations.
   The tier order, sizes, colours and faces all live in FM_FRUITS below, so a fruit can be
   retuned or redrawn without touching the physics or the game rules.
   r is the physics radius in world units (the basket is 420 units wide).
   Every illustration is a locally generated SVG on a 100 × 100 box whose round body is a
   circle of radius BODY_R centred at (50, BODY_Y); stems and leaves sit in the space above. */
(function (root) {
  const BODY_R = 38, BODY_Y = 55;

  const FRUITS = [
    { id: 'blueberry', name: 'blueberry', r: 15, points: 1, base: '#9aaedf', light: '#d3dcf5', dark: '#6676aa', eyes: 'happy', mouth: 'smile', face: 1.5 },
    { id: 'cherry', name: 'cherry', r: 20, points: 3, base: '#e2849e', light: '#f6c0cf', dark: '#a54b66', eyes: 'dot', mouth: 'smile', face: 1.35 },
    { id: 'strawberry', name: 'strawberry', r: 26, points: 6, base: '#f3a69d', light: '#fcd5cf', dark: '#c2665f', eyes: 'dot', mouth: 'cat', face: 1.22 },
    { id: 'plum', name: 'plum', r: 32, points: 10, base: '#c4abdd', light: '#e6dbf2', dark: '#8a70aa', eyes: 'happy', mouth: 'cat', face: 1.12 },
    { id: 'tangerine', name: 'tangerine', r: 39, points: 15, base: '#f6c28a', light: '#fde2bf', dark: '#c98a4c', eyes: 'dot', mouth: 'open', face: 1.05 },
    { id: 'apple', name: 'apple', r: 47, points: 21, base: '#ef9f8e', light: '#fbd0c4', dark: '#ba6556', eyes: 'dot', mouth: 'smile', face: 1 },
    { id: 'peach', name: 'peach', r: 55, points: 28, base: '#f8c6ad', light: '#fee5d7', dark: '#cf8c70', eyes: 'happy', mouth: 'smile', face: 1 },
    { id: 'pear', name: 'pear', r: 63, points: 36, base: '#d7de9c', light: '#f0f3cf', dark: '#98a45e', eyes: 'dot', mouth: 'o', face: 1 },
    { id: 'watermelon', name: 'watermelon', r: 74, points: 45, base: '#acd59f', light: '#d8eecf', dark: '#6e9a62', eyes: 'dot', mouth: 'open', face: .96 },
    { id: 'coconut', name: 'coconut', r: 86, points: 55, base: '#ac8763', light: '#d6b896', dark: '#6e5038', eyes: 'happy', mouth: 'smile', face: .96, ink: '#38271c', cheek: '#e7a29c' }
  ];
  // only the five smallest fruits are ever handed to the player; weights favour the little ones
  const SPAWN_WEIGHTS = [30, 26, 20, 14, 10];

  const INK = '#3d2c2c';
  const LEAF = '#a3c98f', LEAF_DARK = '#6f9a5f', STEM = '#8a6a4a';
  let uidCounter = 0;

  const leaf = (x, y, angle, s = 1) =>
    `<path transform="translate(${x} ${y}) rotate(${angle}) scale(${s})" d="M0 0c4-7 13-9 19-5c-4 7-12 9-19 5z" fill="${LEAF}" stroke="${LEAF_DARK}" stroke-width="2" stroke-linejoin="round"/>` +
    `<path transform="translate(${x} ${y}) rotate(${angle}) scale(${s})" d="M2 0c5-2 10-3 14-4" fill="none" stroke="${LEAF_DARK}" stroke-width="1.2" stroke-linecap="round" opacity=".7"/>`;
  const stem = (d, w = 3.2) => `<path d="${d}" fill="none" stroke="${STEM}" stroke-width="${w}" stroke-linecap="round"/>`;

  // fruit-specific details. clip = drawn inside the body circle; over = drawn on top (stems, leaves)
  const DETAILS = {
    blueberry: f => ({
      over: `<path d="M50 19.5l2.6 4.2 4.8.5-3.6 3.1 1 4.7-4.8-2.3-4.8 2.3 1-4.7-3.6-3.1 4.8-.5z" fill="${f.dark}" stroke="${f.dark}" stroke-width="1.6" stroke-linejoin="round" opacity=".9"/>`
    }),
    cherry: f => ({
      over: stem('M50 19c1-6 4-11 10-14') + leaf(58, 7, -18, .75)
    }),
    strawberry: f => ({
      clip: [[36, 44], [50, 40], [64, 45], [30, 58], [44, 56], [58, 57], [70, 60], [38, 72], [52, 74], [64, 71], [46, 86]]
        .map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.6" ry="2.4" fill="#fff4d6" opacity=".95"/>`).join(''),
      over: `<path d="M50 22c-5-2-11-3-16 0c4 2 7 3 9 5c-4 1-7 4-8 7c5 0 9-1 12-4c1 3 2 5 3 6c1-1 2-3 3-6c3 3 7 4 12 4c-1-3-4-6-8-7c2-2 5-3 9-5c-5-3-11-2-16 0z" fill="${LEAF}" stroke="${LEAF_DARK}" stroke-width="1.8" stroke-linejoin="round"/>` + stem('M50 22v-7', 2.8)
    }),
    plum: f => ({
      clip: `<path d="M52 18c-6 14-6 30 0 46" fill="none" stroke="${f.dark}" stroke-width="1.6" opacity=".35" stroke-linecap="round"/>`,
      over: stem('M51 19c0-5 1-8 3-11') + leaf(53, 11, -30, .7)
    }),
    tangerine: f => ({
      clip: [[30, 36], [42, 28], [66, 34], [74, 48], [26, 52], [72, 70], [30, 76], [58, 86], [44, 88], [80, 60]]
        .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.1" fill="${f.dark}" opacity=".35"/>`).join(''),
      over: `<circle cx="50" cy="19" r="3" fill="${LEAF_DARK}"/>` + leaf(51, 17, -24, .8)
    }),
    apple: f => ({
      clip: `<path d="M41 18.5q9 6 18 0" fill="none" stroke="${f.dark}" stroke-width="1.6" opacity=".5" stroke-linecap="round"/>`,
      over: stem('M50 21c0-6 1-10 4-14') + leaf(53, 13, -28, .95)
    }),
    peach: f => ({
      clip: `<path d="M50 18c-10 10-12 24-8 36" fill="none" stroke="${f.dark}" stroke-width="1.8" opacity=".38" stroke-linecap="round"/>`,
      over: leaf(50, 19, -150, .95) + leaf(50, 19, -30, .85)
    }),
    pear: f => ({
      // the neck is part of the outline, so it is drawn with the body below
      neck: `<ellipse cx="50" cy="26" rx="19" ry="16"/>`,
      over: stem('M50 11c0-4 1-7 3-9') + leaf(52, 5, -18, .7)
    }),
    watermelon: f => ({
      clip: [-30, -15, 0, 15, 30].map(dx =>
        `<path d="M${50 + dx} 14c${dx * .35 + 5} 10 ${dx * .35 - 5} 20 ${dx * .35} 30s${-dx * .1 + 5} 20 ${dx * .1} 30s${-dx * .2 - 5} 12 ${-dx * .45} 22" fill="none" stroke="#7aaa6c" stroke-width="5.5" stroke-linecap="round" opacity=".75"/>`).join(''),
      over: stem('M50 18c0-3 1-5 3-6', 2.6)
    }),
    coconut: f => ({
      clip: [[26, 40, 30], [36, 30, 10], [60, 28, -15], [72, 40, -35], [24, 62, 70], [78, 64, -70], [34, 82, 120], [64, 84, -120], [50, 92, 180]]
        .map(([x, y, rot]) => `<path transform="translate(${x} ${y}) rotate(${rot})" d="M-4 0q4-3 8 0M-3 3q3-2 6 0" fill="none" stroke="${f.light}" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>`).join('') +
        `<g fill="${f.dark}" opacity=".55"><circle cx="45" cy="24" r="2"/><circle cx="55" cy="24" r="2"/><circle cx="50" cy="31" r="2"/></g>`
    })
  };

  function face(f) {
    const ink = f.ink || INK, cheek = f.cheek || '#f29aa9', s = f.face || 1;
    const cy = BODY_Y + 4;
    let eyes;
    if (f.eyes === 'happy') {
      eyes = [41, 59].map(x => `<path d="M${x - 4} ${cy}q4-4.6 8 0" fill="none" stroke="${ink}" stroke-width="2.6" stroke-linecap="round"/>`).join('');
    } else {
      eyes = [41, 59].map(x => `<ellipse cx="${x}" cy="${cy}" rx="3.5" ry="4.3" fill="${ink}"/><circle cx="${x + 1.3}" cy="${cy - 1.6}" r="1.35" fill="#fff"/>`).join('');
    }
    const my = cy + 6;
    const mouth = {
      smile: `<path d="M46 ${my}q4 4 8 0" fill="none" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/>`,
      cat: `<path d="M44.6 ${my - .4}q2.7 3.2 5.4 0q2.7 3.2 5.4 0" fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
      open: `<path d="M46 ${my - .6}h8q0 5.6-4 5.6t-4-5.6z" fill="${ink}"/><path d="M47.6 ${my + 3.4}q2.4-2 4.8 0q-2.4 1.8-4.8 0z" fill="#f09aa6"/>`,
      o: `<ellipse cx="50" cy="${my + 1}" rx="2.4" ry="2.8" fill="${ink}"/>`
    }[f.mouth] || '';
    const blush = [32, 68].map(x => `<ellipse cx="${x}" cy="${my + 1}" rx="5.4" ry="3.2" fill="${cheek}" opacity=".6"/>`).join('');
    return `<g transform="translate(50 ${cy}) scale(${s}) translate(-50 ${-cy})">${blush}${eyes}${mouth}</g>`;
  }

  // the whole illustration for one tier as an SVG string
  function svg(tier, attrs = '') {
    const f = FRUITS[tier];
    const id = 'fm' + (uidCounter++).toString(36);
    const d = (DETAILS[f.id] || (() => ({})))(f);
    const body = `<circle cx="50" cy="${BODY_Y}" r="${BODY_R}"/>`;
    const shape = (d.neck || '') + body;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" ${attrs}>` +
      `<defs><radialGradient id="${id}g" gradientUnits="userSpaceOnUse" cx="38" cy="36" r="66"><stop offset="0" stop-color="${f.light}"/><stop offset=".5" stop-color="${f.base}"/><stop offset="1" stop-color="${f.dark}" stop-opacity=".85"/></radialGradient>` +
      `<clipPath id="${id}c">${shape}</clipPath></defs>` +
      // soft ground shadow, then a thick outline underneath so joined shapes share one outline
      `<ellipse cx="50" cy="${BODY_Y + BODY_R - 1}" rx="${BODY_R * .7}" ry="4" fill="#1d2b1f" opacity=".12"/>` +
      `<g fill="none" stroke="${f.dark}" stroke-width="5.4" stroke-linejoin="round">${shape}</g>` +
      `<g fill="url(#${id}g)">${shape}</g>` +
      `<g clip-path="url(#${id}c)">${d.clip || ''}` +
      `<ellipse cx="50" cy="${BODY_Y + BODY_R + 10}" rx="${BODY_R + 6}" ry="20" fill="${f.dark}" opacity=".14"/></g>` +
      `<ellipse cx="36" cy="${BODY_Y - 19}" rx="8.5" ry="5" fill="#fff" opacity=".5" transform="rotate(-32 36 ${BODY_Y - 19})"/>` +
      `<circle cx="29" cy="${BODY_Y - 9}" r="2" fill="#fff" opacity=".45"/>` +
      (d.over || '') + face(f) + `</svg>`;
  }

  function randomTier(rand = Math.random) {
    const total = SPAWN_WEIGHTS.reduce((a, b) => a + b, 0);
    let x = rand() * total;
    for (let i = 0; i < SPAWN_WEIGHTS.length; i++) { x -= SPAWN_WEIGHTS[i]; if (x < 0) return i; }
    return 0;
  }

  root.FMFruits = { FRUITS, BODY_R, BODY_Y, SPAWN_WEIGHTS, svg, randomTier, MAX_TIER: FRUITS.length - 1 };
})(typeof window !== 'undefined' ? window : globalThis);
