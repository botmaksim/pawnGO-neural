// pawnGO-Neural Anarchy Chess Arena & Sandbox
// Automated Engine Matches, Chess Clocks, Time Controls, Move Replayer, PGN Import/Export & Branching.

const PIECE_SVGS = {
  'P': `<svg viewBox="0 0 45 45" class="svg-piece white-piece"><path d="m22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#f8fafc" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  'N': `<svg viewBox="0 0 45 45" class="svg-piece white-piece"><path d="m22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" fill="#f8fafc" stroke="#0f172a" stroke-width="1.5"/><path d="m24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0-.932 1.27-2 2-1 1-1.602 1.3-2 3-.5 1-1.036 1.41-2 2-1.002.6-1.5 1.5-1.5 2.5 0 2.5 2.5 3 2.5 3s1-2.5 3-2c1.5.38 2.5 2.5 4 2.5 2 0 4-1.5 4-1.5s2.5 1.5 4.5 1.5c3 0 5-1.5 5-1.5s2 1.5 4 1.5c2.5 0 3.5-1.5 3.5-1.5s1 1.5 3 1.5c3 0 4-2 4-2v-4.5c0-4-3-8-3-8s1-1 1-3c0-3-4-7-4-7z" fill="#f8fafc" stroke="#0f172a" stroke-width="1.5"/></svg>`,
  'B': `<svg viewBox="0 0 45 45" class="svg-piece white-piece"><g fill="#f8fafc" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round"><path d="m9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z"/><path d="m15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/><path d="m25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z"/><path d="M17.5 26h10M22.5 21v10" stroke="#0f172a" stroke-width="1.5"/></g></svg>`,
  'R': `<svg viewBox="0 0 45 45" class="svg-piece white-piece"><g fill="#f8fafc" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round"><path d="m9 39h27v-3H9v3z"/><path d="m12 36v-4h21v4H12z"/><path d="m14 29.5v-13h17v13H14z"/><path d="m14 16.5-3-6.5h23l-3 6.5H14z"/><path d="m11 10h4v4h-4zM20.5 10h4v4h-4zM30 10h4v4h-4z"/></g></svg>`,
  'Q': `<svg viewBox="0 0 45 45" class="svg-piece white-piece"><g fill="#f8fafc" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round"><path d="m8 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM24.5 7.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM41 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM16 8.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM33 8.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0z"/><path d="m9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-13.5V25l-7-11 2 12z"/><path d="m9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 21 1 28 0 0 0 2-1 .5-2.5 0 0 0-1.5-1.5-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"/><path d="m11 38.5h23"/></g></svg>`,
  'K': `<svg viewBox="0 0 45 45" class="svg-piece white-piece"><g fill="#f8fafc" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round"><path d="m22.5 11.63V6M20 8h5"/><path d="m22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"/><path d="m11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V23.5c-2.5-7.5-12-10.5-16-4-3 6 5 10.5 5 10.5v7z"/><path d="m11.5 30c5.5-3 15.5-3 21 0M11.5 33.5c5.5-3 15.5-3 21 0M11.5 37c5.5-3 15.5-3 21 0"/></g></svg>`,

  'p': `<svg viewBox="0 0 45 45" class="svg-piece black-piece"><path d="m22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#1e293b" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  'n': `<svg viewBox="0 0 45 45" class="svg-piece black-piece"><path d="m22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" fill="#1e293b" stroke="#cbd5e1" stroke-width="1.5"/><path d="m24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0-.932 1.27-2 2-1 1-1.602 1.3-2 3-.5 1-1.036 1.41-2 2-1.002.6-1.5 1.5-1.5 2.5 0 2.5 2.5 3 2.5 3s1-2.5 3-2c1.5.38 2.5 2.5 4 2.5 2 0 4-1.5 4-1.5s2.5 1.5 4.5 1.5c3 0 5-1.5 5-1.5s2 1.5 4 1.5c2.5 0 3.5-1.5 3.5-1.5s1 1.5 3 1.5c3 0 4-2 4-2v-4.5c0-4-3-8-3-8s1-1 1-3c0-3-4-7-4-7z" fill="#1e293b" stroke="#cbd5e1" stroke-width="1.5"/></svg>`,
  'b': `<svg viewBox="0 0 45 45" class="svg-piece black-piece"><g fill="#1e293b" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round"><path d="m9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z"/><path d="m15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/><path d="m25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z"/><path d="M17.5 26h10M22.5 21v10" stroke="#cbd5e1" stroke-width="1.5"/></g></svg>`,
  'r': `<svg viewBox="0 0 45 45" class="svg-piece black-piece"><g fill="#1e293b" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round"><path d="m9 39h27v-3H9v3z"/><path d="m12 36v-4h21v4H12z"/><path d="m14 29.5v-13h17v13H14z"/><path d="m14 16.5-3-6.5h23l-3 6.5H14z"/><path d="m11 10h4v4h-4zM20.5 10h4v4h-4zM30 10h4v4h-4z"/></g></svg>`,
  'q': `<svg viewBox="0 0 45 45" class="svg-piece black-piece"><g fill="#1e293b" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round"><path d="m8 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM24.5 7.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM41 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM16 8.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM33 8.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0z"/><path d="m9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-13.5V25l-7-11 2 12z"/><path d="m9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 21 1 28 0 0 0 2-1 .5-2.5 0 0 0-1.5-1.5-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"/><path d="m11 38.5h23"/></g></svg>`,
  'k': `<svg viewBox="0 0 45 45" class="svg-piece black-piece"><g fill="#1e293b" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round"><path d="m22.5 11.63V6M20 8h5"/><path d="m22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"/><path d="m11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V23.5c-2.5-7.5-12-10.5-16-4-3 6 5 10.5 5 10.5v7z"/><path d="m11.5 30c5.5-3 15.5-3 21 0M11.5 33.5c5.5-3 15.5-3 21 0M11.5 37c5.5-3 15.5-3 21 0"/></g></svg>`
};

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

