#!/usr/bin/env python3
"""
Interactive Web Sandbox Backend for pawnGO-Neural (sandbox branch).
Features:
- Free-form anarchy chess move support.
- Dual evaluation thermometer: switch between Stockfish 17.1 and pawnGO HCE engine.
- 14 Engines catalog (6 Neural Models x 2 Modes [Legal/Anarchy] + C++ pawnGO + Stockfish 17.1).
- 2-Engine automated Match Arena with custom Anarchy termination rules (Regicide, Annihilation, Stalemate, 3-Fold Repetition, Move Limits).
- Multi-engine comparison matrix.
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
from fastapi.responses import FileResponse, JSONResponse
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

# 14 Engine Variants Catalog
MODELS_CATALOG = {
    "pawngo_cpp": {"name": "pawnGO C++ (Alpha-Beta)", "category": "uci_engine", "path": config["pawngo_path"], "allow_illegal": False},
    "stockfish": {"name": "Stockfish 17.1 (Grandmaster)", "category": "uci_engine", "path": config["stockfish_path"], "allow_illegal": False},

    "policy_pawngo_all_legal": {"base_id": "policy_pawngo_all", "name": "Policy: pawnGO All (Legal)", "category": "neural_policy", "path": os.path.join(BASE_DIR, "models/policy_pawngo_all.pt"), "allow_illegal": False},
    "policy_pawngo_all_anarchy": {"base_id": "policy_pawngo_all", "name": "Policy: pawnGO All (Anarchy)", "category": "neural_policy", "path": os.path.join(BASE_DIR, "models/policy_pawngo_all.pt"), "allow_illegal": True},
    "policy_pawngo_wins_legal": {"base_id": "policy_pawngo_wins", "name": "Policy: pawnGO Wins (Legal)", "category": "neural_policy", "path": os.path.join(BASE_DIR, "models/policy_pawngo_wins.pt"), "allow_illegal": False},
    "policy_pawngo_wins_anarchy": {"base_id": "policy_pawngo_wins", "name": "Policy: pawnGO Wins (Anarchy)", "category": "neural_policy", "path": os.path.join(BASE_DIR, "models/policy_pawngo_wins.pt"), "allow_illegal": True},
    "policy_winner_only_legal": {"base_id": "policy_winner_only", "name": "Policy: Grandmaster (Legal)", "category": "neural_policy", "path": os.path.join(BASE_DIR, "models/policy_winner_only.pt"), "allow_illegal": False},
    "policy_winner_only_anarchy": {"base_id": "policy_winner_only", "name": "Policy: Grandmaster (Anarchy)", "category": "neural_policy", "path": os.path.join(BASE_DIR, "models/policy_winner_only.pt"), "allow_illegal": True},

    "nnue_pawngo_all_legal": {"base_id": "nnue_pawngo_all", "name": "NNUE: pawnGO All (Legal)", "category": "neural_nnue", "path": os.path.join(BASE_DIR, "models/nnue_pawngo_all.pt"), "allow_illegal": False},
    "nnue_pawngo_all_anarchy": {"base_id": "nnue_pawngo_all", "name": "NNUE: pawnGO All (Anarchy)", "category": "neural_nnue", "path": os.path.join(BASE_DIR, "models/nnue_pawngo_all.pt"), "allow_illegal": True},
    "nnue_pawngo_wins_legal": {"base_id": "nnue_pawngo_wins", "name": "NNUE: pawnGO Wins (Legal)", "category": "neural_nnue", "path": os.path.join(BASE_DIR, "models/nnue_pawngo_wins.pt"), "allow_illegal": False},
    "nnue_pawngo_wins_anarchy": {"base_id": "nnue_pawngo_wins", "name": "NNUE: pawnGO Wins (Anarchy)", "category": "neural_nnue", "path": os.path.join(BASE_DIR, "models/nnue_pawngo_wins.pt"), "allow_illegal": True},
    "nnue_winner_only_legal": {"base_id": "nnue_winner_only", "name": "NNUE: Grandmaster (Legal)", "category": "neural_nnue", "path": os.path.join(BASE_DIR, "models/nnue_winner_only.pt"), "allow_illegal": False},
    "nnue_winner_only_anarchy": {"base_id": "nnue_winner_only", "name": "NNUE: Grandmaster (Anarchy)", "category": "neural_nnue", "path": os.path.join(BASE_DIR, "models/nnue_winner_only.pt"), "allow_illegal": True}
}

loaded_models = {}

def get_loaded_model(model_key: str):
    if model_key not in MODELS_CATALOG:
        return None, None
    meta = MODELS_CATALOG[model_key]
    if meta["category"] == "uci_engine":
        return meta["category"], meta

    cache_key = meta.get("base_id", model_key)
    if cache_key in loaded_models:
        return loaded_models[cache_key], meta

    m_path = meta["path"]
    if os.path.exists(m_path):
        try:
            if meta["category"] == "neural_policy":
                m = PolicyNet(in_channels=16)
                m.load_state_dict(torch.load(m_path, map_location="cpu"))
                m.eval()
                loaded_models[cache_key] = m
                return m, meta
            elif meta["category"] == "neural_nnue":
                m = NNUENet()
                m.load_state_dict(torch.load(m_path, map_location="cpu"))
                m.eval()
                loaded_models[cache_key] = m
                return m, meta
        except Exception as e:
            print(f"Error loading {model_key}: {e}")
    return None, meta

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
    last_moved_color: Optional[str] = None
    eval_engine: Optional[str] = "stockfish"

class AIMoveRequest(BaseModel):
    fen: str
    model_id: str
    temperature: float = 0.0
    allow_illegal: Optional[bool] = None
    last_moved_color: Optional[str] = None

class CompareEnginesRequest(BaseModel):
    fen: str
    engine_ids: List[str]
    allow_illegal: bool = False
    last_moved_color: Optional[str] = None

class MatchStepRequest(BaseModel):
    fen: str
    white_engine: str
    black_engine: str
    move_count: int = 1
    history_fens: List[str] = []

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
            "allow_illegal": meta.get("allow_illegal", False),
            "is_ready": ready
        })
    return res

def evaluate_anarchy_heuristic(fen: str) -> float:
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

def compute_single_move(board: chess.Board, model_id: str, allow_illegal: Optional[bool] = None, temperature: float = 0.0) -> Dict:
    t0 = time.time()
    model, meta = get_loaded_model(model_id)
    if allow_illegal is None:
        allow_illegal = meta.get("allow_illegal", False) if meta else False

    # 1. UCI Engines
    if meta and meta["category"] == "uci_engine":
        eng_name = "stockfish" if model_id == "stockfish" else "pawngo"
        eng = get_uci_engine(eng_name)
        if eng and board.is_valid():
            try:
                res = eng.play(board, chess.engine.Limit(time=0.05, depth=10))
                if res.move:
                    dt_ms = int((time.time() - t0) * 1000)
                    san = board.san(res.move) if res.move in board.legal_moves else res.move.uci()
                    return {
                        "engine_id": model_id,
                        "name": meta["name"],
                        "move": res.move.uci(),
                        "san": san,
                        "from_sq": chess.square_name(res.move.from_square),
                        "to_sq": chess.square_name(res.move.to_square),
                        "is_legal": True,
                        "duration_ms": dt_ms,
                        "eval": None
                    }
            except Exception as e:
                print(f"UCI move error {model_id}: {e}")

    # 2. Neural Policy
    if model is not None and meta and meta["category"] == "neural_policy":
        try:
            mv = model.select_move(board, temperature=temperature, legal_only=not allow_illegal)
            dt_ms = int((time.time() - t0) * 1000)
            is_leg = mv in board.legal_moves
            san = board.san(mv) if is_leg else f"{chess.square_name(mv.from_square)}->{chess.square_name(mv.to_square)}*"
            return {
                "engine_id": model_id,
                "name": meta["name"],
                "move": mv.uci(),
                "san": san,
                "from_sq": chess.square_name(mv.from_square),
                "to_sq": chess.square_name(mv.to_square),
                "is_legal": is_leg,
                "duration_ms": dt_ms,
                "eval": None
            }
        except Exception as e:
            print(f"Policy move error {model_id}: {e}")

    # 3. Neural NNUE
    if model is not None and meta and meta["category"] == "neural_nnue":
        try:
            mv = model.select_best_move(board, allow_illegal=allow_illegal)
            dt_ms = int((time.time() - t0) * 1000)
            if mv:
                score = model.evaluate_board(board)
                is_leg = mv in board.legal_moves
                san = board.san(mv) if is_leg else f"{chess.square_name(mv.from_square)}->{chess.square_name(mv.to_square)}*"
                return {
                    "engine_id": model_id,
                    "name": meta["name"],
                    "move": mv.uci(),
                    "san": san,
                    "from_sq": chess.square_name(mv.from_square),
                    "to_sq": chess.square_name(mv.to_square),
                    "is_legal": is_leg,
                    "duration_ms": dt_ms,
                    "eval": score
                }
        except Exception as e:
            print(f"NNUE move error {model_id}: {e}")

    # Fallback
    dt_ms = int((time.time() - t0) * 1000)
    leg = list(board.legal_moves)
    if leg:
        m = leg[0]
        san = board.san(m)
        return {
            "engine_id": model_id,
            "name": meta["name"] if meta else model_id,
            "move": m.uci(),
            "san": san,
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
        "san": "e4*",
        "from_sq": "e2",
        "to_sq": "e4",
        "is_legal": False,
        "duration_ms": dt_ms,
        "simulated": True
    }

def check_game_termination(board: chess.Board, move_count: int, history_fens: List[str]) -> tuple:
    """
    Evaluates game termination conditions under both Standard and Anarchy Chess rules:
    - Regicide (King capture)
    - Total Annihilation (all pieces eliminated)
    - Checkmate & Stalemate (standard chess)
    - 3-Fold Repetition of board layout
    - Move Limit Exhaustion
    """
    piece_map = board.piece_map()
    white_has_king = any(p.piece_type == chess.KING and p.color == chess.WHITE for p in piece_map.values())
    black_has_king = any(p.piece_type == chess.KING and p.color == chess.BLACK for p in piece_map.values())

    # 1. Regicide
    if not white_has_king and not black_has_king:
        return True, "1/2-1/2", "Both kings captured (Mutual Annihilation)"
    if not white_has_king:
        return True, "0-1", "White King captured (Regicide)"
    if not black_has_king:
        return True, "1-0", "Black King captured (Regicide)"

    # 2. Total Annihilation
    white_pieces = [p for p in piece_map.values() if p.color == chess.WHITE]
    black_pieces = [p for p in piece_map.values() if p.color == chess.BLACK]
    if not white_pieces:
        return True, "0-1", "White pieces completely wiped out"
    if not black_pieces:
        return True, "1-0", "Black pieces completely wiped out"

    # 3. Standard Chess Rules (if board is valid)
    try:
        if board.is_valid():
            if board.is_checkmate():
                winner = "0-1" if board.turn == chess.WHITE else "1-0"
                winner_name = "Black" if board.turn == chess.WHITE else "White"
                return True, winner, f"Checkmate by {winner_name}"
            if board.is_stalemate():
                return True, "1/2-1/2", "Stalemate"
            if board.is_insufficient_material():
                return True, "1/2-1/2", "Draw by insufficient material"
    except Exception:
        pass

    # 4. 3-Fold Repetition
    curr_placement = board.fen().split()[0]
    if history_fens.count(curr_placement) >= 3:
        return True, "1/2-1/2", "Draw by 3-fold repetition"

    # 5. Move Count Limit
    if move_count >= 120:
        return True, "1/2-1/2", "Draw by move limit (120 full moves)"

    return False, "*", ""

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

@app.post("/api/match/step")
def match_step(req: MatchStepRequest):
    fen = req.fen.strip()
    parts = fen.split()
    active_turn = parts[1] if len(parts) > 1 else "w"

    board = chess.Board(fen)

    # 1. Check if game already ended prior to move
    is_over, result, reason = check_game_termination(board, req.move_count, req.history_fens)
    if is_over:
        return {
            "fen": fen,
            "is_game_over": True,
            "result": result,
            "termination_reason": reason
        }

    # 2. Pick active engine
    current_engine_id = req.white_engine if active_turn == "w" else req.black_engine
    move_info = compute_single_move(board, current_engine_id)

    from_sq = chess.parse_square(move_info["from_sq"])
    to_sq = chess.parse_square(move_info["to_sq"])

    # 3. Apply move to board (works for both legal and anarchy moves)
    p = board.piece_at(from_sq)
    captured = board.piece_at(to_sq)

    # Handle queen promotion if pawn reaches last rank
    if p and p.piece_type == chess.PAWN:
        if (p.color == chess.WHITE and chess.square_rank(to_sq) == 7) or (p.color == chess.BLACK and chess.square_rank(to_sq) == 0):
            p = chess.Piece(chess.QUEEN, p.color)

    board.remove_piece_at(from_sq)
    board.set_piece_at(to_sq, p)

    # Flip turn
    next_turn = chess.BLACK if active_turn == "w" else chess.WHITE
    board.turn = next_turn
    if next_turn == chess.WHITE:
        board.fullmove_number += 1

    new_fen = board.fen()

    # 4. Check termination after move (e.g. King was captured on this turn!)
    is_over, result, reason = check_game_termination(board, req.move_count, req.history_fens + [new_fen.split()[0]])

    return {
        "fen": new_fen,
        "from_sq": move_info["from_sq"],
        "to_sq": move_info["to_sq"],
        "move": move_info["move"],
        "san": move_info.get("san", move_info["move"]),
        "is_legal": move_info["is_legal"],
        "engine_name": move_info["name"],
        "engine_id": current_engine_id,
        "captured": captured.symbol() if captured else None,
        "is_game_over": is_over,
        "result": result,
        "termination_reason": reason
    }

class PGNImportRequest(BaseModel):
    pgn_text: str

class PGNExportRequest(BaseModel):
    headers: Dict[str, str] = {}
    moves: List[Dict] = []

@app.post("/api/pgn/import")
def import_pgn_text(req: PGNImportRequest):
    import io
    pgn_io = io.StringIO(req.pgn_text.strip())
    game = chess.pgn.read_game(pgn_io)
    if game is None:
        return {"error": "Could not parse valid PGN text"}

    headers = dict(game.headers)
    moves_data = []
    board = game.board()

    for node in game.mainline():
        mv = node.move
        from_sq_name = chess.square_name(mv.from_square)
        to_sq_name = chess.square_name(mv.to_square)
        san = board.san(mv) if mv in board.legal_moves else mv.uci()
        is_leg = mv in board.legal_moves
        captured = board.piece_at(mv.to_square)

        board.push(mv)

        moves_data.append({
            "move": mv.uci(),
            "san": san,
            "from_sq": from_sq_name,
            "to_sq": to_sq_name,
            "fen": board.fen(),
            "is_legal": is_leg,
            "captured": captured.symbol() if captured else None,
            "engine_name": "PGN Import"
        })

    return {
        "headers": headers,
        "moves": moves_data,
        "total_moves": len(moves_data),
        "final_fen": board.fen()
    }

@app.post("/api/pgn/export")
def export_pgn_text(req: PGNExportRequest):
    game = chess.pgn.Game()
    for k, v in req.headers.items():
        game.headers[k] = v
    node = game
    board = game.board()
    for m_info in req.moves:
        try:
            mv = chess.Move.from_uci(m_info.get("move", ""))
            node = node.add_variation(mv)
            if mv in board.legal_moves:
                board.push(mv)
        except Exception:
            pass
    exporter = chess.pgn.StringExporter(headers=True, variations=True, comments=True)
    pgn_str = game.accept(exporter)
    return {"pgn": pgn_str}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    print(f"Starting pawnGO-Neural Sandbox on http://localhost:{port}")
    uvicorn.run("web.app:app", host="0.0.0.0", port=port, reload=True)
