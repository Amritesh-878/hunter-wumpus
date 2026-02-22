# TECHNICAL REPORT

## 1. Abstract

This project implements a modern full-stack adaptation of the Wumpus World with an intelligent RL-controlled antagonist. A FastAPI backend provides deterministic game mechanics and state transitions, while a React frontend delivers an interactive grid-based experience. The Wumpus behavior is learned using Proximal Policy Optimization (PPO) from Stable-Baselines3, with a scent-memory observation design that encourages realistic pursuit rather than direct position cheating.

## 2. Introduction

The Wumpus World is a classic example of a knowledge-based agent in AI. Where the player explores a hazardous grid to find gold and survive. This project extends the original concept by introducing an intelligent adversary (the Wumpus) trained through reinforcement learning.

Rule-based enemies are predictable and often brittle under stochastic environments. Reinforcement learning was chosen to allow adaptive policy learning from rewards, enabling emergent pursuit strategies without manually encoding all chase behaviors.

The project scope includes:

- A Python/FastAPI backend with complete game engine logic
- A PPO-based Wumpus agent trained in a Gymnasium-compatible environment
- A React + Vite frontend with fog-of-war, controls, and game state rendering
- REST API integration for gameplay actions and session updates

## 3. Game Environment Design

### 3.1 State Space

The Wumpus agent observes a 9-dimensional continuous float32 vector:

| Index | Feature                            | Description                        | Range  |
| ----- | ---------------------------------- | ---------------------------------- | ------ |
| 0     | wumpus_x / (grid_size-1)           | Wumpus normalized x position       | [0, 1] |
| 1     | wumpus_y / (grid_size-1)           | Wumpus normalized y position       | [0, 1] |
| 2     | player_x / (grid_size-1)           | Player normalized x position       | [0, 1] |
| 3     | player_y / (grid_size-1)           | Player normalized y position       | [0, 1] |
| 4     | scent[wumpus] / MAX_SCENT          | Scent at Wumpus's current position | [0, 1] |
| 5     | scent[north of wumpus] / MAX_SCENT | Scent signal north                 | [0, 1] |
| 6     | scent[east of wumpus] / MAX_SCENT  | Scent signal east                  | [0, 1] |
| 7     | scent[south of wumpus] / MAX_SCENT | Scent signal south                 | [0, 1] |
| 8     | scent[west of wumpus] / MAX_SCENT  | Scent signal west                  | [0, 1] |

MAX_SCENT = 3 (scent decays each step).

### 3.2 Scent Trail Memory System

The player leaves a scent trail in previously occupied cells. This scent value decays over time (maximum persistence of 3 steps). By observing local scent gradients, the Wumpus policy learns tracking behavior that reflects short-term player movement memory, resulting in emergent hunting patterns.

### 3.3 Action Space

The action space is discrete with 4 actions:

- NORTH (0)
- SOUTH (1)
- EAST (2)
- WEST (3)

Each action attempts to move the Wumpus by one cell in the selected direction.

### 3.4 Reward Function

```python
reward = -1.0           # Step penalty: encourages efficiency

if wumpus_before == wumpus_after:
    reward -= 5.0       # Penalty for staying still / hitting wall

if scent_at_new_pos > 0.0:
    reward += 2.0       # Reward for moving on scented trail (tracking player)

if status == "PlayerLost_Wumpus":
    reward += 100.0     # Terminal reward: Wumpus catches player (win)
elif status == "PlayerLost_Pit":
    reward += 50.0      # Reward: player falls in pit (Wumpus survives, player dead)
elif status == "PlayerWon":
    reward -= 100.0     # Penalty: player escaped with gold (Wumpus failed)
```

Reward summary:

| Event                      | Reward Impact   |
| -------------------------- | --------------- |
| Per-step movement          | -1.0            |
| Invalid move / no movement | -5.0 additional |
| Moving onto scented tile   | +2.0            |
| Player caught by Wumpus    | +100.0          |
| Player dies in pit         | +50.0           |
| Player wins (gold escape)  | -100.0          |

### 3.5 Episode Dynamics

- Each episode starts from a random board on a 4x4 grid with 3 pits
- Maximum episode length is 200 steps (truncation)
- During training, the player executes random cardinal moves
- The Wumpus is the only learning agent

## 4. RL Algorithm — Proximal Policy Optimization (PPO)

PPO was selected for stable and sample-efficient on-policy learning, strong baseline performance, and robust behavior with low-dimensional continuous observations.

The clipped PPO objective is:

$$
L^{CLIP}(\theta) = \mathbb{E}_t\left[\min\left(r_t(\theta)\hat{A}_t, \text{clip}(r_t(\theta), 1-\epsilon, 1+\epsilon)\hat{A}_t\right)\right]
$$

