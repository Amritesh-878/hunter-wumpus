from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

import numpy as np
from stable_baselines3 import PPO

from common import resolve_models_dir

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from rl.env import HunterWumpusEnv

OUTPUT_DIR = Path(__file__).resolve().parent / "outputs"
OUTPUT_DIR.mkdir(exist_ok=True)
MODELS_DIR = resolve_models_dir()
MODEL_PATH = MODELS_DIR / "hunter_wumpus_model"


def summarize_stats(statuses: list[str], lengths: list[int]) -> dict[str, Any]:
    total = len(statuses)
    counts = {
        "PlayerLost_Wumpus": statuses.count("PlayerLost_Wumpus"),
        "PlayerLost_Pit": statuses.count("PlayerLost_Pit"),
        "PlayerWon": statuses.count("PlayerWon"),
        "Ongoing": statuses.count("Ongoing"),
        "Other": sum(1 for s in statuses if s not in {"PlayerLost_Wumpus", "PlayerLost_Pit", "PlayerWon", "Ongoing"}),
    }

    return {
        "episodes": total,
        "counts": counts,
        "rates": {
            "wumpus_catch_rate": counts["PlayerLost_Wumpus"] / total,
            "pit_rate": counts["PlayerLost_Pit"] / total,
            "player_escape_rate": counts["PlayerWon"] / total,
        },
        "episode_length": {
            "mean": float(np.mean(lengths)),
            "std": float(np.std(lengths)),
            "min": int(np.min(lengths)),
            "max": int(np.max(lengths)),
        },
    }


def print_summary_table(stats: dict[str, Any]) -> None:
    counts = stats["counts"]
    rates = stats["rates"]
    lengths = stats["episode_length"]

    print("\nEpisode Outcome Summary (100 episodes)")
    print("-" * 44)
    print(f"PlayerLost_Wumpus : {counts['PlayerLost_Wumpus']:>3} ({rates['wumpus_catch_rate']:.2%})")
    print(f"PlayerLost_Pit    : {counts['PlayerLost_Pit']:>3} ({rates['pit_rate']:.2%})")
    print(f"PlayerWon         : {counts['PlayerWon']:>3} ({rates['player_escape_rate']:.2%})")
    print(f"Ongoing/Other     : {counts['Ongoing'] + counts['Other']:>3}")
    print("-" * 44)
    print(
        "Episode Length -> "
        f"mean={lengths['mean']:.2f}, std={lengths['std']:.2f}, "
        f"min={lengths['min']}, max={lengths['max']}"
    )


def run_episodes(num_episodes: int = 100) -> dict[str, Any]:
    model = PPO.load(str(MODEL_PATH))
    env = HunterWumpusEnv(size=4)

    statuses: list[str] = []
    lengths: list[int] = []

    for _ in range(num_episodes):
        obs, _ = env.reset()
        done = False
        steps = 0
        final_status = "Ongoing"

        while not done:
            action, _ = model.predict(obs, deterministic=True)
            obs, _, terminated, truncated, info = env.step(int(action))
            steps += 1
            done = bool(terminated or truncated)
            final_status = str(info.get("status", "Ongoing"))

        statuses.append(final_status)
        lengths.append(steps)

    env.close()
    return summarize_stats(statuses=statuses, lengths=lengths)


def main() -> None:
    stats = run_episodes(num_episodes=100)
    print_summary_table(stats)

    output_path = OUTPUT_DIR / "episode_stats.json"
    with output_path.open("w", encoding="utf-8") as file:
        json.dump(stats, file, indent=2)
    print(f"Saved to {output_path}")


if __name__ == "__main__":
    main()
