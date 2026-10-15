# pawnGO-Neural: Interactive Sandbox & Arena

Interactive multi-engine chess laboratory and anarchy testing playground.

## Key Features

1. **Free-Form Anarchy Chess Moves**:
   - Move any piece to any square on the board without legality constraints.
   - Capture, jump, or place kings adjacently.
   - Drag new pieces from the palette to spawn multiple queens, kings, or custom tactical setups.

2. **Dynamic Turn Detection & Evaluation**:
   - The sandbox automatically tracks who made the last move:
     - Moved a White piece -> Side to move becomes **Black** (`b`).
     - Moved a Black piece -> Side to move becomes **White** (`w`).
   - Manual override toggle (`Flip Turn`) to test either side's perspective.

3. **Dual Thermometer Evaluation**:
   - Switch between evaluation backends in real time:
     - **Stockfish 17.1**: Strict Grandmaster evaluation.
     - **pawnGO C++**: Hand-crafted evaluation (HCE) from our custom C++ engine.
   - Smooth animated thermometer with numeric centipawn / mate display.

4. **8-Engine Comparison Matrix**:
   - Select multiple engines and compare their candidate moves and evaluations simultaneously on the current position:
     - **pawnGO (C++ Engine)**: Alpha-beta search engine with PVS and TT.
     - **Stockfish 17.1**: World champion reference engine.
     - **Policy: pawnGO (All Moves)**: Behavioral clone of pawnGO.
     - **Policy: pawnGO (Wins & Draws)**: Trained on pawnGO positive performance.
     - **Policy: Grandmaster (Winners & Draws)**: Trained on all winners of the tournament.
     - **NNUE: pawnGO (All Moves)**: 768 -> 128 -> 32 -> 1 Value net.
     - **NNUE: pawnGO (Wins & Draws)**: Value net trained on pawnGO positive results.
     - **NNUE: Grandmaster (Winners & Draws)**: Value net trained on grandmaster positions.

---

## Quick Start

### 1. Requirements
Ensure dependencies are installed:
```bash
uv pip install -r requirements.txt
# Requires: fastapi, uvicorn, chess, torch, numpy
```

### 2. Configure Engine Paths
Edit `web/engines_config.json` if your binary paths differ:
```json
{
  "stockfish_path": "stockfish",
  "pawngo_path": "/home/maksim/Programming/Projects/finished/pawnGO/engine/build/pawnGO"
}
```

### 3. Launch the Sandbox
```bash
python3 web/app.py
```
Open **`http://localhost:8080`** in your browser.

---

## Switching Branches

* For the **ML Core** (dataset extraction, model training pipelines, NNUE weight export), switch to `main`:
  ```bash
  git checkout main
  ```
