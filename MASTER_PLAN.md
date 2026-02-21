# Master Implementation Plan

**Project:** Hunter Wumpus - Adversarial RL Game

**Date Created:** [Insert Date]

---

## 🎯 PROJECT COMPLETION SUMMARY

**Status:** 🚧 **IN PROGRESS (7/10 COMPLETE)**

**Overview of all tasks:**

| Phase | Task                                          | Status | Build | Tests |
| ----- | --------------------------------------------- | ------ | ----- | ----- |
| 1     | TODO-001: Core Game Engine & State Management | ✅     | ✅    | ✅    |
| 2     | TODO-002: Scent Trail & Memory System         | ✅     | ✅    | ✅    |
| 3     | TODO-003: RL Environment Wrapper (Gymnasium)  | ✅     | ✅    | ✅    |
| 4     | TODO-004: Agent Training & Inference          | ✅     | ✅    | ✅    |
| 5     | TODO-005: REST API Server                     | ⏳     | ❓    | ❓    |
| 6     | TODO-006: Core UI & State Setup               | ✅     | ✅    | ✅    |
| 7     | TODO-007: Grid Rendering & Fog of War         | ✅     | ✅    | ✅    |
| 8     | TODO-008: Sensory Indicators & Sprites        | ✅     | ✅    | ✅    |
| 9     | TODO-009: Player Controls & Combat Mechanics  | ⏳     | ❓    | ❓    |
| 10    | TODO-010: Game Loop & Game Over Sequences     | ⏳     | ❓    | ❓    |

**Deliverables:**

- A functional Python-based game engine simulating Wumpus World physics.
- A trained RL agent capable of hunting the player.
- A FastAPI backend serving turn-based game states.
- A React frontend featuring Fog of War, UI controls, and sensory feedback.

**Key Reference Documents:**

| Document                       | Purpose                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------ |
| `MASTER_PLAN.md` (this file)   | Architecture, rules, data contracts, environment setup                         |
| `API_CONTRACT.md`              | Every HTTP endpoint, request/response shape, error codes, and Pydantic schemas |
| `backend_tasks/TASK_00X_*.md`  | Step-by-step implementation instructions per backend phase                     |
| `frontend_tasks/TASK-0XX-*.md` | Step-by-step implementation instructions per frontend phase                    |

---

## Code Generation Policy for AI Agents

⚠️ **CRITICAL: INSTRUCTIONS FOR AI CODING ASSISTANTS**

1. **Context First**: Adapt patterns and structure to fit the actual codebase context. Do not copy-paste code samples verbatim without understanding the surrounding architecture.
2. **Sequential Execution**: Do not jump ahead to future tasks. Complete the current TODO fully, including tests, before moving on.
3. **Typing & Documentation**: All Python code must use strict type hints. All React/JS code must use PropTypes or TypeScript interfaces.
4. **No Spaghetti**: Maintain strict separation of concerns. The Game Engine must know nothing about the FastAPI server. The React UI must be completely decoupled from the game logic, driven purely by the API JSON responses.
5. **Line Limit**: **No single file may exceed 200 lines of code.** If a file is approaching the limit, split it according to the architecture defined in the System Architecture section below. This is a hard rule — not a guideline.

---

## System Architecture

### Line Budget Rule

Every file in this project has a defined **maximum line budget**. The budget includes code, comments, and blank lines. If an implementation causes a file to exceed its budget, the overflowing logic **must** be extracted into the designated split file shown below.

---

### Backend File Tree

```
backend/
│
├── engine/                          ← Pure game logic. Zero external dependencies.
│   ├── __init__.py                  (  ~5 lines ) Package marker.
│   ├── entities.py                  ( ~70 lines ) Data types only.
│   ├── game_state.py                (~170 lines ) GameEngine class — board setup & movement.
│   └── senses.py                    (~100 lines ) Scent grid, Wumpus memory, get_senses().
│
├── rl/                              ← RL logic. Depends on engine/, nothing else.
│   ├── __init__.py                  (  ~5 lines ) Package marker.
│   ├── env.py                       (~160 lines ) HunterWumpusEnv(gym.Env).
│   ├── train.py                     ( ~80 lines ) PPO training script. Run once offline.
│   └── agent.py                     ( ~60 lines ) WumpusAgent — loads model, runs inference.
│
├── api/                             ← Web layer. Depends on engine/ and rl/ only.
│   ├── __init__.py                  (  ~5 lines ) Package marker.
│   ├── main.py                      ( ~50 lines ) FastAPI app creation, CORS, router mount.
│   ├── routes.py                    (~110 lines ) All endpoint handlers (/start, /move, /status).
│   └── schemas.py                   ( ~80 lines ) All Pydantic request/response models.
│
├── models/                          ← Saved model weights (gitignored).
│   └── hunter_wumpus_model.zip
│
├── tests/
│   ├── test_engine_setup.py         ( ~80 lines ) Entity placement & safe spawn tests.
│   ├── test_movement.py             ( ~80 lines ) Boundary clamping & coord update tests.
│   ├── test_game_over.py            ( ~60 lines ) Win/loss condition tests.
│   ├── test_scent_memory.py         (~100 lines ) Scent decay & sensory output tests.
│   └── test_api.py                  (~120 lines ) FastAPI endpoint integration tests.
│
├── requirements.txt
└── .env                             ← MODEL_PATH, PORT (gitignored)
```

