# API Contract — Hunter Wumpus

> ⚠️ **This is the single source of truth for every HTTP interaction between the React frontend and the FastAPI backend.**
> Any AI agent implementing `routes.py`, `schemas.py`, or `gameService.js` must match this document exactly.
> Do not invent new endpoints, rename fields, or change HTTP methods.

---

## Base URL

| Environment      | URL                     |
| ---------------- | ----------------------- |
| Development      | `http://localhost:8000` |
| Frontend env var | `VITE_API_BASE_URL`     |

All endpoints are prefixed with nothing (no `/api/v1` prefix for MVP).

---

## Common Headers

**Every request from the frontend must include:**

```
Content-Type: application/json
```

**Every response from the backend includes:**

```
Content-Type: application/json
Access-Control-Allow-Origin: http://localhost:5173
```

---

## Endpoints

---

### 1. `POST /game/start`

**Purpose:** Create a new game session. Returns the initial board state.

**Request Body:**

```json
{
  "grid_size": 10
}
```

| Field       | Type      | Required | Default | Constraints       |
| ----------- | --------- | -------- | ------- | ----------------- |
| `grid_size` | `integer` | No       | `10`    | Min `4`, max `16` |

**Success Response — `200 OK`:**

```json
{
  "game_id": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "status": "Ongoing",
  "grid_size": 10,
  "turn": 0,
  "player_pos": [0, 0],
  "arrows_remaining": 1,
  "explored_tiles": [[0, 0]],
  "senses": {
    "breeze": false,
    "stench": false,
    "shine": false
  },
  "message": "The hunt begins. Find the gold. Survive."
}
```

**Error Responses:**

| HTTP Code | Condition                     | Body                                               |
| --------- | ----------------------------- | -------------------------------------------------- |
| `422`     | `grid_size` is outside `4–16` | `{ "detail": [{ "msg": "..." }] }` (Pydantic auto) |

**Notes:**

- Each call creates a **brand new** session with a new UUID. Calling start twice gives two independent games.
- The Wumpus position is determined randomly but never logged in the response.
- `turn` starts at `0` and increments after each `/game/move` call.

---

### 2. `POST /game/move`

**Purpose:** Submit the player's action. The backend steps the player, computes the Wumpus's response via the RL agent, advances the turn, and returns the new state.

**Request Body:**

```json
{
  "game_id": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "player_action": "NORTH"
}
```

| Field           | Type            | Required | Valid Values                                                                                               |
| --------------- | --------------- | -------- | ---------------------------------------------------------------------------------------------------------- |
| `game_id`       | `string`        | Yes      | Any UUID returned by `/game/start`                                                                         |
| `player_action` | `string` (enum) | Yes      | `"NORTH"`, `"SOUTH"`, `"EAST"`, `"WEST"`, `"SHOOT_NORTH"`, `"SHOOT_SOUTH"`, `"SHOOT_EAST"`, `"SHOOT_WEST"` |

**Success Response — `200 OK`:**

Same shape as `/game/start` response. The `status`, `player_pos`, `explored_tiles`, `senses`, `turn`, and `arrows_remaining` fields will reflect the new state.

```json
{
  "game_id": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "status": "Ongoing",
  "grid_size": 10,
  "turn": 4,
  "player_pos": [3, 2],
  "arrows_remaining": 1,
  "explored_tiles": [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
    [3, 1],
    [3, 2]
  ],
  "senses": {
    "breeze": true,
    "stench": false,
    "shine": false
  },
  "message": "You feel a cold draft. A pit may be nearby."
}
```

**Terminal state example (loss):**

```json
{
  "game_id": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "status": "PlayerLost_Wumpus",
  "grid_size": 10,
  "turn": 12,
  "player_pos": [5, 5],
  "arrows_remaining": 0,
  "explored_tiles": [[0, 0], "..."],
  "senses": {
    "breeze": false,
    "stench": false,
    "shine": false
  },
  "message": "The Wumpus found you in the dark."
}
```

**Error Responses:**

| HTTP Code | Condition                                                               | Body                                       |
| --------- | ----------------------------------------------------------------------- | ------------------------------------------ |
| `404`     | `game_id` does not exist in the session store                           | `{ "detail": "Game not found." }`          |
| `400`     | Player tries to shoot with `arrows_remaining == 0`                      | `{ "detail": "No arrows remaining." }`     |
| `400`     | Game is already in a terminal state (player re-submits after game over) | `{ "detail": "Game is already over." }`    |
| `422`     | `player_action` is not one of the 8 valid strings                       | Pydantic validation error (auto-generated) |

**Notes:**

- If the player's move **immediately** ends the game (e.g., walks into a pit), the Wumpus does **not** move. The response is the terminal state.
- `explored_tiles` is cumulative — it always grows, never shrinks.
- `message` strings are flavour text only. The frontend must use `status` for logic, never `message`.

---

### 3. `GET /game/{game_id}/status`

**Purpose:** Fetch the current state of a game without advancing the turn. Useful for reconnect/refresh scenarios.

**Path Parameter:**

| Param     | Type            | Description                  |
| --------- | --------------- | ---------------------------- |
| `game_id` | `string` (UUID) | The game session to retrieve |

