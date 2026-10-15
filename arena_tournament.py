#!/usr/bin/env python3
"""
Round-Robin Arena Tournament: pawnGO C++ vs 6 Legal Neural Models.
7 Participants:
  1. pawnGO_CPP               (C++ Alpha-Beta + PVS + TT)
  2. Policy_Wins              (PolicyNet trained on pawnGO wins, legal mode)
  3. Policy_All               (PolicyNet trained on all pawnGO moves, legal mode)
  4. Policy_Winner            (PolicyNet trained on tournament winners, legal mode)
  5. NNUE_Wins                (NNUENet trained on pawnGO wins, 1-ply search)
  6. NNUE_All                 (NNUENet trained on all pawnGO moves, 1-ply search)
  7. NNUE_Winner              (NNUENet trained on tournament winners, 1-ply search)

Rules:
  - 20 games per pair (10 as White, 10 as Black) across 21 unique pairs = 420 games total.
  - 20 diverse opening book lines to ensure variety and fairness.
  - Saves arena_tournament.pgn, arena_tournament.json, and ARENA_TOURNAMENT.md.
"""

import os
import sys
import time
import json
import itertools
from typing import Dict, List, Tuple, Optional
import multiprocessing as mp

import chess
import chess.pgn
import chess.engine
import torch
import numpy as np

PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(0, PROJECT_ROOT)

from models.policy_net import PolicyNet
from models.nnue_net import NNUENet
from models.legalizer import MoveLegalizer
from data.extract_pgn import board_to_planes

PAWNGO_BIN = "/home/maksim/Programming/Projects/finished/pawnGO/engine/build/pawnGO"

ENGINES_META = {
    "pawnGO_CPP": {
        "type": "uci",
        "path": PAWNGO_BIN,
        "name": "pawnGO C++ (Alpha-Beta)"
    },
    "Policy_Wins": {
        "type": "policy",
        "path": os.path.join(PROJECT_ROOT, "models/policy_pawngo_wins.pt"),
        "name": "Policy: pawnGO Wins"
    },
    "Policy_All": {
        "type": "policy",
        "path": os.path.join(PROJECT_ROOT, "models/policy_pawngo_all.pt"),
        "name": "Policy: pawnGO All"
    },
    "Policy_Winner": {
        "type": "policy",
        "path": os.path.join(PROJECT_ROOT, "models/policy_winner_only.pt"),
        "name": "Policy: Grandmaster Winners"
    },
    "NNUE_Wins": {
        "type": "nnue",
        "path": os.path.join(PROJECT_ROOT, "models/nnue_pawngo_wins.pt"),
        "name": "NNUE: pawnGO Wins"
    },
    "NNUE_All": {
        "type": "nnue",
        "path": os.path.join(PROJECT_ROOT, "models/nnue_pawngo_all.pt"),
        "name": "NNUE: pawnGO All"
    },
    "NNUE_Winner": {
        "type": "nnue",
        "path": os.path.join(PROJECT_ROOT, "models/nnue_winner_only.pt"),
        "name": "NNUE: Grandmaster Winners"
    }
}

ENGINE_KEYS = [
    "pawnGO_CPP",
    "Policy_Wins",
    "Policy_All",
    "Policy_Winner",
    "NNUE_Wins",
    "NNUE_All",
    "NNUE_Winner"
]

OPENING_BOOKS = [
    ["e2e4", "e7e5"],                         # 1. Open Game
    ["d2d4", "d7d5"],                         # 2. Closed Game
    ["e2e4", "c7c5"],                         # 3. Sicilian Defense
    ["e2e4", "e7e6"],                         # 4. French Defense
    ["e2e4", "c7c6"],                         # 5. Caro-Kann Defense
    ["d2d4", "g8f6"],                         # 6. Indian Defenses
    ["c2c4", "e7e5"],                         # 7. English Opening
    ["g1f3", "d7d5"],                         # 8. Reti Opening
    ["d2d4", "d7d5", "c2c4"],                 # 9. Queen's Gambit
    ["e2e4", "e7e5", "g1f3", "b8c6", "f1b5"], # 10. Ruy Lopez
    ["e2e4", "e7e5", "g1f3", "b8c6", "f1c4"], # 11. Italian Game
    ["e2e4", "c7c5", "g1f3", "d7d6", "d2d4"], # 12. Open Sicilian
    ["d2d4", "g8f6", "c2c4", "g7g6"],         # 13. King's Indian
    ["d2d4", "g8f6", "c2c4", "e7e6", "b1c3"], # 14. Nimzo/Queen's Indian
    ["e2e4", "e7e5", "d2d4"],                 # 15. Center Game
    ["c2c4", "c7c5"],                         # 16. Symmetrical English
    ["e2e4", "g8f6"],                         # 17. Alekhine Defense
    ["e2e4", "d7d6", "d2d4", "g8f6"],         # 18. Pirc Defense
    ["d2d4", "f7f5"],                         # 19. Dutch Defense
    ["g1f3", "g8f6", "c2c4", "e7e6"]          # 20. Catalan / Reti Setup
]

