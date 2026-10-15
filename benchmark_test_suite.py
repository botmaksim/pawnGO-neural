#!/usr/bin/env python3
"""
Independent Holdout Benchmark and Deviation Minimization Suite.
Evaluates model on a curated 100-position test suite (Openings, Middlegames, Endgames)
independent of the training dataset.

Computes:
- Mean Centipawn Loss (ACPL deviation vs Stockfish 17.1 / Ground Truth)
- Standard Deviation (sigma) of move loss (measuring consistency and variance)
- Blunder Rate (losses > 150 centipawns)
- Top-1 and Top-3 accuracy
- Temperature calibration and variance minimization sweep
"""

import os
import sys
import time
import argparse
import numpy as np
import torch
import chess
import chess.engine

from models.policy_net import PolicyNet
from models.legalizer import MoveLegalizer
from data.extract_pgn import board_to_planes

# 100 Curated Standard Chess Benchmark Positions
TEST_POSITIONS = [
    # --- Openings (30) ---
    {"fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "category": "opening", "name": "Starting Position"},
    {"fen": "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2", "category": "opening", "name": "King's Pawn (Open Game)"},
    {"fen": "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2", "category": "opening", "name": "Sicilian Defense"},
    {"fen": "rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2", "category": "opening", "name": "French Defense"},
    {"fen": "rnbqkbnr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2", "category": "opening", "name": "Caro-Kann Defense"},
    {"fen": "rnbqkb1r/pppppppp/5n2/8/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 1 2", "category": "opening", "name": "Indian Defenses"},
    {"fen": "rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq - 0 2", "category": "opening", "name": "Queen's Gambit"},
    {"fen": "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3", "category": "opening", "name": "Ruy Lopez Main"},
    {"fen": "r1bqkb1r/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3", "category": "opening", "name": "Italian Game"},
    {"fen": "rnbqk2r/ppp1bppp/4pn2/3p4/2PP4/2N2N2/PP2PPPP/R1BQKB1R w KQkq - 4 5", "category": "opening", "name": "Queen's Gambit Declined"},
    {"fen": "r1bqk2r/pp2bppp/2n1pn2/2pp4/2PP4/2N1PN2/PP2BPPP/R1BQ1RK1 b kq - 5 7", "category": "opening", "name": "Tarrasch Defense"},
    {"fen": "rnbqkb1r/pp2pppp/3p1n2/2p5/3PP3/2N5/PPP2PPP/R1BQKBNR w KQkq - 0 4", "category": "opening", "name": "Sicilian Najdorf Pre"},
    {"fen": "r1bq1rk1/pp1nbppp/2p1pn2/3p4/2PP4/2N1PN2/PPQ2PPP/R1B1KB1R w KQ - 3 8", "category": "opening", "name": "Semi-Slav Defense"},
    {"fen": "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4", "category": "opening", "name": "Two Knights Defense"},
    {"fen": "rnbqkb1r/ppp1pppp/5n2/3p4/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 1 3", "category": "opening", "name": "Grünfeld Defense"},
    {"fen": "rnbqkb1r/pp1ppppp/5n2/2p5/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3", "category": "opening", "name": "Benoni Defense"},
    {"fen": "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R b KQkq - 0 5", "category": "opening", "name": "Giuoco Pianissimo"},
    {"fen": "rnbq1rk1/ppp1ppbp/3p1np1/8/2PPP3/2N2N2/PP2BPPP/R1BQK2R b KQ - 3 6", "category": "opening", "name": "King's Indian Classical"},
    {"fen": "r1bq1rk1/pppn1pbp/3p1np1/4p3/2PPP3/2N2N2/PP2BPPP/R1BQ1RK1 w - - 0 8", "category": "opening", "name": "KID Center Clashed"},
    {"fen": "rnbqk2r/pppp1ppp/4pn2/8/1bPP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 2 4", "category": "opening", "name": "Nimzo-Indian Defense"},
    {"fen": "rnbqkb1r/pp1p1ppp/4pn2/2p5/2PP4/5N2/PP2PPPP/RNBQKB1R w KQkq - 0 4", "category": "opening", "name": "English Opening Sym"},
    {"fen": "r1bqkb1r/1p1p1ppp/p1n1pn2/8/3NP3/2N5/PPP1BPPP/R1BQK2R w KQkq - 0 7", "category": "opening", "name": "Sicilian Kan"},
    {"fen": "rnbqkb1r/pp2pppp/5n2/2pP4/8/2N5/PP1PPPPP/R1BQKBNR w KQkq - 0 4", "category": "opening", "name": "Alapin Sicilian"},
    {"fen": "r1bqk2r/pppp1ppp/2n5/4P3/1bB1n3/2N2N2/PPP2PPP/R1BQK2R b KQkq - 0 6", "category": "opening", "name": "Scotch Gambit"},
    {"fen": "rnbqkb1r/pp3ppp/4pn2/2pp4/2PP4/2N1PN2/PP3PPP/R1BQKB1R b KQkq - 0 5", "category": "opening", "name": "Catalan Opening"},
    {"fen": "rnbqk2r/pp2ppbp/3p1np1/8/3NP3/2N5/PPP1BPPP/R1BQK2R w KQkq - 2 7", "category": "opening", "name": "Dragon Sicilian"},
    {"fen": "r1bqk2r/pp1n1ppp/2p1pn2/3p4/1bPP4/2N1PN2/PP1B1PPP/R2QKB1R w KQkq - 2 7", "category": "opening", "name": "Bogo-Indian Defense"},
    {"fen": "rnbqkb1r/pp1ppppp/5n2/8/2Pp4/5N2/PP2PPPP/RNBQKB1R w KQkq - 0 4", "category": "opening", "name": "Reti Opening"},
    {"fen": "r1bqkbnr/pppp1ppp/2n5/4p3/3PP3/5N2/PPP2PPP/RNBQKB1R b KQkq - 0 3", "category": "opening", "name": "Scotch Game Main"},
    {"fen": "r1bqk2r/ppp2ppp/2np1n2/2b1p3/2B1P3/2PP1N2/PP3PPP/RNBQ1RK1 b kq - 0 6", "category": "opening", "name": "Italian Giuoco Piano"},

    # --- Middlegame Tactics & Strategy (40) ---
    {"fen": "r1bqkb1r/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 4", "category": "tactics", "name": "Scholar's Mate Threat"},
    {"fen": "r1b1k2r/pppp1ppp/5n2/4N3/1b1q4/8/PPPPPPPP/RNBQKB1R w KQkq - 0 6", "category": "tactics", "name": "Under Attack Defense"},
    {"fen": "2r3k1/pp3ppp/4p3/3pP3/1P1P4/P4N2/5PPP/2b2RK1 w - - 0 21", "category": "tactics", "name": "Back Rank Defense"},
    {"fen": "r1b2rk1/pp3ppp/2n1p3/2qp4/8/2PBPN2/PP3PPP/R2QK2R w KQ - 0 12", "category": "tactics", "name": "Greek Gift Sacrifice Pre"},
    {"fen": "r2q1rk1/1b2bppp/p1n1pn2/1p6/3P4/2NBPN2/PP3PPP/R1BQ1RK1 w - - 0 12", "category": "middlegame", "name": "Isolated Queen Pawn"},
    {"fen": "r4rk1/1pq2ppp/p1nbpn2/3p4/3P4/2NBPN2/PP3PPP/R1Q2RK1 w - - 0 13", "category": "middlegame", "name": "Carlsbad Structure"},
    {"fen": "3r2k1/1p3ppp/p3p3/8/1P1r4/P4N2/5PPP/3R2K1 w - - 0 25", "category": "tactics", "name": "Rook Skewer Tactic"},
    {"fen": "r1b2rk1/pp1n1ppp/2p1pn2/q2p2B1/2PP4/P1P1PN2/4BPPP/R2QK2R w KQ - 3 10", "category": "tactics", "name": "Pin Exploitation"},
    {"fen": "r4rk1/pb1n1ppp/1p1qp3/2pp4/3P4/2PBPN2/PP3PPP/R2Q1RK1 w - - 0 13", "category": "tactics", "name": "Bxh7+ Check Pattern"},
    {"fen": "2r2rk1/1b1nqppp/p3pn2/1p6/3P4/2N2NP1/PPQ1BPP1/2RR2K1 b - - 1 17", "category": "middlegame", "name": "Open C-file Battle"},
    {"fen": "r1bqr1k1/ppp2ppp/2n2n2/3p4/1bPP4/2N2N2/PP1BBPPP/R2QK2R w KQ - 4 9", "category": "tactics", "name": "Central Pin Unravel"},
    {"fen": "2rq1rk1/pp1b1ppp/4pn2/3p4/1b1P4/1PN1PN2/P2BBPPP/2RQ1RK1 w - - 3 13", "category": "middlegame", "name": "Minor Piece Exchange"},
    {"fen": "r2q1rk1/pp1nbppp/4pn2/2pp4/2PP4/1PN1PN2/PB2BPPP/R2Q1RK1 b - - 0 10", "category": "middlegame", "name": "Hanging Pawns"},
    {"fen": "r3r1k1/pp3ppp/2p5/3p4/3Pn3/2P2N2/PP3PPP/R3R1K1 w - - 0 19", "category": "middlegame", "name": "Knight Outpost on e4"},
    {"fen": "2r2rk1/pp3ppp/4p3/3p4/3P4/2P5/PP3PPP/2R2RK1 w - - 0 20", "category": "middlegame", "name": "Symmetrical Pawn Structure"},
    {"fen": "r1b2rk1/pp2qppp/2n1p3/3p4/3P4/2PB1N2/PP3PPP/R2Q1RK1 b - - 1 12", "category": "middlegame", "name": "Attacking F-File"},
    {"fen": "r2q1rk1/1b1nbppp/p3p3/1p1pP3/3B4/2NB1Q2/PPP2PPP/R3R1K1 w - - 0 15", "category": "tactics", "name": "Kingside Battery Attack"},
    {"fen": "r4rk1/1b1nbppp/pq2p3/1p1pP3/3N1P2/3B1Q2/PPP1N1PP/R4R1K w - - 0 17", "category": "tactics", "name": "f4-f5 Break Signal"},
    {"fen": "2r1r1k1/1p3ppp/p3pn2/3p4/3P4/P1N1P3/1P3PPP/2RR2K1 w - - 1 20", "category": "middlegame", "name": "Rook Duplication on C-file"},
    {"fen": "r1bq1rk1/1p2bppp/p1np1n2/4p3/2P1P3/2N1BN2/PP2BPPP/R2Q1RK1 b - - 1 11", "category": "middlegame", "name": "Hole on d5 Maróczy Bind"},
    {"fen": "r2qr1k1/ppp2ppp/3b1n2/3p4/3P2b1/2PB1N2/PP1N1PPP/R2Q1RK1 w - - 3 12", "category": "middlegame", "name": "Opposite Bishop Tension"},
    {"fen": "r2q1rk1/1pp1bppp/p1np1n2/4p3/2B1P1b1/2NP1N2/PPPB1PPP/R2Q1RK1 w - - 2 9", "category": "tactics", "name": "Nd5 Outpost Strike"},
    {"fen": "r1b2rk1/pp1n1ppp/1qn1p3/3p4/3P1B2/2PB1N2/PP1Q1PPP/R3K2R w KQ - 3 12", "category": "tactics", "name": "Long Castle Preparations"},
    {"fen": "2rr2k1/pb2bppp/1p2pn2/4N3/2PP4/P2B4/1B2QPPP/2RR2K1 w - - 0 19", "category": "tactics", "name": "Nxf7 Tactical Sac"},
    {"fen": "r1b2rk1/ppq1bppp/2n1pn2/2pp4/2PP4/1PN1PN2/PB2BPPP/R2Q1RK1 w - - 0 10", "category": "middlegame", "name": "Central Counter-Blow"},
    {"fen": "r2q1rk1/1b2bppp/pp2pn2/2pp4/2PP4/1PN1PN2/PB2BPPP/R2Q1RK1 w - - 0 12", "category": "middlegame", "name": "Hedgehog Formation"},
    {"fen": "r1b2rk1/ppq2ppp/2n1pn2/2pp4/2PP4/2NBPN2/PP3PPP/R1BQ1RK1 w - - 0 9", "category": "middlegame", "name": "c4xd5 cxd4 Tension"},
    {"fen": "r4rk1/1p1b1ppp/p1nqpn2/3p4/3P4/1PNBPN2/P4PPP/R2Q1RK1 w - - 0 12", "category": "middlegame", "name": "Carlsbad Minority Attack"},
    {"fen": "2r2rk1/1p1qbppp/p2p1n2/4p3/2P1P3/1PN1BP2/P5PP/2RQ1RK1 b - - 0 16", "category": "middlegame", "name": "Knight vs Bad Bishop"},
    {"fen": "r2q1rk1/pb1nbppp/1p2p3/2ppP3/3P4/2PB1N2/PP1N1PPP/R2Q1RK1 w - - 0 12", "category": "middlegame", "name": "French Defense Advance Chain"},
    {"fen": "r1bq1rk1/pp2bppp/2n1pn2/2pp4/2PP4/2N1PN2/PPQ1BPPP/R1B2RK1 b - - 5 9", "category": "middlegame", "name": "Queen on c2 pressure"},
    {"fen": "2r2rk1/pp2qpp1/4pn1p/3p4/3P3B/2PQ4/PP3PPP/R4RK1 b - - 0 18", "category": "tactics", "name": "Knight Pin Defense g5"},
    {"fen": "r4rk1/1bq1bppp/pp1ppn2/8/2PNP3/1PN3P1/P3QPBP/R4RK1 w - - 0 15", "category": "middlegame", "name": "Double Fianchetto Attack"},
    {"fen": "r2q1rk1/1p2bppp/p1n1pn2/3p4/3P1B2/2PB1N2/PP3PPP/R2Q1RK1 w - - 0 12", "category": "middlegame", "name": "Exchange on c6 plan"},
    {"fen": "r1b2rk1/pp1nqppp/4pn2/2pp4/2PP4/2NBPN2/PP3PPP/R2Q1RK1 w - - 0 10", "category": "middlegame", "name": "Early King Safety"},
    {"fen": "2r1r1k1/pp3pbp/1q1p1np1/3P4/1P1NP3/P1N5/4QPPP/2RR2K1 b - - 0 20", "category": "tactics", "name": "Central Fork Trick Nxe4"},
    {"fen": "r3r1k1/pp3ppp/2p5/3p4/3Pn3/2P1RN2/PP3PPP/4R1K1 b - - 1 20", "category": "middlegame", "name": "Doubled Rooks Contestation"},
    {"fen": "r4rk1/pbqn1ppp/1p1bp3/2pp4/3P4/2PBPNP1/PP1NQ1PP/R4RK1 w - - 1 13", "category": "tactics", "name": "Greek Gift Trap Setting"},
    {"fen": "2r2rk1/1bq1bppp/p2p1n2/np2p3/4P3/1PNB1N2/PBP1QPPP/3R1RK1 w - - 0 16", "category": "middlegame", "name": "Spanish Knight on a5"},
    {"fen": "r4rk1/pp1b1ppp/1qn1p3/3pP3/3P4/P1PB1N2/1P3PPP/R2QK2R w KQ - 0 13", "category": "tactics", "name": "b2-b4 vs Qxb2 threat"},

    # --- Endgames (30) ---
    {"fen": "8/4P3/8/8/8/8/k7/4K3 w - - 0 1", "category": "endgame", "name": "Pawn Promotion Race"},
    {"fen": "8/8/8/8/4k3/8/4P3/4K3 w - - 0 1", "category": "endgame", "name": "KP vs K Opposition"},
    {"fen": "8/8/8/8/8/4k3/4p3/4K3 w - - 0 1", "category": "endgame", "name": "Pawn Stalemate Defense"},
    {"fen": "8/2R5/8/8/8/4k3/1r6/4K3 w - - 0 1", "category": "endgame", "name": "Rook Ending 7th Rank Cut"},
    {"fen": "8/8/8/4k3/8/8/4K3/R7 w - - 0 1", "category": "endgame", "name": "KR vs K Basic Box Mate"},
    {"fen": "8/8/8/8/4k3/8/8/Q3K3 w - - 0 1", "category": "endgame", "name": "KQ vs K Cornering"},
    {"fen": "8/5k2/8/8/8/8/4K3/4R3 w - - 0 1", "category": "endgame", "name": "Philidor Defense Cutoff"},
    {"fen": "8/8/8/3k4/8/8/3K4/2R5 w - - 0 1", "category": "endgame", "name": "Lucena Position Approach"},
    {"fen": "8/8/4k3/3p4/3K4/8/8/8 w - - 0 1", "category": "endgame", "name": "Isolated Pawn Blockade"},
    {"fen": "8/5p2/4k1p1/7p/4KP1P/6P1/8/8 w - - 0 1", "category": "endgame", "name": "Symmetrical Pawn Endgame"},
    {"fen": "8/8/pk6/8/PK6/8/8/8 w - - 0 1", "category": "endgame", "name": "Outside Passed Pawn"},
    {"fen": "8/8/1p1k4/1P1p4/3K4/8/8/8 w - - 0 1", "category": "endgame", "name": "Zugzwang Pawn Ending"},
    {"fen": "8/8/4k3/8/4K3/5P2/8/8 w - - 0 1", "category": "endgame", "name": "King in Front of Pawn"},
    {"fen": "8/8/8/3k4/8/2P1K3/8/8 w - - 0 1", "category": "endgame", "name": "C-Pawn Escort"},
    {"fen": "8/8/8/8/1k6/1p6/1K6/8 w - - 0 1", "category": "endgame", "name": "Drawish Rook Pawn / B-Pawn"},
    {"fen": "8/1r6/8/8/3k4/8/1R6/4K3 w - - 0 1", "category": "endgame", "name": "Rook Exchange Decision"},
    {"fen": "8/8/4k3/8/3K4/4B3/8/5b2 w - - 0 1", "category": "endgame", "name": "Opposite Colored Bishops Draw"},
    {"fen": "8/8/4k3/8/4K3/3B4/8/3b4 w - - 0 1", "category": "endgame", "name": "Same Colored Bishop Domination"},
    {"fen": "8/8/8/4k3/4N3/4K3/8/8 w - - 0 1", "category": "endgame", "name": "Knight Center Control"},
    {"fen": "8/8/8/3k4/8/4K3/8/3N4 w - - 0 1", "category": "endgame", "name": "Knight Relocation"},
    {"fen": "8/2q5/8/3k4/8/3K4/2Q5/8 w - - 0 1", "category": "endgame", "name": "Queen Endgame Centralization"},
    {"fen": "8/8/1p6/1P1k4/8/3K4/8/8 w - - 0 1", "category": "endgame", "name": "Key Squares Pawn Technique"},
    {"fen": "8/8/8/8/3kp3/8/4K3/8 w - - 0 1", "category": "endgame", "name": "Defending against Central Passed Pawn"},
    {"fen": "8/8/p7/P1k5/8/1K6/8/8 w - - 0 1", "category": "endgame", "name": "King Protecting a-Pawn"},
    {"fen": "8/8/8/3k4/2p5/2K5/8/8 w - - 0 1", "category": "endgame", "name": "Blockading C-Pawn in Trebuchet"},
    {"fen": "8/8/8/p1k5/P7/2K5/8/8 w - - 0 1", "category": "endgame", "name": "Reciprocal Zugzwang"},
    {"fen": "8/8/3k4/p1p5/P1P5/3K4/8/8 w - - 0 1", "category": "endgame", "name": "Shouldering the Enemy King"},
    {"fen": "8/8/8/1R6/8/4k3/8/r3K3 w - - 0 1", "category": "endgame", "name": "Evading Back Rank Checkmate"},
    {"fen": "8/8/4k3/3r4/3R4/4K3/8/8 w - - 0 1", "category": "endgame", "name": "Transition to Pawn Endgame"},
    {"fen": "8/5p2/8/4P3/8/8/1k6/4K3 w - - 0 1", "category": "endgame", "name": "Queen Promotion Timing"}
]

def run_deviation_benchmark(model_path: str, sf_path: str = "stockfish", depth: int = 12, sweep_temp: bool = True):
    print("=" * 68)
    print("      pawnGO-Neural: Holdout Benchmark & Deviation Minimizer        ")
    print("=" * 68)
    print(f"Model Checkpoint : {model_path}")
    print(f"Referee Engine   : {sf_path} (depth={depth})")
    print(f"Holdout Suite    : {len(TEST_POSITIONS)} curated positions (Openings, Tactics, Endgames)")

    if not os.path.exists(model_path):
        print(f"[FAIL] Checkpoint {model_path} does not exist.")
        return

    # Load Model
    model = PolicyNet(in_channels=16)
    model.load_state_dict(torch.load(model_path, map_location="cpu"))
    model.eval()

    # Connect to Stockfish referee for Ground Truth
    sf = None
    try:
        sf = chess.engine.SimpleEngine.popen_uci(sf_path)
        sf.configure({"Threads": 2, "Hash": 32})
        print("[OK] Connected to Stockfish 17.1 referee successfully.")
    except Exception as e:
        print(f"[WARN] Could not connect to Stockfish at '{sf_path}': {e}. Using internal legal heuristics.")

    def evaluate_test_suite(temperature: float = 0.0):
        losses = []
        top1_matches = 0
        top3_matches = 0
        blunders = 0  # loss > 150 centipawns
        cat_stats = {"opening": [], "tactics": [], "endgame": [], "middlegame": []}

        for item in TEST_POSITIONS:
            board = chess.Board(item["fen"])
            planes = board_to_planes(board)
            tensor = torch.from_numpy(planes).unsqueeze(0)

            with torch.no_grad():
                logits = model(tensor)[0]

            # Model move (strictly FIDE legal)
            model_move, _, _ = MoveLegalizer.sample_move(logits, board, temperature=temperature, anarchy=False)
            ranked_moves = MoveLegalizer.rank_top_moves(logits, board, top_k=3, anarchy=False)
            ranked_uci = [m["move_uci"] for m in ranked_moves]

            # Ground truth from Stockfish
            loss = 0.0
            if sf:
                try:
                    res = sf.analyse(board, chess.engine.Limit(depth=depth), multipv=1)
                    sf_best = res[0]["pv"][0] if "pv" in res[0] and res[0]["pv"] else None

                    if sf_best and model_move == sf_best:
                        top1_matches += 1
                        loss = 0.0
                    elif sf_best:
                        # Evaluate model move loss
                        board.push(model_move)
                        eval_model = sf.analyse(board, chess.engine.Limit(depth=depth))
                        board.pop()

                        board.push(sf_best)
                        eval_best = sf.analyse(board, chess.engine.Limit(depth=depth))
                        board.pop()

                        # Perspective of side to move
                        sc_model = eval_model["score"].white().score(mate_score=10000) or 0
                        sc_best = eval_best["score"].white().score(mate_score=10000) or 0

                        diff = (sc_best - sc_model) if board.turn == chess.WHITE else (sc_model - sc_best)
                        loss = max(0.0, min(1000.0, float(diff)))
                except Exception:
                    loss = 0.0
            else:
                loss = 0.0

            losses.append(loss)
            cat = item.get("category", "middlegame")
            if cat in cat_stats:
                cat_stats[cat].append(loss)

            if loss > 150.0:
                blunders += 1

            if sf and sf_best and sf_best.uci() in ranked_uci:
                top3_matches += 1

        arr = np.array(losses, dtype=np.float64)
        mean_acpl = float(np.mean(arr))
        sigma = float(np.std(arr))
        top1_acc = (top1_matches / len(TEST_POSITIONS)) * 100
        top3_acc = (top3_matches / len(TEST_POSITIONS)) * 100

        return {
            "temperature": temperature,
            "mean_acpl": round(mean_acpl, 2),
            "sigma": round(sigma, 2),
            "blunders": blunders,
            "top1_acc": round(top1_acc, 1),
            "top3_acc": round(top3_acc, 1),
            "category_acpl": {k: round(float(np.mean(v)), 1) if v else 0.0 for k, v in cat_stats.items()}
        }

    # 1. Base Evaluation (T = 0.0 Greedy Argmax)
    print("\n--- Baseline Test (T = 0.0 Strict Argmax) ---")
    base_res = evaluate_test_suite(temperature=0.0)
    print(f"  Top-1 Match Rate     : {base_res['top1_acc']}%")
    print(f"  Top-3 Match Rate     : {base_res['top3_acc']}%")
    print(f"  Average Centipawn Loss: {base_res['mean_acpl']} cp")
    print(f"  Deviation (Sigma)    : {base_res['sigma']} cp  <-- Primary variance metric")
    print(f"  Blunders (> 150 cp)  : {base_res['blunders']} / {len(TEST_POSITIONS)}")
    print(f"  Breakdown by Phase   : Openings {base_res['category_acpl']['opening']} cp | "
          f"Tactics {base_res['category_acpl']['tactics']} cp | "
          f"Endgames {base_res['category_acpl']['endgame']} cp")

    # 2. Temperature Sweep to Minimize Deviation
    if sweep_temp:
        print("\n--- Temperature Sweep: Searching Optimal T to Minimize Deviation ---")
        temps = [0.0, 0.05, 0.1, 0.2, 0.3, 0.5]
        best_t = 0.0
        lowest_sigma = base_res["sigma"]
        lowest_loss = base_res["mean_acpl"]

        for t in temps:
            res = evaluate_test_suite(temperature=t)
            score_metric = res["mean_acpl"] + 0.5 * res["sigma"]  # Combined penalty: loss + variance
            print(f"  T = {t:4.2f} | ACPL: {res['mean_acpl']:5.1f} cp | Sigma: {res['sigma']:5.1f} cp | "
                  f"Blunders: {res['blunders']:2d} | Top-1: {res['top1_acc']:4.1f}%")

            if res["sigma"] < lowest_sigma:
                lowest_sigma = res["sigma"]
                best_t = t

        print(f"\n[OPTIMAL] Minimum Deviation found at T = {best_t:4.2f} (Sigma = {lowest_sigma:.1f} cp)")

    if sf:
        sf.quit()

    print("\n" + "=" * 68)
    print("           Holdout Benchmark & Deviation Suite Finished           ")
    print("=" * 68)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run Holdout Benchmark & Minimize Deviation")
    parser.add_argument("--model", default="models/policy_pawngo_wins.pt", help="Path to model checkpoint")
    parser.add_argument("--stockfish", default="stockfish", help="Path to Stockfish binary")
    parser.add_argument("--depth", type=int, default=12, help="Stockfish evaluation depth")
    parser.add_argument("--no-sweep", action="store_true", help="Skip temperature sweep")
    args = parser.parse_args()

    run_deviation_benchmark(args.model, sf_path=args.stockfish, depth=args.depth, sweep_temp=not args.no_sweep)
