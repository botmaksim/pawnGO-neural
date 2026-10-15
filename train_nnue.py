#!/usr/bin/env python3
"""
Production Training Pipeline for NNUE / Value Network (pawnGO-Neural).
Enterprise ML Best Practices:
- Huber Loss (SmoothL1Loss) with optimal transition threshold.
- Linear Warmup followed by Cosine Annealing learning rate schedule.
- Gradient norm clipping (max_norm=1.0) to eliminate exploding activations.
- Exponential Moving Average (EMA) weight shadowing (decay=0.999).
- Evaluation correlation (Pearson r) and Centipawn MAE tracking.
- Multi-core CPU parallelization (14 worker threads).
- Game-stratified leak-free validation splitting.
- Structured JSON telemetry persistence.
"""

import os
import sys
import json
import copy
import argparse
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from tqdm import tqdm

from models.nnue_net import NNUENet

class NNUEDataset(Dataset):
    def __init__(self, data_path: str, indices=None):
        data = np.load(data_path)
        boards = data["boards"]  # (N, 16, 8, 8)
        piece_planes = boards[:, 0:12, :, :]  # (N, 12, 8, 8)
        # Transpose to (N, 8, 8, 12) -> reshape to (N, 768)
        features = piece_planes.transpose(0, 2, 3, 1).reshape(-1, 768)

        evals = data["evals"]
        results = data["results"]
        results_scaled = 2.0 * results - 1.0
        targets = 0.7 * evals + 0.3 * results_scaled

        if indices is not None:
            features = features[indices]
            targets = targets[indices]

        self.features = torch.from_numpy(features).float()
        self.targets = torch.from_numpy(targets).float()

    def __len__(self):
        return len(self.features)

    def __getitem__(self, idx):
        return self.features[idx], self.targets[idx]

def get_nnue_loaders(data_path: str, batch_size=512, val_split=0.1, num_workers=2):
    data = np.load(data_path)
    total_len = len(data["moves"])

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

        train_ds = NNUEDataset(data_path, indices=train_indices)
        val_ds = NNUEDataset(data_path, indices=val_indices)
    else:
        full_ds = NNUEDataset(data_path)
        train_size = int((1.0 - val_split) * len(full_ds))
        val_size = len(full_ds) - train_size
        train_ds, val_ds = torch.utils.data.random_split(full_ds, [train_size, val_size])

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, drop_last=True, num_workers=num_workers, pin_memory=True)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False, num_workers=num_workers, pin_memory=True)
    return train_loader, val_loader

class EMAModel:
    def __init__(self, model: nn.Module, decay: float = 0.999):
        self.decay = decay
        self.shadow = {}
        for name, param in model.named_parameters():
            if param.requires_grad:
                self.shadow[name] = param.data.clone()

    def update(self, model: nn.Module):
        for name, param in model.named_parameters():
            if param.requires_grad:
                new_val = (1.0 - self.decay) * param.data + self.decay * self.shadow[name]
                self.shadow[name] = new_val

    def apply_shadow(self, model: nn.Module):
        for name, param in model.named_parameters():
            if param.requires_grad:
                param.data.copy_(self.shadow[name])

def get_lr_scheduler(optimizer, warmup_epochs, total_epochs, base_lr, min_lr=1e-5):
    def lr_lambda(epoch):
        if epoch < warmup_epochs:
            return 0.1 + 0.9 * ((epoch + 1) / warmup_epochs)
        decay_ratio = (epoch - warmup_epochs) / max(1, total_epochs - warmup_epochs)
        coeff = 0.5 * (1.0 + np.cos(np.pi * decay_ratio))
        return min_lr / base_lr + (1.0 - min_lr / base_lr) * coeff
    return optim.lr_scheduler.LambdaLR(optimizer, lr_lambda)