where:

$$
r_t(\theta) = \frac{\pi_\theta(a_t|s_t)}{\pi_{\theta_{old}}(a_t|s_t)}
$$

The clipping term limits update magnitude and reduces policy collapse risk, typically with $\epsilon \approx 0.2$. PPO in SB3 also optimizes a value-loss term and entropy bonus, while advantages are estimated via Generalized Advantage Estimation (GAE).

Training hyperparameters (SB3 defaults used):

| Parameter       | Value     | Description            |
| --------------- | --------- | ---------------------- |
| n_steps         | 2048      | Steps before update    |
| batch_size      | 64        | Mini-batch size        |
| n_epochs        | 10        | Gradient update epochs |
| gamma           | 0.99      | Discount factor        |
| learning_rate   | 3e-4      | Adam optimizer LR      |
| clip_range      | 0.2       | PPO clip epsilon       |
| total_timesteps | 1,000,000 | Training length        |

## 5. System Architecture

### 5.1 Overall Architecture ASCII Diagram

```mermaid
graph TD
    %% Styling
    classDef frontend fill:#61dafb,stroke:#333,stroke-width:2px,color:#000;
    classDef backend fill:#059669,stroke:#333,stroke-width:2px,color:#fff;
    classDef ai fill:#f59e0b,stroke:#333,stroke-width:2px,color:#000;
    classDef storage fill:#6b7280,stroke:#333,stroke-width:2px,color:#fff;

    subgraph Client [Frontend Layer - React & Vite]
        UI[React User Interface]:::frontend
        Store((Game Context<br>State)):::frontend
        UI <-->|State Updates| Store
    end

    subgraph API [API Layer - FastAPI]
        Router{REST API Router}:::backend
    end

    subgraph Server [Backend Core & Game Engine]
        Session[(Session State Store)]:::storage
        Engine[Deterministic Game Engine]:::backend
        Memory[Scent Memory System]:::backend
    end

    subgraph RL [AI Agent Layer - Stable-Baselines3]
        Agent{PPO Wumpus Agent}:::ai
        Model[(Trained Model<br>best_model.zip)]:::storage
    end

    %% Network Connections
    Store -->|POST move, GET status| Router
    Router -->|JSON Responses| Store

    %% Backend Logic Flow
    Router -->|Validate and Route| Session
    Session <-->|Retrieve or Update Board| Engine
    Engine -->|Deposit and Decay Scent| Memory

    %% AI Integration Flow
    Engine -->|Provide 9D Observation| Agent
    Agent -->|Load Policy Weights| Model
    Memory -.->|Scent Gradients| Agent
    Agent -->|Predict Action: N S E W| Engine
```

### 5.2 Component Relationships Diagram (UML-style ASCII)

```mermaid
graph TD
    %% Styling
    classDef context fill:#8b5cf6,stroke:#333,stroke-width:2px,color:#fff;
    classDef component fill:#3b82f6,stroke:#333,stroke-width:2px,color:#fff;
    classDef logic fill:#ef4444,stroke:#333,stroke-width:2px,color:#fff;

    %% State Management block
    subgraph State [State Management Flow]
        Provider[GameProvider]:::context
        Context((GameContext)):::context
        Reducer{gameReducer}:::logic
        GameState[(GameState<br>status, pos, scent<br>explored, turns)]:::context
    end

    %% UI Components block
    subgraph UI [React Component Tree]
        App[App.jsx]:::component
        Grid[Grid Component<br>React.memo]:::component
        Tile[Tile Component<br>React.memo]:::component
        HUD[GameUI / HUD]:::component
        Modals[GameOver / Loading Modals]:::component
    end

    %% Initialization and Context passing
    Provider -->|Provides| Context
    Context -->|Consumes| App

    %% Render Tree
    App -->|Renders| Grid
    Grid -->|Renders 10x10| Tile
    App -->|Renders| HUD
    App -->|Renders| Modals

    %% Unidirectional Data Flow
    App -.->|Dispatch MOVE_UP etc| Reducer
    Reducer -->|Computes New State| GameState
    GameState -.->|Updates Values| Context

    %% Visual dependencies
    GameState -.->|Props and State| Grid
    GameState -.->|Props and State| HUD
```

### 5.3 Entity Relationship Diagram (ERD — ASCII)