let boardState = {};
let activeTurn = 'w';
let draggedPiece = null;
let dragSourceSq = null;
let lastMoveSq = null;
let selectedSq = null;
let activeThermoEngine = 'stockfish';

// Game History & Replayer
let gameHistory = []; // list of { fen, move, san, from_sq, to_sq, is_legal, engine_name, captured }
let currentHistoryIndex = -1;

// Prediction & Highlights
let currentPredictedMove = null;
let predictedFromSq = null;
let predictedToSq = null;

// Match Arena & Clock State
let isMatchRunning = false;
let matchInterval = null;
let clockInterval = null;
let whiteTimeMs = 180000;
let blackTimeMs = 180000;
let incMs = 1000;
let isFixedTime = false;
let fixedTimeMs = 200;

function parseFen(fen) {
  const parts = fen.split(' ');
  const placement = parts[0];
  activeTurn = parts[1] || 'w';
  boardState = {};

  const ranks = placement.split('/');
  for (let r = 0; r < 8; r++) {
    const rankNum = 8 - r;
    let fileIdx = 0;
    const rankStr = ranks[r];
    for (let i = 0; i < rankStr.length; i++) {
      const char = rankStr[i];
      if (!isNaN(char)) {
        fileIdx += parseInt(char, 10);
      } else {
        const fileChar = String.fromCharCode('a'.charCodeAt(0) + fileIdx);
        boardState[`${fileChar}${rankNum}`] = char;
        fileIdx++;
      }
    }
  }
}

function generateFen() {
  let placement = "";
  for (let r = 8; r >= 1; r--) {
    let emptyCount = 0;
    for (let f = 0; f < 8; f++) {
      const sq = `${String.fromCharCode('a'.charCodeAt(0) + f)}${r}`;
      const piece = boardState[sq];
      if (!piece) {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          placement += emptyCount;
          emptyCount = 0;
        }
        placement += piece;
      }
    }
    if (emptyCount > 0) {
      placement += emptyCount;
    }
    if (r > 1) placement += "/";
  }
  return `${placement} ${activeTurn} - - 0 1`;
}

function clearPredictionHighlights() {
  predictedFromSq = null;
  predictedToSq = null;
  currentPredictedMove = null;
  document.querySelectorAll(".square.predicted-from, .square.predicted-to").forEach(el => {
    el.classList.remove("predicted-from", "predicted-to");
  });
  const box = document.getElementById("aiPredictionBox");
  if (box) box.classList.add("hidden");
}

function highlightPredictionSquares() {
  document.querySelectorAll(".square.predicted-from, .square.predicted-to").forEach(el => {
    el.classList.remove("predicted-from", "predicted-to");
  });
  if (predictedFromSq) {
    const fromEl = document.querySelector(`.square[data-sq="${predictedFromSq}"]`);
    if (fromEl) fromEl.classList.add("predicted-from");
  }
  if (predictedToSq) {
    const toEl = document.querySelector(`.square[data-sq="${predictedToSq}"]`);
    if (toEl) toEl.classList.add("predicted-to");
  }
}

