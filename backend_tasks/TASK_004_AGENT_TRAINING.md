# TODO 004: Agent Training & Inference

## Overview

Write the scripts to actually train the Hunter Wumpus using a Deep Q-Network (DQN) or PPO, and save the resulting model weights.

## Goals

1. **Training Script**: Set up the learning loop using **Stable-Baselines3** (`pip install stable-baselines3>=2.3`). Do **not** use Ray RLlib unless SB3 proves insufficient — SB3 is simpler and sufficient for this grid size.
2. **Inference Function**: Create a clean callable that takes a raw game state dict, builds the observation vector, feeds it to the loaded model, and returns the Wumpus's next action as a `Direction` enum value.

---

## Files to Change

### Files to MODIFY (Create New)

1. `backend/rl/train.py` - **MAJOR** - The training execution script.
2. `backend/rl/agent.py` - **MINOR** - The class that loads the trained `.zip` or `.pt` model for gameplay.

---

## Implementation Approach

### Training Loop

**Library:** `stable-baselines3 >= 2.3`, `torch >= 2.2`

**Algorithm:** PPO (recommended over DQN for this task — the action space is small and PPO is more stable with the step penalties).

**Recommended Hyperparameters (starting point — tune if needed):**

```python
from stable_baselines3 import PPO
from backend.rl.env import HunterWumpusEnv

env = HunterWumpusEnv(size=4, num_pits=3)

model = PPO(
    policy="MlpPolicy",
    env=env,
    learning_rate=3e-4,
    n_steps=2048,
    batch_size=64,
    n_epochs=10,
    gamma=0.99,
    verbose=1,
    seed=42,
)

model.learn(total_timesteps=500_000)
model.save("backend/models/hunter_wumpus_model")
```

- Train for `500,000` timesteps as a baseline. Increase to `1,000,000` if the agent is not outperforming random.
- Save the best model using `EvalCallback` with `best_model_save_path="backend/models/"`.
- Do **not** hardcode the model path in `agent.py` — read it from an environment variable or a config constant.

### Inference (`backend/rl/agent.py`)

**Key Responsibilities:**

- `class WumpusAgent`: loads the saved model on `__init__`.
- `get_wumpus_action(obs: np.ndarray) -> Direction`: calls `model.predict(obs, deterministic=True)`, returns the corresponding `Direction` enum.
- The agent must be **stateless** between calls — all state lives in the game engine.

```python
from stable_baselines3 import PPO
import numpy as np
from backend.engine.entities import Direction

class WumpusAgent:
    def __init__(self, model_path: str = "backend/models/hunter_wumpus_model") -> None:
        self.model = PPO.load(model_path)

    def get_wumpus_action(self, obs: np.ndarray) -> Direction:
        action, _ = self.model.predict(obs, deterministic=True)
        return Direction(int(action))
```

---

## Acceptance Criteria

- [ ] `train.py` runs end-to-end without errors and produces a `.zip` model file at `backend/models/`.
- [ ] `agent.py` loads the model and calls `get_wumpus_action` without raising exceptions.
- [ ] After training, the agent's **mean episode reward** exceeds that of a random-action agent by at least `+20` over 100 evaluation episodes (measure using `stable_baselines3.common.evaluation.evaluate_policy`).
- [ ] `WumpusAgent` is stateless — calling `get_wumpus_action` twice with the same `obs` returns the same action.
- [ ] No training or SB3 imports exist in `backend/api/` or `backend/engine/`.
