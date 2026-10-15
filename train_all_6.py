#!/usr/bin/env python3
"""
Master Orchestrator to extract datasets and train all 6 models:
3 Target Modes (pawngo-all, pawngo-wins, winner-only) x 2 Model Architectures (PolicyNet, NNUENet)
"""

import os
import sys
import subprocess
import argparse

MODES = [
    ("pawngo-all", "data/dataset_pawngo_all.npz", "models/policy_pawngo_all.pt", "models/nnue_pawngo_all.pt"),
    ("pawngo-wins", "data/dataset_pawngo_wins.npz", "models/policy_pawngo_wins.pt", "models/nnue_pawngo_wins.pt"),
    ("winner-only", "data/dataset_winner_only.npz", "models/policy_winner_only.pt", "models/nnue_winner_only.pt")
]

def run_cmd(cmd_list):
    print(f"\n[RUNNING] {' '.join(cmd_list)}")
    res = subprocess.run(cmd_list)
    if res.returncode != 0:
        print(f"[ERROR] Command failed with code {res.returncode}: {' '.join(cmd_list)}")
        sys.exit(res.returncode)

def main():
    parser = argparse.ArgumentParser(description="Extract data and train all 6 neural models")
    parser.add_argument("--epochs", type=int, default=10, help="Epochs per model (default: 10)")
    parser.add_argument("--skip-extract", action="store_true", help="Skip PGN extraction if npz already exists")
    parser.add_argument("--pgn-dir", default="/home/maksim/Programming/Projects/finished/pawnGO/engine/scripts/benchmarks", help="PGN benchmarks directory")
    args = parser.parse_args()

    python_bin = sys.executable

    print("=" * 65)
    print("      pawnGO-Neural: Training Pipeline (6 Models Total)      ")
    print("=" * 65)

    for mode, npz_path, policy_path, nnue_path in MODES:
        print(f"\n>>> PROCESSING TARGET MODE: {mode.upper()} <<<")

        # 1. Extraction (if needed)
        if not (args.skip_extract and os.path.exists(npz_path)):
            extract_cmd = [
                python_bin, "data/extract_pgn.py",
                "--pgn-dir", args.pgn_dir,
                "--out", npz_path,
                "--target-mode", mode,
                "--max-endgame-per-game", "12"
            ]
            run_cmd(extract_cmd)
        else:
            print(f"Skipping extraction, found existing: {npz_path}")

        # 2. Train Policy Network
        print(f"\n--> Training PolicyNet for {mode}...")
        policy_cmd = [
            python_bin, "train_policy.py",
            "--data", npz_path,
            "--epochs", str(args.epochs),
            "--save", policy_path
        ]
        run_cmd(policy_cmd)

        # 3. Train NNUE Value Network
        print(f"\n--> Training NNUENet for {mode}...")
        nnue_cmd = [
            python_bin, "train_nnue.py",
            "--data", npz_path,
            "--epochs", str(args.epochs),
            "--save", nnue_path
        ]
        run_cmd(nnue_cmd)

    print("\n" + "=" * 65)
    print("   [*] ALL 6 MODELS SUCCESSFULLY TRAINED AND SAVED TO models/ [*]   ")
    print("=" * 65)

if __name__ == "__main__":
    main()
