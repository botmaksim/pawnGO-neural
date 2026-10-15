# pawnGO-Neural: High-Performance Chess Policy & NNUE Engine Suite

An enterprise-grade deep learning chess suite featuring 6 trained neural network models, an interactive 14-engine sandbox, strict FIDE move legalizers, Anarchy mode research tools, and quantized C++ SIMD export.

---

## 1. Architecture Overview

pawnGO-Neural provides two complementary neural architectures trained on the 9,750-game tournament gauntlet corpus:

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

All models reside in `models/` on the primary branch and are instantly hot-swappable in the interactive sandbox:

| Model File | Type | Training Dataset | Objective / Target | Key Metrics |
| :--- | :--- | :--- | :--- | :--- |
| `policy_pawngo_wins.pt` | PolicyNet | `dataset_pawngo_wins.npz` (285k pos) | Win move classification | Top-1: 25.0%, Top-3: 42.7%, Latency: 1.94 ms |
| `policy_pawngo_all.pt` | PolicyNet | `dataset_pawngo_all.npz` (484k pos) | Behavioral cloning avatar | Multi-style comprehensive coverage |
| `policy_winner_only.pt` | PolicyNet | `dataset_winner_only.npz` (534k pos) | Grandmaster winning moves | Pure victory pattern modeling |
| `nnue_pawngo_wins.pt` | NNUENet | `dataset_pawngo_wins.npz` (285k pos) | Position value evaluation | Correlation: r = 0.748, MAE: 94.6 cp |
| `nnue_pawngo_all.pt` | NNUENet | `dataset_pawngo_all.npz` (484k pos) | Global evaluation surface | Comprehensive evaluation across all phases |
| `nnue_winner_only.pt` | NNUENet | `dataset_winner_only.npz` (534k pos) | Dominant advantage scoring | High-confidence conversion evaluation |

---

## 3. Enterprise ML Best Practices

1. **Exponential Moving Average (EMA)**:
   - Shadow parameter decay rate $\alpha = 0.999$.
   - Eliminates batch-level stochastic fluctuations and optimizes validation loss variance. Saved as `*_ema.pt`.
2. **Learning Rate Optimization**:
   - 1-epoch Linear Warmup followed by Cosine Annealing decay down to $\text{lr}_{\min} = 10^{-5}$.
3. **Gradient Norm Clipping**:
   - `torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)` applied at every step to eliminate exploding activations.
4. **Regularization**:
   - Policy: `CrossEntropyLoss(label_smoothing=0.03)` penalizes overconfidence on positions with multiple valid tactical candidate moves.
   - NNUE: `SmoothL1Loss(beta=0.1)` (Huber loss) protects against extreme tactical centipawn evaluation spikes.
5. **Leak-Free Game Stratification**:
   - Unique `game_ids` tracked alongside position tensors.
   - 90% Train / 10% Validation split executed exclusively on unique game boundaries (0% temporal or position autocorrelation leakage).
6. **Endgame Representation Boost**:
   - Sampling cap increased to 35 moves per game.
   - 100% of decisive winning conversion moves, pawn pushes, checks, captures, promotions, and king centralizations are preserved.
7. **Endgame Zeitnot Filtering & Decisive Focus**:
   - The underlying tournament data contains games played under severe blitz zeitnot (increment buffer of 0.05s to 0.10s), where clock depletion naturally forced shallower search depths (6-8 plies) and repetitive time-scramble maneuvers.
   - To prevent behavioral cloning of zeitnot inaccuracies, passive drawn shuffles are aggressively decimated, while 100% of high-conversion moves leading to decisive victory are retained.

---

## 4. Verification & Holdout Benchmark Suite

### Verification Suite (`verify_model.py`)
- **Trainable Parameters**: 8,704,192 (PolicyNet) / 102,689 (NNUENet).
- **Inference Latency**: **1.94 ms / position** (515 positions/sec on CPU single thread).
- **Canonical Tests**:
  - `[PASS]` Starting Position: 1. e4 (60.1%), 1. d4 (27.6%), 1. c4 (9.3%).
  - `[PASS]` Knight Fork Defense: Tactical defense identified in Top-2 candidate moves.
  - `[PASS]` Pawn Promotion: e8=Q verified in Top-3 candidate moves.
  - `[PASS]` MoveLegalizer: 100% FIDE legal move filtering guaranteed.

### 100-Position Holdout Benchmark (`benchmark_test_suite.py`)
Evaluated against Stockfish 17.1 ground truth across 30 openings, 40 middlegame tactics, and 30 endgames:
- **Top-1 Match Rate**: 28.0% (T=0.00) / 38.0% (T=0.10).
- **Top-3 Match Rate**: 59.0%.
- **Average Centipawn Loss (Openings)**: **12.0 cp**.
- **Blunders (> 150 cp)**: 14 / 100 positions.
- **Variance Minimizer**: Temperature sweep ($T \in [0.0, 0.5]$) identified optimal deviation minimum at **$T^* = 0.00$** ($\sigma = 246.8$ cp).

