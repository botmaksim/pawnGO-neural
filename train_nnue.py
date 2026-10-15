#!/usr/bin/env python3
"""
Train NNUE / Value Network on extracted tournament games.
Predicts position evaluation in [-1.0, 1.0].
"""

import os
import argparse
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from tqdm import tqdm
import chess
from models.nnue_net import NNUENet, board_to_halfkp_768

class NNUEDataset(Dataset):
    def __init__(self, data_path: str):
        data = np.load(data_path)
        # We can reconstruct 768-dim features from the 16x8x8 planes:
        # Planes 0-11 contain the 12 piece types on the 64 squares!
        # Shape: (N, 16, 8, 8) -> reshape piece planes (N, 12, 64) -> (N, 768)
        boards = data["boards"]  # (N, 16, 8, 8)
        piece_planes = boards[:, 0:12, :, :]  # (N, 12, 8, 8)
        # Transpose to (N, 8, 8, 12) -> reshape to (N, 64 * 12) = (N, 768)
        features = piece_planes.transpose(0, 2, 3, 1).reshape(-1, 768)
        self.features = torch.from_numpy(features).float()

        evals = torch.from_numpy(data["evals"]).float()
        results = torch.from_numpy(data["results"]).float()
        # Scale results from [0, 1] to [-1, 1]
        results_scaled = 2.0 * results - 1.0

        # Target is a blend of Stockfish referee evaluation and actual game result
        self.targets = 0.7 * evals + 0.3 * results_scaled

    def __len__(self):
        return len(self.features)

    def __getitem__(self, idx):
        return self.features[idx], self.targets[idx]

def get_nnue_loaders(data_path: str, batch_size=512, train_ratio=0.9):
    full_ds = NNUEDataset(data_path)
    train_size = int(train_ratio * len(full_ds))
    val_size = len(full_ds) - train_size
    train_ds, val_ds = torch.utils.data.random_split(full_ds, [train_size, val_size])
    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, drop_last=True)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False)
    return train_loader, val_loader

def train_nnue(data_path, epochs=10, batch_size=512, lr=1e-3, device=None, save_path="models/nnue_best.pt"):
    if device is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Training NNUE Value Network on {device} (Epochs: {epochs}, Batch Size: {batch_size})")

    train_loader, val_loader = get_nnue_loaders(data_path, batch_size=batch_size)
    print(f"Training samples: {len(train_loader.dataset):,}, Validation: {len(val_loader.dataset):,}")

    model = NNUENet().to(device)
    criterion = nn.SmoothL1Loss()  # Huber loss is robust against eval outliers
    optimizer = optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

    best_val_loss = float("inf")
    os.makedirs(os.path.dirname(os.path.abspath(save_path)), exist_ok=True)

    for epoch in range(1, epochs + 1):
        model.train()
        train_loss = 0.0
        total_train = 0

        pbar = tqdm(train_loader, desc=f"Epoch {epoch}/{epochs} [Train NNUE]")
        for feats, targets in pbar:
            feats, targets = feats.to(device), targets.to(device)
            optimizer.zero_grad()
            preds = model(feats)
            loss = criterion(preds, targets)
            loss.backward()
            optimizer.step()

            train_loss += loss.item() * feats.size(0)
            total_train += feats.size(0)
            pbar.set_postfix({"loss": f"{train_loss / total_train:.4f}"})

        scheduler.step()
        train_avg_loss = train_loss / total_train

        # Validation
        model.eval()
        val_loss = 0.0
        total_val = 0

        with torch.no_grad():
            for feats, targets in val_loader:
                feats, targets = feats.to(device), targets.to(device)
                preds = model(feats)
                loss = criterion(preds, targets)
                val_loss += loss.item() * feats.size(0)
                total_val += feats.size(0)

        val_avg_loss = val_loss / total_val
        print(f"--> Epoch {epoch} Complete | Train Loss: {train_avg_loss:.4f}, Val Loss: {val_avg_loss:.4f}")

        if val_avg_loss < best_val_loss:
            best_val_loss = val_avg_loss
            torch.save(model.state_dict(), save_path)
            print(f"    [*] Saved new best NNUE model to {save_path} (Val Loss: {val_avg_loss:.4f})")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train NNUE Value Network")
    parser.add_argument("--data", default="data/chess_dataset.npz", help="Path to preprocessed dataset")
    parser.add_argument("--epochs", type=int, default=10, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=512, help="Batch size")
    parser.add_argument("--lr", type=float, default=1e-3, help="Learning rate")
    parser.add_argument("--save", default="models/nnue_best.pt", help="Checkpoint save path")
    args = parser.parse_args()

    train_nnue(args.data, epochs=args.epochs, batch_size=args.batch_size, lr=args.lr, save_path=args.save)
