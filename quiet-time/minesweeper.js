/* Quiet Time — Minesweeper. Local-only state, no external dependencies. */
const MS_LEVELS = {
  gentle: { rows: 9, cols: 9, mines: 10, title: 'gentle · 9 × 9' },
  thoughtful: { rows: 16, cols: 16, mines: 40, title: 'thoughtful · 16 × 16' },
  challenging: { rows: 16, cols: 30, mines: 99, title: 'challenging · 16 × 30' }
};
let ms = null;
let msFlagMode = false;
let msPressTimer = null;
let msLongPress = null;

function msNewGame(level = 'gentle') {
  const preset = MS_LEVELS[level] || MS_LEVELS.gentle;
  level = MS_LEVELS[level] ? level : 'gentle';
  ms = {
    level, rows: preset.rows, cols: preset.cols, mines: preset.mines,
    started: false, status: 'playing',
    board: Array.from({ length: preset.rows * preset.cols }, () => ({
      mine: false, adjacent: 0, revealed: false, flagged: false
    })),
    message: 'Choose a square to begin. Your first square is always safe.'
  };
  msSave();
}
function msSave() { storage.set('minesweeper', ms); }
function msLoad() {
  const saved = storage.get('minesweeper');
  if (saved && MS_LEVELS[saved.level] &&
      saved.rows === MS_LEVELS[saved.level].rows &&
      saved.cols === MS_LEVELS[saved.level].cols &&
      saved.mines === MS_LEVELS[saved.level].mines &&
      Array.isArray(saved.board) && saved.board.length === saved.rows * saved.cols &&
      ['playing', 'won', 'lost'].includes(saved.status)) {
    ms = saved;
  } else msNewGame();
}
function msNeighbors(i) {
  const row = Math.floor(i / ms.cols), col = i % ms.cols;
  const result = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const r = row + dr, c = col + dc;
      if (r >= 0 && r < ms.rows && c >= 0 && c < ms.cols) result.push(r * ms.cols + c);
    }
  }
  return result;
}
function msPlaceMines(firstIndex) {
  // Keep the first square *and its neighbors* mine-free so the game starts gently.
  const excluded = new Set([firstIndex, ...msNeighbors(firstIndex)]);
  const candidates = Array.from({ length: ms.board.length }, (_, i) => i)
    .filter(i => !excluded.has(i));
  for (let i = 0; i < ms.mines; i++) {
    const j = i + Math.floor(Math.random() * (candidates.length - i));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    ms.board[candidates[i]].mine = true;
  }
  ms.board.forEach((cell, i) => {
    cell.adjacent = msNeighbors(i).filter(j => ms.board[j].mine).length;
  });
  ms.started = true;
}
function msCheckWin() {
  if (ms.board.every(c => c.mine || c.revealed)) {
    ms.status = 'won';
    ms.board.forEach(c => { if (c.mine) c.flagged = true; });
    ms.message = 'Every safe square found. Beautifully done! ✿';
  }
}
function msReveal(i) {
  if (!ms || ms.status !== 'playing') return;
  const cell = ms.board[i];
  if (!cell || cell.flagged || cell.revealed) return;
  if (!ms.started) msPlaceMines(i);
  if (cell.mine) {
    ms.status = 'lost';
    ms.board.forEach(c => { if (c.mine) c.revealed = true; });
    ms.message = 'A mine! You can start a fresh little puzzle whenever you like.';
  } else {
    // Flood fill empty areas iteratively so large openings do not overflow the stack.
    const queue = [i];
    for (let head = 0; head < queue.length; head++) {
      const index = queue[head], current = ms.board[index];
      if (current.revealed || current.flagged || current.mine) continue;
      current.revealed = true;
      if (current.adjacent === 0) {
        for (const j of msNeighbors(index)) {
          const neighbor = ms.board[j];
          if (!neighbor.revealed && !neighbor.flagged && !neighbor.mine && !queue.includes(j)) queue.push(j);
        }
      }
    }
    ms.message = 'Take your time. Every number is a clue.';
    msCheckWin();
  }
  msSave(); msUpdate();
}
function msToggleFlag(i) {
  if (!ms || ms.status !== 'playing') return;
  const cell = ms.board[i];
  if (!cell || cell.revealed) return;
  // Limit flags to the total number of mines, to avoid accidental overflagging.
  const flags = ms.board.filter(c => c.flagged).length;
  if (!cell.flagged && flags >= ms.mines) {
    ms.message = 'All flags are placed. Remove a flag to move this one.';
  } else {
    cell.flagged = !cell.flagged;
    ms.message = cell.flagged ? 'Flag placed. ✿' : 'Flag removed.';
  }
  msSave(); msUpdate();
}
function drawMinesweeper() {
  msLoad(); msFlagMode = false;
  layout('Minesweeper', 'Little clues, one square at a time.', `
    <div class="ms-toolbar">
      <label for="msLevel">Difficulty</label>
      <select class="pill" id="msLevel">
        ${Object.entries(MS_LEVELS).map(([id, p]) => `<option value="${id}">${p.title}</option>`).join('')}
      </select>
      <button class="pill" id="msNew" type="button">new puzzle</button>
      <button class="pill" id="msFlag" type="button" aria-pressed="false">⚑ flag mode: off</button>
    </div>
    <div class="ms-status"><span id="msMinesLeft"></span><span id="msState"></span></div>
    <div class="ms-board-scroll" aria-label="Minesweeper game board, scroll horizontally for large puzzles">
      <div id="msBoard" class="ms-board" role="grid" aria-label="Minesweeper grid"></div>
    </div>
    <p id="msMessage" class="feedback ms-message" role="status" aria-live="polite"></p>
    <p class="tip">Click or tap to uncover a square. Numbers tell you how many mines touch it, including diagonally. Right-click on Mac, or use <strong>flag mode</strong> on a touch screen, to mark suspected mines. A long press also places a flag. The first reveal is always safe.</p>
  `);
  $('#msLevel').value = ms.level;
  $('#msLevel').onchange = e => {
    const value = e.target.value;
    if (confirm('Start a new Minesweeper puzzle?')) {
      msNewGame(value); msFlagMode = false; msUpdate();
    } else e.target.value = ms.level;
  };
  $('#msNew').onclick = () => {
    if (ms.status !== 'playing' || confirm('Start a new Minesweeper puzzle?')) {
      msNewGame(ms.level); msUpdate();
    }
  };
  $('#msFlag').onclick = () => { msFlagMode = !msFlagMode; msUpdate(); };
  const board = $('#msBoard');
  board.addEventListener('click', e => {
    const tile = e.target.closest('[data-ms]');
    if (!tile) return;
    const index = Number(tile.dataset.ms);
    if (msLongPress && msLongPress.index === index && Date.now() - msLongPress.time < 1000) {
      msLongPress = null;
      return;
    }
    if (msFlagMode) msToggleFlag(index); else msReveal(index);
  });
  board.addEventListener('contextmenu', e => {
    const tile = e.target.closest('[data-ms]');
    if (!tile) return;
    e.preventDefault();
    const index = Number(tile.dataset.ms);
    if (msLongPress && msLongPress.index === index && Date.now() - msLongPress.time < 1000) return;
    msToggleFlag(index);
  });
  board.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
    const tile = e.target.closest('[data-ms]');
    if (!tile) return;
    clearTimeout(msPressTimer);
    const index = Number(tile.dataset.ms);
    msPressTimer = setTimeout(() => {
      msLongPress = { index, time: Date.now() };
      msToggleFlag(index);
    }, 550);
  });
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) {
    board.addEventListener(ev, () => clearTimeout(msPressTimer));
  }
  msUpdate();
}
function msUpdate() {
  const board = $('#msBoard');
  if (!board || !ms) return;
  const flags = ms.board.filter(c => c.flagged).length;
  const safeRemaining = ms.board.filter(c => !c.mine && !c.revealed).length;
  $('#msLevel').value = ms.level;
  const flagButton = $('#msFlag');
  flagButton.textContent = `⚑ flag mode: ${msFlagMode ? 'on' : 'off'}`;
  flagButton.classList.toggle('active', msFlagMode);
  flagButton.setAttribute('aria-pressed', String(msFlagMode));
  $('#msMinesLeft').textContent = `⚑ ${ms.mines - flags} flags left`;
  $('#msState').textContent = ms.status === 'won' ? '✿ puzzle solved' :
    ms.status === 'lost' ? 'a fresh start awaits' : `${safeRemaining} safe squares left`;
  $('#msMessage').textContent = ms.message;
  const preferred = matchMedia('(max-width: 650px)').matches ? 31 : 35;
  board.style.setProperty('--ms-cell', `${preferred}px`);
  board.style.gridTemplateColumns = `repeat(${ms.cols}, var(--ms-cell))`;
  board.setAttribute('aria-rowcount', String(ms.rows));
  board.setAttribute('aria-colcount', String(ms.cols));
  board.innerHTML = ms.board.map((cell, i) => {
    const wrong = ms.status === 'lost' && cell.flagged && !cell.mine;
    const showMine = cell.mine && ms.status !== 'playing';
    const visible = cell.revealed || showMine;
    const label = wrong ? 'incorrect flag' : showMine ? 'mine' :
      cell.flagged ? 'flagged' : cell.revealed ? (cell.adjacent ? `${cell.adjacent} nearby mines` : 'clear') : 'covered';
    const classes = ['ms-cell', visible ? 'ms-open' : 'ms-covered', cell.flagged ? 'ms-flagged' : '',
      wrong ? 'ms-wrong' : '', showMine ? 'ms-mine' : '', cell.revealed && cell.adjacent ? `ms-n${cell.adjacent}` : ''].filter(Boolean).join(' ');
    const content = wrong ? '×' : cell.flagged ? '⚑' : showMine ? '✹' :
      cell.revealed && cell.adjacent ? String(cell.adjacent) : '';
    return `<button class="${classes}" type="button" role="gridcell" data-ms="${i}" aria-label="row ${Math.floor(i / ms.cols) + 1}, column ${i % ms.cols + 1}, ${label}" ${ms.status !== 'playing' ? 'disabled' : ''}>${content}</button>`;
  }).join('');
}