```mermaid
erDiagram
    %% Core State Management
    SESSION_STATE {
        UUID game_id PK
        int turn
        int arrows_remaining
        string explored_tiles
        string message
    }

    %% Main Game Logic
    GAME_ENGINE {
        int size
        int num_pits
        string status
    }

    %% Active Entities
    PLAYER_ENTITY {
        int x
        int y
        boolean has_gold
    }

    WUMPUS_AGENT {
        int x
        int y
        boolean is_alive
    }

    %% Static Grid Objects
    PIT_HAZARD {
        int x
        int y
    }

    GOLD_ITEM {
        int x
        int y
    }

    %% RL Specific Memory
    SCENT_MEMORY {
        matrix scent_grid
        list wumpus_visited
        list pending_trail
    }

    %% Relationships
    SESSION_STATE ||--|| GAME_ENGINE : manages
    GAME_ENGINE ||--|| PLAYER_ENTITY : tracks
    GAME_ENGINE ||--|| WUMPUS_AGENT : coordinates
    GAME_ENGINE ||--o{ PIT_HAZARD : generates
    GAME_ENGINE ||--|| GOLD_ITEM : spawns
    GAME_ENGINE ||--|| SCENT_MEMORY : updates
    SCENT_MEMORY }o--|| WUMPUS_AGENT : influences
```

### 5.4 Training Pipeline Diagram

```mermaid
sequenceDiagram
    autonumber

    %% Define participants with HTML breaks for parser safety
    participant Env as Gymnasium Env<br>(HunterWumpus 4x4)
    participant PPO as PPO Agent<br>(Stable-Baselines3)
    participant Eval as EvalCallback<br>(Monitor)
    participant Disk as File System<br>(Checkpoints)

    Note over Env, PPO: Phase 1: Experience Collection

    loop Rollout Buffer (2048 steps)
        Env->>PPO: 9D Observation Vector (Scent, Pos)
        PPO->>Env: Discrete Action (N, S, E, W)
        Env->>PPO: Reward, Done Flag, Info Dict
    end

    Note over PPO, Disk: Phase 2: Policy Optimization & Callbacks

    PPO->>PPO: Compute Advantages (GAE)
    PPO->>PPO: Update Actor-Critic Networks<br>(10 Epochs, Batch Size 64)

    opt Every 10,000 Timesteps
        PPO->>Eval: Trigger Periodic Evaluation
        Eval->>Env: Run Deterministic Test Episodes
        Env-->>Eval: Return Mean Reward
        Eval->>Disk: Save best_model.zip (If Improved)
    end

    Note over PPO, Disk: End of Training (1,000,000 Timesteps)
    PPO->>Disk: Save final_wumpus_model.zip
```

## 6. Sensory and Memory System

- Breeze, Stench, and Shine are computed from orthogonal neighboring tiles to represent local hazard and objective proximity.
- The scent memory uses `MAX_SCENT = 3` and applies per-step decay to all scent cells.
- The player deposits scent on previous positions, creating short-lived trajectories.
- This indirect signal design prevents trivial pursuit from direct player coordinates and forces learned tracking behavior.

Decay rule:

$$
\text{scent}[x][y] = \max(0, \text{scent}[x][y] - 1)
$$

## 7. Software Architecture Decisions

- **FastAPI + Pydantic**: lightweight REST implementation with typed request/response validation.
- **In-memory session store (`dict`)**: acceptable for single-user local execution; production should migrate to Redis or a database.
- **React Context + `useReducer`**: simpler than full Redux while preserving predictable state transitions.
- **`React.memo` on Grid/Tile**: reduces unnecessary large-grid render costs.
- **Separation of concerns**: `engine/`, `rl/`, and `api/` are modular and independently testable.

## 8. Results & Evaluation

- Model training runs for 1,000,000 timesteps on a 4x4 environment with 3 pits.
- `EvalCallback` evaluates every 10,000 timesteps and retains the best-performing checkpoint.
- Reward shaping biases the policy toward active pursuit and successful terminal outcomes.
- Inference uses `deterministic=True` in `PPO.predict()` to ensure consistent gameplay behavior.

## 9. Limitations & Future Work

- Training occurs on a 4x4 grid, while deployment is on 10x10; normalized state helps transfer, but policy quality may degrade.
- Support for multiple Wumpus entities can extend challenge and complexity.
- A trainable player policy can enable adversarial or self-play setups.
- WebSocket-based updates can reduce request overhead and improve interactivity.
- Persistent sessions with database-backed storage can enable multi-user and resume functionality.

## 10. Conclusion

The project demonstrates an end-to-end adversarial game system where a reinforcement-learned Wumpus agent operates within a deterministic game engine served over REST and visualized through a responsive React frontend. The scent-memory observation strategy and reward shaping produce practical hunting behavior while maintaining game fairness and extensibility for future AI/ML enhancements.