---

## 5. C++ NNUE Weight Export

Trained PyTorch weights are converted into quantized binary format compatible with the pawnGO C++ evaluator:

```bash
# Export quantized weights (int16 Feature Transformer + int8 Hidden Layers)
python3 export/export_nnue.py --model models/nnue_pawngo_wins.pt --out export/pawngo_nnue.bin --quantize
```

- **Output Size**: 196.4 KB (optimized for CPU cache and SIMD vector instructions).
- **Magic Header**: `PAWN` (format version 2).

---

## 6. Interactive Web Sandbox & 14-Engine Catalog

Launch the interactive laboratory:

```bash
python3 web/app.py
```
Navigate to `http://localhost:8080`.

### Features:
- **14 Engine Variants**:
  - `pawnGO C++ (Alpha-Beta)`
  - `Stockfish 17.1 (Grandmaster)`
  - `Policy: pawnGO Wins (Legal & Anarchy)`
  - `Policy: pawnGO All (Legal & Anarchy)`
  - `Policy: Grandmaster (Legal & Anarchy)`
  - `NNUE: pawnGO Wins (Legal & Anarchy)`
  - `NNUE: pawnGO All (Legal & Anarchy)`
  - `NNUE: Grandmaster (Legal & Anarchy)`
- **Interactive Move Legalizer**: Top-K candidate move prediction cards with probability badges and UCI/SAN notation.
- **Anarchy Mode**: Toggleable unmasked argmax allowing illegal moves, teleportation, piece placement, and custom research positions.
- **PGN Import/Export & Rollback Branching**: Upload any standard PGN or step back to explore alternate variations.

---

## 7. Round-Robin Arena Tournament (420 Games)

A round-robin tournament was conducted between the master C++ alpha-beta engine (`pawnGO`) and all 6 legal neural network configurations (7 participants, 20 games per pair, 420 games total across 12 CPU workers):

### Leaderboard & Standings

| Rank | Engine | Played | Wins | Draws | Losses | Score (Pts) | Score % |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | **pawnGO C++ (Alpha-Beta)** | 120 | 120 | 0 | 0 | **120.0** | **100.0%** |
| **2** | **Policy: Grandmaster Winners** | 120 | 17 | 83 | 20 | **58.5** | **48.8%** |
| **3** | **Policy: pawnGO All** | 120 | 15 | 81 | 24 | **55.5** | **46.2%** |
| **4** | **Policy: pawnGO Wins** | 120 | 11 | 83 | 26 | **52.5** | **43.8%** |
| **5** | **NNUE: pawnGO All** | 120 | 3 | 91 | 26 | **48.5** | **40.4%** |
| **6** | **NNUE: pawnGO Wins** | 120 | 2 | 88 | 30 | **46.0** | **38.3%** |
| **7** | **NNUE: Grandmaster Winners** | 120 | 1 | 76 | 43 | **39.0** | **32.5%** |

### Head-to-Head Crosstable

| Contestant | 1 | 2 | 3 | 4 | 5 | 6 | 7 | Total Pts |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. pawnGO C++ (Alpha-Beta)** | — | 20.0/20 | 20.0/20 | 20.0/20 | 20.0/20 | 20.0/20 | 20.0/20 | **120.0** |
| **2. Policy: Grandmaster Winners** | 0.0/20 | — | 10.5/20 | 11.0/20 | 11.5/20 | 12.5/20 | 13.0/20 | **58.5** |
| **3. Policy: pawnGO All** | 0.0/20 | 9.5/20 | — | 10.5/20 | 11.5/20 | 10.5/20 | 13.5/20 | **55.5** |
| **4. Policy: pawnGO Wins** | 0.0/20 | 9.0/20 | 9.5/20 | — | 9.5/20 | 10.5/20 | 14.0/20 | **52.5** |
| **5. NNUE: pawnGO All** | 0.0/20 | 8.5/20 | 8.5/20 | 10.5/20 | — | 10.5/20 | 10.5/20 | **48.5** |
| **6. NNUE: pawnGO Wins** | 0.0/20 | 7.5/20 | 9.5/20 | 9.5/20 | 9.5/20 | — | 10.0/20 | **46.0** |
| **7. NNUE: Grandmaster Winners** | 0.0/20 | 7.0/20 | 6.5/20 | 6.0/20 | 9.5/20 | 10.0/20 | — | **39.0** |

All tournament game records are available in `arena_tournament.pgn` and `arena_tournament.json`.

