# TODO 005: REST API Server

## Overview

Create a FastAPI server that acts as the bridge between the trained RL Wumpus/Game Engine and the React frontend.

## Goals

1. **API Endpoints**: Create `/game/start`, `/game/move`, and `/game/status`.
2. **Session Management**: Handle basic state storage so the frontend can make stateless HTTP requests (e.g., using a game_id).
3. **JSON Serialization**: Format the engine's state into a UI-friendly JSON payload.

---

## Files to Change

### Files to MODIFY (Create New)

1. `backend/api/main.py` - **MAJOR** - FastAPI application and routes.
2. `backend/api/schemas.py` - **MINOR** - Pydantic models for request/response validation.

---

## Implementation Approach

### Endpoints

- **POST `/game/start`**: Initializes a new `GameEngine`, returns a `game_id` (UUID4) and the initial sanitized state.
- **POST `/game/move`**:
  1. Look up `game_id` in the in-memory session store; return `404` if not found.
  2. Validate `player_action` is one of `["NORTH", "SOUTH", "EAST", "WEST", "SHOOT_NORTH", "SHOOT_SOUTH", "SHOOT_EAST", "SHOOT_WEST"]`; return `400` with a descriptive error if not.
  3. Step the player.
  4. Call `WumpusAgent.get_wumpus_action(obs)` to get the Wumpus's move.
  5. Step the Wumpus.
  6. Call `engine._update_scent()`.
  7. Return the newly resolved state.
- **GET `/game/{game_id}/status`**: Returns the current state for a given `game_id` without advancing the turn. Returns `404` if the `game_id` is unknown.

### Session Store

Use a simple in-memory Python dict for MVP: `_sessions: dict[str, GameEngine] = {}`. This resets on server restart. Do **not** use Redis or a database for this phase.

```python
import uuid
_sessions: dict[str, GameEngine] = {}

@app.post("/game/start", response_model=GameStateResponse)
def start_game() -> GameStateResponse:
    game_id = str(uuid.uuid4())
    engine = GameEngine(size=4, num_pits=3)
    _sessions[game_id] = engine
    return _build_response(game_id, engine)
```

### Pydantic Schemas (`backend/api/schemas.py`)

```python
from pydantic import BaseModel
from typing import Literal

ActionType = Literal[
    "NORTH", "SOUTH", "EAST", "WEST",
    "SHOOT_NORTH", "SHOOT_SOUTH", "SHOOT_EAST", "SHOOT_WEST",
]

class MoveRequest(BaseModel):
    game_id: str
    player_action: ActionType

class SensesPayload(BaseModel):
    breeze: bool
    stench: bool
    shine: bool

class GameStateResponse(BaseModel):
    game_id: str
    status: Literal["Ongoing", "PlayerWon", "PlayerLost_Pit", "PlayerLost_Wumpus"]
    player_pos: tuple[int, int]
    grid_size: int
    explored_tiles: list[tuple[int, int]]
    senses: SensesPayload
```

### CORS Setup

Add `CORSMiddleware` to allow the React dev server (`localhost:5173`) to call the API during development:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)
```

### JSON Payload Structure

Every response from `/game/start` and `/game/move` must match the `GameStateResponse` schema exactly:

```json
{
  "game_id": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "status": "Ongoing",
  "grid_size": 4,
  "player_pos": [0, 0],
  "explored_tiles": [[0, 0]],
  "senses": {
    "breeze": false,
    "stench": true,
    "shine": false
  }
}
```

> **Note:** Never expose `wumpus_pos` or `pits` in the response — the frontend must not know enemy/hazard locations. This is enforced by the Pydantic schema.

## Acceptance Criteria

- [ ] Server runs via `uvicorn backend.api.main:app --reload` without errors.
- [ ] `POST /game/start` returns a valid UUID `game_id` and a `GameStateResponse` JSON body.
- [ ] `POST /game/move` with a valid `game_id` triggers a Wumpus response and returns the updated state.
- [ ] `POST /game/move` with an **invalid** `game_id` returns HTTP `404` with a JSON `{"detail": "Game not found"}` body.
- [ ] `POST /game/move` with an **invalid** `player_action` (e.g., `"JUMP"`) returns HTTP `422` (Pydantic validation error) without crashing.
- [ ] `wumpus_pos` and `pits` are **never** present in any API response.
- [ ] CORS allows requests from `http://localhost:5173`.
- [ ] All request and response bodies are validated by Pydantic models — no raw `dict` returns.
