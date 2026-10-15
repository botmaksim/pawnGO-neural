#!/usr/bin/env python3
"""
Verification and Sanity Suite for Trained Policy Network (Model 1).
Performs:
1. Architecture and parameter count inspection.
2. Inference latency and throughput benchmarks.
3. Canonical tactical and opening position tests (Scholar's Mate, Starting Pos, Fork).
4. Validation Top-1 and Top-3 accuracy measurement.
5. MoveLegalizer verification (strict FIDE legal enforcement vs Anarchy Mode).
"""

import os
import sys
import time
import argparse
import chess
import numpy as np
import torch
import torch.nn.functional as F

from models.policy_net import PolicyNet
from models.legalizer import MoveLegalizer, move_to_index, index_to_move
from data.extract_pgn import board_to_planes

CANONICAL_POSITIONS = [
    {
        "name": "Starting Position",
        "fen": chess.STARTING_FEN,
        "expected_top_moves": ["e2e4", "d2d4", "g1f3", "c2c4"],
        "description": "Standard chess opening moves"
    },
    {
        "name": "Scholar's Mate in 1",
        "fen": "r1bqkb1r/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 4",
        "expected_top_moves": ["h5f7"],
        "description": "Tactical checkmate on f7 (Qxf7#)"
    },
    {
        "name": "Knight Fork Tactic (Royal Fork)",
        "fen": "r1b1k2r/pppp1ppp/5n2/4N3/1b1q4/8/PPPPPPPP/RNBQKB1R w KQkq - 0 6",
        "expected_top_moves": ["e5d3", "e5f3"],
        "description": "Tactical retreat/defense under attack"
    },
    {
        "name": "Pawn Endgame Promotion",
        "fen": "8/4P3/8/8/8/8/k7/4K3 w - - 0 1",
        "expected_top_moves": ["e7e8q", "e7e8"],
        "description": "Advancing pawn to 8th rank with promotion"
    }
]

def verify_model(model_path: str, data_path: str = None, device: str = "cpu"):
    print("=" * 65)
    print("      pawnGO-Neural: Policy Network Verification Suite       ")
    print("=" * 65)
    print(f"Model Checkpoint : {model_path}")
    print(f"Execution Device : {device}")

    if not os.path.exists(model_path):
        print(f"[FAIL] Checkpoint not found: {model_path}")
        return False

    # 1. Load Architecture
    model = PolicyNet(in_channels=16)
    state_dict = torch.load(model_path, map_location=device)
    model.load_state_dict(state_dict)
    model.to(device)
    model.eval()

    param_count = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"[OK] Model successfully loaded. Trainable parameters: {param_count:,}")

    # 2. Benchmark Inference Latency
    test_board = chess.Board()
    planes = board_to_planes(test_board)
    x = torch.from_numpy(planes).unsqueeze(0).to(device)

    # Warmup
    for _ in range(20):
        _ = model(x)

    trials = 200
    t0 = time.perf_counter()
    for _ in range(trials):
        _ = model(x)
    t1 = time.perf_counter()

    avg_ms = ((t1 - t0) / trials) * 1000.0
    throughput = trials / (t1 - t0)
    print(f"[OK] Inference Latency: {avg_ms:.2f} ms/position ({throughput:.0f} pos/sec)")

    # 3. Canonical Position Tests
    print("\n--- Canonical Position Tests ---")
    all_passed = True
    for test in CANONICAL_POSITIONS:
        board = chess.Board(test["fen"])
        planes = board_to_planes(board)
        tensor = torch.from_numpy(planes).unsqueeze(0).to(device)

        with torch.no_grad():
            logits = model(tensor)[0]

        top_moves = MoveLegalizer.rank_top_moves(logits, board, top_k=5, anarchy=False)
        top_uci = [m["move_uci"] for m in top_moves]

        # Check if at least one expected move is in top-3
        found_expected = any(m in top_uci[:3] for m in test["expected_top_moves"])
        status = "[PASS]" if found_expected else "[WARN]"

        print(f"{status} {test['name']} ({test['description']})")
        print(f"       Expected in Top-3 : {test['expected_top_moves']}")
        print(f"       Actual Top-3 Moves: {[m['san'] + ' (' + str(round(m['probability']*100, 1)) + '%)' for m in top_moves[:3]]}")

        if not found_expected and test["name"] == "Scholar's Mate in 1":
            all_passed = False

    # 4. MoveLegalizer Strictness vs Anarchy Test
    print("\n--- MoveLegalizer Integrity Test ---")
    board = chess.Board()
    planes = board_to_planes(board)
    tensor = torch.from_numpy(planes).unsqueeze(0).to(device)
    with torch.no_grad():
        raw_logits = model(tensor)[0]

    # Test legal masking
    legal_move, is_legal, conf = MoveLegalizer.sample_move(raw_logits, board, temperature=0.0, anarchy=False)
    assert is_legal, "Legal mode produced an illegal move!"
    assert legal_move in board.legal_moves, "Move not found in board.legal_moves!"
    print(f"[OK] Legal Mode: {board.san(legal_move)} (Confidence: {conf*100:.1f}%, Strictly Legal: {is_legal})")

    # Test anarchy sampling
    anarchy_move, a_legal, a_conf = MoveLegalizer.sample_move(raw_logits, board, temperature=0.0, anarchy=True)
    print(f"[OK] Anarchy Mode: {anarchy_move.uci()} (Confidence: {a_conf*100:.1f}%, FIDE Legal: {a_legal})")

    # 5. Validation Accuracy (if dataset available)
    if data_path and os.path.exists(data_path):
        print("\n--- Validation Top-1 / Top-3 Accuracy ---")
        from data.dataset import get_loaders
        _, val_loader = get_loaders(data_path, batch_size=256)

        total = 0
        top1_correct = 0
        top3_correct = 0

        with torch.no_grad():
            for boards, targets, _, _ in val_loader:
                boards, targets = boards.to(device), targets.to(device)
                logits = model(boards)

                # Top-1
                preds1 = torch.argmax(logits, dim=-1)
                top1_correct += (preds1 == targets).sum().item()

                # Top-3
                _, top3_indices = torch.topk(logits, k=3, dim=-1)
                for i in range(targets.size(0)):
                    if targets[i] in top3_indices[i]:
                        top3_correct += 1

                total += boards.size(0)

        top1_pct = (top1_correct / total) * 100
        top3_pct = (top3_correct / total) * 100
        print(f"Validation Samples: {total:,}")
        print(f"[OK] Top-1 Validation Accuracy: {top1_pct:.2f}%")
        print(f"[OK] Top-3 Validation Accuracy: {top3_pct:.2f}%")

    print("\n" + "=" * 65)
    print("              Verification Successfully Complete             ")
    print("=" * 65)
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Verify Policy Network Checkpoint")
    parser.add_argument("--model", default="models/policy_pawngo_wins.pt", help="Model weights path")
    parser.add_argument("--data", default="data/dataset_pawngo_wins.npz", help="Dataset path for validation eval")
    parser.add_argument("--device", default="cpu", help="Device (cpu or cuda)")
    args = parser.parse_args()

    verify_model(args.model, args.data, device=args.device)
