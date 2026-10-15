#!/usr/bin/env python3
"""
Policy Network architecture for pawnGO-neural.
Predicts move probabilities from 14x8x8 board representation.
Can run in Strict Legal mode or Anarchy Hallucination mode!
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import chess
import numpy as np

class SEBlock(nn.Module):
    """Squeeze-and-Excitation block for channel-wise attention across board features."""
    def __init__(self, channels, reduction=8):
        super().__init__()
        self.fc1 = nn.Linear(channels, channels // reduction, bias=False)
        self.fc2 = nn.Linear(channels // reduction, channels, bias=False)

    def forward(self, x):
        b, c, _, _ = x.size()
        y = x.mean(dim=(2, 3))  # Global average pooling over 8x8
        y = F.relu(self.fc1(y))
        y = torch.sigmoid(self.fc2(y)).view(b, c, 1, 1)
        return x * y

class ResBlock(nn.Module):
    def __init__(self, channels):
        super().__init__()
        self.conv1 = nn.Conv2d(channels, channels, kernel_size=3, padding=1, bias=False)
        self.bn1 = nn.BatchNorm2d(channels)
        self.conv2 = nn.Conv2d(channels, channels, kernel_size=3, padding=1, bias=False)
        self.bn2 = nn.BatchNorm2d(channels)
        self.se = SEBlock(channels, reduction=8)

    def forward(self, x):
        residual = x
        out = F.relu(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))
        out = self.se(out)
        out += residual
        return F.relu(out)

class PolicyNet(nn.Module):
    def __init__(self, in_channels=16, num_filters=64, num_blocks=4, num_actions=4096):
        super().__init__()
        # Initial feature extractor
        self.conv_in = nn.Conv2d(in_channels, num_filters, kernel_size=3, padding=1, bias=False)
        self.bn_in = nn.BatchNorm2d(num_filters)

        # Residual backbone with SE attention
        self.res_blocks = nn.ModuleList([ResBlock(num_filters) for _ in range(num_blocks)])

        # Policy Head
        self.policy_conv = nn.Conv2d(num_filters, 32, kernel_size=1, bias=False)
        self.policy_bn = nn.BatchNorm2d(32)
        self.policy_fc = nn.Linear(32 * 8 * 8, num_actions)

    def forward(self, x):
        out = F.relu(self.bn_in(self.conv_in(x)))
        for block in self.res_blocks:
            out = block(out)

        # Policy head
        p = F.relu(self.policy_bn(self.policy_conv(out)))
        p = p.view(p.size(0), -1)
        logits = self.policy_fc(p)
        return logits

    @torch.no_grad()
    def select_move(self, board: chess.Board, device="cpu", temperature=0.0, legal_only=True):
        """
        Selects move for a chess.Board position.
        If legal_only is True: masks out illegal moves.
        If legal_only is False: pure anarchy mode, allows free-form moves!
        """
        from data.extract_pgn import board_to_planes
        from models.legalizer import MoveLegalizer

        self.eval()
        planes = board_to_planes(board)
        tensor = torch.from_numpy(planes).unsqueeze(0).to(device)
        logits = self(tensor)[0]  # Shape: (4096,)

        move, is_legal, confidence = MoveLegalizer.sample_move(
            logits, board, temperature=temperature, anarchy=not legal_only
        )
        return move
