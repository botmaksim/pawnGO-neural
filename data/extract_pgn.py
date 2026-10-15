#!/usr/bin/env python3
"""
Extract training samples from pawnGO tournament PGN benchmarks.
Features:
- Anti-endgame-skew filters (phase balancing, stride decimation, dead-draw skipping).
- Multiple target training modes:
    * 'pawngo-wins': strictly pawnGO moves in games pawnGO won (gold standard style).
    * 'pawngo-all': all pawnGO moves (behavior cloning avatar of pawnGO).
    * 'winner-only': moves of the winning side (pawnGO or Stockfish).
    * 'all': all moves from all games.
- 16-plane representation with piece density and move number context.
"""

import os
import sys
import glob
import re
import argparse
import chess
import chess.pgn
import numpy as np
from tqdm import tqdm

DEFAULT_BENCH_DIR = "/home/maksim/Programming/Projects/finished/pawnGO/engine/scripts/benchmarks"

def board_to_planes(board: chess.Board) -> np.ndarray:
    """
    Converts chess.Board to 16x8x8 binary/normalized numpy array (float32):
    Planes 0-5: White P, N, B, R, Q, K
    Planes 6-11: Black p, n, b, r, q, k
    Plane 12: Active color (1.0 for White, 0.0 for Black)
    Plane 13: Castling rights (White K/Q, Black K/Q)
    Plane 14: Remaining piece density (len(piece_map) / 32.0)
    Plane 15: Move progress (min(fullmove_number, 100) / 100.0)
    """
    planes = np.zeros((16, 8, 8), dtype=np.float32)
    piece_map = board.piece_map()

    for sq, piece in piece_map.items():
        r = sq // 8
        c = sq % 8
        plane_idx = piece.piece_type - 1
        if piece.color == chess.BLACK:
            plane_idx += 6
        planes[plane_idx, r, c] = 1.0

    if board.turn == chess.WHITE:
        planes[12, :, :] = 1.0

    if board.has_kingside_castling_rights(chess.WHITE):
        planes[13, 0, 0:4] = 1.0
    if board.has_queenside_castling_rights(chess.WHITE):
        planes[13, 0, 4:8] = 1.0
    if board.has_kingside_castling_rights(chess.BLACK):
        planes[13, 7, 0:4] = 1.0
    if board.has_queenside_castling_rights(chess.BLACK):
        planes[13, 7, 4:8] = 1.0

    # Global context planes for phase & piece density
    planes[14, :, :] = len(piece_map) / 32.0
    planes[15, :, :] = min(board.fullmove_number, 100) / 100.0

    return planes

def move_to_index(move: chess.Move) -> int:
    """Converts move to an integer in [0, 4095] (from_sq * 64 + to_sq)"""
    return move.from_square * 64 + move.to_square

def index_to_move(idx: int, board: chess.Board) -> chess.Move:
    """Converts integer index back to chess.Move with queen promotion inference"""
    from_sq = idx // 64
    to_sq = idx % 64
    move = chess.Move(from_sq, to_sq)
    if move in board.legal_moves:
        return move
    promo_move = chess.Move(from_sq, to_sq, promotion=chess.QUEEN)
    if promo_move in board.legal_moves:
        return promo_move
    return move

def classify_game_phase(board: chess.Board, move_num: int) -> str:
    """
    Classifies board state into 'opening', 'middlegame', or 'endgame'.
    """
    pieces = board.piece_map()
    piece_count = len(pieces)
    if move_num <= 12 and piece_count >= 28:
        return "opening"

    # Count major/minor piece material (excluding kings & pawns)
    non_king_major_minor = 0
    has_queens = False
    for p in pieces.values():
        if p.piece_type == chess.QUEEN:
            non_king_major_minor += 9
            has_queens = True
        elif p.piece_type == chess.ROOK:
            non_king_major_minor += 5
        elif p.piece_type in (chess.BISHOP, chess.KNIGHT):
            non_king_major_minor += 3

    # Endgame criteria: no queens and material <= 14, or total pieces <= 12
    if (not has_queens and non_king_major_minor <= 14) or piece_count <= 12:
        return "endgame"
    return "middlegame"

