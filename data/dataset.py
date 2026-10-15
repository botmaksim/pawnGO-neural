#!/usr/bin/env python3
"""
PyTorch Dataset loader for extracted chess positions.
"""

import numpy as np
import torch
from torch.utils.data import Dataset, DataLoader

class ChessPositionDataset(Dataset):
    def __init__(self, npz_path, transform=None):
        data = np.load(npz_path)
        self.boards = data["boards"]    # Shape: (N, 14, 8, 8)
        self.moves = data["moves"]      # Shape: (N,) target move in [0, 4095]
        self.evals = data["evals"]      # Shape: (N,) eval in [-1.0, 1.0]
        self.results = data["results"]  # Shape: (N,) outcome in {1.0, 0.5, 0.0}
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
    dataset = ChessPositionDataset(npz_path)
    total_len = len(dataset)
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
