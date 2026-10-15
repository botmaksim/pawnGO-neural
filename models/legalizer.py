#!/usr/bin/env python3
"""
Move Legalizer and Action Masking Module for pawnGO-Neural.
Provides:
- Strict FIDE legal move masking on policy distribution (setting illegal move logits to -1e9).
- Probability renormalization over legal moves.
- Top-K move ranking with UCI and SAN notations.
- Anarchy Mode support (unmasked raw distribution with illegal move detection).
- Promotion inference ensuring pawn moves to rank 8/rank 1 produce valid promotions.
"""

from typing import List, Dict, Tuple, Optional
import chess
import numpy as np
import torch
import torch.nn.functional as F

def move_to_index(move: chess.Move) -> int:
    """Converts chess.Move to integer index in [0, 4095] (from_sq * 64 + to_sq)."""
    return move.from_square * 64 + move.to_square

def index_to_move(idx: int, board: chess.Board) -> chess.Move:
    """Converts integer index in [0, 4095] back to chess.Move with queen promotion inference."""
    from_sq = idx // 64
    to_sq = idx % 64
    move = chess.Move(from_sq, to_sq)
    if move in board.legal_moves:
        return move
    promo_move = chess.Move(from_sq, to_sq, promotion=chess.QUEEN)
    if promo_move in board.legal_moves:
        return promo_move
    return move

class MoveLegalizer:
    """
    Applies legal move filtering, masking, and probability extraction on neural logits.
    """

    @staticmethod
    def get_legal_indices(board: chess.Board) -> List[int]:
        """Returns list of unique action indices for all currently legal moves."""
        indices = set()
        for m in board.legal_moves:
            indices.add(move_to_index(m))
        return sorted(list(indices))

    @classmethod
    def mask_logits(
        cls,
        logits: torch.Tensor,
        board: chess.Board,
        fill_value: float = -1e9
    ) -> torch.Tensor:
        """
        Masks out all illegal move logits by setting them to fill_value (-1e9).
        If board has no legal moves (terminal state), returns original logits.
        """
        legal_indices = cls.get_legal_indices(board)
        if not legal_indices:
            return logits

        masked = torch.full_like(logits, fill_value)
        masked[..., legal_indices] = logits[..., legal_indices]
        return masked

    @classmethod
    def get_probabilities(
        cls,
        logits: torch.Tensor,
        board: chess.Board,
        temperature: float = 1.0,
        anarchy: bool = False
    ) -> torch.Tensor:
        """
        Returns normalized probability distribution across 4096 actions.
        If anarchy is False, illegal actions have exactly 0.0 probability.
        """
        if not anarchy:
            logits = cls.mask_logits(logits, board)

        temp = max(1e-4, temperature)
        probs = F.softmax(logits / temp, dim=-1)
        return probs

    @classmethod
    def sample_move(
        cls,
        logits: torch.Tensor,
        board: chess.Board,
        temperature: float = 0.0,
        anarchy: bool = False
    ) -> Tuple[chess.Move, bool, float]:
        """
        Selects a move from logits.
        Returns:
            move: chess.Move object
            is_legal: bool indicating if move conforms to FIDE rules
            confidence: float probability assigned to the chosen move
        """
        if not anarchy:
            masked_logits = cls.mask_logits(logits, board)
        else:
            masked_logits = logits

        if temperature <= 0.01:
            idx = int(torch.argmax(masked_logits).item())
            probs = F.softmax(masked_logits, dim=-1)
            confidence = float(probs[idx].item())
        else:
            probs = F.softmax(masked_logits / temperature, dim=-1)
            idx = int(torch.multinomial(probs, num_samples=1).item())
            confidence = float(probs[idx].item())

        move = index_to_move(idx, board)
        is_legal = move in board.legal_moves
        return move, is_legal, confidence

    @classmethod
    def rank_top_moves(
        cls,
        logits: torch.Tensor,
        board: chess.Board,
        top_k: int = 5,
        anarchy: bool = False
    ) -> List[Dict]:
        """
        Returns top-K candidate moves with rank, UCI, SAN, probability, and legality.
        """
        if not anarchy:
            effective_logits = cls.mask_logits(logits, board)
            valid_indices = cls.get_legal_indices(board)
            k = min(top_k, len(valid_indices))
        else:
            effective_logits = logits
            k = min(top_k, 4096)

        if k == 0:
            return []

        probs = F.softmax(effective_logits, dim=-1)
        top_probs, top_indices = torch.topk(probs, k=k)

        results = []
        for rank, (p, idx_tensor) in enumerate(zip(top_probs, top_indices), start=1):
            idx = int(idx_tensor.item())
            move = index_to_move(idx, board)
            is_legal = move in board.legal_moves

            try:
                san = board.san(move) if is_legal else f"{chess.square_name(move.from_square)}->{chess.square_name(move.to_square)}*"
            except Exception:
                san = move.uci()

            results.append({
                "rank": rank,
                "move_uci": move.uci(),
                "san": san,
                "probability": float(p.item()),
                "is_legal": is_legal,
                "action_idx": idx
            })

        return results
