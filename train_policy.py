#!/usr/bin/env python3
"""
Train the Policy Network on extracted tournament games.
"""

import os
import argparse
import torch
import torch.nn as nn
import torch.optim as optim
from tqdm import tqdm
from data.dataset import get_loaders
from models.policy_net import PolicyNet

def train_policy(data_path, epochs=10, batch_size=256, lr=1e-3, device=None, save_path="models/policy_best.pt"):
    if device is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Training Policy Network on {device} (Epochs: {epochs}, Batch Size: {batch_size})")

    train_loader, val_loader = get_loaders(data_path, batch_size=batch_size)
    print(f"Training positions: {len(train_loader.dataset):,}, Validation: {len(val_loader.dataset):,}")

    model = PolicyNet().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

    best_val_acc = 0.0
    os.makedirs(os.path.dirname(os.path.abspath(save_path)), exist_ok=True)

    for epoch in range(1, epochs + 1):
        model.train()
        train_loss = 0.0
        train_correct = 0
        total_train = 0

        pbar = tqdm(train_loader, desc=f"Epoch {epoch}/{epochs} [Train]")
        for boards, moves, _, _ in pbar:
            boards, moves = boards.to(device), moves.to(device)
            optimizer.zero_grad()
            logits = model(boards)
            loss = criterion(logits, moves)
            loss.backward()
            optimizer.step()

            train_loss += loss.item() * boards.size(0)
            preds = torch.argmax(logits, dim=-1)
            train_correct += (preds == moves).sum().item()
            total_train += boards.size(0)

            pbar.set_postfix({
                "loss": f"{train_loss / total_train:.3f}",
                "acc": f"{train_correct / total_train * 100:.1f}%"
            })

        scheduler.step()
        train_acc = train_correct / total_train * 100

        # Validation
        model.eval()
        val_loss = 0.0
        val_correct = 0
        total_val = 0

        with torch.no_grad():
            for boards, moves, _, _ in val_loader:
                boards, moves = boards.to(device), moves.to(device)
                logits = model(boards)
                loss = criterion(logits, moves)
                val_loss += loss.item() * boards.size(0)
                preds = torch.argmax(logits, dim=-1)
                val_correct += (preds == moves).sum().item()
                total_val += boards.size(0)

        val_acc = val_correct / total_val * 100
        print(f"--> Epoch {epoch} Complete | Train Acc: {train_acc:.2f}%, Val Acc: {val_acc:.2f}% | Val Loss: {val_loss/total_val:.4f}")

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), save_path)
            print(f"    [*] Saved new best model to {save_path} (Val Acc: {val_acc:.2f}%)")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train Policy Network")
    parser.add_argument("--data", default="data/chess_dataset.npz", help="Path to preprocessed dataset")
    parser.add_argument("--epochs", type=int, default=10, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=256, help="Batch size")
    parser.add_argument("--lr", type=float, default=1e-3, help="Learning rate")
    parser.add_argument("--save", default="models/policy_best.pt", help="Checkpoint save path")
    args = parser.parse_args()

    train_policy(args.data, epochs=args.epochs, batch_size=args.batch_size, lr=args.lr, save_path=args.save)