function renderBoard() {
  const boardEl = document.getElementById("board");
  boardEl.innerHTML = "";

  for (let r = 8; r >= 1; r--) {
    for (let f = 0; f < 8; f++) {
      const fileChar = String.fromCharCode('a'.charCodeAt(0) + f);
      const sq = `${fileChar}${r}`;
      const isLight = (f + r) % 2 !== 0;

      const sqEl = document.createElement("div");
      sqEl.className = `square ${isLight ? 'light' : 'dark'}`;
      sqEl.dataset.sq = sq;

      if (sq === lastMoveSq) sqEl.classList.add("last-move");
      if (sq === selectedSq) sqEl.classList.add("selected");
      if (sq === predictedFromSq) sqEl.classList.add("predicted-from");
      if (sq === predictedToSq) sqEl.classList.add("predicted-to");

      if (f === 7) {
        const rCoord = document.createElement("span");
        rCoord.className = "coord rank";
        rCoord.textContent = r;
        sqEl.appendChild(rCoord);
      }
      if (r === 1) {
        const fCoord = document.createElement("span");
        fCoord.className = "coord file";
        fCoord.textContent = fileChar;
        sqEl.appendChild(fCoord);
      }

      const piece = boardState[sq];
      if (piece && PIECE_SVGS[piece]) {
        const pieceContainer = document.createElement("div");
        pieceContainer.className = "piece-wrapper";
        pieceContainer.draggable = !isMatchRunning;
        pieceContainer.innerHTML = PIECE_SVGS[piece];

        pieceContainer.addEventListener("dragstart", (e) => {
          if (isMatchRunning) return;
          draggedPiece = piece;
          dragSourceSq = sq;
          e.dataTransfer.setData("text/plain", piece);
        });

        sqEl.appendChild(pieceContainer);
      }

      sqEl.addEventListener("dragover", (e) => e.preventDefault());
      sqEl.addEventListener("drop", (e) => {
        if (isMatchRunning) return;
        e.preventDefault();
        if (!draggedPiece) return;

        if (dragSourceSq) {
          applyMoveAndRecord(dragSourceSq, sq, `${dragSourceSq}->${sq}`, `${dragSourceSq}${sq}`, true, "Manual Move");
        } else {
          // Piece spawned from palette
          boardState[sq] = draggedPiece;
          lastMoveSq = sq;
          const pieceColor = draggedPiece === draggedPiece.toUpperCase() ? 'w' : 'b';
          activeTurn = (pieceColor === 'w') ? 'b' : 'w';
          clearPredictionHighlights();
          renderBoard();
          triggerEvaluate(pieceColor);
        }

        draggedPiece = null;
        dragSourceSq = null;
      });

      sqEl.addEventListener("click", () => {
        if (isMatchRunning) return;
        if (selectedSq) {
          if (selectedSq !== sq) {
            applyMoveAndRecord(selectedSq, sq, `${selectedSq}->${sq}`, `${selectedSq}${sq}`, true, "Manual Move");
            selectedSq = null;
            return;
          }
          selectedSq = null;
          renderBoard();
        } else if (boardState[sq]) {
          selectedSq = sq;
          renderBoard();
        }
      });

      boardEl.appendChild(sqEl);
    }
  }

  const currentFen = generateFen();
  document.getElementById("fenInput").value = currentFen;
  updateTurnIndicator();
  updateClockHighlight();
}

function renderPiecePalette() {
  const paletteEl = document.getElementById("piecePalette");
  if (!paletteEl) return;
  paletteEl.innerHTML = "";

  const whiteRow = document.createElement("div");
  whiteRow.className = "palette-row";
  ['P', 'N', 'B', 'R', 'Q', 'K'].forEach(p => {
    const el = document.createElement("div");
    el.className = "palette-piece";
    el.draggable = true;
    el.innerHTML = PIECE_SVGS[p];
    el.dataset.piece = p;
    el.addEventListener("dragstart", (e) => {
      draggedPiece = p;
      dragSourceSq = null;
      e.dataTransfer.setData("text/plain", p);
    });
    whiteRow.appendChild(el);
  });

  const blackRow = document.createElement("div");
  blackRow.className = "palette-row";
  ['p', 'n', 'b', 'r', 'q', 'k'].forEach(p => {
    const el = document.createElement("div");
    el.className = "palette-piece";
    el.draggable = true;
    el.innerHTML = PIECE_SVGS[p];
    el.dataset.piece = p;
    el.addEventListener("dragstart", (e) => {
      draggedPiece = p;
      dragSourceSq = null;
      e.dataTransfer.setData("text/plain", p);
    });
    blackRow.appendChild(el);
  });

  paletteEl.appendChild(whiteRow);
  paletteEl.appendChild(blackRow);
}

function updateTurnIndicator() {
  const turnEl = document.getElementById("turnIndicator");
  if (activeTurn === 'w') {
    turnEl.className = "turn-pill white-turn";
    turnEl.textContent = "White to Move";
  } else {
    turnEl.className = "turn-pill black-turn";
    turnEl.textContent = "Black to Move";
  }
}