#### Backend — Per-File Responsibility

| File            | Max Lines | Owns                                                                                     | Must NOT contain                              |
| --------------- | --------- | ---------------------------------------------------------------------------------------- | --------------------------------------------- |
| `entities.py`   | 70        | `Direction`, `Position`, `TileContent` enums/dataclasses                                 | Any logic, methods beyond `__eq__`/`__hash__` |
| `game_state.py` | 170       | `GameEngine.__init__`, `_reset_board`, `move_player`, `move_wumpus`, `check_game_over`   | Scent logic, sensory queries, API/RL imports  |
| `senses.py`     | 100       | `_update_scent`, `get_senses`, `_get_orthogonal_neighbors`, `wumpus_visited` set updates | Movement logic, game status evaluation        |
| `env.py`        | 160       | `HunterWumpusEnv`, `reset`, `step`, `_get_obs`, `render`                                 | Training loop, model loading                  |
| `train.py`      | 80        | `PPO` setup, `model.learn()`, `EvalCallback`, `model.save()`                             | Inference, API logic                          |
| `agent.py`      | 60        | `WumpusAgent.__init__`, `get_wumpus_action`                                              | Training, environment stepping                |
| `main.py`       | 50        | FastAPI `app` instance, `CORSMiddleware`, `include_router`                               | Route handlers, Pydantic models               |
| `routes.py`     | 110       | `start_game`, `move`, `get_status` endpoint functions, `_sessions` store                 | Schema definitions, game logic                |
| `schemas.py`    | 80        | `MoveRequest`, `GameStateResponse`, `SensesPayload`, `ActionType`                        | Any logic or imports from engine/rl           |

---

### Frontend File Tree

```
frontend/
│
├── public/
│   └── index.html
│
├── src/
│   │
│   ├── api/
│   │   └── gameService.js           ( ~60 lines ) startGame(), movePlayer(). Fetch wrappers only.
│   │
│   ├── store/
│   │   ├── GameContext.jsx          ( ~70 lines ) Context creation, GameProvider component, useGame hook.
│   │   └── gameReducer.js           ( ~80 lines ) Pure reducer — all state transitions (UPDATE_STATE, SET_LOADING, RESET_STATE).
│   │
│   ├── hooks/
│   │   └── useControls.js           ( ~90 lines ) keydown listener, aim toggle, API dispatch, error handling.
│   │
│   ├── components/
│   │   ├── Grid.jsx                 ( ~55 lines ) Renders N×N Tile grid using CSS custom property.
│   │   ├── Tile.jsx                 (~100 lines ) Fog logic + sensory indicator overlays.
│   │   ├── GameUI.jsx               ( ~80 lines ) HUD: ammo counter, aim-mode indicator, Start button.
│   │   ├── GameOverModal.jsx        ( ~75 lines ) Win/loss overlay, per-status messages, Play Again.
│   │   └── LoadingOverlay.jsx       ( ~30 lines ) Full-screen "The Wumpus is thinking..." blocker.
│   │
│   ├── styles/
│   │   ├── App.css                  ( ~40 lines ) Root layout, font, background.
│   │   ├── Grid.css                 ( ~60 lines ) .grid, --grid-size, gap, aspect-ratio.
│   │   ├── Tile.css                 ( ~70 lines ) .tile, .fog-of-war, .explored, .sense-* classes.
│   │   └── Modal.css                ( ~60 lines ) .modal-overlay, .modal-box, .play-again-btn.
│   │
│   ├── assets/                      ← SVG/PNG sprites (player, pit, gold).
│   │
│   ├── App.jsx                      ( ~70 lines ) Root component — wires Provider, Grid, GameUI, Modal, Overlay.
│   └── main.jsx                     ( ~15 lines ) ReactDOM.createRoot entry point.
│
├── .env                             ← VITE_API_BASE_URL=http://localhost:8000
├── package.json
└── vite.config.js
```