def parse_pgn_files(
    pgn_dir: str,
    output_file: str,
    target_mode: str = "winner-only",
    include_draws: bool = True,
    max_endgame_per_game: int = 12,
    filter_dead_draws: bool = True,
    max_games: int = None
):
    pgn_files = sorted(glob.glob(os.path.join(pgn_dir, "**/*.pgn"), recursive=True))
    if not pgn_files:
        print(f"No PGN files found in {pgn_dir}")
        return

    print(f"Found {len(pgn_files)} PGN files in {pgn_dir}")
    print(f"Target Mode               : {target_mode.upper()}")
    print(f"Include Drawn Games       : {include_draws}")
    print(f"Max Endgame Moves / Game  : {max_endgame_per_game}")
    print(f"Filter Dead Endgame Draws : {filter_dead_draws}")

    all_boards = []
    all_moves = []
    all_evals = []
    all_results = []

    phase_counts = {"opening": 0, "middlegame": 0, "endgame": 0}
    total_games_parsed = 0
    total_positions_extracted = 0

    for fpath in tqdm(pgn_files, desc="Processing PGN files"):
        try:
            with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                while True:
                    game = chess.pgn.read_game(f)
                    if game is None:
                        break

                    res_str = game.headers.get("Result", "*")
                    if res_str == "1-0":
                        result_val = 1.0
                        winning_color = chess.WHITE
                    elif res_str == "0-1":
                        result_val = 0.0
                        winning_color = chess.BLACK
                    elif res_str == "1/2-1/2":
                        result_val = 0.5
                        winning_color = None
                    else:
                        continue

                    white_name = game.headers.get("White", "").lower()
                    black_name = game.headers.get("Black", "").lower()
                    pawngo_color = None
                    if "pawngo" in white_name:
                        pawngo_color = chess.WHITE
                    elif "pawngo" in black_name:
                        pawngo_color = chess.BLACK

                    board = game.board()
                    endgame_positions_recorded = 0

                    for node in game.mainline():
                        move = node.move
                        turn = board.turn
                        move_num = board.fullmove_number

                        # 1. Check target filter (who are we training on?)
                        should_record = True
                        if target_mode == "winner-only":
                            if winning_color is not None and turn != winning_color:
                                should_record = False
                            # Draws are recorded for both sides if include_draws is True
                            elif winning_color is None and not include_draws:
                                should_record = False
                        elif target_mode in ("pawngo-wins", "pawngo-positive"):
                            is_positive = (winning_color == pawngo_color) or (include_draws and result_val == 0.5)
                            if pawngo_color is None or not is_positive or turn != pawngo_color:
                                should_record = False
                        elif target_mode == "pawngo-all":
                            if pawngo_color is None or turn != pawngo_color:
                                should_record = False
                        elif target_mode == "all":
                            should_record = True

                        if not should_record:
                            board.push(move)
                            continue

                        # 2. Phase Classification and Endgame Anti-Skew Logic
                        phase = classify_game_phase(board, move_num)

                        # Parse evaluation comment if present
                        eval_score = 0.0
                        comment = node.comment
                        m_eval = re.search(r'\[%eval ([+-]?[0-9.]+|#-?[0-9]+)\]', comment)
                        if m_eval:
                            val_s = m_eval.group(1)
                            if '#' in val_s:
                                mate_val = int(val_s.replace('#', ''))
                                eval_score = 1000.0 if mate_val > 0 else -1000.0
                            else:
                                eval_score = float(val_s) * 100.0  # Centipawns

                        if phase == "endgame":
                            # Cap maximum endgame positions from a single game
                            if endgame_positions_recorded >= max_endgame_per_game:
                                board.push(move)
                                continue

                            # Dead-draw filter: skip drawn endgame shuffles that convey no tactical lesson
                            is_decisive = (winning_color is not None)
                            if not is_decisive and filter_dead_draws and abs(eval_score) < 20.0 and move_num > 45:
                                board.push(move)
                                continue

                            # For decisive games: retain all winning conversion moves, pawn pushes, checks, captures, king moves
                            if not is_decisive:
                                piece_moved = board.piece_at(move.from_square)
                                is_key_move = (
                                    (piece_moved and piece_moved.piece_type in (chess.PAWN, chess.KING))
                                    or board.is_capture(move)
                                    or board.gives_check(move)
                                    or move.promotion is not None
                                )
                                if not is_key_move and (move_num % 2 != 0):
                                    board.push(move)
                                    continue

                            endgame_positions_recorded += 1

                        # Normalized eval in [-1.0, 1.0] using sigmoid win-rate mapping
                        norm_eval = 2.0 / (1.0 + np.exp(-eval_score / 400.0)) - 1.0

                        planes = board_to_planes(board)
                        mv_idx = move_to_index(move)

                        all_boards.append(planes)
                        all_moves.append(mv_idx)
                        all_evals.append(norm_eval)
                        all_results.append(result_val)
                        phase_counts[phase] += 1
                        total_positions_extracted += 1

                        board.push(move)

                    total_games_parsed += 1
                    if max_games and total_games_parsed >= max_games:
                        break
        except Exception as e:
            print(f"Warning reading {fpath}: {e}")

        if max_games and total_games_parsed >= max_games:
            break

    print(f"\nExtraction Complete:")
    print(f"  Total Games Parsed   : {total_games_parsed:,}")
    print(f"  Positions Extracted  : {total_positions_extracted:,}")
    if total_positions_extracted > 0:
        op_pct = 100.0 * phase_counts['opening'] / total_positions_extracted
        mg_pct = 100.0 * phase_counts['middlegame'] / total_positions_extracted
        eg_pct = 100.0 * phase_counts['endgame'] / total_positions_extracted
        print(f"  Opening Positions    : {phase_counts['opening']:,} ({op_pct:.1f}%)")
        print(f"  Middlegame Positions : {phase_counts['middlegame']:,} ({mg_pct:.1f}%)")
        print(f"  Endgame Positions    : {phase_counts['endgame']:,} ({eg_pct:.1f}%)")

    if total_positions_extracted == 0:
        print("No positions extracted with current filters. Exiting.")
        return

    boards_arr = np.array(all_boards, dtype=np.float32)
    moves_arr = np.array(all_moves, dtype=np.int32)
    evals_arr = np.array(all_evals, dtype=np.float32)
    results_arr = np.array(all_results, dtype=np.float32)

    os.makedirs(os.path.dirname(os.path.abspath(output_file)), exist_ok=True)
    np.savez_compressed(
        output_file,
        boards=boards_arr,
        moves=moves_arr,
        evals=evals_arr,
        results=results_arr
    )
    file_mb = os.path.getsize(output_file) / (1024 * 1024)
    print(f"Saved dataset to: {output_file} ({file_mb:.1f} MB)")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract training dataset from PGN files with anti-endgame-skew")
    parser.add_argument("--pgn-dir", default=DEFAULT_BENCH_DIR, help="Path to tournament benchmarks folder")
    parser.add_argument("--out", default="data/chess_dataset.npz", help="Output .npz file")
    parser.add_argument(
        "--target-mode",
        choices=["winner-only", "pawngo-wins", "pawngo-positive", "pawngo-all", "all"],
        default="winner-only",
        help="Target training source: winner moves, pawnGO wins/positive, pawnGO all, or all"
    )
    parser.add_argument("--no-draws", dest="include_draws", action="store_false", help="Exclude drawn games")
    parser.add_argument("--max-endgame-per-game", type=int, default=35, help="Cap maximum endgame moves per game (default: 35)")
    parser.add_argument("--no-filter-draws", dest="filter_dead_draws", action="store_false", help="Don't filter dead draws")
    parser.add_argument("--max-games", type=int, default=None, help="Limit number of games for quick testing")
    args = parser.parse_args()

    parse_pgn_files(
        args.pgn_dir,
        args.out,
        target_mode=args.target_mode,
        include_draws=args.include_draws,
        max_endgame_per_game=args.max_endgame_per_game,
        filter_dead_draws=args.filter_dead_draws,
        max_games=args.max_games
    )
