from __future__ import annotations

import sys
from pathlib import Path
from typing import cast

import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns  # type: ignore[import-untyped]
from numpy.typing import NDArray
from stable_baselines3 import PPO

from common import resolve_models_dir

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from rl.env import HunterWumpusEnv

OUTPUT_DIR = Path(__file__).resolve().parent / "outputs"
OUTPUT_DIR.mkdir(exist_ok=True)
MODELS_DIR = resolve_models_dir()
MODEL_PATH = MODELS_DIR / "hunter_wumpus_model"


def collect_final_positions(num_episodes: int = 500, size: int = 4) -> NDArray[np.int_]:
    model = PPO.load(str(MODEL_PATH))
    env = HunterWumpusEnv(size=size)
    heat = np.zeros((size, size), dtype=np.int_)

    for _ in range(num_episodes):
        obs, _ = env.reset()
        done = False

        while not done:
            action, _ = model.predict(obs, deterministic=True)
            obs, _, terminated, truncated, _ = env.step(int(action))
            done = bool(terminated or truncated)

        wumpus_pos = env.engine.wumpus_pos
        heat[wumpus_pos.y, wumpus_pos.x] += 1

    env.close()
    return cast(NDArray[np.int_], heat)


def main() -> None:
    heat = collect_final_positions(num_episodes=500, size=4)

    plt.style.use("dark_background")
    fig, ax = plt.subplots(figsize=(10, 6))

    cmap = sns.color_palette("rocket", as_cmap=True)
    sns.heatmap(
        heat,
        annot=True,
        fmt="d",
        cmap=cmap,
        linewidths=0.5,
        linecolor="#222222",
        cbar=True,
        square=True,
        ax=ax,
    )

    ax.set_title("Wumpus Final Position Heatmap (500 episodes)")
    ax.set_xlabel("X Position")
    ax.set_ylabel("Y Position")

    plt.tight_layout()
    output_path = OUTPUT_DIR / "wumpus_heatmap.png"
    plt.savefig(output_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"Saved to {output_path}")


if __name__ == "__main__":
    main()
