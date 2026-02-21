# Wumpus Agent Training Graphs

These scripts analyze and visualize the trained PPO Wumpus agent.

## Setup

From the project root, activate the venv:

```bash
.venv/Scripts/activate  # Windows
source .venv/bin/activate  # Unix
```

## Generate All Graphs

```bash
cd backend/graphs
python generate_all.py
```

Output graphs are saved to `backend/graphs/outputs/`.

## Individual Scripts

- `plot_training_reward.py` — reward curve over 1M training steps
- `plot_episode_length.py` — episode length during training
- `plot_reward_distribution.py` — reward distribution: random vs trained policy
- `run_episodes.py` — run 100 live episodes, print win/loss stats
- `plot_wumpus_positions.py` — heatmap of Wumpus final positions

## Output Graphs Explained

### `training_reward.png`
- Plots mean evaluation reward at each checkpoint (`10k` to `1M` steps).
- Orange line: checkpoint mean over 20 evaluation episodes.
- Shaded band: ±1 standard deviation across those 20 episodes.
- Bright amber line: 10-point rolling mean trend (plotted only where the window is valid).
- Interpretation: upward movement means the Wumpus policy is improving; narrow variance means more consistent behavior.

### `episode_length.png`
- Plots mean episode length during training with ±1 standard deviation.
- Very low values (around 2–3 steps) indicate the Wumpus tends to end episodes quickly.
- Interpretation caveat: short episodes are efficient for a hunter policy, but may reduce match variety.

### `reward_distribution.png`
- Side-by-side histogram comparison:
	- Left: rewards at first checkpoint (`10k`, random/early policy behavior).
	- Right: rewards at final checkpoint (`1M`, trained policy).
- Both panels share identical bin edges and x-axis range for fair comparison.
- Interpretation: rightward shift of the trained distribution indicates improved policy quality.

### `episode_stats.json`
- Produced by `run_episodes.py` from 100 live rollout episodes.
- Includes:
	- outcome counts and rates (`PlayerLost_Wumpus`, `PlayerLost_Pit`, `PlayerWon`)
	- episode length summary (mean/std/min/max)
- Interpretation: provides concrete outcome frequencies beyond training-only metrics.

### `wumpus_heatmap.png`
- 4x4 heatmap from 500 episodes counting the Wumpus final position.
- Cell annotations are absolute counts; color intensity reflects frequency.
- Interpretation: reveals where the policy tends to finish interactions and potential positional bias.