#### Frontend — Per-File Responsibility

| File                 | Max Lines | Owns                                                               | Must NOT contain                        |
| -------------------- | --------- | ------------------------------------------------------------------ | --------------------------------------- |
| `gameService.js`     | 60        | HTTP calls to backend, base URL from `import.meta.env`             | State, React hooks, rendering           |
| `GameContext.jsx`    | 70        | Context object, `GameProvider`, `useGame()` convenience hook       | Reducer logic, API calls                |
| `gameReducer.js`     | 80        | All `dispatch` cases: `UPDATE_STATE`, `SET_LOADING`, `RESET_STATE` | Side effects, API calls, DOM            |
| `useControls.js`     | 90        | `keydown` binding, `isAiming` state, error toast trigger           | Rendering, direct state mutation        |
| `Grid.jsx`           | 55        | `N×N` tile layout, injects `--grid-size` CSS var                   | Individual tile rendering, fog logic    |
| `Tile.jsx`           | 100       | Fog-of-war logic, sensory overlays, player/entity sprites          | Grid layout, controls, context dispatch |
| `GameUI.jsx`         | 80        | Ammo display, aim-mode badge, Start/Restart button                 | Game grid, modals                       |
| `GameOverModal.jsx`  | 75        | Status-to-message mapping, Play Again action                       | Loading state, keyboard controls        |
| `LoadingOverlay.jsx` | 30        | Full-screen blocker div + spinner text                             | Any logic beyond conditional render     |
| `App.jsx`            | 70        | Component composition, modal/overlay conditional render            | Business logic, API calls               |

---

### Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                          BROWSER (React)                            │
│                                                                     │
│  useControls.js                                                     │
│  (keydown event)                                                    │
│       │  player_action string                                       │
│       ▼                                                             │
│  gameService.js  ──── POST /game/move ──────────────────────────▶  │
│                  ◀─── GameStateResponse JSON ───────────────────── │
│       │                                                             │
│       ▼                                                             │
│  gameReducer.js (UPDATE_STATE)                                      │
│       │                                                             │
│       ▼                                                             │
│  GameContext  ──▶  Grid.jsx / Tile.jsx / GameUI.jsx                │
│                    (re-render on state change)                      │
└─────────────────────────────────────────────────────────────────────┘
                              ▲
                    HTTP (JSON over REST)
                              │
