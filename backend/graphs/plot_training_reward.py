from __future__ import annotations

import sys
from pathlib import Path
from typing import cast

import matplotlib.pyplot as plt
import numpy as np
import numpy.typing as npt

from common import resolve_models_dir

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

OUTPUT_DIR = Path(__file__).resolve().parent / "outputs"
OUTPUT_DIR.mkdir(exist_ok=True)
MODELS_DIR = resolve_models_dir()
MODEL_PATH = MODELS_DIR / "hunter_wumpus_model"
EVAL_PATH = MODELS_DIR / "evaluations.npz"


def rolling_mean(values: npt.NDArray[np.float64], window: int = 10) -> npt.NDArray[np.float64]:
    if len(values) < window:
        return values
    kernel = np.ones(window, dtype=float) / float(window)
    return cast(npt.NDArray[np.float64], np.convolve(values, kernel, mode="valid"))


def main() -> None:
    data = np.load(EVAL_PATH)
    timesteps = data["timesteps"]
    results = data["results"]

    mean_reward = results.mean(axis=1)
    std_reward = results.std(axis=1)
    window = 10
    smooth_reward = rolling_mean(mean_reward, window=window)
    smooth_timesteps = timesteps[window - 1 :]

    plt.style.use("dark_background")
    fig, ax = plt.subplots(figsize=(10, 6))

    base_color = "#ff8c00"
    trend_color = "#ffbf00"

    ax.plot(timesteps, mean_reward, color=base_color, linewidth=2, label="Mean Reward")
    ax.fill_between(
        timesteps,
        mean_reward - std_reward,
        mean_reward + std_reward,
        color=base_color,
        alpha=0.2,
        label="±1 Std Dev",
    )
    ax.plot(
        smooth_timesteps,
        smooth_reward,
        color=trend_color,
        linewidth=2.5,
        label="10-Point Rolling Mean",
    )

    ax.set_title("PPO Training Reward Curve — Wumpus vs Player")
    ax.set_xlabel("Timesteps")
    ax.set_ylabel("Mean Episode Reward")
    ax.legend()
    ax.grid(alpha=0.2)

    plt.tight_layout()
    output_path = OUTPUT_DIR / "training_reward.png"
    plt.savefig(output_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"Saved to {output_path}")


if __name__ == "__main__":
    main()
