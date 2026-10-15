#!/usr/bin/env python3
"""
Interactive Web Sandbox Backend for pawnGO-Neural (sandbox branch).
Features:
- Free-form anarchy chess move support.
- Dual evaluation thermometer: switch between Stockfish 17.1 and pawnGO HCE engine!
- 8 Engines catalog (6 Neural Models + C++ pawnGO + Stockfish 17.1).
- Multi-engine comparison matrix: select multiple engines and compare their candidate moves & evaluations side-by-side.
- Clean external UCI connections configured via web/engines_config.json.
"""

import os
import sys
import json
import time
import subprocess
import chess
import chess.engine
import torch
import numpy as np
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List, Dict

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from models.policy_net import PolicyNet
from models.nnue_net import NNUENet

# Load engine paths from engines_config.json
CONFIG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "engines_config.json")
config = {
    "stockfish_path": "stockfish",
    "pawngo_path": "/home/maksim/Programming/Projects/finished/pawnGO/engine/build/pawnGO"
}
if os.path.exists(CONFIG_PATH):
    try:
        with open(CONFIG_PATH) as f:
            config.update(json.load(f))
    except Exception as e:
        print(f"Warning reading engines_config.json: {e}")

app = FastAPI(title="pawnGO-Neural Anarchy Sandbox")

STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
os.makedirs(STATIC_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# 8 Engines Catalog
MODELS_CATALOG = {
    "policy_pawngo_all": {"name": "Policy: pawnGO (All Moves)", "category": "neural_policy", "path": os.path.join(BASE_DIR, "models/policy_pawngo_all.pt")},
    "policy_pawngo_wins": {"name": "Policy: pawnGO (Wins Only)", "category": "neural_policy", "path": os.path.join(BASE_DIR, "models/policy_pawngo_wins.pt")},
    "policy_winner_only": {"name": "Policy: Grandmaster (Winners)", "category": "neural_policy", "path": os.path.join(BASE_DIR, "models/policy_winner_only.pt")},
    "nnue_pawngo_all": {"name": "NNUE: pawnGO (All Moves)", "category": "neural_nnue", "path": os.path.join(BASE_DIR, "models/nnue_pawngo_all.pt")},
    "nnue_pawngo_wins": {"name": "NNUE: pawnGO (Wins Only)", "category": "neural_nnue", "path": os.path.join(BASE_DIR, "models/nnue_pawngo_wins.pt")},
    "nnue_winner_only": {"name": "NNUE: Grandmaster (Winners)", "category": "neural_nnue", "path": os.path.join(BASE_DIR, "models/nnue_winner_only.pt")},
    "pawngo_cpp": {"name": "pawnGO (C++ Search Engine)", "category": "uci_engine", "path": config["pawngo_path"]},
    "stockfish": {"name": "Stockfish 17.1 (Grandmaster)", "category": "uci_engine", "path": config["stockfish_path"]}
}

loaded_models = {}

def get_loaded_model(model_id: str):
    if model_id not in MODELS_CATALOG:
        return None, None
    meta = MODELS_CATALOG[model_id]
    if meta["category"] == "uci_engine":
        return meta["category"], meta

    if model_id in loaded_models:
        return loaded_models[model_id], meta

    m_path = meta["path"]
    if os.path.exists(m_path):
        try:
            if meta["category"] == "neural_policy":
                m = PolicyNet(in_channels=16)
                m.load_state_dict(torch.load(m_path, map_location="cpu"))
                m.eval()
                loaded_models[model_id] = m
                return m, meta
            elif meta["category"] == "neural_nnue":
                m = NNUENet()
                m.load_state_dict(torch.load(m_path, map_location="cpu"))
                m.eval()
                loaded_models[model_id] = m
                return m, meta
        except Exception as e:
            print(f"Error loading {model_id}: {e}")
    return None, meta

# UCI Engine Process Handlers
sf_engine = None
pawngo_engine = None

def get_uci_engine(engine_name: str):
    global sf_engine, pawngo_engine
    if engine_name == "stockfish":
        if sf_engine is None:
            try:
                sf_engine = chess.engine.SimpleEngine.popen_uci(config["stockfish_path"])
                sf_engine.configure({"Threads": 1, "Hash": 16})
            except Exception as e:
                print(f"Stockfish UCI error: {e}")
                sf_engine = None
        return sf_engine
    elif engine_name in ("pawngo", "pawngo_cpp"):
        if pawngo_engine is None:
            try:
                pawngo_engine = chess.engine.SimpleEngine.popen_uci(config["pawngo_path"])
            except Exception as e:
                print(f"pawnGO UCI error: {e}")
                pawngo_engine = None
        return pawngo_engine
    return None

class EvaluateRequest(BaseModel):
    fen: str
    last_moved_color: Optional[str] = None  # "w" or "b"
    eval_engine: Optional[str] = "stockfish"  # "stockfish" or "pawngo"

class AIMoveRequest(BaseModel):
    fen: str
    model_id: str
    temperature: float = 0.0
    allow_illegal: bool = False
    last_moved_color: Optional[str] = None

class CompareEnginesRequest(BaseModel):
    fen: str
    engine_ids: List[str]
    allow_illegal: bool = False
    last_moved_color: Optional[str] = None

@app.get("/")
def read_root():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))