┌─────────────────────────────────────────────────────────────────────┐
│                        FASTAPI SERVER (Python)                      │
│                                                                     │
│  routes.py                                                          │
│  POST /game/move                                                    │
│       │                                                             │
│       ├─── 1. engine.move_player(direction)                        │
│       │         (game_state.py)                                     │
│       │                                                             │
│       ├─── 2. agent.get_wumpus_action(obs)                         │
│       │         (agent.py  ──▶  models/*.zip)                      │
│       │                                                             │
│       ├─── 3. engine.move_wumpus(direction)                        │
│       │         (game_state.py)                                     │
│       │                                                             │
│       ├─── 4. engine._update_scent()                               │
│       │         (senses.py)                                         │
│       │                                                             │
│       └─── 5. build GameStateResponse  ──▶  return JSON            │
│                  (schemas.py)                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Split Rules (When to Break a File)

If a file is approaching its line budget during implementation, use these designated splits:

| Overflowing File | Extract Into             | What to Move                                           |
| ---------------- | ------------------------ | ------------------------------------------------------ |
| `game_state.py`  | `senses.py`              | Any scent/sensory method                               |
| `env.py`         | `obs_builder.py` (new)   | `_get_obs()` if observation logic grows complex        |
| `routes.py`      | `session_store.py` (new) | `_sessions` dict + CRUD helpers if session logic grows |
| `Tile.jsx`       | `SenseOverlay.jsx` (new) | The sensory icon rendering block                       |
| `gameReducer.js` | `initialState.js` (new)  | The default state object and type constants            |

---

## Game Rules

> ⚠️ These rules are **frozen**. No AI agent may change game behaviour to suit its implementation. If a rule creates a coding challenge, solve the challenge — do not bend the rule.

### Board

| Property          | Value                                                                                        |
| ----------------- | -------------------------------------------------------------------------------------------- |
| Default grid size | `10 × 10`                                                                                    |
| Configurable?     | Yes — `POST /game/start` accepts optional `{ "grid_size": N }` where `N` is `4–16` inclusive |
| Coordinate system | `(col, row)` → `(x, y)`. `(0, 0)` is **top-left**. X increases right, Y increases down       |
| Safe start tile   | `(0, 0)` is always free of pits, gold, and the Wumpus                                        |

### Entities (defaults for a 10×10 game)

| Entity | Count                    | Spawns on safe tile?    | Notes                              |
| ------ | ------------------------ | ----------------------- | ---------------------------------- |
| Player | 1                        | Always `(0, 0)`         | Starts facing no direction         |
| Wumpus | 1                        | Anywhere except `(0,0)` | Controlled by RL agent             |
| Gold   | 1                        | Anywhere except `(0,0)` | Static — does not move             |
| Pits   | `floor(grid_size * 0.2)` | Anywhere except `(0,0)` | Static — do not move. Min 2, max 8 |

### Turn Structure (one full turn = both sides move once)

```
1. Player sends action  →  engine.move_player(direction) or engine.shoot(direction)
2. engine.check_game_over()  →  if terminal, return final state immediately (Wumpus does NOT move)
3. Agent computes Wumpus action  →  engine.move_wumpus(direction)
4. engine.check_game_over()  →  check again after Wumpus move
5. engine._update_scent()  →  decay scent trail
6. Return new GameStateResponse
```

### Movement

- All movement is **orthogonal only** (N, S, E, W). No diagonal movement for player or Wumpus.
- Moving into a wall (grid boundary) is a **no-op** — the entity stays in place. The player is charged the `-5` wall penalty in the RL reward but the game does **not** end.
- Entities occupy exactly one tile at a time. Multiple entities **can** share a tile (this is how death is detected).
- The Wumpus **can** enter pit tiles. Pits do not affect the Wumpus.

### Combat — Shooting

- The player starts with **1 arrow**. There is no way to gain more.
- Shooting sends an action of `SHOOT_NORTH`, `SHOOT_SOUTH`, `SHOOT_EAST`, or `SHOOT_WEST`.
- The arrow travels in a **straight line** until it hits a wall or the Wumpus.
- If the arrow hits the Wumpus: `status → "PlayerWon"` immediately. The Wumpus is dead.
- If the arrow misses: the arrow is consumed. `arrows_remaining → 0`. The game continues.
- Shooting with 0 arrows remaining is treated as an invalid action → return HTTP `400`.

### Win / Loss Conditions

| Condition                           | Who triggers it     | Status string         |
| ----------------------------------- | ------------------- | --------------------- |
| Player steps onto the Gold tile     | Player movement     | `"PlayerWon"`         |
| Arrow hits the Wumpus               | Player shoot action | `"PlayerWon"`         |
| Player steps onto a Pit tile        | Player movement     | `"PlayerLost_Pit"`    |
| Wumpus steps onto the Player's tile | Wumpus movement     | `"PlayerLost_Wumpus"` |
| Player steps onto the Wumpus's tile | Player movement     | `"PlayerLost_Wumpus"` |

### Sensory Rules

- Senses are computed for the **Player's current tile** after every move.
- Only **orthogonally adjacent** tiles trigger senses. Diagonals do not.
- `breeze` = any adjacent tile is a pit.
- `stench` = any adjacent tile contains the Wumpus (or the player is on the Wumpus tile — but that resolves as death first).
- `shine` = the player is on the Gold tile **or** any adjacent tile is the Gold tile.

### Scent Trail (Wumpus POV)

- When the player leaves a tile, that tile's scent value is set to `MAX_SCENT = 3`.
- After both moves resolve, **all** non-zero scent values decay by `1` (floor at `0`).
- Scent values never exceed `MAX_SCENT`.
- Scent is part of the RL observation, not the player-facing API response.

---

## Data Contracts

> ⚠️ These are **locked interfaces**. Every file that produces or consumes these structures must match them exactly — field names, types, and nesting. No deviations.

### `entities.py` — Canonical Field Names

```python
from dataclasses import dataclass
from enum import Enum

class Direction(Enum):
    NORTH = 0
    SOUTH = 1
    EAST  = 2
    WEST  = 3

class TileContent(Enum):
    EMPTY  = "empty"
    PIT    = "pit"
    GOLD   = "gold"
    WUMPUS = "wumpus"
    PLAYER = "player"

@dataclass
class Position:
    x: int   # column (increases right)
    y: int   # row    (increases down)

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Position):
            return NotImplemented
        return self.x == other.x and self.y == other.y

    def __hash__(self) -> int:
        return hash((self.x, self.y))
```

> **Rule:** All engine code uses `pos.x` and `pos.y`. Never `pos[0]`, `pos.row`, or `pos.col`.

---

### `GameStateResponse` — The Single API JSON Shape

Every response from `/game/start`, `/game/move`, and `/game/status` must match this schema exactly:

```json
{
  "game_id": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "status": "Ongoing",
  "grid_size": 10,
  "turn": 3,
  "player_pos": [3, 4],
  "arrows_remaining": 1,
  "explored_tiles": [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 4]
  ],
  "senses": {
    "breeze": false,
    "stench": true,
    "shine": false
  },
  "message": "Something foul is close. The Wumpus is near."
}
```

**Field rules:**

| Field              | Type                 | Notes                                                                         |
| ------------------ | -------------------- | ----------------------------------------------------------------------------- |
| `game_id`          | `string` (UUID4)     | Never reuse across games                                                      |
| `status`           | `string` (enum)      | One of: `"Ongoing"`, `"PlayerWon"`, `"PlayerLost_Pit"`, `"PlayerLost_Wumpus"` |
| `grid_size`        | `integer`            | The `N` for an `N×N` board                                                    |
| `turn`             | `integer`            | Starts at `0`, increments by `1` after each full turn                         |
| `player_pos`       | `[integer, integer]` | `[x, y]` — never `{x, y}` object                                              |
| `arrows_remaining` | `integer`            | `0` or `1`                                                                    |
| `explored_tiles`   | `[[int,int], ...]`   | All tiles the player has stood on. Always includes `[0,0]`                    |
| `senses.breeze`    | `boolean`            |                                                                               |
| `senses.stench`    | `boolean`            |                                                                               |
| `senses.shine`     | `boolean`            |                                                                               |
| `message`          | `string`             | Human-readable flavour text. Empty string `""` if nothing notable.            |

**Fields NEVER in the response** (the frontend must not know these):

- `wumpus_pos`
- `pit_positions`
- `gold_pos`
- `scent_grid`

---

### RL Observation Vector — Locked Index Table

Shape: `(9,)`, dtype `float32`, all values normalized to `[0.0, 1.0]`.

| Index    | Field                    | Formula                                                                   |
| -------- | ------------------------ | ------------------------------------------------------------------------- |
| `obs[0]` | Wumpus X                 | `wumpus_pos.x / (grid_size - 1)`                                          |
| `obs[1]` | Wumpus Y                 | `wumpus_pos.y / (grid_size - 1)`                                          |
| `obs[2]` | Player X                 | `player_pos.x / (grid_size - 1)`                                          |
| `obs[3]` | Player Y                 | `player_pos.y / (grid_size - 1)`                                          |
| `obs[4]` | Scent on Wumpus tile     | `scent_grid[wumpus.y][wumpus.x] / MAX_SCENT`                              |
| `obs[5]` | Scent on NORTH neighbour | `scent_grid[wumpus.y-1][wumpus.x] / MAX_SCENT` (if in bounds, else `0.0`) |
| `obs[6]` | Scent on EAST neighbour  | `scent_grid[wumpus.y][wumpus.x+1] / MAX_SCENT` (if in bounds, else `0.0`) |
| `obs[7]` | Scent on SOUTH neighbour | `scent_grid[wumpus.y+1][wumpus.x] / MAX_SCENT` (if in bounds, else `0.0`) |
| `obs[8]` | Scent on WEST neighbour  | `scent_grid[wumpus.y][wumpus.x-1] / MAX_SCENT` (if in bounds, else `0.0`) |

> **Rule:** `observation_space = spaces.Box(low=0.0, high=1.0, shape=(9,), dtype=np.float32)`. Do not change the shape without updating this table AND `env.py` AND `agent.py` simultaneously.

---

### RL Reward Function — Locked

Defined in `env.py`. These values are final — do not tweak during implementation.

| Event                               | Reward | Notes                                        |
| ----------------------------------- | ------ | -------------------------------------------- |
| Wumpus catches Player (share tile)  | `+100` | Terminal — `terminated = True`               |
| Player falls in Pit (Wumpus wins)   | `+50`  | Terminal — Wumpus didn't have to work for it |
| Wumpus walks into a wall (clamped)  | `-5`   | Non-terminal                                 |
| Every step taken by Wumpus          | `-1`   | Time pressure penalty                        |
| Wumpus moves onto a scented tile    | `+2`   | Incentive to follow trail                    |
| Player picks up Gold (Wumpus loses) | `-100` | Terminal — `terminated = True`               |
| Player shoots and kills Wumpus      | `-100` | Terminal — `terminated = True`               |

> **Rule:** Rewards are **from the Wumpus's perspective** — positive means the Wumpus is winning. The player has no reward function; the player is controlled by the human or random-walk dummy.

---

### CSS Class Name Contract — Locked

`Grid.css` and `Tile.css` must define **exactly** these classes. `Tile.jsx` must apply **exactly** these class names. No ad-hoc class names.

| Class                 | Applied to         | Condition                       |
| --------------------- | ------------------ | ------------------------------- |
| `.tile`               | Every `<div>` tile | Always                          |
| `.tile--fog`          | Tile `<div>`       | `isExplored === false`          |
| `.tile--explored`     | Tile `<div>`       | `isExplored === true`           |
| `.tile--player`       | Tile `<div>`       | `isPlayerHere === true`         |
| `.tile--sense-breeze` | Tile `<div>`       | `isPlayerHere && senses.breeze` |
| `.tile--sense-stench` | Tile `<div>`       | `isPlayerHere && senses.stench` |
| `.tile--sense-shine`  | Tile `<div>`       | `isPlayerHere && senses.shine`  |
| `.tile--pit`          | Tile `<div>`       | Post-game reveal only           |
| `.tile--gold`         | Tile `<div>`       | Post-game reveal only           |

`GameContext` state CSS:

| Class              | Applied to                 | Condition            |
| ------------------ | -------------------------- | -------------------- |
| `.ui--aiming`      | `GameUI` wrapper           | `isAiming === true`  |
| `.modal-overlay`   | `GameOverModal` outer div  | Modal is open        |
| `.loading-overlay` | `LoadingOverlay` outer div | `isLoading === true` |

---

### Frontend `initialState` — Locked

This is the **exact** default state object that `gameReducer.js` must export and use. Field names are camelCase (JS convention). Types are JSDoc annotations.

```javascript
// frontend/src/store/gameReducer.js  — top of file

/** @type {GameState} */
export const initialState = {
  gameId: null, // string | null  — UUID from backend
  status: 'idle', // 'idle' | 'Ongoing' | 'PlayerWon' | 'PlayerLost_Pit' | 'PlayerLost_Wumpus'
  gridSize: 10, // number
  turn: 0, // number
  playerPos: [0, 0], // [number, number]
  arrowsRemaining: 1, // number  — 0 or 1
  exploredTiles: [], // [number, number][]
  senses: {
    breeze: false, // boolean
    stench: false, // boolean
    shine: false, // boolean
  },
  message: '', // string  — flavour text, never used for logic
  isLoading: false, // boolean — true while any API call is in-flight
  isAiming: false, // boolean — true when player has toggled shoot mode
  error: null, // string | null — last API error message, shown as toast
};
```

> **Rule:** No component or hook may add fields to this object. If new state is needed, add it here first and update this table.

---

### API JSON → JS State Field Name Mapping — Locked

The backend uses `snake_case`. The frontend state uses `camelCase`. The `gameReducer.js` `UPDATE_STATE` case must apply this mapping every time it processes a backend response. Never store snake_case keys in React state.

| Backend JSON field (`snake_case`) | Frontend state field (`camelCase`)     |
| --------------------------------- | -------------------------------------- |
| `game_id`                         | `gameId`                               |
| `status`                          | `status`                               |
| `grid_size`                       | `gridSize`                             |
| `turn`                            | `turn`                                 |
| `player_pos`                      | `playerPos`                            |
| `arrows_remaining`                | `arrowsRemaining`                      |
| `explored_tiles`                  | `exploredTiles`                        |
| `senses`                          | `senses` (object passed through as-is) |
| `message`                         | `message`                              |

The mapping in `gameReducer.js` must look exactly like this:

```javascript
case 'UPDATE_STATE':
  return {
    ...state,
    gameId:          action.payload.game_id,
    status:          action.payload.status,
    gridSize:        action.payload.grid_size,
    turn:            action.payload.turn,
    playerPos:       action.payload.player_pos,
    arrowsRemaining: action.payload.arrows_remaining,
    exploredTiles:   action.payload.explored_tiles,
    senses:          action.payload.senses,
    message:         action.payload.message,
    isLoading:       false,
    error:           null,
  };
```

---

### Keypress → API Action String Mapping — Locked

`useControls.js` must use **exactly** this mapping. No other key bindings. The strings sent to the API must match the `ActionType` enum in `schemas.py` exactly.

| Physical Key                   | `isAiming` | Action string sent to API                          |
| ------------------------------ | ---------- | -------------------------------------------------- |
| `w` or `ArrowUp`               | `false`    | `"NORTH"`                                          |
| `s` or `ArrowDown`             | `false`    | `"SOUTH"`                                          |
| `d` or `ArrowRight`            | `false`    | `"EAST"`                                           |
| `a` or `ArrowLeft`             | `false`    | `"WEST"`                                           |
| `w` or `ArrowUp`               | `true`     | `"SHOOT_NORTH"`                                    |
| `s` or `ArrowDown`             | `true`     | `"SHOOT_SOUTH"`                                    |
| `d` or `ArrowRight`            | `true`     | `"SHOOT_EAST"`                                     |
| `a` or `ArrowLeft`             | `true`     | `"SHOOT_WEST"`                                     |
| `Space` (`e.code === 'Space'`) | any        | Toggles `isAiming` — does **not** send an API call |

```javascript
// useControls.js — the exact lookup table to use
const KEY_TO_DIRECTION = {
  w: 'NORTH',
  ArrowUp: 'NORTH',
  s: 'SOUTH',
  ArrowDown: 'SOUTH',
  d: 'EAST',
  ArrowRight: 'EAST',
  a: 'WEST',
  ArrowLeft: 'WEST',
};
// Build action: if isAiming → 'SHOOT_' + direction, else direction
const action = isAiming ? `SHOOT_${direction}` : direction;
```

> **Bug trap:** Use `e.code === 'Space'` for the spacebar, NOT `e.key === 'Space'`. `e.key` for spacebar is `' '` (a space character) — that condition silently never fires.

---

## Environment Setup

### Prerequisites

| Tool    | Required Version                        |
| ------- | --------------------------------------- |
| Python  | `3.11.x` (not 3.12 — some SB3 deps lag) |
| Node.js | `20.x LTS`                              |
| npm     | `10.x` (bundled with Node 20)           |
| Git     | Any recent version                      |

---

### Backend Setup

**`backend/requirements.txt`** (exact versions — do not upgrade during development):

```
fastapi==0.111.0
uvicorn[standard]==0.29.0
pydantic==2.7.1
gymnasium==0.29.1
stable-baselines3==2.3.2
torch==2.3.0
numpy==1.26.4
python-dotenv==1.0.1
pytest==8.2.0
httpx==0.27.0
```

**`backend/.env`** (create this file — never commit it):

```
MODEL_PATH=backend/models/hunter_wumpus_model
PORT=8000
```

**Commands:**

```bash
# From the project root (Hunter Wumpus/)

# 1. Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Run the API server (development)
cd backend
uvicorn api.main:app --reload --port 8000

# 4. Run all backend tests
cd backend
pytest tests/ -v

# 5. Train the RL agent (run once, takes ~10 minutes)
cd backend
python -m rl.train
```

---

### Frontend Setup

**`frontend/package.json`** (key dependencies — use exact versions):

```json
{
  "name": "hunter-wumpus-frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "lint": "eslint src --ext .js,.jsx"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^5.2.0",
    "vitest": "^1.6.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.4.0",
    "jsdom": "^24.0.0",
    "prop-types": "^15.8.1",
    "eslint": "^9.3.0"
  }
}
```

**`frontend/.env`** (create this file — never commit it):

```
VITE_API_BASE_URL=http://localhost:8000
```

**Commands:**

```bash
# From the project root (Hunter Wumpus/)

