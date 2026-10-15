#!/usr/bin/env python3
"""
Export trained PyTorch NNUE weights into a binary format compatible with pawnGO C++ evaluator.
Supports:
- Raw float32 binary format
- Quantized int16/int8 format for ultra-fast SIMD evaluation
"""

import os
import sys
import argparse
import struct
import torch
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from models.nnue_net import NNUENet

def export_nnue_binary(model_path: str, output_path: str, quantize: bool = False):
    model = NNUENet()
    state_dict = torch.load(model_path, map_location="cpu")
    model.load_state_dict(state_dict)
    model.eval()

    ft_weight = model.ft.weight.detach().numpy()  # (128, 768)
    ft_bias = model.ft.bias.detach().numpy()      # (128,)
    fc1_weight = model.fc1.weight.detach().numpy() # (32, 128)
    fc1_bias = model.fc1.bias.detach().numpy()     # (32,)
    fc2_weight = model.fc2.weight.detach().numpy() # (1, 32)
    fc2_bias = model.fc2.bias.detach().numpy()     # (1,)

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

    with open(output_path, "wb") as f:
        # Magic header: "PAWN" + version 1
        f.write(b"PAWN")
        f.write(struct.pack("<I", 1 if not quantize else 2))  # format version

        if not quantize:
            # Write float32 arrays directly
            ft_weight.astype(np.float32).tofile(f)
            ft_bias.astype(np.float32).tofile(f)
            fc1_weight.astype(np.float32).tofile(f)
            fc1_bias.astype(np.float32).tofile(f)
            fc2_weight.astype(np.float32).tofile(f)
            fc2_bias.astype(np.float32).tofile(f)
        else:
            # Quantize: FT to int16 (scale 255), FC to int8
            SCALE_FT = 255.0
            SCALE_FC = 64.0
            ft_w_q = np.clip(np.round(ft_weight * SCALE_FT), -32767, 32767).astype(np.int16)
            ft_b_q = np.clip(np.round(ft_bias * SCALE_FT), -32767, 32767).astype(np.int16)
            fc1_w_q = np.clip(np.round(fc1_weight * SCALE_FC), -127, 127).astype(np.int8)
            fc1_b_q = np.clip(np.round(fc1_bias * (SCALE_FT * SCALE_FC)), -2147483647, 2147483647).astype(np.int32)
            fc2_w_q = np.clip(np.round(fc2_weight * SCALE_FC), -127, 127).astype(np.int8)
            fc2_b_q = np.clip(np.round(fc2_bias * (SCALE_FC * SCALE_FC)), -2147483647, 2147483647).astype(np.int32)

            ft_w_q.tofile(f)
            ft_b_q.tofile(f)
            fc1_w_q.tofile(f)
            fc1_b_q.tofile(f)
            fc2_w_q.tofile(f)
            fc2_b_q.tofile(f)

    file_size_kb = os.path.getsize(output_path) / 1024
    print(f"Exported NNUE weights to {output_path} ({file_size_kb:.1f} KB, quantize={quantize})")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Export NNUE weights for pawnGO C++ engine")
    parser.add_argument("--model", default="models/nnue_best.pt", help="Path to PyTorch .pt model")
    parser.add_argument("--out", default="export/pawngo_nnue.bin", help="Output binary file path")
    parser.add_argument("--quantize", action="store_true", help="Quantize to int16/int8")
    args = parser.parse_args()

    export_nnue_binary(args.model, args.out, quantize=args.quantize)
