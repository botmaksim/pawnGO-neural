// pawnGO-Neural Anarchy Chess Sandbox
// Vector SVG chess piece renderer, dual thermometers, and multi-engine comparative analysis.

const PIECE_SVGS = {
  // White pieces: light fill with dark outline
  'P': `<svg viewBox="0 0 45 45" class="svg-piece white-piece"><path d="m22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#f8fafc" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  'N': `<svg viewBox="0 0 45 45" class="svg-piece white-piece"><path d="m22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" fill="#f8fafc" stroke="#0f172a" stroke-width="1.5"/><path d="m24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0-.932 1.27-2 2-1 1-1.602 1.3-2 3-.5 1-1.036 1.41-2 2-1.002.6-1.5 1.5-1.5 2.5 0 2.5 2.5 3 2.5 3s1-2.5 3-2c1.5.38 2.5 2.5 4 2.5 2 0 4-1.5 4-1.5s2.5 1.5 4.5 1.5c3 0 5-1.5 5-1.5s2 1.5 4 1.5c2.5 0 3.5-1.5 3.5-1.5s1 1.5 3 1.5c3 0 4-2 4-2v-4.5c0-4-3-8-3-8s1-1 1-3c0-3-4-7-4-7z" fill="#f8fafc" stroke="#0f172a" stroke-width="1.5"/></svg>`,
  'B': `<svg viewBox="0 0 45 45" class="svg-piece white-piece"><g fill="#f8fafc" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round"><path d="m9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z"/><path d="m15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/><path d="m25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z"/><path d="M17.5 26h10M22.5 21v10" stroke="#0f172a" stroke-width="1.5"/></g></svg>`,
  'R': `<svg viewBox="0 0 45 45" class="svg-piece white-piece"><g fill="#f8fafc" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round"><path d="m9 39h27v-3H9v3z"/><path d="m12 36v-4h21v4H12z"/><path d="m14 29.5v-13h17v13H14z"/><path d="m14 16.5-3-6.5h23l-3 6.5H14z"/><path d="m11 10h4v4h-4zM20.5 10h4v4h-4zM30 10h4v4h-4z"/></g></svg>`,
  'Q': `<svg viewBox="0 0 45 45" class="svg-piece white-piece"><g fill="#f8fafc" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round"><path d="m8 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM24.5 7.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM41 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM16 8.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM33 8.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0z"/><path d="m9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-13.5V25l-7-11 2 12z"/><path d="m9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 21 1 28 0 0 0 2-1 .5-2.5 0 0 0-1.5-1.5-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"/><path d="m11 38.5h23"/></g></svg>`,
  'K': `<svg viewBox="0 0 45 45" class="svg-piece white-piece"><g fill="#f8fafc" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round"><path d="m22.5 11.63V6M20 8h5"/><path d="m22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"/><path d="m11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V23.5c-2.5-7.5-12-10.5-16-4-3 6 5 10.5 5 10.5v7z"/><path d="m11.5 30c5.5-3 15.5-3 21 0M11.5 33.5c5.5-3 15.5-3 21 0M11.5 37c5.5-3 15.5-3 21 0"/></g></svg>`,

  // Black pieces: dark slate fill with light outline
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
        pieceContainer.draggable = true;
        pieceContainer.innerHTML = PIECE_SVGS[piece];

        pieceContainer.addEventListener("dragstart", (e) => {
          draggedPiece = piece;
          dragSourceSq = sq;
          e.dataTransfer.setData("text/plain", piece);
        });

        sqEl.appendChild(pieceContainer);
      }

      sqEl.addEventListener("dragover", (e) => e.preventDefault());
      sqEl.addEventListener("drop", (e) => {
        e.preventDefault();
        if (!draggedPiece) return;

        if (dragSourceSq) {
          delete boardState[dragSourceSq];
        }
        boardState[sq] = draggedPiece;
        lastMoveSq = sq;

        // Auto side-to-move detection: moved white piece -> black turn, moved black piece -> white turn
        const pieceColor = draggedPiece === draggedPiece.toUpperCase() ? 'w' : 'b';
        activeTurn = (pieceColor === 'w') ? 'b' : 'w';

        draggedPiece = null;
        dragSourceSq = null;

        renderBoard();
        triggerEvaluate(pieceColor);
      });

      sqEl.addEventListener("click", () => {
        if (selectedSq) {
          if (selectedSq !== sq) {
            const p = boardState[selectedSq];
            delete boardState[selectedSq];
            boardState[sq] = p;
            lastMoveSq = sq;
            const pColor = p === p.toUpperCase() ? 'w' : 'b';
            activeTurn = (pColor === 'w') ? 'b' : 'w';
            selectedSq = null;
            renderBoard();
            triggerEvaluate(pColor);
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
    const evalDetails = document.getElementById("evalDetails");
    const legalityIndicator = document.getElementById("legalityIndicator");

    fillEl.style.height = `${data.thermometer_pct}%`;
    const scoreStr = data.eval_white >= 0 ? `+${data.eval_white.toFixed(2)}` : data.eval_white.toFixed(2);
    valEl.textContent = data.mate_score ? `M${data.mate_score}` : scoreStr;

    const engineLabel = data.engine_used === 'pawngo' ? 'pawnGO' : 'Stockfish';
    evalDetails.textContent = `${engineLabel}: ${data.commentary}`;

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

async function makeAiMove() {
  const modelId = document.getElementById("modelSelect").value;
  const allowIllegal = document.getElementById("chkAllowIllegal").checked;
  const aiComment = document.getElementById("aiComment");
  aiComment.textContent = "Computing move...";

  const fen = generateFen();
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

    if (!res.ok) throw new Error("Move API failed");
    const data = await res.json();

    const fromSq = data.from_sq;
    const toSq = data.to_sq;

    if (boardState[fromSq]) {
      const movedPiece = boardState[fromSq];
      delete boardState[fromSq];
      boardState[toSq] = movedPiece;
      lastMoveSq = toSq;

      const pColor = movedPiece === movedPiece.toUpperCase() ? 'w' : 'b';
      activeTurn = (pColor === 'w') ? 'b' : 'w';

      renderBoard();
      triggerEvaluate(pColor);
      aiComment.textContent = `${data.name}: ${fromSq} -> ${toSq} (${data.duration_ms}ms) [${data.is_legal ? 'Legal' : 'Illegal'}]`;
    } else {
      aiComment.textContent = `${data.name} attempted ${data.move}, but square ${fromSq} was empty`;
    }
  } catch (e) {
    aiComment.textContent = `Error: ${e.message}`;
  }
}

async function compareSelectedEngines() {
  const checkedBoxes = document.querySelectorAll(".cmp-engine-chk:checked");
  const engineIds = Array.from(checkedBoxes).map(cb => cb.value);
  if (engineIds.length === 0) {
    alert("Please select at least one engine to compare.");
    return;
  }

  const container = document.getElementById("comparisonResultsContainer");
  const tbody = document.getElementById("cmpTableBody");
  tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:12px; color:#93c5fd;">Calculating proposals across ${engineIds.length} engines...</td></tr>`;
  container.classList.remove("hidden");

  const fen = generateFen();
  const allowIllegal = document.getElementById("chkAllowIllegal").checked;

  try {
    const res = await fetch("/api/compare_engines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fen,
        engine_ids: engineIds,
        allow_illegal: allowIllegal
      })
    });

    if (!res.ok) throw new Error("Compare API failed");
    const data = await res.json();

    tbody.innerHTML = "";
    data.results.forEach(r => {
      const tr = document.createElement("tr");

      const tdName = document.createElement("td");
      tdName.textContent = r.name;
      tdName.style.fontWeight = "600";

      const tdMove = document.createElement("td");
      const badge = document.createElement("span");
      badge.className = `cmp-move-badge ${r.is_legal ? '' : 'illegal'}`;
      badge.textContent = `${r.from_sq} -> ${r.to_sq}`;
      tdMove.appendChild(badge);

      const tdEval = document.createElement("td");
      tdEval.textContent = r.eval !== null && r.eval !== undefined ? `${r.eval > 0 ? '+' : ''}${r.eval}` : '-';

      const tdTime = document.createElement("td");
      tdTime.textContent = `${r.duration_ms}ms`;
      tdTime.style.color = "#9ca3af";

      tr.appendChild(tdName);
      tr.appendChild(tdMove);
      tr.appendChild(tdEval);
      tr.appendChild(tdTime);

      tbody.appendChild(tr);
    });
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="4" style="color:#ef4444; padding:8px;">Error: ${e.message}</td></tr>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  parseFen(STARTING_FEN);
  renderPiecePalette();
  renderBoard();
  triggerEvaluate();

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

  document.getElementById("btnAiMove").addEventListener("click", makeAiMove);
  document.getElementById("btnCompareEngines").addEventListener("click", compareSelectedEngines);

  document.getElementById("btnFlipTurn").addEventListener("click", () => {
    activeTurn = (activeTurn === 'w') ? 'b' : 'w';
    renderBoard();
    triggerEvaluate();
  });

  document.getElementById("btnResetBoard").addEventListener("click", () => {
    parseFen(STARTING_FEN);
    lastMoveSq = null;
    selectedSq = null;
    renderBoard();
    triggerEvaluate();
  });

  document.getElementById("btnClearBoard").addEventListener("click", () => {
    boardState = {};
    lastMoveSq = null;
    selectedSq = null;
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
