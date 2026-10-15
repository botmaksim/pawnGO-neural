// pawnGO-Neural Anarchy Chess Sandbox (sandbox branch)
// Features: Free-form drag & drop, Dual Thermometers (Stockfish vs pawnGO), 8-engine Comparison

const PIECE_SYMBOLS = {
  'P': '♙', 'N': '♘', 'B': '♗', 'R': '♖', 'Q': '♕', 'K': '♔',
  'p': '♟', 'n': '♞', 'b': '♝', 'r': '♜', 'q': '♛', 'k': '♚'
};

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

let boardState = {};
let activeTurn = 'w'; // 'w' or 'b'
let draggedPiece = null;
let dragSourceSq = null;
let lastMoveSq = null;
let selectedSq = null;
let activeThermoEngine = 'stockfish'; // 'stockfish' or 'pawngo'

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
      if (piece) {
        const pieceEl = document.createElement("span");
        pieceEl.className = `piece ${piece === piece.toUpperCase() ? 'white-piece' : 'black-piece'}`;
        pieceEl.textContent = PIECE_SYMBOLS[piece];
        pieceEl.draggable = true;

        pieceEl.addEventListener("dragstart", (e) => {
          draggedPiece = piece;
          dragSourceSq = sq;
          e.dataTransfer.setData("text/plain", piece);
        });

        sqEl.appendChild(pieceEl);
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
      legalityIndicator.textContent = "Anarchy Board ⚠️";
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
      aiComment.textContent = `${data.name}: ${fromSq} ➔ ${toSq} (${data.duration_ms}ms) ${data.is_legal ? '✓' : '(Illegal ⚠️)'}`;
    } else {
      aiComment.textContent = `${data.name} attempted ${data.move}, but square ${fromSq} was empty!`;
    }
  } catch (e) {
    aiComment.textContent = `AI Error: ${e.message}`;
  }
}

async function compareSelectedEngines() {
  const checkedBoxes = document.querySelectorAll(".cmp-engine-chk:checked");
  const engineIds = Array.from(checkedBoxes).map(cb => cb.value);
  if (engineIds.length === 0) {
    alert("Please select at least one engine to compare!");
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
      badge.textContent = `${r.from_sq} ➔ ${r.to_sq}`;
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
  renderBoard();
  triggerEvaluate();

  // Palette dragging
  document.querySelectorAll(".palette-piece").forEach(el => {
    el.addEventListener("dragstart", (e) => {
      draggedPiece = el.dataset.piece;
      dragSourceSq = null;
      e.dataTransfer.setData("text/plain", draggedPiece);
    });
  });

  // Thermometer Source Toggle
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

  // Buttons
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
    const orig = document.getElementById("btnCopyFen").textContent;
    document.getElementById("btnCopyFen").textContent = "✓";
    setTimeout(() => document.getElementById("btnCopyFen").textContent = orig, 1200);
  });
});
