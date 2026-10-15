#!/usr/bin/env python3
"""
PyTorch Dataset loader for extracted chess positions.
"""

import numpy as np
import torch
from torch.utils.data import Dataset, DataLoader

class ChessPositionDataset(Dataset):
    def __init__(self, npz_path, indices=None, transform=None):
        data = np.load(npz_path)
        if indices is not None:
            self.boards = data["boards"][indices]
            self.moves = data["moves"][indices]
            self.evals = data["evals"][indices]
            self.results = data["results"][indices]
        else:
            self.boards = data["boards"]
            self.moves = data["moves"]
            self.evals = data["evals"]
            self.results = data["results"]
        self.transform = transform

    def __len__(self):
        return len(self.moves)

    def __getitem__(self, idx):
        board = torch.from_numpy(self.boards[idx])
        move = torch.tensor(self.moves[idx], dtype=torch.long)
        eval_score = torch.tensor(self.evals[idx], dtype=torch.float32)
        result = torch.tensor(self.results[idx], dtype=torch.float32)

        if self.transform:
            board = self.transform(board)

        return board, move, eval_score, result

def get_loaders(npz_path, batch_size=256, val_split=0.1, num_workers=2):
    data = np.load(npz_path)
    total_len = len(data["moves"])

    # Google ML Best Practice: Game-level stratification prevents position autocorrelation leakage
    if "game_ids" in data:
        game_ids = data["game_ids"]
        unique_games = np.unique(game_ids)
        rng = np.random.RandomState(42)
        shuffled_games = rng.permutation(unique_games)
        n_val_games = max(1, int(len(shuffled_games) * val_split))
        val_game_set = set(shuffled_games[:n_val_games])

        val_mask = np.isin(game_ids, list(val_game_set))
        val_indices = np.where(val_mask)[0]
        train_indices = np.where(~val_mask)[0]

        train_ds = ChessPositionDataset(npz_path, indices=train_indices)
        val_ds = ChessPositionDataset(npz_path, indices=val_indices)
    else:
        dataset = ChessPositionDataset(npz_path)
        val_len = int(total_len * val_split)
        train_len = total_len - val_len
        train_ds, val_ds = torch.utils.data.random_split(dataset, [train_len, val_len])

    train_loader = DataLoader(
        train_ds,
        batch_size=batch_size,
        shuffle=True,
        num_workers=num_workers,
        pin_memory=True
    )

    val_loader = DataLoader(
        val_ds,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=True
    )

    return train_loader, val_loader