def train_nnue(
    data_path: str,
    epochs: int = 10,
    batch_size: int = 512,
    lr: float = 1e-3,
    weight_decay: float = 1e-4,
    max_grad_norm: float = 1.0,
    ema_decay: float = 0.999,
    threads: int = 14,
    device: str = None,
    save_path: str = "models/nnue_best.pt"
):
    torch.set_num_threads(threads)
    if device is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"

    print("=" * 68)
    print("      pawnGO-Neural: High-Performance NNUE Value Pipeline       ")
    print("=" * 68)
    print(f"Dataset          : {data_path}")
    print(f"Device           : {device} (Threads: {threads})")
    print(f"Batch Size       : {batch_size}")
    print(f"Epochs           : {epochs}")
    print(f"Learning Rate    : {lr} (Warmup=1 epoch + Cosine Annealing)")
    print(f"Gradient Clip    : {max_grad_norm}")
    print(f"EMA Decay        : {ema_decay}")
    print(f"Target Save Path : {save_path}")

    train_loader, val_loader = get_nnue_loaders(data_path, batch_size=batch_size, num_workers=2)
    print(f"Dataset Samples  : Train = {len(train_loader.dataset):,}, Val = {len(val_loader.dataset):,}")

    model = NNUENet().to(device)
    ema = EMAModel(model, decay=ema_decay)

    criterion = nn.SmoothL1Loss(beta=0.1)
    optimizer = optim.AdamW(model.parameters(), lr=lr, weight_decay=weight_decay)
    scheduler = get_lr_scheduler(optimizer, warmup_epochs=1, total_epochs=epochs, base_lr=lr)

    best_val_loss = float("inf")
    history = []
    os.makedirs(os.path.dirname(os.path.abspath(save_path)), exist_ok=True)

    for epoch in range(1, epochs + 1):
        model.train()
        train_loss = 0.0
        total_train = 0
        grad_norms = []

        curr_lr = optimizer.param_groups[0]["lr"]
        pbar = tqdm(train_loader, desc=f"Epoch {epoch}/{epochs} [Train NNUE LR={curr_lr:.2e}]")
        for feats, targets in pbar:
            feats, targets = feats.to(device), targets.to(device)
            optimizer.zero_grad()

            preds = model(feats)
            loss = criterion(preds, targets)
            loss.backward()

            norm = torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=max_grad_norm)
            grad_norms.append(float(norm.item() if hasattr(norm, "item") else norm))

            optimizer.step()
            ema.update(model)

            train_loss += loss.item() * feats.size(0)
            total_train += feats.size(0)
            pbar.set_postfix({"loss": f"{train_loss / total_train:.4f}", "gnorm": f"{np.mean(grad_norms[-50:]):.2f}"})

        scheduler.step()
        train_avg_loss = train_loss / total_train

        # Validation
        val_loss, val_corr, val_mae_cp = evaluate_nnue(model, val_loader, criterion, device)
        print(f"--> Epoch {epoch:2d}/{epochs} | Train Loss: {train_avg_loss:.4f} | "
              f"Val Loss: {val_loss:.4f}, Correlation (r): {val_corr:.3f}, MAE: {val_mae_cp:.1f} cp")

        epoch_stats = {
            "epoch": epoch,
            "train_loss": round(train_avg_loss, 4),
            "val_loss": round(val_loss, 4),
            "val_corr": round(val_corr, 3),
            "val_mae_cp": round(val_mae_cp, 1),
            "lr": curr_lr,
            "avg_grad_norm": round(float(np.mean(grad_norms)), 3)
        }
        history.append(epoch_stats)

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            torch.save(model.state_dict(), save_path)
            print(f"    [*] Checkpoint Saved to {save_path} (Val Loss: {val_loss:.4f}, r: {val_corr:.3f})")

            # Also save EMA weights
            ema_path = save_path.replace(".pt", "_ema.pt")
            saved_weights = copy.deepcopy(model.state_dict())
            ema.apply_shadow(model)
            torch.save(model.state_dict(), ema_path)
            model.load_state_dict(saved_weights)

    # Save training telemetry to JSON
    telemetry_path = save_path.replace(".pt", "_history.json")
    with open(telemetry_path, "w") as fp:
        json.dump(history, fp, indent=2)
    print(f"Training telemetry saved to: {telemetry_path}")

def evaluate_nnue(model: nn.Module, loader, criterion, device):
    model.eval()
    total_loss = 0.0
    all_preds = []
    all_targets = []

    with torch.no_grad():
        for feats, targets in loader:
            feats, targets = feats.to(device), targets.to(device)
            preds = model(feats)
            loss = criterion(preds, targets)
            total_loss += loss.item() * feats.size(0)

            all_preds.append(preds.cpu().numpy())
            all_targets.append(targets.cpu().numpy())

    avg_loss = total_loss / len(loader.dataset)
    y_pred = np.concatenate(all_preds)
    y_true = np.concatenate(all_targets)

    # Pearson correlation coefficient
    corr_matrix = np.corrcoef(y_pred, y_true)
    corr = float(corr_matrix[0, 1]) if not np.isnan(corr_matrix[0, 1]) else 0.0

    # Approximate centipawn MAE (using win-rate reverse sigmoid scaling)
    pred_cp = -400.0 * np.log((2.0 / (np.clip(y_pred, -0.999, 0.999) + 1.0)) - 1.0 + 1e-7)
    true_cp = -400.0 * np.log((2.0 / (np.clip(y_true, -0.999, 0.999) + 1.0)) - 1.0 + 1e-7)
    mae_cp = float(np.mean(np.abs(pred_cp - true_cp)))

    return avg_loss, corr, mae_cp

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train NNUE Value Network with Enterprise ML Best Practices")
    parser.add_argument("--data", default="data/chess_dataset.npz", help="Path to preprocessed dataset")
    parser.add_argument("--epochs", type=int, default=10, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=512, help="Batch size")
    parser.add_argument("--lr", type=float, default=1e-3, help="Learning rate")
    parser.add_argument("--threads", type=int, default=14, help="CPU threads for parallel PyTorch computation")
    parser.add_argument("--save", default="models/nnue_best.pt", help="Checkpoint save path")
    args = parser.parse_args()

    train_nnue(
        args.data,
        epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr,
        threads=args.threads,
        save_path=args.save
    )
