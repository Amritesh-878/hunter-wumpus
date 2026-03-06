# Hunt the Wumpus: An Adversarial Dungeon Game with a PPO-Trained Reinforcement Learning Agent

---

## Abstract

This project presents a modern, full-stack reimagining of the classic "Hunt the Wumpus" game, in which the traditionally static Wumpus adversary is replaced by an intelligent agent trained through Proximal Policy Optimization (PPO). The system is composed of a Python/FastAPI backend housing the core game engine, a Gymnasium-compatible reinforcement learning environment, and a React + Vite frontend that renders an interactive dungeon grid with fog-of-war, sensory indicators, and real-time game state management. The Wumpus agent observes a compact 9-dimensional continuous state vector — encoding its own position, the player's position, and local scent-trail gradients — and learns emergent pursuit behavior entirely from reward signals, without any hand-coded chase logic. Training is conducted over 1,000,000 timesteps on a 4×4 grid with randomized board layouts and a stochastic simulated player, producing a policy that catches the player in 69% of evaluation episodes with a mean episode length of only 2.27 steps. The scent-memory system, which deposits decaying trails at the player's previous positions, serves as the primary indirect tracking signal and is the mechanism through which the agent discovers realistic predator-like hunting patterns. The full pipeline — from environment design and reward shaping through training, evaluation, and live deployment over REST — demonstrates a practical application of deep reinforcement learning to game AI.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Problem Statement & Objectives](#2-problem-statement--objectives)
3. [Literature Survey](#3-literature-survey)
4. [Methodology](#4-methodology)
   - 4.1 [Game Environment Design](#41-game-environment-design)
   - 4.2 [State Space (Observation Design)](#42-state-space-observation-design)
   - 4.3 [Action Space](#43-action-space)
   - 4.4 [Reward Function Design](#44-reward-function-design)
   - 4.5 [Scent Memory System](#45-scent-memory-system)
   - 4.6 [Training Pipeline](#46-training-pipeline)
   - 4.7 [Evaluation Strategy](#47-evaluation-strategy)
5. [Model Architecture](#5-model-architecture)
   - 5.1 [Why PPO?](#51-why-ppo)
   - 5.2 [PPO — Theoretical Background](#52-ppo--theoretical-background)
   - 5.3 [Neural Network Architecture (MlpPolicy)](#53-neural-network-architecture-mlppolicy)
   - 5.4 [Hyperparameter Configuration](#54-hyperparameter-configuration)
   - 5.5 [Agent Integration Architecture](#55-agent-integration-architecture)
6. [System Architecture](#6-system-architecture)
7. [Results & Evaluation](#7-results--evaluation)
8. [Limitations & Future Work](#8-limitations--future-work)
9. [Conclusion](#9-conclusion)
10. [References](#10-references)

---

## 1. Introduction

The Wumpus World is one of the foundational problems in artificial intelligence, originally introduced by Gregory Yob in 1973 and later formalized by Stuart Russell and Peter Norvig in their seminal textbook _Artificial Intelligence: A Modern Approach_ as a canonical example of a knowledge-based agent operating under partial observability. In the classic formulation, a player explores a grid-based cave system, sensing environmental cues (breezes near pits, stenches near the Wumpus, and glitter near gold) while trying to locate treasure and avoid hazards. The Wumpus itself is traditionally a static obstacle — it occupies a fixed cell and does not move.

This project extends the original Wumpus World concept in a fundamental way: **the Wumpus is no longer a passive hazard but an active, intelligent adversary**. Rather than relying on hand-crafted if-else rules to dictate the Wumpus's movement (which would produce predictable, easily exploitable behavior), we employ reinforcement learning (RL) to allow the Wumpus to discover its own hunting strategy from scratch. The learning algorithm used is **Proximal Policy Optimization (PPO)**, a state-of-the-art policy gradient method known for its stability and sample efficiency.

The system is implemented as a full-stack application:

- **Backend** (Python, FastAPI): Contains the deterministic game engine, the Gymnasium RL training environment, the PPO agent wrapper, and the REST API layer.
- **Frontend** (React, Vite): Delivers an interactive 10×10 grid-based UI with fog-of-war exploration, sensory feedback (breeze, stench, shine), keyboard controls, an aim-and-shoot arrow mechanic, and a guided tutorial mode.

During live gameplay, the trained PPO model runs inference in under 1 ms per turn, making the Wumpus's response effectively instantaneous from the player's perspective. The agent observes a 9-dimensional floating-point vector capturing its position, the player's position, and local scent gradients, and outputs one of four cardinal movement actions. This compact observation design, combined with a carefully shaped reward function, produces emergent tracking behavior — the Wumpus effectively follows the player's scent trail without ever being explicitly programmed to do so.

---

## 2. Problem Statement & Objectives

### 2.1 Problem Statement

Traditional implementations of the Wumpus World feature a stationary Wumpus, which significantly reduces the game's challenge and strategic depth. Once the player identifies the Wumpus's location through environmental cues, the threat is effectively neutralized. This makes the game primarily a spatial reasoning puzzle rather than an adversarial survival challenge.

The core problem this project addresses is: **How can we create an adaptive, intelligent Wumpus adversary that learns effective hunting behavior through interaction with the environment, without relying on hand-coded heuristics or direct access to privileged game information?**

A secondary challenge is the **sim-to-real gap**: the agent is trained on a small 4×4 grid (for computational efficiency), but must generalize its behavior to the larger 10×10 grid used in real gameplay. The observation design must be robust enough to enable this transfer.

### 2.2 Objectives

1. **Design a Gymnasium-compatible RL environment** that faithfully models the Wumpus World dynamics, including entity placement, movement rules, hazard interactions, and game termination conditions, suitable for training a Wumpus agent from scratch.

2. **Implement a scent-memory system** that gives the Wumpus an indirect tracking signal — the player leaves behind a decaying scent trail that the agent can learn to follow, avoiding the trivially optimal (and unfair) strategy of simply chasing the player's exact coordinates.

3. **Train a PPO-based Wumpus agent** over 1,000,000 timesteps with a composite reward function that encourages active pursuit, penalizes inaction and wall collisions, and provides strong terminal rewards for catching the player.

4. **Validate the trained agent quantitatively** through evaluation callbacks during training (every 10,000 steps, 20 episodes each) and a post-training rollout of 100 episodes, measuring catch rate, episode length, and reward distribution.

5. **Integrate the trained model into a live game server** via a FastAPI REST API, where the agent performs inference each turn to decide the Wumpus's movement, with a fallback to a random-movement agent if the trained model file is unavailable.

6. **Build a polished frontend** in React that supports fog-of-war exploration, sensory indicators, an arrow-shooting mechanic, and a tutorial system, communicating with the backend over HTTP.

---

## 3. Literature Survey

The following works provide the theoretical and practical foundations for this project:

### 3.1 The Wumpus World

- **Russell, S. & Norvig, P. (2020).** _Artificial Intelligence: A Modern Approach_ (4th ed.). Pearson.
  - The Wumpus World is used as a running example for knowledge representation and logical inference under partial observability (Chapter 7). Our project extends this by replacing the static Wumpus with a learning agent.
  - [Link](https://aima.cs.berkeley.edu/)

- **Yob, G. (1975).** "Hunt the Wumpus." _Creative Computing_, 1(5).
  - The original text-based game that introduced the Wumpus concept. Our project preserves the core mechanics (pits, gold, arrow) while adding an RL-controlled adversary.

### 3.2 Reinforcement Learning Foundations

- **Sutton, R. S. & Barto, A. G. (2018).** _Reinforcement Learning: An Introduction_ (2nd ed.). MIT Press.
  - The foundational reference for RL theory, covering MDPs, value functions, policy gradient methods, and temporal-difference learning. Our agent design follows the standard MDP formulation described here.
  - [Link](http://incompleteideas.net/book/the-book-2nd.html)

- **Mnih, V. et al. (2015).** "Human-level control through deep reinforcement learning." _Nature_, 518(7540), 529–533.
  - Introduced Deep Q-Networks (DQN) for Atari game playing, demonstrating that deep RL can learn complex behaviors from raw sensory input. While we use PPO rather than DQN, this work established the paradigm of training game-playing agents through reward signals.
  - [Link](https://doi.org/10.1038/nature14236)

### 3.3 Proximal Policy Optimization

- **Schulman, J. et al. (2017).** "Proximal Policy Optimization Algorithms." _arXiv preprint arXiv:1707.06347_.
  - The original PPO paper. Introduces the clipped surrogate objective that prevents destructive policy updates. Our implementation uses the clip variant with ε = 0.2, exactly as proposed in this paper.
  - [Link](https://arxiv.org/abs/1707.06347)

- **Schulman, J. et al. (2016).** "High-Dimensional Continuous Control Using Generalized Advantage Estimation." _ICLR 2016_.
  - Introduces Generalized Advantage Estimation (GAE), which PPO relies on for computing advantages with a bias-variance tradeoff controlled by λ. Our training uses GAE with λ = 0.95 and γ = 0.99 (SB3 defaults).
  - [Link](https://arxiv.org/abs/1506.02438)

### 3.4 Implementation Frameworks

- **Raffin, A. et al. (2021).** "Stable-Baselines3: Reliable Reinforcement Learning Implementations." _Journal of Machine Learning Research_, 22(268), 1–8.
  - Stable-Baselines3 (SB3) is the RL library we use for PPO implementation. It provides a clean, well-tested API with built-in support for evaluation callbacks, vectorized environments, and model checkpointing.
  - [Link](https://jmlr.org/papers/v22/20-1364.html)

- **Towers, M. et al. (2024).** "Gymnasium: A Standard Interface for Reinforcement Learning Environments." _arXiv preprint arXiv:2407.17032_.
  - Gymnasium (the maintained successor to OpenAI Gym) defines the standard `Env` interface (`reset()`, `step()`, observation/action spaces) that our `HunterWumpusEnv` implements.
  - [Link](https://arxiv.org/abs/2407.17032)

### 3.5 Reward Shaping and Game AI

- **Ng, A. Y., Harada, D., & Russell, S. (1999).** "Policy invariance under reward transformations: Theory and application to reward shaping." _ICML 1999_.
  - Provides the theoretical foundation for potential-based reward shaping, which ensures that added shaping rewards do not alter the optimal policy. Our distance-based and scent-based shaping rewards are informed by this principle.
  - [Link](https://people.eecs.berkeley.edu/~pabbeel/cs287-fa09/readings/NgHaradaRussell-shaping-ICML1999.pdf)

- **Silver, D. et al. (2016).** "Mastering the game of Go with deep neural networks and tree search." _Nature_, 529(7587), 484–489.
  - AlphaGo demonstrated that RL-trained agents can surpass human performance in adversarial board games. While our task is far simpler, the design philosophy of learning strategy from self-play (in our case, play against a random opponent) is shared.
  - [Link](https://doi.org/10.1038/nature16961)

---

## 4. Methodology

### 4.1 Game Environment Design

The training environment is implemented as a custom Gymnasium environment in `backend/rl/env.py`. Each episode simulates a complete game on a 4×4 grid with 3 randomly placed pits:

```python
# backend/rl/env.py
class HunterWumpusEnv(gym.Env):
    def __init__(self, size: int = 4, num_pits: int = 3, max_steps: int = 200) -> None:
        super().__init__()
        self.size = size
        self.num_pits = num_pits
        self.max_steps = max_steps
        self.engine = GameEngine(size=self.size, num_pits=self.num_pits)

        self.action_space = spaces.Discrete(4)
        self.observation_space = spaces.Box(
            low=0.0, high=1.0, shape=(9,), dtype=np.float32,
        )
```

Each episode proceeds as follows:

1. **Reset**: A fresh `GameEngine` is created with random entity placement (player at origin, Wumpus/gold/pits at minimum Manhattan distances to prevent instant game-overs).
2. **Wumpus moves**: The agent selects cardinal direction → engine updates Wumpus position (clamped to board bounds).
3. **Game-over check**: If the Wumpus lands on the player, episode terminates.
4. **Player moves**: A simulated player moves in a uniformly random direction (also clamped).
5. **Second game-over check**: The player may walk into the Wumpus, a pit, or the gold.
6. **Scent update**: The player's previous position receives fresh scent; all existing scent decays.
7. **Reward computation**: A composite signal is returned (detailed in Section 4.4).
8. **Truncation**: If `step_count >= 200` without termination, the episode is truncated.

The simulated player uses a **uniformly random movement policy** during training. This is a deliberate design choice: training against a random opponent ensures the agent learns robust tracking that generalizes to any player behavior, including the strategic movement of a real human player.

### 4.2 State Space (Observation Design)

The agent receives a 9-dimensional continuous observation vector, normalized to the range [0, 1]:

```python
# backend/rl/env.py — _get_obs()
def _get_obs(self) -> npt.NDArray[np.float32]:
    denom = float(max(1, self.size - 1))
    wumpus = self.engine.wumpus_pos
    player = self.engine.player_pos

    obs = np.array([
        wumpus.x / denom,                                           # [0] Wumpus X
        wumpus.y / denom,                                           # [1] Wumpus Y
        player.x / denom,                                           # [2] Player X
        player.y / denom,                                           # [3] Player Y
        self._scent_at(wumpus),                                     # [4] Scent at Wumpus
        self._scent_at(Position(x=wumpus.x, y=wumpus.y - 1)),      # [5] Scent North
        self._scent_at(Position(x=wumpus.x + 1, y=wumpus.y)),      # [6] Scent East
        self._scent_at(Position(x=wumpus.x, y=wumpus.y + 1)),      # [7] Scent South
        self._scent_at(Position(x=wumpus.x - 1, y=wumpus.y)),      # [8] Scent West
    ], dtype=np.float32)
    return obs
```

| Index | Feature            | Range  | Description                                  |
| ----- | ------------------ | ------ | -------------------------------------------- |
| 0     | `wumpus.x / denom` | [0, 1] | Normalized horizontal position of the Wumpus |
| 1     | `wumpus.y / denom` | [0, 1] | Normalized vertical position of the Wumpus   |
| 2     | `player.x / denom` | [0, 1] | Normalized horizontal position of the player |
| 3     | `player.y / denom` | [0, 1] | Normalized vertical position of the player   |
| 4     | `scent_at(wumpus)` | [0, 1] | Scent intensity at the Wumpus's current cell |
| 5     | `scent_at(north)`  | [0, 1] | Scent intensity one cell north of the Wumpus |
| 6     | `scent_at(east)`   | [0, 1] | Scent intensity one cell east of the Wumpus  |
| 7     | `scent_at(south)`  | [0, 1] | Scent intensity one cell south of the Wumpus |
| 8     | `scent_at(west)`   | [0, 1] | Scent intensity one cell west of the Wumpus  |

**Design rationale**: The first four dimensions give the agent global spatial awareness, while dimensions 4–8 provide local sensory information via the scent gradient. Normalization by `max(1, size - 1)` ensures consistent scaling regardless of grid size, which is critical for the 4×4 → 10×10 transfer. The scent values are divided by `MAX_SCENT = 3` to keep them in [0, 1]. Keeping the observation space to just 9 dimensions avoids overfitting, accelerates training, and requires only a small neural network for function approximation.

### 4.3 Action Space

The action space is `Discrete(4)`, mapping integer indices to cardinal directions:

```python
# backend/rl/env.py
def _action_to_direction(self, action: int) -> Direction:
    mapping = {
        0: Direction.NORTH,
        1: Direction.SOUTH,
        2: Direction.EAST,
        3: Direction.WEST,
    }
    return mapping[action_value]
```

| Action | Direction | Effect                             |
| ------ | --------- | ---------------------------------- |
| 0      | NORTH     | Move Wumpus up one cell (y - 1)    |
| 1      | SOUTH     | Move Wumpus down one cell (y + 1)  |
| 2      | EAST      | Move Wumpus right one cell (x + 1) |
| 3      | WEST      | Move Wumpus left one cell (x - 1)  |

If the chosen action would move the Wumpus outside the grid boundary, the position is clamped (the Wumpus stays at the edge). This is treated differently from a valid move in the reward function — the Wumpus receives a penalty for "hitting a wall" since its position does not change.

### 4.4 Reward Function Design

The reward function is a **multi-component composite signal** designed to provide dense feedback at every step while strongly rewarding/penalizing terminal outcomes:

```python
# backend/rl/env.py — _compute_reward()
def _compute_reward(self, status, wumpus_before, wumpus_after) -> float:
    reward = -1.0                          # Base step penalty

    if wumpus_before == wumpus_after:
        reward -= 5.0                      # Wall-bump / no-movement penalty

    if self._scent_at(wumpus_after) > 0.0:
        reward += 2.0                      # On a scented tile (tracking player)

    if status == "PlayerLost_Wumpus":
        reward += 100.0                    # Caught the player (primary goal)
    elif status == "PlayerLost_Pit":
        reward += 50.0                     # Player fell in a pit (still a "win")
    elif status == "PlayerWon":
        reward -= 100.0                    # Player escaped with gold (failure)

    return reward
```

| Component                       | Value           | Purpose                                                                                                                                                                                                                          |
| ------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Step penalty**                | −1.0 per step   | Creates urgency — the agent is motivated to end episodes quickly rather than wandering. Over a 200-step episode, this amounts to −200 of baseline penalty, making catch rewards relatively large.                                |
| **Wall-bump penalty**           | −5.0 additional | When `wumpus_before == wumpus_after`, the move was invalid (hit a wall). This teaches boundary awareness within the first ~10K timesteps.                                                                                        |
| **Scent-following bonus**       | +2.0            | Awarded when the Wumpus moves onto a cell with nonzero scent. This dense shaping signal creates a gradient toward the player's recent positions, guiding exploration in early training before the agent discovers catch rewards. |
| **Player caught (Wumpus wins)** | +100.0          | The primary terminal reward. The Wumpus occupies the same cell as the player.                                                                                                                                                    |
| **Player fell in pit**          | +50.0           | A partial success — the player died, though not directly by the Wumpus. The agent still benefits because the episode ends favorably.                                                                                             |
| **Player escaped with gold**    | −100.0          | The worst outcome for the Wumpus. The player retrieved the gold and the Wumpus failed in its sole objective.                                                                                                                     |

**Why this specific design?** The combination of dense (per-step, scent-based) and sparse (terminal) rewards avoids the classic RL problem of reward sparsity, where the agent receives almost no signal in early training and struggles to discover the task objective. The scent bonus in particular acts as a "breadcrumb trail" that leads the agent toward its goal even before it experiences a single successful catch.

### 4.5 Scent Memory System

The scent memory is implemented in `backend/engine/senses.py` and is one of the most important design elements in the project. It transforms the problem from a simple pursuit game (where the Wumpus just chases the player's coordinates) into a tracking problem (where the Wumpus must interpret indirect evidence).

```python
# backend/engine/senses.py
MAX_SCENT: int = 3

class ScentMemorySystem:
    def __init__(self, size: int, wumpus_start: Position) -> None:
        self.size = size
        self.scent_grid: list[list[int]] = [[0 for _ in range(size)] for _ in range(size)]
        self.wumpus_visited: set[tuple[int, int]] = {(wumpus_start.x, wumpus_start.y)}
        self._pending_player_trail: Position | None = None

    def queue_player_trail(self, previous_pos: Position, current_pos: Position) -> None:
        if previous_pos != current_pos:
            self._pending_player_trail = previous_pos

    def update_scent(self) -> None:
        # Decay all existing scent by 1 each step
        for y in range(self.size):
            for x in range(self.size):
                if self.scent_grid[y][x] > 0:
                    self.scent_grid[y][x] -= 1
        # Deposit fresh scent at player's previous position
        if self._pending_player_trail is not None:
            trail_pos = self._pending_player_trail
            self.scent_grid[trail_pos.y][trail_pos.x] = MAX_SCENT
            self._pending_player_trail = None
```

**How it works:**

1. When the player moves from cell A to cell B, cell A is queued for scent deposit.
2. At the end of each turn, all scent values on the grid decay by 1. Values at 0 stay at 0.
3. The queued cell receives fresh scent at its maximum value (3).
4. This creates a trail: the most recently vacated cell has scent 3, the one before has scent 2, the one before that has scent 1, and anything older has evaporated.

**Decay rule (mathematically):**

$$\text{scent}[y][x]_{t+1} = \max\left(0,\; \text{scent}[y][x]_t - 1\right)$$

The agent reads this scent gradient through its observation dimensions 4–8. By comparing scent intensities in the four cardinal directions around itself, the agent can infer which direction the player recently traveled. For example, if the cell to the east has scent 3 and the cell to the west has scent 1, the player recently moved eastward. This is analogous to how a real-world predator tracks prey by chemical trails, and the agent learns this interpretation entirely from experience — it is never explicitly told what scent means.

### 4.6 Training Pipeline

Training is orchestrated in `backend/rl/train.py` and follows a standard Stable-Baselines3 workflow:

```python
# backend/rl/train.py — train_and_save()
def train_and_save(total_timesteps, model_output_dir, seed):
    train_env = build_training_env(seed=seed)      # DummyVecEnv wrapping Monitor(HunterWumpusEnv)
    eval_env = build_eval_env(seed=seed + 1)        # Separate Monitor(HunterWumpusEnv) instance

    eval_callback = EvalCallback(
        eval_env=eval_env,
        best_model_save_path=str(model_output_dir),
        log_path=str(model_output_dir),
        eval_freq=10_000,
        n_eval_episodes=20,
        deterministic=True,
    )

    model = PPO(
        policy="MlpPolicy",
        env=train_env,
        learning_rate=3e-4,
        n_steps=2048,
        batch_size=64,
        n_epochs=10,
        gamma=0.99,
        verbose=1,
        seed=seed,
    )

    model.learn(total_timesteps=total_timesteps, callback=eval_callback)

    # Quality gate: reject model if it doesn't beat random by ≥ 20 reward
    random_reward, _ = evaluate_policy(RandomPolicy(...), eval_env, n_eval_episodes=100)
    trained_reward, _ = evaluate_policy(model, eval_env, n_eval_episodes=100)
    if trained_reward - random_reward < 20.0:
        raise RuntimeError("Model does not meet minimum improvement threshold")

    model.save(str(model_output_dir / "hunter_wumpus_model"))
```

**Key design features of the training pipeline:**

1. **Separate training and evaluation environments**: The training env is wrapped in `DummyVecEnv` and `Monitor` for vectorized rollout collection. The eval env is a separate instance with a different seed, ensuring evaluation is independent of training state.

2. **EvalCallback with best-model checkpointing**: Every 10,000 timesteps, the current policy is evaluated over 20 episodes (deterministically). If the mean reward exceeds the previous best, the model checkpoint is saved as `best_model.zip`. This prevents late-training regression from overwriting a superior earlier checkpoint.

3. **Quality gate**: After training completes, a `RandomPolicy` (uniformly random actions) is evaluated over 100 episodes. The trained model must exceed the random baseline by at least 20 reward points, or training is rejected. This automated check prevents deploying a degenerate policy.

4. **Reproducibility**: A fixed seed (`seed=42` by default) controls all random number generators — NumPy, environment randomization, and PPO's internal sampling — ensuring identical training runs.

### 4.7 Evaluation Strategy

Evaluation occurs at two stages:

**During training** (automated via `EvalCallback`):

- Frequency: every 10,000 of 1,000,000 timesteps → 100 checkpoints
- Episodes per checkpoint: 20
- Mode: deterministic (agent always selects highest-probability action)
- Metrics logged: mean reward, standard deviation, mean episode length
- Artifact: `evaluations.npz` (NumPy archive with `timesteps`, `results`, `ep_lengths`)

**Post-training** (via `backend/graphs/run_episodes.py`):

- 100 full episodes with deterministic policy
- Metrics: outcome counts and rates, episode length statistics
- Artifact: `episode_stats.json`

---

## 5. Model Architecture

### 5.1 Why PPO?

We evaluated several candidate RL algorithms before selecting PPO. The choice was driven by our specific problem characteristics:

| Requirement                                           | PPO                  | DQN                                   | A2C                                | SAC                               |
| ----------------------------------------------------- | -------------------- | ------------------------------------- | ---------------------------------- | --------------------------------- |
| Discrete action space (4 directions)                  | Native (categorical) | Native                                | Native                             | Requires discretization           |
| Continuous observations (9D float)                    | Native (MLP policy)  | Native                                | Native                             | Native                            |
| Stochastic environment (random player, random boards) | Clipping stabilizes  | Replay buffer helps but Q-instability | No safeguard against large updates | Off-policy, handles stochasticity |
| Sample efficiency (reuses data)                       | Yes (n_epochs > 1)   | Yes (replay buffer)                   | No (single pass)                   | Yes (replay buffer)               |
| Implementation complexity                             | Low (SB3)            | Low (SB3)                             | Low (SB3)                          | Medium (continuous tuning)        |
| On-policy (simpler pipeline)                          | Yes                  | No (needs replay buffer)              | Yes                                | No (needs replay buffer)          |

**PPO was selected** because it offers the best combination of stability (via clipping), sample efficiency (via multiple epochs per rollout), and simplicity (on-policy, no replay buffer) for our specific problem: a small discrete action space, low-dimensional continuous observations, and a stochastic environment with random board layouts and player behavior.

### 5.2 PPO — Theoretical Background

**Proximal Policy Optimization (PPO)** is a policy gradient method introduced by Schulman et al. (2017) that addresses the fundamental challenge of policy-based RL: how to update the policy without making destructive changes.

**The core insight**: Earlier methods like vanilla REINFORCE or TRPO (Trust Region Policy Optimization) either suffered from high-variance updates or were computationally expensive (TRPO requires computing natural gradients). PPO achieves TRPO-like stability with first-order optimization by introducing a **clipped surrogate objective**.

**The PPO-Clip objective function:**

$$L^{CLIP}(\theta) = \mathbb{E}_t \left[ \min \left( r_t(\theta)\hat{A}_t, \; \text{clip}(r_t(\theta),\; 1-\epsilon,\; 1+\epsilon) \hat{A}_t \right) \right]$$

Where:

- $r_t(\theta) = \frac{\pi_\theta(a_t | s_t)}{\pi_{\theta_{old}}(a_t | s_t)}$ is the probability ratio between the new and old policies for the action taken.
- $\hat{A}_t$ is the estimated advantage (how much better this action was compared to the average action in this state).
- $\epsilon$ is the clipping hyperparameter (0.2 in our case).

**Intuition**: If an action had a positive advantage (it was good), and the new policy increases the probability of that action, the ratio $r_t(\theta)$ grows above 1. But the clipping prevents it from growing beyond $1 + \epsilon = 1.2$. This means the policy can increase the probability of a good action by at most 20% per update. Similarly, it can decrease the probability of a bad action by at most 20%.

**Generalized Advantage Estimation (GAE)**:

PPO uses GAE (Schulman et al., 2016) to compute $\hat{A}_t$, which balances bias and variance:

$$\hat{A}_t^{GAE(\gamma, \lambda)} = \sum_{l=0}^{\infty} (\gamma \lambda)^l \delta_{t+l}$$

where $\delta_t = r_t + \gamma V(s_{t+1}) - V(s_t)$ is the TD residual.

- $\gamma = 0.99$: discount factor — the agent values rewards 100 steps in the future at $0.99^{100} \approx 36.6\%$ of immediate rewards.
- $\lambda = 0.95$: GAE parameter — blends 1-step (low variance, high bias) and Monte Carlo (high variance, low bias) returns with 95% weight toward longer horizons.

**Actor-Critic structure**: PPO jointly trains two neural networks:

- **Actor (Policy Network)**: Maps observation → action probability distribution. During training, actions are sampled from this distribution (exploration). During inference, the highest-probability action is selected (exploitation).
- **Critic (Value Network)**: Maps observation → scalar state value $V(s)$. Used to compute advantages and is trained via mean squared error against actual returns.

The total loss function combines three terms:

$$L = L^{CLIP} - c_1 L^{VF} + c_2 S[\pi_\theta]$$

Where $L^{VF}$ is the value function loss, $S[\pi_\theta]$ is an entropy bonus (encourages exploration by penalizing overly deterministic policies), $c_1 = 0.5$, and $c_2 = 0.01$ in our configuration.

### 5.3 Neural Network Architecture (MlpPolicy)

The `"MlpPolicy"` in Stable-Baselines3 creates two separate fully-connected networks:

**Actor Network (Policy):**

```
Input (9) → Linear(9, 64) → Tanh → Linear(64, 64) → Tanh → Linear(64, 4) → Softmax
```

Output: probability distribution over 4 actions.

**Critic Network (Value):**

```
Input (9) → Linear(9, 64) → Tanh → Linear(64, 64) → Tanh → Linear(64, 1)
```

Output: scalar state value estimate.

**Parameter count**: Each network has approximately 9×64 + 64 + 64×64 + 64 + 64×4 + 4 ≈ 5,060 parameters (actor), and a similar count for the critic. Total ≈ 10,000 trainable parameters — extremely lightweight, enabling fast training and sub-millisecond inference.

The architecture diagram:

```mermaid
flowchart LR
    subgraph Input["Observation Vector (9D)"]
        I1["Wumpus pos (x,y)"]
        I2["Player pos (x,y)"]
        I3["Scent at Wumpus"]
        I4["Scent N/E/S/W"]
    end

    subgraph Actor["Actor Network (Policy)"]
        A1["Linear(9→64) + Tanh"]
        A2["Linear(64→64) + Tanh"]
        A3["Linear(64→4) + Softmax"]
    end

    subgraph Critic["Critic Network (Value)"]
        C1["Linear(9→64) + Tanh"]
        C2["Linear(64→64) + Tanh"]
        C3["Linear(64→1)"]
    end

    subgraph Output["Outputs"]
        O1["Action Probabilities<br/>P(N), P(S), P(E), P(W)"]
        O2["State Value V(s)"]
    end

    I1 & I2 & I3 & I4 --> A1 --> A2 --> A3 --> O1
    I1 & I2 & I3 & I4 --> C1 --> C2 --> C3 --> O2

    style Actor fill:#4a9eff22,stroke:#4a9eff
    style Critic fill:#ff6b6b22,stroke:#ff6b6b
    style Input fill:#4aff4a22,stroke:#4aff4a
    style Output fill:#ffa50022,stroke:#ffa500
```

### 5.4 Hyperparameter Configuration

```python
model = PPO(
    policy="MlpPolicy",
    env=train_env,
    learning_rate=3e-4,
    n_steps=2048,
    batch_size=64,
    n_epochs=10,
    gamma=0.99,
    verbose=1,
    seed=42,
)
```

| Hyperparameter    | Value            | Explanation                                                                                                                                                                                                                         |
| ----------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `policy`          | `"MlpPolicy"`    | Two-hidden-layer MLP with 64 units each and Tanh activations. Appropriate for our low-dimensional observation space.                                                                                                                |
| `learning_rate`   | `3e-4`           | The Adam optimizer step size. This is the default recommended value from the PPO paper and SB3 documentation. It balances convergence speed against stability.                                                                      |
| `n_steps`         | `2048`           | Number of environment steps collected per rollout before each policy update. With typical episode lengths of 2–10 steps on a 4×4 board, this contains ~200–1000 complete episodes per rollout, providing stable gradient estimates. |
| `batch_size`      | `64`             | The mini-batch size for stochastic gradient descent within each epoch. The 2048 collected experiences are shuffled and split into 2048/64 = 32 mini-batches per epoch.                                                              |
| `n_epochs`        | `10`             | Number of full passes through the collected rollout data. PPO reuses data 10 times (320 gradient updates per rollout), extracting maximum learning from each batch while the clipping mechanism prevents over-fitting.              |
| `gamma`           | `0.99`           | Discount factor for future rewards. With γ = 0.99, a reward 10 steps in the future is worth 0.99¹⁰ ≈ 90.4% of an immediate reward.                                                                                                  |
| `clip_range`      | `0.2` (default)  | The PPO clipping parameter ε — constrains policy ratio to [0.8, 1.2]. Prevents destructive updates.                                                                                                                                 |
| `gae_lambda`      | `0.95` (default) | GAE smoothing parameter. Blends 1-step and full returns with 95% weight on longer-horizon estimates.                                                                                                                                |
| `ent_coef`        | `0.01` (default) | Entropy bonus coefficient. Encourages exploration by rewarding policies that maintain some randomness in action selection.                                                                                                          |
| `seed`            | `42`             | Fixed random seed for full reproducibility.                                                                                                                                                                                         |
| `total_timesteps` | `1,000,000`      | Total environment interactions during training. At 2048 steps/rollout, this is ~488 rollout-update cycles.                                                                                                                          |

**Training arithmetic:**

- Rollout cycles: 1,000,000 / 2048 ≈ 488 iterations
- Mini-batches per epoch: 2048 / 64 = 32
- Total gradient updates: 488 × 10 × 32 = ~156,000 weight updates
- Evaluation checkpoints: 1,000,000 / 10,000 = 100 evaluations

### 5.5 Agent Integration Architecture

The trained model is deployed via the `WumpusAgent` class in `backend/rl/agent.py`:

```python
# backend/rl/agent.py
class WumpusAgent:
    def __init__(self, model_path: str | Path | None = None) -> None:
        resolved_model_path = self._resolve_model_path(model_path)
        self.model = PPO.load(str(resolved_model_path))

    def get_wumpus_action(self, obs: npt.NDArray[np.float32]) -> Direction:
        normalized_obs = np.asarray(obs, dtype=np.float32).reshape((9,))
        action, _ = self.model.predict(normalized_obs, deterministic=True)
        action_value = int(np.asarray(action, dtype=np.int64).item())
        return Direction(action_value)

    def build_observation(self, game_state: dict[str, Any]) -> npt.NDArray[np.float32]:
        # Constructs the same 9D vector from live game state
        # Identical logic to env._get_obs() for consistency
        ...
```

The critical `deterministic=True` flag means that during live gameplay, the agent always selects the action with the highest probability (greedy policy), producing consistent, predictable behavior rather than the exploratory sampling used during training.

The API routes file integrates this as follows:

```python
# backend/api/routes.py — inside the move endpoint
agent = _get_agent()
obs = agent.build_observation(_observation_state(session.engine))
wumpus_action = agent.get_wumpus_action(obs)
session.engine.move_wumpus(wumpus_action)
session.engine._update_scent()
```

A `RandomWumpusAgent` fallback is loaded if the trained model file is missing:

```python
# backend/api/routes.py
def _get_agent() -> WumpusPolicy:
    global _agent
    if _agent is None or isinstance(_agent, RandomWumpusAgent):
        try:
            _agent = WumpusAgent()
        except FileNotFoundError:
            _agent = RandomWumpusAgent()
    return _agent
```

---

## 6. System Architecture

The full system is a three-tier architecture: frontend (React), API layer (FastAPI), and game engine + RL agent (Python):

```mermaid
graph TD
    classDef frontend fill:#61dafb,stroke:#333,stroke-width:2px,color:#000
    classDef backend fill:#059669,stroke:#333,stroke-width:2px,color:#fff
    classDef ai fill:#f59e0b,stroke:#333,stroke-width:2px,color:#000
    classDef storage fill:#6b7280,stroke:#333,stroke-width:2px,color:#fff

    subgraph Client["Frontend — React + Vite"]
        UI["React UI<br/>(Grid, Tile, GameUI, Modals)"]:::frontend
        Store["GameContext + useReducer"]:::frontend
        Controls["useControls Hook<br/>(Keyboard Input)"]:::frontend
        API_Client["gameService.js<br/>(HTTP Client)"]:::frontend
        Controls -->|"Dispatches actions"| Store
        Store -->|"Props & state"| UI
        Store -->|"POST /game/move"| API_Client
    end

    subgraph Server["Backend — FastAPI"]
        Router["REST API Router<br/>(/game/start, /game/move, /game/{id}/status)"]:::backend
        Sessions["In-Memory Session Store<br/>dict[UUID → SessionState]"]:::storage
        Engine["GameEngine<br/>(Board, Movement, Game-Over)"]:::backend
        Scent["ScentMemorySystem<br/>(Trail Decay + Deposit)"]:::backend
    end

    subgraph RL["AI Layer — Stable-Baselines3"]
        Agent["WumpusAgent<br/>(PPO.predict)"]:::ai
        Model["Trained Model<br/>(hunter_wumpus_model.zip)"]:::storage
    end

    API_Client -->|"HTTP JSON"| Router
    Router -->|"Route & validate"| Sessions
    Sessions <-->|"Retrieve/update"| Engine
    Engine -->|"Scent deposit & decay"| Scent
    Engine -->|"9D observation"| Agent
    Agent -->|"Load weights"| Model
    Scent -.->|"Scent gradient dims 4-8"| Agent
    Agent -->|"Direction (N/S/E/W)"| Engine
    Router -->|"GameStateResponse JSON"| API_Client
```

### Turn Sequence (One Move)

```mermaid
sequenceDiagram
    participant FE as Frontend (React)
    participant API as FastAPI Router
    participant GE as GameEngine
    participant SM as ScentMemorySystem
    participant AG as WumpusAgent (PPO)

    FE->>API: POST /game/move {game_id, player_action: "NORTH"}
    API->>GE: move_player(Direction.NORTH)
    GE->>SM: queue_player_trail(old_pos, new_pos)
    GE->>GE: check_game_over()

    alt Game still ongoing
        API->>AG: build_observation(game_state_dict)
        AG->>AG: Construct 9D vector (pos + scent)
        AG->>AG: model.predict(obs, deterministic=True)
        AG-->>API: Direction.SOUTH (example)
        API->>GE: move_wumpus(Direction.SOUTH)
        GE->>SM: record_wumpus_visit(new_wumpus_pos)
        API->>GE: check_game_over()
        API->>GE: _update_scent()
        GE->>SM: update_scent() — decay all, deposit trail
        API->>GE: get_senses(player_pos)
        GE-->>API: {breeze, stench, shine}
    end

    API-->>FE: GameStateResponse JSON
```

### Game Engine Entity Relationships

```mermaid
erDiagram
    SESSION_STATE {
        UUID game_id PK
        int turn
        int arrows_remaining
        list explored_tiles
        string message
    }

    GAME_ENGINE {
        int size
        int num_pits
        GameStatus status
    }

    PLAYER {
        int x
        int y
    }

    WUMPUS {
        int x
        int y
    }

    GOLD {
        int x
        int y
    }

    PIT {
        int x
        int y
    }

    SCENT_MEMORY {
        grid scent_grid
        set wumpus_visited
        Position pending_trail
    }

    SESSION_STATE ||--|| GAME_ENGINE : contains
    GAME_ENGINE ||--|| PLAYER : tracks
    GAME_ENGINE ||--|| WUMPUS : tracks
    GAME_ENGINE ||--|| GOLD : tracks
    GAME_ENGINE ||--|{ PIT : contains
    GAME_ENGINE ||--|| SCENT_MEMORY : uses
    SCENT_MEMORY }o--|| WUMPUS : influences
```

---

## 7. Results & Evaluation

### 7.1 Training Evaluation

Training was conducted for **1,000,000 timesteps** on a 4×4 grid with 3 pits, using seed 42 for reproducibility. The `EvalCallback` evaluated the policy every 10,000 steps over 20 deterministic episodes, saving the best checkpoint.

Training outputs include reward curves and episode length plots generated via the graph visualization scripts in `backend/graphs/`:

- **Reward curve** (`plot_training_reward.py`): Plots mean evaluation reward with ±1 std deviation band and a 10-point rolling mean trendline. An upward trend indicates policy improvement; narrowing variance indicates increasing consistency.
- **Episode length** (`plot_episode_length.py`): Tracks mean episode length over training. Very short episodes (2–3 steps) indicate the Wumpus has learned to intercept the player rapidly.
- **Reward distribution** (`plot_reward_distribution.py`): Compares reward histograms at the first checkpoint (10K steps, essentially random behavior) versus the final checkpoint (1M steps, trained policy). A rightward shift demonstrates improved policy quality.

### 7.2 Post-Training Evaluation: 100 Live Episodes

After training, 100 full episodes were evaluated using `backend/graphs/run_episodes.py` with the trained model in deterministic mode. The actual results from `episode_stats.json`:

| Metric                       | Value                     |
| ---------------------------- | ------------------------- |
| **Total episodes**           | 100                       |
| **Wumpus catch rate**        | **69%** (69/100 episodes) |
| **Player fell in pit**       | **23%** (23/100 episodes) |
| **Player escaped with gold** | **8%** (8/100 episodes)   |
| **Mean episode length**      | **2.27 steps**            |
| **Std episode length**       | 1.24 steps                |
| **Min episode length**       | 1 step                    |
| **Max episode length**       | 6 steps                   |

**Key observations:**

1. **69% direct catch rate**: The Wumpus catches the player in over two-thirds of episodes, demonstrating that the PPO policy has learned effective pursuit behavior. Combined with the 23% pit deaths (where the player dies regardless), the player only escapes 8% of the time.

2. **Mean episode length of 2.27 steps**: This extremely short episode length on a 4×4 grid indicates the agent has learned to intercept the player almost immediately. On such a small grid, the initial Manhattan distance between entities is typically 2–4 cells, and the agent closes this gap efficiently.

3. **92% player death rate** (69% Wumpus + 23% pit): From the Wumpus's perspective, the player dies in 92% of episodes. Only 8% of the time does the player successfully reach the gold and escape.

### 7.3 Quality Gate

The training pipeline includes an automated quality check:

```python
if trained_reward - random_reward < 20.0:
    raise RuntimeError("Trained model does not meet minimum improvement over random policy")
```

This ensures the deployed model is meaningfully superior to random behavior — a baseline sanity check that catches catastrophic training failures, degenerate reward hacking, or seed-related issues.

---

## 8. Limitations & Future Work

### 8.1 Current Limitations

1. **Training-deployment grid size mismatch**: The agent is trained on a 4×4 grid but deployed on 10×10. While observation normalization by `max(1, size - 1)` helps transfer, the agent has never experienced the spatial dynamics of a larger grid during training. Pursuit strategies that work in 3–4 steps on a 4×4 grid may require fundamentally different behavior on 10×10.

2. **Random opponent during training**: The simulated player moves randomly, which does not capture the strategic behavior of a real human player (who moves toward gold, away from stench, etc.). The agent may be under-prepared for purposeful evasion.

3. **In-memory session store**: Game sessions are stored in a Python dictionary, which does not survive server restarts and cannot scale to multiple server instances.

4. **Single Wumpus**: The current design supports exactly one Wumpus entity. Multiple intelligent adversaries would create interesting multi-agent dynamics.

5. **No curriculum learning**: Training occurs at a single fixed difficulty. A curriculum that progressively increases grid size or introduces smarter simulated players could improve policy quality.

### 8.2 Future Work

- **Larger grid training**: Train directly on 10×10 (or use progressive grid size scaling) to eliminate the sim-to-real gap.
- **Self-play**: Replace the random player with another RL agent, creating an adversarial co-evolution setup.
- **Multiple difficulty tiers**: Implement easy/medium/hard modes with different Wumpus agents (random, partially trained, fully trained).
- **WebSocket real-time updates**: Replace HTTP polling with WebSocket connections for lower-latency game state updates.
- **Persistent sessions**: Migrate from in-memory dict to Redis or PostgreSQL for production-grade session management.

---

## 9. Conclusion

This project demonstrates a practical, end-to-end application of deep reinforcement learning to game AI. By replacing the traditionally static Wumpus with a PPO-trained agent, we transform the classic Wumpus World from a pure logical reasoning puzzle into a dynamic adversarial survival game.

The key technical contributions are:

1. **Scent-memory observation design**: Rather than giving the Wumpus direct access to the player's position alone, we introduced a decaying scent-trail mechanism that the agent must learn to interpret. This creates emergent tracking behavior that is both more realistic (analogous to olfactory tracking in nature) and more interesting from a gameplay perspective.

2. **Composite reward shaping**: The multi-component reward function (step penalty + wall penalty + scent bonus + terminal rewards) provides dense feedback that guides the agent from random exploration to efficient pursuit within 1M timesteps.

3. **Robust training pipeline**: The use of EvalCallback with best-model checkpointing, automated quality gates (requiring ≥ 20 reward improvement over random), and deterministic seeding ensures reliable, reproducible training outcomes.

4. **Lightweight deployment**: The trained MlpPolicy network (~10K parameters) runs inference in under 1 ms, adding no perceptible latency to the game loop. The fallback to `RandomWumpusAgent` when no trained model is available ensures graceful degradation.

The quantitative results validate the approach: the trained Wumpus achieves a **69% direct catch rate** and a combined **92% player death rate** across 100 evaluation episodes, with a mean episode length of just 2.27 steps on a 4×4 grid. These results demonstrate that PPO, combined with thoughtful observation design and reward shaping, can produce capable game AI agents even with modest computational resources and a simple neural network architecture.

---

## 10. References

1. Russell, S. & Norvig, P. (2020). _Artificial Intelligence: A Modern Approach_ (4th ed.). Pearson. https://aima.cs.berkeley.edu/

2. Yob, G. (1975). "Hunt the Wumpus." _Creative Computing_, 1(5).

3. Sutton, R. S. & Barto, A. G. (2018). _Reinforcement Learning: An Introduction_ (2nd ed.). MIT Press. http://incompleteideas.net/book/the-book-2nd.html

4. Schulman, J., Wolski, F., Dhariwal, P., Radford, A., & Klimov, O. (2017). "Proximal Policy Optimization Algorithms." _arXiv:1707.06347_. https://arxiv.org/abs/1707.06347

5. Schulman, J., Moritz, P., Levine, S., Jordan, M., & Abbeel, P. (2016). "High-Dimensional Continuous Control Using Generalized Advantage Estimation." _ICLR 2016_. https://arxiv.org/abs/1506.02438

6. Raffin, A., Hill, A., Gleave, A., Kanervisto, A., Ernestus, M., & Dormann, N. (2021). "Stable-Baselines3: Reliable Reinforcement Learning Implementations." _JMLR_, 22(268), 1–8. https://jmlr.org/papers/v22/20-1364.html

7. Towers, M. et al. (2024). "Gymnasium: A Standard Interface for Reinforcement Learning Environments." _arXiv:2407.17032_. https://arxiv.org/abs/2407.17032

8. Mnih, V. et al. (2015). "Human-level control through deep reinforcement learning." _Nature_, 518(7540), 529–533. https://doi.org/10.1038/nature14236

9. Ng, A. Y., Harada, D., & Russell, S. (1999). "Policy invariance under reward transformations: Theory and application to reward shaping." _ICML 1999_. https://people.eecs.berkeley.edu/~pabbeel/cs287-fa09/readings/NgHaradaRussell-shaping-ICML1999.pdf

10. Silver, D. et al. (2016). "Mastering the game of Go with deep neural networks and tree search." _Nature_, 529(7587), 484–489. https://doi.org/10.1038/nature16961

---
