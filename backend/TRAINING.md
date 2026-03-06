# Training Models for Difficulty Tiers

All models are trained on the **10×10 grid** with **2 pits**, matching the gameplay environment.

## Prerequisites

Activate the virtual environment:

```bash
cd backend
../.venv/Scripts/activate  # Windows
# or: source ../.venv/bin/activate  # Linux/macOS
```

## Training Commands

Run each command from the `backend/` directory:

```bash
# Easy — 50k steps (~5 min on GPU)
python -m rl.train --steps 50000 --output models/easy.zip

# Medium — 250k steps (~20 min on GPU)
python -m rl.train --steps 250000 --output models/medium.zip

# Hard — 1M steps (~1-2 hours on GPU)
python -m rl.train --steps 1000000 --output models/hard.zip

# Impossible — 2M steps (~3-4 hours on GPU)
python -m rl.train --steps 2000000 --output models/impossible.zip
```

## How It Works

- `--steps` controls total PPO timesteps (more steps = smarter Wumpus).
- `--output` sets the output `.zip` path relative to the working directory.
- `--seed` (optional, default 42) sets the random seed for reproducibility.

The model registry (`rl/model_registry.py`) maps difficulty tiers to these files:

| Difficulty       | Model File         |
| ---------------- | ------------------ |
| easy             | `models/easy.zip`  |
| medium           | `models/medium.zip`|
| hard             | `models/hard.zip`  |
| impossible_i     | `models/impossible.zip` |
| impossible_ii    | `models/impossible.zip` |
| impossible_iii   | `models/impossible.zip` |

If a model file is missing, the game falls back to a **random agent** — no crash.

## Smoke Test

To verify training code works without waiting hours:

```bash
python -m rl.train --steps 100 --output models/smoke_test.zip
del models\smoke_test.zip  # Clean up
```
