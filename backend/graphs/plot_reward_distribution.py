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
    rewards = data["results"]

    random_rewards = rewards[0]
    trained_rewards = rewards[-1]

    plt.style.use("dark_background")
    fig, axes = plt.subplots(1, 2, figsize=(12, 5), sharey=True)

    global_min = float(np.min(rewards))
    global_max = float(np.max(rewards))
    bins = np.linspace(global_min, global_max, 12)

    axes[0].hist(random_rewards, bins=bins, color="#d32f2f", alpha=0.85, edgecolor="white")
    axes[0].set_title(f"Random Baseline ({int(timesteps[0]):,} steps)")
    axes[0].set_xlabel("Episode Reward")
    axes[0].set_ylabel("Frequency")
    axes[0].grid(alpha=0.2)
    axes[0].set_xlim(global_min, global_max)

    axes[1].hist(trained_rewards, bins=bins, color="#ffb300", alpha=0.9, edgecolor="white")
    axes[1].set_title(f"Trained Policy ({int(timesteps[-1]):,} steps)")
    axes[1].set_xlabel("Episode Reward")
    axes[1].grid(alpha=0.2)
    axes[1].set_xlim(global_min, global_max)

    fig.suptitle("Reward Distribution: Random vs Trained Policy", fontsize=14)

    plt.tight_layout()
    output_path = OUTPUT_DIR / "reward_distribution.png"
    plt.savefig(output_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"Saved to {output_path}")


if __name__ == "__main__":
    main()