function formatClock(ms) {
  if (ms <= 0) return "00:00.0";
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const tenths = Math.floor((ms % 1000) / 100);
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${tenths}`;
}

function updateClockDisplays() {
  document.getElementById("whiteClockTime").textContent = formatClock(whiteTimeMs);
  document.getElementById("blackClockTime").textContent = formatClock(blackTimeMs);
}

function updateClockHighlight() {
  const wCard = document.getElementById("whiteClock");
  const bCard = document.getElementById("blackClock");
  if (activeTurn === 'w') {
    wCard.classList.add("active-clock");
    bCard.classList.remove("active-clock");
  } else {
    bCard.classList.add("active-clock");
    wCard.classList.remove("active-clock");
  }
}

function setupTimeControl(tcValue) {
  if (tcValue === "bullet_1_05") {
    whiteTimeMs = 60000; blackTimeMs = 60000; incMs = 500; isFixedTime = false;
  } else if (tcValue === "blitz_3_1") {
    whiteTimeMs = 180000; blackTimeMs = 180000; incMs = 1000; isFixedTime = false;
  } else if (tcValue === "rapid_5_2") {
    whiteTimeMs = 300000; blackTimeMs = 300000; incMs = 2000; isFixedTime = false;
  } else if (tcValue === "fixed_200ms") {
    whiteTimeMs = 200; blackTimeMs = 200; incMs = 0; isFixedTime = true; fixedTimeMs = 200;
  } else if (tcValue === "fixed_500ms") {
    whiteTimeMs = 500; blackTimeMs = 500; incMs = 0; isFixedTime = true; fixedTimeMs = 500;
  } else {
    whiteTimeMs = 999000; blackTimeMs = 999000; incMs = 0; isFixedTime = false;
  }
  updateClockDisplays();
}

function startClockTicking() {
  stopClockTicking();
  if (document.getElementById("timeControlSelect").value === "unlimited") return;

  const tickRate = 100;
  clockInterval = setInterval(() => {
    if (!isMatchRunning) return;
    if (activeTurn === 'w') {
      whiteTimeMs = Math.max(0, whiteTimeMs - tickRate);
      if (whiteTimeMs <= 0) {
        stopMatch("0-1", "White forfeited on time (Flag fell)");
      }
    } else {
      blackTimeMs = Math.max(0, blackTimeMs - tickRate);
      if (blackTimeMs <= 0) {
        stopMatch("1-0", "Black forfeited on time (Flag fell)");
      }
    }
    updateClockDisplays();
  }, tickRate);
}

function stopClockTicking() {
  if (clockInterval) {
    clearInterval(clockInterval);
    clockInterval = null;
  }
}

let evalAbortController = null;
async function triggerEvaluate(lastMovedColor = null) {
  if (evalAbortController) {
    evalAbortController.abort();
  }
  evalAbortController = new AbortController();

  const fen = generateFen();
  try {
    const res = await fetch("/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fen,
        last_moved_color: lastMovedColor,
        eval_engine: activeThermoEngine
      }),
      signal: evalAbortController.signal
    });

    if (!res.ok) return;
    const data = await res.json();

    const fillEl = document.getElementById("thermometerFill");
    const valEl = document.getElementById("thermometerVal");
    const legalityIndicator = document.getElementById("legalityIndicator");

    fillEl.style.height = `${data.thermometer_pct}%`;
    const scoreStr = data.eval_white >= 0 ? `+${data.eval_white.toFixed(2)}` : data.eval_white.toFixed(2);
    valEl.textContent = data.mate_score ? `M${data.mate_score}` : scoreStr;

    if (data.is_legal_board) {
      legalityIndicator.className = "legality-pill legal";
      legalityIndicator.textContent = "Standard Board";
    } else {
      legalityIndicator.className = "legality-pill illegal";
      legalityIndicator.textContent = "Anarchy Board";
    }
  } catch (e) {
    if (e.name !== "AbortError") {
      console.error("Evaluation error:", e);
    }
  }
}

// Apply move with rollback & branching support
function applyMoveAndRecord(fromSq, toSq, san, moveUci, isLegal, engineName) {
  // If rewound to a previous position, truncate future history to start a new branch!
  if (currentHistoryIndex < gameHistory.length - 1) {
    gameHistory = gameHistory.slice(0, currentHistoryIndex + 1);
  }

  let p = boardState[fromSq];
  const captured = boardState[toSq] ? boardState[toSq] : null;
  delete boardState[fromSq];

  // Pawn promotion to Queen
  if (p === 'P' && toSq[1] === '8') p = 'Q';
  if (p === 'p' && toSq[1] === '1') p = 'q';

  boardState[toSq] = p;
  lastMoveSq = toSq;

  const pieceColor = (p === p.toUpperCase()) ? 'w' : 'b';
  activeTurn = (pieceColor === 'w') ? 'b' : 'w';

  const newFen = generateFen();

  gameHistory.push({
    fen: newFen,
    move: moveUci,
    san: san || moveUci,
    from_sq: fromSq,
    to_sq: toSq,
    is_legal: isLegal,
    engine_name: engineName || "Player",
    captured: captured
  });
  currentHistoryIndex = gameHistory.length - 1;

  clearPredictionHighlights();
  renderBoard();
  updateMoveHistoryUI();
  triggerEvaluate(pieceColor);
}

// Match Step execution
async function executeMatchStep() {
  const whiteEng = document.getElementById("matchWhiteEngine").value;
  const blackEng = document.getElementById("matchBlackEngine").value;
  const fen = generateFen();

  const historyFens = gameHistory.map(h => h.fen.split(' ')[0]);
  const moveCount = Math.floor(gameHistory.length / 2) + 1;

  try {
    const res = await fetch("/api/match/step", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fen,
        white_engine: whiteEng,
        black_engine: blackEng,
        move_count: moveCount,
        history_fens: historyFens
      })
    });

    if (!res.ok) throw new Error("Step API error");
    const data = await res.json();

    if (data.is_game_over) {
      stopMatch(data.result, data.termination_reason);
      return;
    }

    // Apply incremental clock
    if (!isFixedTime) {
      if (activeTurn === 'w') whiteTimeMs += incMs;
      else blackTimeMs += incMs;
    } else {
      if (activeTurn === 'w') whiteTimeMs = fixedTimeMs;
      else blackTimeMs = fixedTimeMs;
    }
    updateClockDisplays();

    // Record to history (respecting branching if user had rewound)
    if (currentHistoryIndex < gameHistory.length - 1) {
      gameHistory = gameHistory.slice(0, currentHistoryIndex + 1);
    }

    gameHistory.push({
      fen: data.fen,
      move: data.move,
      san: data.san || data.move,
      from_sq: data.from_sq,
      to_sq: data.to_sq,
      is_legal: data.is_legal,
      engine_name: data.engine_name,
      captured: data.captured
    });
    currentHistoryIndex = gameHistory.length - 1;

    parseFen(data.fen);
    lastMoveSq = data.to_sq;
    clearPredictionHighlights();
    renderBoard();
    updateMoveHistoryUI();
    triggerEvaluate();

    if (data.is_game_over) {
      stopMatch(data.result, data.termination_reason);
    }
  } catch (e) {
    console.error("Match step error:", e);
    stopMatch("*", `Error: ${e.message}`);
  }
}

function startMatch() {
  isMatchRunning = true;
  document.getElementById("btnStartMatch").disabled = true;
  document.getElementById("btnPauseMatch").disabled = false;
  document.getElementById("matchTerminationBanner").classList.add("hidden");

  startClockTicking();

  const delay = parseInt(document.getElementById("matchSpeedSlider").value, 10);
  matchInterval = setInterval(() => {
    if (!isMatchRunning) return;
    executeMatchStep();
  }, delay);
}

function pauseMatch() {
  isMatchRunning = false;
  document.getElementById("btnStartMatch").disabled = false;
  document.getElementById("btnPauseMatch").disabled = true;
  if (matchInterval) {
    clearInterval(matchInterval);
    matchInterval = null;
  }
  stopClockTicking();
}

function stopMatch(result, reason) {
  pauseMatch();
  const banner = document.getElementById("matchTerminationBanner");
  banner.classList.remove("hidden");
  document.getElementById("matchResultBadge").textContent = result;
  document.getElementById("matchReasonText").textContent = reason;
}

function updateMoveHistoryUI() {
  const container = document.getElementById("moveHistoryList");
  container.innerHTML = "";

  const branchPill = document.getElementById("branchNotice");
  if (currentHistoryIndex < gameHistory.length - 1 && currentHistoryIndex >= 0) {
    branchPill.classList.remove("hidden");
    branchPill.textContent = `Rewound (${currentHistoryIndex + 1}/${gameHistory.length}) - Next move branches`;
  } else if (currentHistoryIndex === -1 && gameHistory.length > 0) {
    branchPill.classList.remove("hidden");
    branchPill.textContent = `Rewound to Start (0/${gameHistory.length}) - Next move branches`;
  } else {
    branchPill.classList.add("hidden");
  }

  if (gameHistory.length === 0) {
    container.innerHTML = `<div class="empty-history-text">No moves recorded yet</div>`;
    document.getElementById("moveCounter").textContent = "Move 0 / 0";
    return;
  }

  for (let i = 0; i < gameHistory.length; i += 2) {
    const moveNum = Math.floor(i / 2) + 1;
    const wMove = gameHistory[i];
    const bMove = gameHistory[i + 1];

    const row = document.createElement("div");
    row.className = "move-row";

    const numSpan = document.createElement("span");
    numSpan.className = "move-num";
    numSpan.textContent = `${moveNum}.`;
    row.appendChild(numSpan);

    const wText = wMove.san || `${wMove.from_sq}->${wMove.to_sq}${wMove.is_legal ? '' : '*'}`;
    const wSpan = document.createElement("span");
    wSpan.className = `move-span ${i === currentHistoryIndex ? 'active' : ''}`;
    wSpan.textContent = wText;
    wSpan.addEventListener("click", () => jumpToHistory(i));
    row.appendChild(wSpan);

    if (bMove) {
      const bText = bMove.san || `${bMove.from_sq}->${bMove.to_sq}${bMove.is_legal ? '' : '*'}`;
      const bSpan = document.createElement("span");
      bSpan.className = `move-span ${i + 1 === currentHistoryIndex ? 'active' : ''}`;
      bSpan.textContent = bText;
      bSpan.addEventListener("click", () => jumpToHistory(i + 1));
      row.appendChild(bSpan);
    }

    container.appendChild(row);
  }

  document.getElementById("moveCounter").textContent = `Move ${currentHistoryIndex + 1} / ${gameHistory.length}`;
  container.scrollTop = container.scrollHeight;
}

function jumpToHistory(index) {
  if (index < 0 || index >= gameHistory.length) return;
  currentHistoryIndex = index;
  const state = gameHistory[index];
  parseFen(state.fen);
  lastMoveSq = state.to_sq;
  clearPredictionHighlights();
  renderBoard();
  updateMoveHistoryUI();
  triggerEvaluate();
}

function jumpToStart() {
  if (gameHistory.length === 0) return;
  parseFen(STARTING_FEN);
  currentHistoryIndex = -1;
  lastMoveSq = null;
  clearPredictionHighlights();
  renderBoard();
  updateMoveHistoryUI();
  triggerEvaluate();
}

// Next Move Predictor
async function predictNextMove() {
  clearPredictionHighlights();
  const modelId = document.getElementById("modelSelect").value;
  const allowIllegal = document.getElementById("chkAllowIllegal").checked;
  const fen = generateFen();
  const commentEl = document.getElementById("aiComment");
  commentEl.textContent = `Analyzing with ${modelId}...`;

  try {
    const res = await fetch("/api/ai_move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fen,
        model_id: modelId,
        allow_illegal: allowIllegal
      })
    });
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    currentPredictedMove = data;
    predictedFromSq = data.from_sq;
    predictedToSq = data.to_sq;

    const box = document.getElementById("aiPredictionBox");
    box.classList.remove("hidden");
    document.getElementById("predMoveSan").textContent = data.san || data.move;
    document.getElementById("predEngineTag").textContent = data.name;
    document.getElementById("predMoveUci").textContent = `${data.from_sq} -> ${data.to_sq}`;
    document.getElementById("predEval").textContent = (data.eval !== null && data.eval !== undefined) ?
      `Eval: ${data.eval > 0 ? '+' : ''}${Number(data.eval).toFixed(2)}` : '';
    document.getElementById("predTime").textContent = `${data.duration_ms}ms`;

    commentEl.textContent = `Predicted move: ${data.san || data.move} (${data.from_sq}->${data.to_sq}) by ${data.name} in ${data.duration_ms}ms`;

    highlightPredictionSquares();
  } catch (err) {
    commentEl.textContent = `Prediction failed: ${err.message}`;
  }
}

function playPredictedMove() {
  if (!currentPredictedMove) return;
  const { from_sq, to_sq, san, move, name, is_legal } = currentPredictedMove;
  applyMoveAndRecord(from_sq, to_sq, san || move, move, is_legal, name);
  clearPredictionHighlights();
}

async function executeSingleAiMove() {
  const modelId = document.getElementById("modelSelect").value;
  const allowIllegal = document.getElementById("chkAllowIllegal").checked;
  const fen = generateFen();
  const commentEl = document.getElementById("aiComment");
  commentEl.textContent = `Computing move with ${modelId}...`;

  try {
    const res = await fetch("/api/ai_move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fen, model_id: modelId, allow_illegal: allowIllegal })
    });
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    applyMoveAndRecord(data.from_sq, data.to_sq, data.san || data.move, data.move, data.is_legal, data.name);
    commentEl.textContent = `Played ${data.san || data.move} (${data.name}, ${data.duration_ms}ms)`;
    clearPredictionHighlights();
  } catch (err) {
    commentEl.textContent = `Engine move error: ${err.message}`;
  }
}

// Compare Engines
async function compareEngines() {
  const chks = document.querySelectorAll(".cmp-engine-chk:checked");
  const engineIds = Array.from(chks).map(c => c.value);
  if (engineIds.length === 0) {
    alert("Select at least one engine to compare.");
    return;
  }
  const fen = generateFen();
  const tbody = document.getElementById("cmpTableBody");
  tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text-muted);">Querying ${engineIds.length} engines in parallel...</td></tr>`;
  document.getElementById("comparisonResultsContainer").classList.remove("hidden");

  try {
    const res = await fetch("/api/compare_engines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fen, engine_ids: engineIds })
    });
    if (!res.ok) throw new Error("Comparison error");
    const data = await res.json();
    tbody.innerHTML = "";
    (data.results || []).forEach(r => {
      const tr = document.createElement("tr");
      const evalStr = (r.eval !== null && r.eval !== undefined) ? 
        (r.eval > 0 ? `+${r.eval.toFixed(2)}` : r.eval.toFixed(2)) : '-';
      const badgeClass = r.is_legal ? 'cmp-move-badge' : 'cmp-move-badge illegal';
      tr.innerHTML = `
        <td><strong>${r.name}</strong></td>
        <td><span class="${badgeClass}">${r.san || r.move}</span></td>
        <td>${evalStr}</td>
        <td>${r.duration_ms}ms</td>
      `;
      tr.style.cursor = "pointer";
      tr.title = "Click to preview this move";
      tr.addEventListener("click", () => {
        predictedFromSq = r.from_sq;
        predictedToSq = r.to_sq;
        currentPredictedMove = r;
        highlightPredictionSquares();
      });
      tbody.appendChild(tr);
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" style="color:#ef4444;">Error: ${err.message}</td></tr>`;
  }
}

// PGN Import & Export
function openPgnModal() {
  document.getElementById("pgnModal").classList.remove("hidden");
  document.getElementById("pgnTextInput").focus();
}

function closePgnModal() {
  document.getElementById("pgnModal").classList.add("hidden");
}

async function doImportPgn() {
  const pgnText = document.getElementById("pgnTextInput").value.trim();
  if (!pgnText) {
    alert("Please paste PGN text or choose a .pgn file first.");
    return;
  }
  try {
    const res = await fetch("/api/pgn/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pgn_text: pgnText })
    });
    if (!res.ok) throw new Error("Import failed");
    const data = await res.json();
    if (data.error) {
      alert("PGN Import error: " + data.error);
      return;
    }
    gameHistory = data.moves || [];
    const jumpToEnd = document.getElementById("chkPgnJumpToEnd").checked;
    const autoPredict = document.getElementById("chkPgnAutoPredict").checked;
    
    closePgnModal();

    if (gameHistory.length > 0) {
      if (jumpToEnd) {
        jumpToHistory(gameHistory.length - 1);
      } else {
        jumpToStart();
      }
    } else {
      parseFen(STARTING_FEN);
      currentHistoryIndex = -1;
      renderBoard();
      updateMoveHistoryUI();
      triggerEvaluate();
    }

    if (autoPredict) {
      predictNextMove();
    }
  } catch (err) {
    alert("Could not import PGN: " + err.message);
  }
}

