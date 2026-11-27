/* quiet time — fruitmerge: saving and resuming.
   One local key holds the chosen mode and a separate game for classic and for endless,
   so switching modes or refreshing never erases the other game. */
(function (root) {
  const KEY = 'lg-fruitmerge';
  function read() {
    try { const v = JSON.parse(localStorage.getItem(KEY)); return v && typeof v === 'object' ? v : {}; } catch { return {}; }
  }
  function write(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* storage full or blocked: keep playing */ } }

  function load() {
    const raw = read();
    const mode = raw.mode === 'endless' ? 'endless' : 'classic';
    return { mode, classic: raw.classic || null, endless: raw.endless || null };
  }
  // states: { classic, endless } live game objects (either may be missing)
  function save(mode, states) {
    const raw = read();
    raw.mode = mode;
    for (const m of ['classic', 'endless']) if (states[m]) raw[m] = root.FMGame.serialize(states[m]);
    write(raw);
  }
  function restore(saved, mode) { return root.FMGame.restore(saved[mode], mode) || root.FMGame.create(mode); }

  root.FMSave = { KEY, load, save, restore };
})(typeof window !== 'undefined' ? window : globalThis);