# Process-local engine cache for worker processes
_local_models = {}
_local_uci_engine = None

def get_process_engine(engine_key: str):
    global _local_models, _local_uci_engine

    if engine_key not in _local_models:
        meta = ENGINES_META[engine_key]
        etype = meta["type"]
        epath = meta["path"]

        if etype == "uci":
            if _local_uci_engine is None:
                try:
                    _local_uci_engine = chess.engine.SimpleEngine.popen_uci(epath)
                except Exception as e:
                    print(f"Failed to start UCI engine: {e}")
            _local_models[engine_key] = _local_uci_engine

        elif etype == "policy":
            model = PolicyNet(in_channels=16)
            if os.path.exists(epath):
                state = torch.load(epath, map_location="cpu")
                model.load_state_dict(state)
            model.eval()
            _local_models[engine_key] = model

        elif etype == "nnue":
            model = NNUENet()
            if os.path.exists(epath):
                state = torch.load(epath, map_location="cpu")
                model.load_state_dict(state)
            model.eval()
            _local_models[engine_key] = model

    return _local_models[engine_key]

def choose_move(engine_key: str, board: chess.Board) -> Optional[chess.Move]:
    meta = ENGINES_META[engine_key]
    etype = meta["type"]
    engine_obj = get_process_engine(engine_key)

    if etype == "uci":
        try:
            # 25ms move limit: highly responsive, grandmaster blitz caliber
            res = engine_obj.play(board, chess.engine.Limit(time=0.025))
            return res.move
        except Exception:
            legal = list(board.legal_moves)
            return legal[0] if legal else None

    elif etype == "policy":
        planes = torch.from_numpy(board_to_planes(board)).unsqueeze(0)
        with torch.no_grad():
            logits = engine_obj(planes)[0]
        move, is_legal, _ = MoveLegalizer.sample_move(logits, board, temperature=0.0, anarchy=False)
        return move if is_legal else list(board.legal_moves)[0]

    elif etype == "nnue":
        move = engine_obj.select_best_move(board, allow_illegal=False)
        return move if move else list(board.legal_moves)[0]

    return None

def play_single_game(args) -> Dict:
    game_idx, white_key, black_key, opening_moves = args
    torch.set_num_threads(1)

    board = chess.Board()
    # Apply opening book
    for uci_str in opening_moves:
        try:
            mv = chess.Move.from_uci(uci_str)
            if mv in board.legal_moves:
                board.push(mv)
        except Exception:
            pass

    max_moves = 120
    move_count = 0

    while not board.is_game_over(claim_draw=True) and move_count < max_moves:
        curr_engine = white_key if board.turn == chess.WHITE else black_key
        mv = choose_move(curr_engine, board)
        if mv is None or mv not in board.legal_moves:
            break
        board.push(mv)
        move_count += 1

    # Determine result
    res_str = board.result(claim_draw=True)
    if res_str == "*":
        res_str = "1/2-1/2"

    term_reason = "Move limit (120m)"
    if board.is_checkmate():
        term_reason = "Checkmate"
    elif board.is_stalemate():
        term_reason = "Stalemate"
    elif board.is_insufficient_material():
        term_reason = "Insufficient material"
    elif board.can_claim_threefold_repetition():
        term_reason = "Threefold repetition"
    elif board.can_claim_fifty_moves():
        term_reason = "50-move rule"

    # Export PGN
    pgn_game = chess.pgn.Game.from_board(board)
    pgn_game.headers["Event"] = "pawnGO-Neural Round-Robin Arena"
    pgn_game.headers["Round"] = str(game_idx)
    pgn_game.headers["White"] = ENGINES_META[white_key]["name"]
    pgn_game.headers["Black"] = ENGINES_META[black_key]["name"]
    pgn_game.headers["Result"] = res_str
    pgn_game.headers["Termination"] = term_reason

    return {
        "game_idx": game_idx,
        "white": white_key,
        "black": black_key,
        "result": res_str,
        "plies": len(board.move_stack),
        "termination": term_reason,
        "pgn": str(pgn_game)
    }

