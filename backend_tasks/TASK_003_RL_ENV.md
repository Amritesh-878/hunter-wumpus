# TODO 003: RL Environment Wrapper (Gymnasium)

## Overview

Wrap the core `GameEngine` in a standard OpenAI/Farama `gym.Env` class so it can be used by standard Reinforcement Learning libraries.

## Goals

1. **State Space Definition**: Translate the Wumpus's local senses, memory, and scent detection into a flat numpy array (see Observation Vector below).
2. **Action Space Definition**: Map discrete actions `{0, 1, 2, 3}` to `{NORTH, SOUTH, EAST, WEST}` matching the `Direction` enum from TODO 001.
3. **Reward Function**: Implement the point system to encourage hunting and discourage pit deaths.
4. **Dummy Player**: For training, the environment must autonomously drive the player's turn using a simple random-walk strategy so the Wumpus can be trained without human input.

---

## Files to Change

### Files to MODIFY (Create New)

1. `backend/rl/env.py` - **MAJOR** - Contains `HunterWumpusEnv(gym.Env)`.

---

## Implementation Approach

### HunterWumpusEnv

**Purpose:** Connect the game rules to the RL math.

**Observation Vector** (flat `numpy.ndarray`, dtype `float32`, shape `(8,)`):

| Index | Value                               | Description                                      |
| ----- | ----------------------------------- | ------------------------------------------------ |
| 0     | `wumpus_x / (size-1)`               | Normalized Wumpus X position                     |
| 1     | `wumpus_y / (size-1)`               | Normalized Wumpus Y position                     |
| 2     | `player_x / (size-1)`               | Normalized Player X position                     |
| 3     | `player_y / (size-1)`               | Normalized Player Y position                     |
| 4     | `senses["stench"]`                  | 1.0 if player is adjacent (Wumpus POV)           |
| 5     | `senses["scent_level"] / MAX_SCENT` | Scent value on Wumpus’s current tile, normalized |
| 6     | `tile_already_visited`              | 1.0 if Wumpus has visited current tile before    |
| 7     | `pit_adjacent`                      | 1.0 if any neighbor of Wumpus is a pit           |

**Key Responsibilities:**

- `reset(seed=None)`: Calls `engine._reset_board()`, returns initial observation and an empty `info` dict.
- `step(action: int) -> tuple[np.ndarray, float, bool, bool, dict]`:
  1. Move the Wumpus using the provided `action`.
  2. **Dummy player turn**: Move the player in a uniformly random direction.
  3. Call `engine._update_scent()` to decay the trail.
  4. Compute the reward (see table below).
  5. Determine `terminated` (game over) and `truncated` (step limit reached).
  6. Return `(obs, reward, terminated, truncated, info)`.
- `_get_obs() -> np.ndarray`: Builds and returns the 8-element observation vector above.
- `render()`: Optional; not required for training but stub it out with `pass`.

> **Dummy Player Note:** The player uses `random.choice([Direction.NORTH, Direction.SOUTH, Direction.EAST, Direction.WEST])` for its move each step. This is intentional — a more sophisticated heuristic (e.g., always move toward gold) can be swapped in as a future improvement but would bias early training.

**Reward Function Design:**

| Event                            | Reward |
| -------------------------------- | ------ |
| Wumpus catches Player            | `+100` |
| Wumpus falls in Pit              | `-100` |
| Wumpus hits Wall (clamped)       | `-5`   |
| Step Penalty (every step)        | `-1`   |
| Wumpus moves onto a scented tile | `+2`   |

---

## Pseudocode Reference

```python
import gymnasium as gym
import numpy as np
from gymnasium import spaces
from backend.engine.game_state import GameEngine
from backend.engine.entities import Direction

class HunterWumpusEnv(gym.Env):
    metadata = {"render_modes": []}

    def __init__(self, size: int = 4, num_pits: int = 3) -> None:
        super().__init__()
        self.size = size
        self.num_pits = num_pits
        self.engine: GameEngine

        # 8-element observation (all values normalized 0.0–1.0)
        self.observation_space = spaces.Box(
            low=0.0, high=1.0, shape=(8,), dtype=np.float32
        )
        # 4 discrete actions: NORTH=0, SOUTH=1, EAST=2, WEST=3
        self.action_space = spaces.Discrete(4)

    def reset(
        self, *, seed: int | None = None, options: dict | None = None
    ) -> tuple[np.ndarray, dict]:
        super().reset(seed=seed)
        self.engine = GameEngine(size=self.size, num_pits=self.num_pits)
        return self._get_obs(), {}

    def step(self, action: int) -> tuple[np.ndarray, float, bool, bool, dict]:
        ...

    def _get_obs(self) -> np.ndarray:
        ...
```

---

## Acceptance Criteria

- [ ] Environment class inherits from `gymnasium.Env`.
- [ ] `observation_space` is `spaces.Box(low=0.0, high=1.0, shape=(8,), dtype=np.float32)`.
- [ ] `action_space` is `spaces.Discrete(4)`.
- [ ] `reset()` accepts `seed` and `options` keyword arguments (Gymnasium v26+ API).
- [ ] `step()` returns a 5-tuple `(obs, reward, terminated, truncated, info)` — **not** the old 4-tuple.
- [ ] All observation values are normalized to `[0.0, 1.0]` — no raw grid coordinates.
- [ ] Environment passes `gymnasium.utils.env_checker.check_env(env)` with zero errors or warnings.
- [ ] The dummy player's random move is seeded via the environment's `np_random` source for reproducibility.
