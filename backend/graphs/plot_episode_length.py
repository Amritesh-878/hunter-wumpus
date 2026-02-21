from __future__ import annotations

import sys
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np

from common import resolve_models_dir

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

OUTPUT_DIR = Path(__file__).resolve().parent / "outputs"
OUTPUT_DIR.mkdir(exist_ok=True)
MODELS_DIR = resolve_models_dir()
MODEL_PATH = MODELS_DIR / "hunter_wumpus_model"
EVAL_PATH = MODELS_DIR / "evaluations.npz"


def main() -> None:
    data = np.load(EVAL_PATH)
    timesteps = data["timesteps"]
    ep_lengths = data["ep_lengths"]

    mean_length = ep_lengths.mean(axis=1)
    std_length = ep_lengths.std(axis=1)

    plt.style.use("dark_background")
    fig, ax = plt.subplots(figsize=(10, 6))

    base_color = "#00bcd4"

    ax.plot(timesteps, mean_length, color=base_color, linewidth=2.2, label="Mean Episode Length")
    ax.fill_between(
        timesteps,
        mean_length - std_length,
        mean_length + std_length,
        color=base_color,
        alpha=0.25,
        label="±1 Std Dev",
    )

    ax.set_title("Mean Episode Length During Training")
    ax.set_xlabel("Timesteps")
    ax.set_ylabel("Mean Episode Length (steps)")
    ax.legend()
    ax.grid(alpha=0.2)
    ax.text(
        0.02,
        0.95,
        "Very short episodes (2–3 steps) suggest fast Wumpus interception.",
        transform=ax.transAxes,
        fontsize=10,
        verticalalignment="top",
        color="#9be7f3",
    )

    plt.tight_layout()
    output_path = OUTPUT_DIR / "episode_length.png"
    plt.savefig(output_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"Saved to {output_path}")


if __name__ == "__main__":
    main()
