# pawnGO-Neural 🧠♟️

Machine learning laboratory and neural network models trained on tournament games of the **pawnGO** chess engine vs Stockfish.

## Overview

This repository contains the dataset preprocessing pipelines, PyTorch neural architectures, and training scripts to build 6 specialized chess models:

1. **Policy Networks (Convolutional ResNet + Squeeze-and-Excitation Attention)**
   - 16-channel tensor input representation: 12 piece planes, active color, castling rights, remaining piece density, and move progress clock.
   - Squeeze-and-Excitation (SE) channel-wise attention to dynamically re-weight features between crowded middlegames and open endgames.
   - Outputs move probabilities across 4096 action indices. Supports strict legal masking or pure anarchy move hallucination.

2. **NNUE / Value Networks (HalfKP Evaluation)**
   - 768-dimensional sparse input (64 squares × 12 piece types) $\to$ 128 accumulator $\to$ 32 $\to$ 1 scalar output.
   - Predicts normalized position evaluation in $[-1.0, 1.0]$.
   - Exportable to C++ binary format for integration into pawnGO's evaluator (`export/export_nnue.py`).

---

## The 6 Trained Models

We train across 3 behavioral target modes:
- **`pawngo-all`** (*Pure pawnGO Clone*): Learns pawnGO's exact playstyle, heuristics, and tactical preferences across all games.
- **`pawngo-wins`** (*pawnGO Gold Standard*): Learns exclusively from pawnGO's winning games (1500+ dominant victories).
- **`winner-only`** (*Grandmaster Style*): Learns strictly from the winner of each match (pawnGO or Stockfish).

Combined with the 2 architectures, we produce 6 distinct checkpoints:
* `models/policy_pawngo_all.pt`
* `models/policy_pawngo_wins.pt`
* `models/policy_winner_only.pt`
* `models/nnue_pawngo_all.pt`
* `models/nnue_pawngo_wins.pt`
* `models/nnue_winner_only.pt`

---

## Anti-Endgame-Skew Pipeline

Chess games naturally generate far more moves in endgames (40–80 move shuffles) than in openings (10–15 moves). To prevent convolutional networks from over-optimizing on sparse empty boards and forgetting middlegame tactics, `data/extract_pgn.py` implements:
- **Game Phase Classification**: Classifies each position into opening, middlegame, or endgame based on material and piece counts.
- **Endgame Decimation**: Caps endgame positions per game and samples non-capture/non-pawn moves with a stride.
- **Dead-Draw Filtering**: Discards 0.00-shuffling endgame repetitions.

---

## Quick Start

### 1. Setup Environment
```bash
uv venv .venv
source .venv/bin/activate
uv pip install -r requirements.txt
```

### 2. Extract Data & Train All 6 Models
```bash
python3 train_all_6.py --epochs 10
```

### 3. Export NNUE Weights to C++ Binary
```bash
python3 export/export_nnue.py --model models/nnue_winner_only.pt --out export/pawngo_nnue.bin --quantize
```

---

## Interactive Sandbox

For the interactive free-form chess sandbox (featuring anarchy moves, multi-engine comparison across all 8 engines, and dual Stockfish/pawnGO evaluation thermometers), switch to the `sandbox` branch:

```bash
git checkout sandbox
python3 web/app.py
```