async function exportPgnText() {
  if (gameHistory.length === 0) {
    alert("No moves to export as PGN.");
    return;
  }
  const headers = {
    "Event": "pawnGO-Neural Match Arena",
    "Site": "Localhost Sandbox",
    "Date": new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
    "Round": "1",
    "White": document.getElementById("matchWhiteEngine") ? document.getElementById("matchWhiteEngine").value : "Player White",
    "Black": document.getElementById("matchBlackEngine") ? document.getElementById("matchBlackEngine").value : "Player Black",
    "Result": document.getElementById("matchResultBadge") ? document.getElementById("matchResultBadge").textContent : "*"
  };
  try {
    const res = await fetch("/api/pgn/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ headers, moves: gameHistory })
    });
    if (!res.ok) throw new Error("Export API error");
    const data = await res.json();
    const blob = new Blob([data.pgn], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pawngo_game_${Date.now()}.pgn`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert("PGN export failed: " + err.message);
  }
}

// Save & Load Game JSON
function saveGameJson() {
  const payload = {
    white_engine: document.getElementById("matchWhiteEngine").value,
    black_engine: document.getElementById("matchBlackEngine").value,
    time_control: document.getElementById("timeControlSelect").value,
    result: document.getElementById("matchResultBadge").textContent,
    termination: document.getElementById("matchReasonText").textContent,
    history: gameHistory
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pawngo_match_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function loadGameJson(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.history && Array.isArray(data.history)) {
        gameHistory = data.history;
        currentHistoryIndex = gameHistory.length - 1;
        if (currentHistoryIndex >= 0) {
          parseFen(gameHistory[currentHistoryIndex].fen);
          lastMoveSq = gameHistory[currentHistoryIndex].to_sq;
        } else {
          parseFen(STARTING_FEN);
          lastMoveSq = null;
        }
        clearPredictionHighlights();
        renderBoard();
        updateMoveHistoryUI();
        triggerEvaluate();

        if (data.result && data.termination) {
          stopMatch(data.result, data.termination);
        }
      }
    } catch (err) {
      alert("Invalid game JSON file: " + err.message);
    }
  };
  reader.readAsText(file);
}

// Populate Engine Selectors
async function populateEngineSelectors() {
  try {
    const res = await fetch("/api/engines");
    if (!res.ok) return;
    const engines = await res.json();

    const mWhite = document.getElementById("matchWhiteEngine");
    const mBlack = document.getElementById("matchBlackEngine");
    const quickSel = document.getElementById("modelSelect");

    mWhite.innerHTML = "";
    mBlack.innerHTML = "";
    quickSel.innerHTML = "";

    engines.forEach(eng => {
      const optW = document.createElement("option");
      optW.value = eng.id;
      optW.textContent = eng.name;
      if (eng.id === "pawngo_cpp") optW.selected = true;
      mWhite.appendChild(optW);

      const optB = document.createElement("option");
      optB.value = eng.id;
      optB.textContent = eng.name;
      if (eng.id === "stockfish") optB.selected = true;
      mBlack.appendChild(optB);

      const optQ = document.createElement("option");
      optQ.value = eng.id;
      optQ.textContent = eng.name;
      if (eng.id === "policy_pawngo_wins_legal") optQ.selected = true;
      quickSel.appendChild(optQ);
    });
  } catch (e) {
    console.error("Error loading engines list:", e);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  parseFen(STARTING_FEN);
  renderPiecePalette();
  renderBoard();
  triggerEvaluate();
  populateEngineSelectors();
  setupTimeControl("blitz_3_1");

  // Tab switching
  document.getElementById("tabBtnSandbox").addEventListener("click", () => {
    document.getElementById("tabBtnSandbox").classList.add("active");
    document.getElementById("tabBtnMatch").classList.remove("active");
    document.getElementById("sandboxPanel").classList.remove("hidden");
    document.getElementById("matchPanel").classList.add("hidden");
  });

  document.getElementById("tabBtnMatch").addEventListener("click", () => {
    document.getElementById("tabBtnMatch").classList.add("active");
    document.getElementById("tabBtnSandbox").classList.remove("active");
    document.getElementById("matchPanel").classList.remove("hidden");
    document.getElementById("sandboxPanel").classList.add("hidden");
  });

  // Time control dropdown
  document.getElementById("timeControlSelect").addEventListener("change", (e) => {
    setupTimeControl(e.target.value);
  });

  // Speed slider
  document.getElementById("matchSpeedSlider").addEventListener("input", (e) => {
    document.getElementById("lblSpeedVal").textContent = `${e.target.value}ms`;
    if (isMatchRunning) {
      clearInterval(matchInterval);
      matchInterval = setInterval(() => {
        if (!isMatchRunning) return;
        executeMatchStep();
      }, parseInt(e.target.value, 10));
    }
  });

  // Match buttons
  document.getElementById("btnStartMatch").addEventListener("click", startMatch);
  document.getElementById("btnPauseMatch").addEventListener("click", pauseMatch);
  document.getElementById("btnStepMatch").addEventListener("click", executeMatchStep);

  // Replayer Navigation
  document.getElementById("btnReplayStart").addEventListener("click", jumpToStart);

  document.getElementById("btnReplayPrev").addEventListener("click", () => {
    if (currentHistoryIndex > 0) {
      jumpToHistory(currentHistoryIndex - 1);
    } else if (currentHistoryIndex === 0) {
      jumpToStart();
    }
  });

  document.getElementById("btnReplayNext").addEventListener("click", () => {
    if (currentHistoryIndex < gameHistory.length - 1) {
      jumpToHistory(currentHistoryIndex + 1);
    }
  });

  document.getElementById("btnReplayEnd").addEventListener("click", () => {
    if (gameHistory.length > 0) {
      jumpToHistory(gameHistory.length - 1);
    }
  });

  // Keyboard navigation for replaying and branching
  document.addEventListener("keydown", (e) => {
    if (["input", "textarea", "select"].includes(document.activeElement.tagName.toLowerCase())) {
      return;
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      document.getElementById("btnReplayPrev").click();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      document.getElementById("btnReplayNext").click();
    } else if (e.key === "Home") {
      e.preventDefault();
      document.getElementById("btnReplayStart").click();
    } else if (e.key === "End") {
      e.preventDefault();
      document.getElementById("btnReplayEnd").click();
    } else if (e.key === " ") {
      e.preventDefault();
      if (isMatchRunning) pauseMatch();
      else startMatch();
    }
  });

  // Prediction & AI Move Buttons
  document.getElementById("btnPredictNext").addEventListener("click", predictNextMove);
  document.getElementById("btnPlayPrediction").addEventListener("click", playPredictedMove);
  document.getElementById("btnAiMove").addEventListener("click", executeSingleAiMove);
  document.getElementById("btnCompareEngines").addEventListener("click", compareEngines);

  // PGN Import Modal
  document.getElementById("btnOpenPgnModal").addEventListener("click", openPgnModal);
  document.getElementById("btnClosePgnModal").addEventListener("click", closePgnModal);
  document.getElementById("btnCancelPgnModal").addEventListener("click", closePgnModal);
  document.getElementById("btnDoImportPgn").addEventListener("click", doImportPgn);
  document.getElementById("btnExportPgn").addEventListener("click", exportPgnText);

  document.getElementById("fileImportPgn").addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      document.getElementById("pgnFileName").textContent = file.name;
      const reader = new FileReader();
      reader.onload = (re) => {
        document.getElementById("pgnTextInput").value = re.target.result;
      };
      reader.readAsText(file);
    }
  });

  // Save / Load JSON
  document.getElementById("btnSaveGame").addEventListener("click", saveGameJson);
  document.getElementById("fileLoadGame").addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      loadGameJson(e.target.files[0]);
    }
  });

  // Thermometer source toggle
  document.getElementById("btnThermoSF").addEventListener("click", () => {
    activeThermoEngine = "stockfish";
    document.getElementById("btnThermoSF").classList.add("active");
    document.getElementById("btnThermoPawnGO").classList.remove("active");
    triggerEvaluate();
  });

  document.getElementById("btnThermoPawnGO").addEventListener("click", () => {
    activeThermoEngine = "pawngo";
    document.getElementById("btnThermoPawnGO").classList.add("active");
    document.getElementById("btnThermoSF").classList.remove("active");
    triggerEvaluate();
  });

  // Board Utils
  document.getElementById("btnFlipTurn").addEventListener("click", () => {
    activeTurn = (activeTurn === 'w') ? 'b' : 'w';
    clearPredictionHighlights();
    renderBoard();
    triggerEvaluate();
  });

  document.getElementById("btnResetBoard").addEventListener("click", () => {
    parseFen(STARTING_FEN);
    lastMoveSq = null;
    selectedSq = null;
    gameHistory = [];
    currentHistoryIndex = -1;
    clearPredictionHighlights();
    stopMatch("*", "Board reset");
    renderBoard();
    updateMoveHistoryUI();
    triggerEvaluate();
  });

  document.getElementById("btnClearBoard").addEventListener("click", () => {
    boardState = {};
    lastMoveSq = null;
    selectedSq = null;
    clearPredictionHighlights();
    renderBoard();
    triggerEvaluate();
  });

  document.getElementById("btnCopyFen").addEventListener("click", () => {
    const fen = document.getElementById("fenInput").value;
    navigator.clipboard.writeText(fen);
    const orig = document.getElementById("btnCopyFen").innerHTML;
    document.getElementById("btnCopyFen").textContent = "Copied!";
    setTimeout(() => document.getElementById("btnCopyFen").innerHTML = orig, 1200);
  });
});