**Request Body:** None

**Success Response — `200 OK`:**

Identical shape to `/game/start` and `/game/move` responses. The state reflects the last resolved turn.

**Error Responses:**

| HTTP Code | Condition           | Body                              |
| --------- | ------------------- | --------------------------------- |
| `404`     | `game_id` not found | `{ "detail": "Game not found." }` |

---

## Action Enum Reference

The `player_action` field accepts exactly these 8 string values — no others:

| Value           | Meaning                         |
| --------------- | ------------------------------- |
| `"NORTH"`       | Move player up (Y decreases)    |
| `"SOUTH"`       | Move player down (Y increases)  |
| `"EAST"`        | Move player right (X increases) |
| `"WEST"`        | Move player left (X decreases)  |
| `"SHOOT_NORTH"` | Fire arrow upward               |
| `"SHOOT_SOUTH"` | Fire arrow downward             |
| `"SHOOT_EAST"`  | Fire arrow rightward            |
| `"SHOOT_WEST"`  | Fire arrow leftward             |

---

## Status Enum Reference

The `status` field will always be exactly one of these strings:

| Value                 | Meaning                                        | Game continues? |
| --------------------- | ---------------------------------------------- | --------------- |
| `"Ongoing"`           | Normal play                                    | Yes             |
| `"PlayerWon"`         | Player found gold or shot the Wumpus           | No              |
| `"PlayerLost_Pit"`    | Player walked into a pit                       | No              |
| `"PlayerLost_Wumpus"` | Player was caught by or walked into the Wumpus | No              |

---

## Message String Reference

The `message` field is flavour text only. Below are the canonical messages the backend must use. Do not invent new messages.

| Trigger                    | Message                                                        |
| -------------------------- | -------------------------------------------------------------- |
| Game starts                | `"The hunt begins. Find the gold. Survive."`                   |
| Player moves, no senses    | `""` (empty string)                                            |
| `senses.breeze == true`    | `"You feel a cold draft. A pit may be nearby."`                |
| `senses.stench == true`    | `"Something foul is close. The Wumpus is near."`               |
| `senses.shine == true`     | `"A faint glimmer catches your eye."`                          |
| Breeze + stench            | `"You feel both a draft and a stench. Tread carefully."`       |
| Player shoots, hits Wumpus | `"Your arrow finds its mark. The Wumpus is dead."`             |
| Player shoots, misses      | `"Your arrow disappears into the darkness. You have no more."` |
| Player wins (gold)         | `"You found the gold and escaped. Victory."`                   |
| `PlayerLost_Pit`           | `"The ground gave way. There was no bottom."`                  |
| `PlayerLost_Wumpus`        | `"The Wumpus found you in the dark."`                          |

---

## Frontend `gameService.js` Implementation Contract

The following function signatures must be implemented exactly as described:

```javascript
// frontend/src/api/gameService.js

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Start a new game session.
 * @param {number} [gridSize=10] - Board dimensions (N for N×N).
 * @returns {Promise<GameStateResponse>}
 * @throws {Error} On non-2xx HTTP response.
 */
export async function startGame(gridSize = 10) { ... }

/**
 * Submit a player action and receive the new state.
 * @param {string} gameId - UUID from a previous startGame() call.
 * @param {string} action - One of the 8 valid ActionType strings.
 * @returns {Promise<GameStateResponse>}
 * @throws {Error} On non-2xx HTTP response. The caller handles the error.
 */
export async function movePlayer(gameId, action) { ... }

/**
 * Retrieve the current state without advancing the turn.
 * @param {string} gameId
 * @returns {Promise<GameStateResponse>}
 * @throws {Error} On non-2xx HTTP response.
 */
export async function getStatus(gameId) { ... }
```

**Error handling rule:** All three functions must `throw` on non-2xx responses so the calling hook (`useControls.js`) can catch and display a toast. Functions must never silently swallow errors.

---

## Backend `schemas.py` Pydantic Models Contract

```python
from pydantic import BaseModel, Field
from typing import Literal

# Locked to exactly these 8 values
ActionType = Literal[
    "NORTH", "SOUTH", "EAST", "WEST",
    "SHOOT_NORTH", "SHOOT_SOUTH", "SHOOT_EAST", "SHOOT_WEST",
]

GameStatus = Literal[
    "Ongoing", "PlayerWon", "PlayerLost_Pit", "PlayerLost_Wumpus"
]

class StartRequest(BaseModel):
    grid_size: int = Field(default=10, ge=4, le=16)

class MoveRequest(BaseModel):
    game_id: str
    player_action: ActionType

class SensesPayload(BaseModel):
    breeze: bool
    stench: bool
    shine:  bool

class GameStateResponse(BaseModel):
    game_id:          str
    status:           GameStatus
    grid_size:        int
    turn:             int
    player_pos:       tuple[int, int]
    arrows_remaining: int
    explored_tiles:   list[tuple[int, int]]
    senses:           SensesPayload
    message:          str
```

> **Rule:** `wumpus_pos`, `pit_positions`, `gold_pos`, and `scent_grid` must never be fields in `GameStateResponse`. Pydantic will serialize exactly what is defined — add nothing extra.
