/* quiet time — fruitmerge: fruit definitions and illustrations.
   The tier order, sizes, colours and shapes all live here, so a fruit can be retuned or redrawn
   without touching the physics or the game rules.
   r is the physics radius in world units (the basket is 460 units wide).

   The art is a sticker-style set: one bold ink outline, flat colour, a single soft highlight, and the
   same little face on every fruit (big sparkly eyes, tiny brows, an open smile, pink cheeks).
   Each illustration is an SVG on a 100 × 100 box. The fruit's body stays inside the collision
   circle (radius BODY_R around (50, BODY_Y)); only stems and leaves poke out above it. */
(function (root) {
  const BODY_R = 38, BODY_Y = 55;
  const INK = '#3a2e2b', CHEEK = '#f6a0ae', TONGUE = '#f2828f';
  const LEAF = '#8fcf7c', STEM = '#9a6f4c';

  const FRUITS = [
    { id: 'blueberry', name: 'blueberry', r: 15, points: 1, base: '#8fa8ea', shape: 'round', face: 1.55, faceY: 2, brows: false },
    { id: 'cherry', name: 'cherry', r: 20, points: 3, base: '#f27f93', shape: 'cherry', face: 1.4, faceY: 4, brows: false },
    { id: 'strawberry', name: 'strawberry', r: 26, points: 6, base: '#f6857c', shape: 'strawberry', face: 1.25, faceY: -1, brows: false },
    { id: 'plum', name: 'plum', r: 32, points: 10, base: '#b99ce6', shape: 'round', face: 1.15, faceY: 2, brows: true },
    { id: 'tangerine', name: 'tangerine', r: 39, points: 15, base: '#ffb066', shape: 'round', face: 1.08, faceY: 2, brows: true },
    { id: 'apple', name: 'apple', r: 47, points: 21, base: '#f4746c', shape: 'apple', face: 1.02, faceY: 3, brows: true },
    { id: 'peach', name: 'peach', r: 55, points: 28, base: '#ffbe9c', shape: 'peach', face: 1, faceY: 3, brows: true },
    { id: 'pear', name: 'pear', r: 63, points: 36, base: '#cde67e', shape: 'pear', face: .96, faceY: 9, brows: true },
    { id: 'watermelon', name: 'watermelon', r: 74, points: 45, base: '#8fd27e', shape: 'round', face: .96, faceY: 2, brows: true },
    { id: 'coconut', name: 'coconut', r: 86, points: 55, base: '#b2825a', shape: 'round', face: .96, faceY: 2, brows: true }
  ];
  // only the five smallest fruits are ever handed to the player; weights favour the little ones
  const SPAWN_WEIGHTS = [30, 26, 20, 14, 10];

  // body outlines, all inside the collision circle (centre 50,55, radius 38)
  const SHAPES = {
    round: 'M50 18A37 37 0 1 1 49.99 18Z',
    cherry: 'M50 31C43 21 15 24 15 52C15 76 32 92 50 92C68 92 85 76 85 52C85 24 57 21 50 31Z',
    strawberry: 'M50 23C71 21 87 32 86 50C85 70 66 91 50 92C34 91 15 70 14 50C13 32 29 21 50 23Z',
    apple: 'M50 31C56 22 83 21 86 47C89 70 71 92 59 91C55 90.5 53 89 50 89C47 89 45 90.5 41 91C29 92 11 70 14 47C17 21 44 22 50 31Z',
    peach: 'M50 20C57 27 87 28 87 56C87 77 70 92 50 92C30 92 13 77 13 56C13 28 43 27 50 20Z',
    pear: 'M50 21C61 21 65 31 65 40C65 48 84 57 84 72C84 85 69 92 50 92C31 92 16 85 16 72C16 57 35 48 35 40C35 31 39 21 50 21Z'
  };

  // a few flat details per fruit: `under` sits inside the body (clipped), `over` sits on top of it
  const leaf = (x, y, angle, s = 1) =>
    `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${s})"><path d="M0 0C5-9 17-11 25-5C18 4 7 6 0 0Z" fill="${LEAF}"/><path d="M3-1C9-3 15-4 20-4" fill="none" stroke-width="1.6"/></g>`;
  const stem = d => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${STEM}" stroke-width="3.2" stroke-linecap="round"/>`;
  const DETAILS = {
    blueberry: () => ({
      over: `<path d="M50 14l3 5.5 6 .8-4.4 4.2 1.1 6-5.7-2.9-5.7 2.9 1.1-6-4.4-4.2 6-.8z" fill="#5f74bd"/>`
    }),
    cherry: () => ({ over: stem('M50 30C51 20 56 11 64 6') + leaf(62, 9, -20, .7) }),
    strawberry: () => ({
      under: [[34, 46], [50, 42], [66, 46], [28, 60], [72, 60], [38, 80], [62, 80], [50, 86]]
        .map(([x, y]) => `<path d="M${x} ${y - 1.6}v3.2" stroke="#fff1d6" stroke-width="2.6" stroke-linecap="round"/>`).join(''),
      over: `<path d="M50 30C44 32 34 31 28 26C34 24 39 23 42 23C38 19 37 16 38 13C43 15 47 18 50 22C53 18 57 15 62 13C63 16 62 19 58 23C61 23 66 24 72 26C66 31 56 32 50 30Z" fill="${LEAF}"/>`
    }),
    plum: () => ({
      under: `<path d="M53 18C47 32 47 46 51 58" fill="none" stroke="#9378c9" stroke-width="2.6" stroke-linecap="round"/>`,
      over: stem('M51 19C51 14 52 10 55 7')
    }),
    tangerine: () => ({
      under: [[63, 30], [70, 36], [58, 26]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="#e0893e"/>`).join(''),
      over: stem('M50 19V12') + leaf(51, 14, -25, .85)
    }),
    apple: () => ({ over: stem('M50 30C50 22 51 16 54 11') + leaf(53, 15, -30, .9) }),
    peach: () => ({
      under: `<path d="M50 23C44 38 44 54 48 66" fill="none" stroke="#ef9a77" stroke-width="2.8" stroke-linecap="round"/>`,
      over: leaf(50, 21, -155, .9)
    }),
    pear: () => ({ over: stem('M50 21C50 16 51 12 54 8') + leaf(53, 12, -25, .75) }),
    watermelon: () => ({
      under: [-26, -9, 9, 26].map(dx =>
        `<path d="M${50 + dx} 16l${-4 - dx * .1} 9 ${6} 9 ${-6} 9 ${6} 9 ${-6} 9 ${6} 9 ${-6} 9 ${4 + dx * .1} 9" fill="none" stroke="#5aa25a" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>`).join(''),
      over: stem('M50 18V13')
    }),
    coconut: () => ({
      under: `<ellipse cx="50" cy="66" rx="25" ry="20" fill="#c99b72"/>`,
      // a few soft husk fibres on top instead of the shell's three holes (which read as extra eyes)
      under2: [[40, 27, -20], [50, 24, 0], [60, 27, 20], [33, 34, -35], [67, 34, 35]]
        .map(([x, y, a]) => `<path transform="translate(${x} ${y}) rotate(${a})" d="M-3 0q3-3 6 0" fill="none" stroke="#8c6040" stroke-width="2" stroke-linecap="round"/>`).join('')
    })
  };

  // the shared face: drawn around (50, 61) and scaled up a little on the small fruits
  function face(f) {
    const cy = 61 + (f.faceY || 0), s = f.face || 1;
    const eye = x => `<circle cx="${x}" cy="${cy - 3}" r="7.1" fill="${INK}"/>` +
      `<circle cx="${x + 2.3}" cy="${cy - 5.7}" r="2.8" fill="#fff"/><circle cx="${x - 2.5}" cy="${cy - .3}" r="1.15" fill="#fff"/>`;
    const brow = x => `<path d="M${x - 4.5} ${cy - 14}Q${x} ${cy - 17.5} ${x + 4.5} ${cy - 14}" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>`;
    const my = cy + 5;
    const mouth = `<path d="M44.6 ${my}Q50 ${my + 1.6} 55.4 ${my}Q55 ${my + 8.6} 50 ${my + 8.6}Q45 ${my + 8.6} 44.6 ${my}Z" fill="${INK}" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>` +
      `<path d="M46.6 ${my + 6.2}Q50 ${my + 3.4} 53.4 ${my + 6.2}Q52 ${my + 7.8} 50 ${my + 7.8}Q48 ${my + 7.8} 46.6 ${my + 6.2}Z" fill="${TONGUE}"/>`;
    const cheek = x => `<ellipse cx="${x}" cy="${my + 1}" rx="5" ry="3.3" fill="${CHEEK}"/>`;
    return `<g transform="translate(50 ${cy}) scale(${s}) translate(-50 ${-cy})">` +
      cheek(33) + cheek(67) + eye(39.5) + eye(60.5) + (f.brows ? brow(39.5) + brow(60.5) : '') + mouth + `</g>`;
  }

  let uid = 0;
  // the whole illustration for one tier as an SVG string
  function svg(tier, attrs = '') {
    const f = FRUITS[tier];
    const id = 'fm' + (uid++).toString(36);
    const d = (DETAILS[f.id] || (() => ({})))();
    const body = SHAPES[f.shape] || SHAPES.round;
    // the outline weight shrinks gently on bigger fruit so lines look alike across the basket
    const sw = Math.max(2.3, Math.min(5.4, 3.4 * Math.sqrt(39 / f.r)));
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" ${attrs}>` +
      `<defs><clipPath id="${id}"><path d="${body}"/></clipPath></defs>` +
      `<g stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round">` +
      `<path d="${body}" fill="${f.base}" stroke="none"/>` +
      `<g clip-path="url(#${id})" stroke="none">${d.under || ''}${d.under2 || ''}` +
      // one soft highlight, high on the left
      `<path d="M27 40C28 31 34 25 41 23" fill="none" stroke="#fff" stroke-width="4.2" stroke-linecap="round" opacity=".55"/></g>` +
      `<path d="${body}" fill="none"/>` +
      `<g stroke-width="${Math.max(2.2, sw * .8)}">${d.over || ''}</g>` +
      `</g>` + face(f) + `</svg>`;
  }

  function randomTier(rand = Math.random) {
    const total = SPAWN_WEIGHTS.reduce((a, b) => a + b, 0);
    let x = rand() * total;
    for (let i = 0; i < SPAWN_WEIGHTS.length; i++) { x -= SPAWN_WEIGHTS[i]; if (x < 0) return i; }
    return 0;
  }

  root.FMFruits = { FRUITS, BODY_R, BODY_Y, SPAWN_WEIGHTS, svg, randomTier, MAX_TIER: FRUITS.length - 1 };
})(typeof window !== 'undefined' ? window : globalThis);
