# pawnGO-Neural

**pawnGO-Neural** is a deep learning chess suite featuring two neural architectures, a 14-engine evaluation sandbox, strict FIDE move legalizers, unconstrained research tools, and quantized C++ SIMD export.

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![PyTorch 2.x](https://img.shields.io/badge/PyTorch-2.x-ee4c2c.svg)](https://pytorch.org/)
[![Architecture](https://img.shields.io/badge/Architecture-ResNet--SE%20%7C%20HalfKP--768-purple.svg)](#1-architecture-overview)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 1. Architecture Overview

pawnGO-Neural implements two complementary neural architectures trained on a gauntlet corpus of 9,750 tournament games:

```
+-----------------------------------------------------------------------------------+
|                               1. PolicyNet Architecture                           |
|  Input: 16x8x8 Tensor (12 Piece planes + Turn + Castling + Density + Progress)     |
|  Conv2D (64 filters, 3x3) -> BatchNorm -> ReLU                                    |
|  4x Residual Blocks with Squeeze-and-Excitation (SE) Channel Attention            |
|  Policy Head: Conv2D (32 filters, 1x1) -> BatchNorm -> Flatten (2048)             |
|  Linear (2048 -> 4096 discrete move actions: from_sq * 64 + to_sq)                |
+-----------------------------------------------------------------------------------+

+-----------------------------------------------------------------------------------+
|                                2. NNUENet Architecture                            |
|  Input: HalfKP-768 Feature Vector (sparse piece-square activations)                |
|  Linear Feature Transformer: 768 -> 128 (Clipped ReLU / Clamp [0, 1])             |
|  Hidden Layer 1: 128 -> 32 (ReLU)                                                 |
|  Output Value Layer: 32 -> 1 (Tanh output in range [-1.0, 1.0])                   |
+-----------------------------------------------------------------------------------+
```

---

## 2. Neural Models Matrix

All production weights are located in `models/` and support hot-swapping in the evaluation sandbox:

| Model File | Architecture | Dataset | Objective | Verification Metrics |
| :--- | :--- | :--- | :--- | :--- |
| `policy_pawngo_wins.pt` | PolicyNet | `dataset_pawngo_wins.npz` (285k positions) | Win move classification | Top-1: 25.0%, Top-3: 42.7%, Latency: 1.94 ms |
| `policy_pawngo_all.pt` | PolicyNet | `dataset_pawngo_all.npz` (484k positions) | Behavioral cloning avatar | Multi-style comprehensive coverage |
| `policy_winner_only.pt` | PolicyNet | `dataset_winner_only.npz` (534k positions) | Grandmaster winning moves | Pure victory pattern modeling |
| `nnue_pawngo_wins.pt` | NNUENet | `dataset_pawngo_wins.npz` (285k positions) | Position evaluation | Correlation: $r = 0.748$, MAE: 94.6 cp |
| `nnue_pawngo_all.pt` | NNUENet | `dataset_pawngo_all.npz` (484k positions) | Global evaluation surface | Comprehensive evaluation across all phases |
| `nnue_winner_only.pt` | NNUENet | `dataset_winner_only.npz` (534k positions) | Dominant advantage scoring | High-confidence conversion evaluation |

---

## 3. Training Methodology & ML Pipeline

1. **Exponential Moving Average**:
   - Shadow parameter decay rate $\alpha = 0.999$.
   - Mitigates batch-level stochastic fluctuations and optimizes validation loss variance. Saved as `*_ema.pt`.
2. **Learning Rate Optimization**:
   - 1-epoch linear warmup followed by cosine annealing decay to $\text{lr}_{\min} = 10^{-5}$.
3. **Gradient Norm Clipping**:
   - `torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)` applied at every optimization step to eliminate exploding activations.
4. **Loss Formulations & Regularization**:
   - Policy: `CrossEntropyLoss` with label smoothing parameter 0.03 penalizes overconfidence on positions containing multiple valid tactical lines.
   - NNUE: `SmoothL1Loss` Huber objective with $\beta = 0.1$ dampens sensitivity to extreme centipawn evaluation spikes.
5. **Stratified Game Splitting**:
   - Unique game identifiers are tracked alongside position tensors.
   - Train and validation splits use a 90/10 ratio segmented strictly along game boundaries, preventing temporal and position autocorrelation leakage.
6. **Decisive Phase Oversampling**:
   - Position sampling cap is set to 35 plies per game.
   - Conversion moves, pawn advancements, checks, captures, promotions, and king centralizations are fully retained.
7. **Zeitnot Filtration**:
   - Raw tournament data includes blitz games with increment buffers between 0.05s and 0.10s. Under acute clock depletion, search depths dropped to 6–8 plies and yielded repetitive shuffling.
   - Passive drawing sequences are filtered out, while decisive sequences leading to victory are preserved.

---

## 4. Verification & Holdout Benchmarks

### Verification Suite: `verify_model.py`
- **Trainable Parameters**: 8,704,192 for PolicyNet; 102,689 for NNUENet.
- **Inference Latency**: 1.94 ms per position, processing 515 positions per second on a single CPU thread.
- **Canonical Tests**:
  - `[PASS]` Starting Position: 1. e4 (60.1%), 1. d4 (27.6%), 1. c4 (9.3%).
  - `[PASS]` Knight Fork Defense: Tactical defense identified in Top-2 candidate moves.
  - `[PASS]` Pawn Promotion: e8=Q verified in Top-3 candidate moves.
  - `[PASS]` MoveLegalizer: Strict FIDE legal move validation verified.

### 100-Position Holdout Benchmark: `benchmark_test_suite.py`
Evaluated against Stockfish 17.1 ground truth across 30 openings, 40 middlegame tactics, and 30 endgames:
- **Top-1 Match Rate**: 28.0% at $T = 0.00$; 38.0% at $T = 0.10$.
- **Top-3 Match Rate**: 59.0%.
- **Average Centipawn Loss in Openings**: 12.0 cp.
- **Tactical Blunders Exceeding 150 cp**: 14 per 100 positions.
- **Temperature Optimization**: A sweep across $T \in [0.0, 0.5]$ identified an error minimum at $T^* = 0.00$ with standard deviation $\sigma = 246.8$ cp.

---

## 5. C++ NNUE Binary Export

Trained PyTorch weights convert to a quantized binary representation for direct integration into the pawnGO C++ evaluator:

```bash
# Export quantized weights with int16 feature transformer and int8 hidden layers
python3 export/export_nnue.py --model models/nnue_pawngo_wins.pt --out export/pawngo_nnue.bin --quantize
```

- **Binary Footprint**: 196.4 KB, formatted for CPU L1/L2 cache residency and SIMD vector execution.
- **Header Magic**: `PAWN` with format version 2.

---

## 6. Interactive Web Sandbox

Launch the local web laboratory:

```bash
python3 web/app.py
```

Access the dashboard at `http://localhost:8080`.

### Capabilities:
- **14 Engine Configurations**:
  - `pawnGO C++ Alpha-Beta`
  - `Stockfish 17.1 Grandmaster`
  - `Policy: pawnGO Wins [Legal | Anarchy]`
  - `Policy: pawnGO All [Legal | Anarchy]`
  - `Policy: Grandmaster [Legal | Anarchy]`
  - `NNUE: pawnGO Wins [Legal | Anarchy]`
  - `NNUE: pawnGO All [Legal | Anarchy]`
  - `NNUE: Grandmaster [Legal | Anarchy]`
- **Dynamic Move Legalizer**: Displays Top-K candidate move probability cards with UCI and SAN notation.
- **Anarchy Mode**: Allows unmasked argmax move selection for research on illegal trajectories, piece placement, and unorthodox positions.
- **PGN Ingestion & Tree Exploration**: Import PGN transcripts or step backward to analyze diverging variations.

---

## 7. 420-Game Arena Tournament

A round-robin tournament evaluated the C++ alpha-beta engine against all 6 neural configurations across 7 competitors, 20 games per matchup, and 420 games total on 12 CPU workers:

### Leaderboard & Standings

| Rank | Engine | Played | Wins | Draws | Losses | Score | Win Rate |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | **pawnGO C++ Alpha-Beta** | 120 | 120 | 0 | 0 | **120.0** | **100.0%** |
| **2** | **Policy: Grandmaster Winners** | 120 | 17 | 83 | 20 | **58.5** | **48.8%** |
| **3** | **Policy: pawnGO All** | 120 | 15 | 81 | 24 | **55.5** | **46.2%** |
| **4** | **Policy: pawnGO Wins** | 120 | 11 | 83 | 26 | **52.5** | **43.8%** |
| **5** | **NNUE: pawnGO All** | 120 | 3 | 91 | 26 | **48.5** | **40.4%** |
| **6** | **NNUE: pawnGO Wins** | 120 | 2 | 88 | 30 | **46.0** | **38.3%** |
| **7** | **NNUE: Grandmaster Winners** | 120 | 1 | 76 | 43 | **39.0** | **32.5%** |

### Head-to-Head Crosstable

| Contestant | 1 | 2 | 3 | 4 | 5 | 6 | 7 | Total |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. pawnGO C++ Alpha-Beta** | — | 20.0/20 | 20.0/20 | 20.0/20 | 20.0/20 | 20.0/20 | 20.0/20 | **120.0** |
| **2. Policy: Grandmaster Winners** | 0.0/20 | — | 10.5/20 | 11.0/20 | 11.5/20 | 12.5/20 | 13.0/20 | **58.5** |
| **3. Policy: pawnGO All** | 0.0/20 | 9.5/20 | — | 10.5/20 | 11.5/20 | 10.5/20 | 13.5/20 | **55.5** |
| **4. Policy: pawnGO Wins** | 0.0/20 | 9.0/20 | 9.5/20 | — | 9.5/20 | 10.5/20 | 14.0/20 | **52.5** |
| **5. NNUE: pawnGO All** | 0.0/20 | 8.5/20 | 8.5/20 | 10.5/20 | — | 10.5/20 | 10.5/20 | **48.5** |
| **6. NNUE: pawnGO Wins** | 0.0/20 | 7.5/20 | 9.5/20 | 9.5/20 | 9.5/20 | — | 10.0/20 | **46.0** |
| **7. NNUE: Grandmaster Winners** | 0.0/20 | 7.0/20 | 6.5/20 | 6.0/20 | 9.5/20 | 10.0/20 | — | **39.0** |

Complete tournament game records are available in `arena_tournament.pgn` and `arena_tournament.json`.

---

## 8. License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