# 1. Install dependencies
cd frontend
npm install

# 2. Run the dev server
npm run dev          # opens at http://localhost:5173

# 3. Run all frontend tests
npm test

# 4. Production build
npm run build
```

---

### Running the Full Stack

Both servers must be running simultaneously in separate terminals:

```
Terminal 1 (backend):
  cd backend && uvicorn api.main:app --reload --port 8000

Terminal 2 (frontend):
  cd frontend && npm run dev
```

Open `http://localhost:5173` in the browser. The frontend calls `http://localhost:8000`.

---

### `frontend/vite.config.js` — Exact Template

Copy this file verbatim. Do not modify it during implementation.

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  },
});
```

---

### `frontend/src/setupTests.js` — Exact Template

This file must exist for `@testing-library/jest-dom` matchers to work in Vitest.

```javascript
import '@testing-library/jest-dom';
```

---

### `.gitignore` — Full File

Create this file at the project root (`Hunter Wumpus/.gitignore`):

```
# Python
.venv/
__pycache__/
*.pyc
*.pyo
.pytest_cache/
backend/.env
backend/models/

# Node
frontend/node_modules/
frontend/dist/
frontend/.env
frontend/.vite/

# OS
.DS_Store
Thumbs.db

# Editor
.vscode/settings.json
.idea/
```

---

## Implementation Order & Dependency Graph

**Why this order?**
The backend must be built from the inside out. We start with the pure, dependency-free game logic, wrap it for RL training, train the model, and expose it via REST API. The frontend consumes this API sequentially, starting with raw state, moving to visuals, and finishing with user controls.

```text
Backend (Python)
[TODO 001: Core Engine] ──▶ [TODO 002: Scent & Memory] ──▶ [TODO 003: RL Env]
                                                                 │
