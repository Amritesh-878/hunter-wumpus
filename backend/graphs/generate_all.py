from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

from common import resolve_models_dir

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

MODELS_DIR = resolve_models_dir()
MODEL_PATH = MODELS_DIR / "hunter_wumpus_model"
OUTPUT_DIR = Path(__file__).resolve().parent / "outputs"
OUTPUT_DIR.mkdir(exist_ok=True)


def main() -> None:
    scripts = [
        "plot_training_reward.py",
        "plot_episode_length.py",
        "plot_reward_distribution.py",
        "run_episodes.py",
        "plot_wumpus_positions.py",
    ]

    for script in scripts:
        print(f"Running {script}...")
        subprocess.run([sys.executable, script], check=True, cwd=os.path.dirname(__file__))

    print("All graphs generated in backend/graphs/outputs/")


if __name__ == "__main__":
    main()