@app.get("/api/engines")
def list_engines():
    res = []
    for m_id, meta in MODELS_CATALOG.items():
        if meta["category"] == "uci_engine":
            ready = os.path.exists(meta["path"]) or meta["path"] == "stockfish"
        else:
            ready = os.path.exists(meta["path"])
        res.append({
            "id": m_id,
            "name": meta["name"],
            "category": meta["category"],
            "is_ready": ready
        })
    return res

def evaluate_anarchy_heuristic(fen: str) -> float:
    """Fallback evaluator for illegal positions (multiple kings, missing kings, etc.)"""
    piece_vals = {'p': 1.0, 'n': 3.2, 'b': 3.3, 'r': 5.0, 'q': 9.5, 'k': 20.0}
    placement = fen.split()[0]
    score = 0.0
    for char in placement:
        if char.lower() in piece_vals:
            val = piece_vals[char.lower()]
            score += val if char.isupper() else -val
    return max(-10.0, min(10.0, score))

@app.post("/api/evaluate")
def evaluate_position(req: EvaluateRequest):
    fen = req.fen.strip()
    parts = fen.split()

    if req.last_moved_color == "w":
        active_turn = "b"
    elif req.last_moved_color == "b":
        active_turn = "w"
    else:
        active_turn = parts[1] if len(parts) > 1 else "w"

    if len(parts) >= 2:
        parts[1] = active_turn
        adjusted_fen = " ".join(parts)
    else:
        adjusted_fen = f"{fen} {active_turn} - - 0 1"

    engine_name = req.eval_engine or "stockfish"
    engine = get_uci_engine(engine_name)

    eval_white = 0.0
    mate_score = None
    is_legal_board = True
    commentary = ""

    try:
        board = chess.Board(adjusted_fen)
        if board.is_valid() and engine is not None:
            # Query engine for 35ms (depth 10-12)
            limit = chess.engine.Limit(time=0.035, depth=10)
            info = engine.analyse(board, limit)
            score_obj = info.get("score")
            if score_obj:
                score_w = score_obj.white()
                if score_w.is_mate():
                    mate_val = score_w.mate()
                    mate_score = mate_val
                    eval_white = 10.0 if mate_val > 0 else -10.0
                    commentary = f"Mate in {abs(mate_val)}"
                else:
                    cp = score_w.score()
                    eval_white = max(-10.0, min(10.0, cp / 100.0))
                    commentary = f"{eval_white:+.2f} pawns"
        else:
            is_legal_board = False
            eval_white = evaluate_anarchy_heuristic(adjusted_fen)
            commentary = f"{eval_white:+.2f} (Anarchy Eval)"
    except Exception:
        is_legal_board = False
        eval_white = evaluate_anarchy_heuristic(adjusted_fen)
        commentary = f"{eval_white:+.2f} (Anarchy Eval)"

    thermometer_pct = max(0.0, min(100.0, (eval_white + 10.0) * 5.0))

    return {
        "fen": adjusted_fen,
        "engine_used": engine_name,
        "active_turn": active_turn,
        "eval_white": round(eval_white, 2),
        "mate_score": mate_score,
        "thermometer_pct": round(thermometer_pct, 1),
        "commentary": commentary,
        "is_legal_board": is_legal_board
    }