def run_arena_tournament(games_per_pair: int = 20, concurrency: int = 12):
    print("=" * 72)
    print("      pawnGO-Neural Round-Robin Arena Tournament (7 Contestants)      ")
    print("=" * 72)
    print(f"Contestants     : {len(ENGINE_KEYS)} Engines")
    for k in ENGINE_KEYS:
        print(f"  - {k:16s}: {ENGINES_META[k]['name']}")
    print(f"Games per Pair  : {games_per_pair} (10 as White, 10 as Black)")
    num_pairs = len(ENGINE_KEYS) * (len(ENGINE_KEYS) - 1) // 2
    total_games = num_pairs * games_per_pair
    print(f"Total Games     : {num_pairs} pairs x {games_per_pair} games = {total_games} games")
    print(f"Concurrency     : {concurrency} parallel worker processes")
    print("=" * 72)

    # Generate game tasks
    tasks = []
    game_idx = 1
    for e1, e2 in itertools.combinations(ENGINE_KEYS, 2):
        half = games_per_pair // 2
        # E1 White vs E2 Black (half games)
        for i in range(half):
            op = OPENING_BOOKS[i % len(OPENING_BOOKS)]
            tasks.append((game_idx, e1, e2, op))
            game_idx += 1
        # E2 White vs E1 Black (half games)
        for i in range(half):
            op = OPENING_BOOKS[i % len(OPENING_BOOKS)]
            tasks.append((game_idx, e2, e1, op))
            game_idx += 1

    start_time = time.time()
    results = []

    print(f"\n[TOURNAMENT LAUNCHED] Playing {total_games} games...")
    ctx = mp.get_context("spawn")
    with ctx.Pool(processes=concurrency) as pool:
        for i, res in enumerate(pool.imap_unordered(play_single_game, tasks), 1):
            results.append(res)
            if i % 20 == 0 or i == total_games:
                elapsed = time.time() - start_time
                speed = i / max(0.1, elapsed)
                print(f"  [{i:3d}/{total_games}] Games Finished ({speed:.1f} games/sec, elapsed {elapsed:.0f}s)")

    duration = time.time() - start_time
    print(f"\nTournament completed in {duration:.1f}s ({total_games / duration:.1f} games/sec)")

    # Aggregate Standings and Crosstable
    standings = {k: {"wins": 0, "draws": 0, "losses": 0, "points": 0.0, "played": 0} for k in ENGINE_KEYS}
    crosstable = {k1: {k2: {"wins": 0, "draws": 0, "losses": 0, "points": 0.0, "total": 0} for k2 in ENGINE_KEYS} for k1 in ENGINE_KEYS}

    all_pgn_texts = []
    for r in results:
        w = r["white"]
        b = r["black"]
        res = r["result"]
        all_pgn_texts.append(r["pgn"] + "\n\n")

        standings[w]["played"] += 1
        standings[b]["played"] += 1
        crosstable[w][b]["total"] += 1
        crosstable[b][w]["total"] += 1

        if res == "1-0":
            standings[w]["wins"] += 1
            standings[w]["points"] += 1.0
            standings[b]["losses"] += 1

            crosstable[w][b]["wins"] += 1
            crosstable[w][b]["points"] += 1.0
            crosstable[b][w]["losses"] += 1

        elif res == "0-1":
            standings[b]["wins"] += 1
            standings[b]["points"] += 1.0
            standings[w]["losses"] += 1

            crosstable[b][w]["wins"] += 1
            crosstable[b][w]["points"] += 1.0
            crosstable[w][b]["losses"] += 1

        elif res == "1/2-1/2":
            standings[w]["draws"] += 1
            standings[w]["points"] += 0.5
            standings[b]["draws"] += 1
            standings[b]["points"] += 0.5

            crosstable[w][b]["draws"] += 1
            crosstable[w][b]["points"] += 0.5
            crosstable[b][w]["draws"] += 1
            crosstable[b][w]["points"] += 0.5

    # Sort leaderboard by points descending
    ranked_keys = sorted(ENGINE_KEYS, key=lambda k: standings[k]["points"], reverse=True)

    # Save PGN
    pgn_path = os.path.join(PROJECT_ROOT, "arena_tournament.pgn")
    with open(pgn_path, "w", encoding="utf-8") as fp:
        fp.writelines(all_pgn_texts)
    print(f"All 420 games saved to: {pgn_path}")

    # Save JSON summary
    summary = {
        "total_games": total_games,
        "duration_sec": round(duration, 1),
        "standings": {k: standings[k] for k in ranked_keys},
        "crosstable": crosstable
    }
    json_path = os.path.join(PROJECT_ROOT, "arena_tournament.json")
    with open(json_path, "w", encoding="utf-8") as fp:
        json.dump(summary, fp, indent=2)
    print(f"Tournament results saved to: {json_path}")

    # Generate Markdown Report
    md_lines = [
        "# pawnGO-Neural Arena: Round-Robin Tournament (7 Contestants)\n",
        f"Round-Robin match tournament conducted between **pawnGO C++ engine** and **6 legal neural models**.\n",
        f"- **Total Games**: {total_games} (20 games per pair, 10 as White / 10 as Black)\n",
        f"- **Duration**: {duration:.1f}s ({total_games / duration:.1f} games/sec on {concurrency} cores)\n\n",
        "## Leaderboard & Final Standings\n\n",
        "| Rank | Engine | Played | Wins | Draws | Losses | Score (Pts) | Score % |\n",
        "| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: |\n"
    ]

    for rank, k in enumerate(ranked_keys, 1):
        st = standings[k]
        score_pct = (st["points"] / st["played"]) * 100 if st["played"] > 0 else 0.0
        md_lines.append(f"| **{rank}** | **{ENGINES_META[k]['name']}** | {st['played']} | {st['wins']} | {st['draws']} | {st['losses']} | **{st['points']:.1f}** | **{score_pct:.1f}%** |\n")

    md_lines.append("\n## Head-to-Head Crosstable\n\n")
    header = "| Contestant | " + " | ".join([f"**{i+1}**" for i in range(len(ranked_keys))]) + " | Total Pts |\n"
    divider = "| :--- | " + " | ".join([":---:" for _ in range(len(ranked_keys))]) + " | :---: |\n"
    md_lines.append(header)
    md_lines.append(divider)

    for i, k1 in enumerate(ranked_keys, 1):
        row = [f"**{i}. {ENGINES_META[k1]['name']}**"]
        for j, k2 in enumerate(ranked_keys, 1):
            if k1 == k2:
                row.append("—")
            else:
                pts = crosstable[k1][k2]["points"]
                tot = crosstable[k1][k2]["total"]
                row.append(f"{pts:.1f}/{tot}")
        row.append(f"**{standings[k1]['points']:.1f}**")
        md_lines.append("| " + " | ".join(row) + " |\n")

    md_report_path = os.path.join(PROJECT_ROOT, "ARENA_TOURNAMENT.md")
    with open(md_report_path, "w", encoding="utf-8") as fp:
        fp.writelines(md_lines)
    print(f"Markdown report generated at: {md_report_path}")

    # Print Standings to console
    print("\n" + "=" * 78)
    print("                       FINAL ARENA STANDINGS                          ")
    print("=" * 78)
    print(f"{'Rank':4s} | {'Engine':32s} | {'W':4s} | {'D':4s} | {'L':4s} | {'Points':8s} | {'Score %':7s}")
    print("-" * 78)
    for rank, k in enumerate(ranked_keys, 1):
        st = standings[k]
        score_pct = (st["points"] / st["played"]) * 100 if st["played"] > 0 else 0.0
        print(f"{rank:4d} | {ENGINES_META[k]['name']:32s} | {st['wins']:4d} | {st['draws']:4d} | {st['losses']:4d} | {st['points']:6.1f}/{st['played']:<3d} | {score_pct:6.1f}%")
    print("=" * 78)

if __name__ == "__main__":
    concurrency_arg = int(sys.argv[1]) if len(sys.argv) > 1 else 12
    games_arg = int(sys.argv[2]) if len(sys.argv) > 2 else 20
    run_arena_tournament(games_per_pair=games_arg, concurrency=concurrency_arg)