[TODO 005: API Server] ◀── [TODO 004: Agent Training] ◀─────────┘
        │
Frontend (React)
        ▼
[TODO 006: Core UI Setup] ──▶ [TODO 007: Grid/Fog] ──▶ [TODO 008: Sensory UI]
                                                                 │
[TODO 010: Game Loop] ◀── [TODO 009: Controls/Combat] ◀─────────┘
```

---

## TODO-003 Handoff Notes

Completed by: GPT-5.3-Codex
Build status: ✅ PASS

### What was done:

- Created `backend/rl/__init__.py` and `backend/rl/env.py` with `HunterWumpusEnv` as a Gymnasium wrapper around `GameEngine`.
- Implemented locked RL spaces: `action_space=spaces.Discrete(4)` and `observation_space=spaces.Box(low=0.0, high=1.0, shape=(9,), dtype=np.float32)`.
- Implemented locked 9-index observation vector using normalized Wumpus/player coordinates plus center/N/E/S/W scent values.
- Implemented locked reward table events in Wumpus POV: catch player `+100`, player pit `+50`, wall clamp `-5`, step penalty `-1`, scented tile bonus `+2`, player win `-100`.
- Implemented seeded dummy-player movement via environment `np_random` source for reproducible training episodes.
- Added RL environment tests in `backend/tests/test_rl_env.py` for spaces, reset/step contracts, and terminal reward outcomes.

### Tests passing: ✅ All (21/21)

### Warnings to next implementor:

- `PlayerWon` in current engine maps to a single terminal status, so both “gold pickup” and “wumpus killed by shot” resolve to the same RL penalty (`-100`) until distinct terminal labels exist.
- Training and inference modules (`backend/rl/train.py` and `backend/rl/agent.py`) should consume the locked `(9,)` observation contract exactly.

### Breaking changes:

- None.

## TODO-004 Handoff Notes

Completed by: GPT-5.3-Codex
Build status: ✅ PASS

### What was done:

- Added `backend/rl/train.py` implementing PPO training (`1,000,000` timesteps), evaluation callbacks, random-policy baseline comparison, and model save to `backend/models/hunter_wumpus_model.zip`.
- Added `backend/rl/agent.py` implementing stateless `WumpusAgent` inference with model path resolution via `MODEL_PATH` env var or default config path.
- Added `WumpusAgent.build_observation(game_state)` to build the locked `(9,)` observation vector from raw internal state (`grid_size`, `player_pos`, `wumpus_pos`, `scent_grid`).
- Added `backend/tests/test_agent.py` covering locked observation indexing, deterministic action behavior for identical observations, and real trained-model load/inference.
- Added `backend/mypy.ini` for stable third-party typing behavior on Windows and updated `backend/rl/__init__.py` exports.
- Added model artifact ignore rule in `.gitignore` for `backend/models/`.

### Tests passing: ✅ All (24/24)

### Warnings to next implementor:

- `WumpusAgent.decide_from_state` expects internal engine-style state including hidden fields (`wumpus_pos`, `scent_grid`); API-facing payloads intentionally omit these.
- Keep `MODEL_PATH` configured for production deployments; default path is `backend/models/hunter_wumpus_model.zip`.
- `backend/models/best_model.zip` and `backend/models/evaluations.npz` are produced by `EvalCallback` during training and are ignored by git.

### Breaking changes:

- None.

## TODO-006 Handoff Notes

Completed by: GPT-5.3-Codex
Build status: ✅ PASS

### What was done:

- Scaffolded a Vite + React frontend in `frontend/` with Node 24 engine compatibility.
- Implemented `frontend/src/api/gameService.js` with `startGame`, `movePlayer`, and `getStatus` fetch wrappers that throw on non-2xx responses.
- Implemented `frontend/src/store/gameReducer.js` with locked `initialState`, required reducer actions, and exact snake_case→camelCase mapping in `UPDATE_STATE`.
- Implemented `frontend/src/store/GameContext.jsx` with `GameProvider` and `useGame` hook.
- Implemented `frontend/src/App.jsx` and `frontend/src/main.jsx` to wire provider and Start Game flow with loading/error dispatch.
- Added unit tests for API service and reducer mapping/state transitions.

### Tests passing: ✅ All (6/6)

### Warnings to next implementor:

- Package manager in this worktree is `pnpm`; lockfile is `frontend/pnpm-lock.yaml`.
- Keep API snake_case mapping centralized in reducer `UPDATE_STATE`; do not store backend keys directly in component state.

### Breaking changes:

- None.
