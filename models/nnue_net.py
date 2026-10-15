#!/usr/bin/env python3
"""
NNUE / Value Network architecture for pawnGO-neural.
Implements a 768 -> 128x2 -> 32 -> 1 architecture compatible with pawnGO's evaluator.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import chess
import numpy as np

def board_to_halfkp_768(board: chess.Board) -> np.ndarray:
    """
    Encodes board into a 768-dimensional binary vector:
    64 squares * 12 piece types (White P,N,B,R,Q,K, Black p,n,b,r,q,k).
    """
    vec = np.zeros(768, dtype=np.float32)
    piece_map = board.piece_map()
    for sq, piece in piece_map.items():
        piece_type_idx = piece.piece_type - 1  # 0 to 5
        if piece.color == chess.BLACK:
            piece_type_idx += 6
        idx = sq * 12 + piece_type_idx
        vec[idx] = 1.0
    return vec

class NNUENet(nn.Module):
    def __init__(self, in_features=768, hidden_dim=128):
        super().__init__()
        # Feature Transformer (Accumulator layer)
        self.ft = nn.Linear(in_features, hidden_dim)

        # Output layers
        self.fc1 = nn.Linear(hidden_dim, 32)
        self.fc2 = nn.Linear(32, 1)

    def forward(self, x):
        # Clipped ReLU activation (standard NNUE quantization friendly)
        accum = torch.clamp(self.ft(x), 0.0, 1.0)
        h = F.relu(self.fc1(accum))
        out = self.fc2(h)
        return out.squeeze(-1)

    @torch.no_grad()
    def evaluate_board(self, board: chess.Board, device="cpu") -> float:
        """
        Evaluates a chess position.
        Returns score from the perspective of the side to move (in centipawns).
        """
        self.eval()
        feat = board_to_halfkp_768(board)
        tensor = torch.from_numpy(feat).unsqueeze(0).to(device)
        score_norm = self(tensor).item()  # score in [-1.0, 1.0]

        # Convert normalized score back to centipawns
        cp = -400.0 * np.log((2.0 / (score_norm + 1.0 + 1e-7)) - 1.0 + 1e-7)
        if board.turn == chess.BLACK:
            cp = -cp
        return round(float(cp), 1)

    @torch.no_grad()
    def select_best_move(self, board: chess.Board, device="cpu", allow_illegal: bool = False):
        """
        1-ply search using the NNUE evaluation to pick the best move.
        If allow_illegal is False: picks best move among strictly legal moves.
        If allow_illegal is True: Anarchy Greedy search across all possible piece moves!
        """
        if not allow_illegal:
            legal = list(board.legal_moves)
            if not legal:
                return None
            best_move = legal[0]
            best_score = -1e9
            for m in legal:
                board.push(m)
                score = -self.evaluate_board(board, device=device)
                board.pop()
                if score > best_score:
                    best_score = score
                    best_move = m
            return best_move

        # Anarchy Mode: any friendly piece can move/teleport to any square not occupied by own piece!
        piece_map = board.piece_map()
        my_color = board.turn
        my_squares = [sq for sq, p in piece_map.items() if p.color == my_color]
        if not my_squares:
            return None

        best_move = None
        best_score = -1e9

        for from_sq in my_squares:
            for to_sq in range(64):
                if to_sq == from_sq:
                    continue
                target_piece = piece_map.get(to_sq)
                if target_piece and target_piece.color == my_color:
                    continue  # Can't capture own piece

                # Construct virtual anarchy board
                virtual_board = board.copy(stack=False)
                p = virtual_board.remove_piece_at(from_sq)
                virtual_board.set_piece_at(to_sq, p)
                virtual_board.turn = not my_color

                score = -self.evaluate_board(virtual_board, device=device)
                if score > best_score:
                    best_score = score
                    best_move = chess.Move(from_sq, to_sq)

        return best_move