def compute_single_move(board: chess.Board, model_id: str, allow_illegal: bool = False, temperature: float = 0.0) -> Dict:
    t0 = time.time()
    model, meta = get_loaded_model(model_id)

    # 1. UCI Engines (Stockfish or pawnGO)
    if meta and meta["category"] == "uci_engine":
        eng_name = "stockfish" if model_id == "stockfish" else "pawngo"
        eng = get_uci_engine(eng_name)
        if eng and board.is_valid():
            try:
                res = eng.play(board, chess.engine.Limit(time=0.05, depth=10))
                if res.move:
                    dt_ms = int((time.time() - t0) * 1000)
                    return {
                        "engine_id": model_id,
                        "name": meta["name"],
                        "move": res.move.uci(),
                        "from_sq": chess.square_name(res.move.from_square),
                        "to_sq": chess.square_name(res.move.to_square),
                        "is_legal": True,
                        "duration_ms": dt_ms,
                        "eval": None
                    }
            except Exception as e:
                print(f"Error playing UCI {model_id}: {e}")

    # 2. Neural Policy
    if model is not None and meta and meta["category"] == "neural_policy":
        try:
            mv = model.select_move(board, temperature=temperature, legal_only=not allow_illegal)
            dt_ms = int((time.time() - t0) * 1000)
            is_leg = mv in board.legal_moves
            return {
                "engine_id": model_id,
                "name": meta["name"],
                "move": mv.uci(),
                "from_sq": chess.square_name(mv.from_square),
                "to_sq": chess.square_name(mv.to_square),
                "is_legal": is_leg,
                "duration_ms": dt_ms,
                "eval": None
            }
        except Exception as e:
            print(f"Error neural policy {model_id}: {e}")

    # 3. Neural NNUE
    if model is not None and meta and meta["category"] == "neural_nnue":
        try:
            mv = model.select_best_move(board, allow_illegal=allow_illegal)
            dt_ms = int((time.time() - t0) * 1000)
            if mv:
                score = model.evaluate_board(board)
                is_leg = mv in board.legal_moves
                return {
                    "engine_id": model_id,
                    "name": meta["name"],
                    "move": mv.uci(),
                    "from_sq": chess.square_name(mv.from_square),
                    "to_sq": chess.square_name(mv.to_square),
                    "is_legal": is_leg,
                    "duration_ms": dt_ms,
                    "eval": score
                }
        except Exception as e:
            print(f"Error neural nnue {model_id}: {e}")

    # Fallback (e.g. model not trained yet)
    dt_ms = int((time.time() - t0) * 1000)
    leg = list(board.legal_moves)
    if leg:
        m = leg[0]
        return {
            "engine_id": model_id,
            "name": meta["name"] if meta else model_id,
            "move": m.uci(),
            "from_sq": chess.square_name(m.from_square),
            "to_sq": chess.square_name(m.to_square),
            "is_legal": True,
            "duration_ms": dt_ms,
            "simulated": True
        }

    return {
        "engine_id": model_id,
        "name": meta["name"] if meta else model_id,
        "move": "e2e4",
        "from_sq": "e2",
        "to_sq": "e4",
        "is_legal": False,
        "duration_ms": dt_ms,
        "simulated": True
    }

@app.post("/api/ai_move")
def generate_ai_move(req: AIMoveRequest):
    fen = req.fen.strip()
    parts = fen.split()
    if req.last_moved_color == "w":
        active_turn = "b"
    elif req.last_moved_color == "b":
        active_turn = "w"
    else:
        active_turn = parts[1] if len(parts) > 1 else "w"

    if len(parts) >= 2:
        parts[1] = active_turn
        adjusted_fen = " ".join(parts)
    else:
        adjusted_fen = f"{fen} {active_turn} - - 0 1"

    board = chess.Board(adjusted_fen)
    res = compute_single_move(board, req.model_id, allow_illegal=req.allow_illegal, temperature=req.temperature)
    return res

@app.post("/api/compare_engines")
def compare_engines(req: CompareEnginesRequest):
    fen = req.fen.strip()
    parts = fen.split()
    if req.last_moved_color == "w":
        active_turn = "b"
    elif req.last_moved_color == "b":
        active_turn = "w"
    else:
        active_turn = parts[1] if len(parts) > 1 else "w"

    if len(parts) >= 2:
        parts[1] = active_turn
        adjusted_fen = " ".join(parts)
    else:
        adjusted_fen = f"{fen} {active_turn} - - 0 1"

    board = chess.Board(adjusted_fen)
    results = []
    for eng_id in req.engine_ids:
        res = compute_single_move(board, eng_id, allow_illegal=req.allow_illegal)
        results.append(res)
    return {"results": results}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    print(f"Starting pawnGO-Neural Sandbox on http://localhost:{port}")
    uvicorn.run("web.app:app", host="0.0.0.0", port=port, reload=True)
