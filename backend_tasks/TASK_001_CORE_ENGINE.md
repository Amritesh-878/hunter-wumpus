# TODO 001: Core Game Engine & State Management

## Overview

Build the foundational, pure-Python logic for the $N \times N$ grid, entity placement, and turn progression. This engine must be headless and completely decoupled from any AI or Web framework.

## Goals

1. **Grid Setup**: Initialize an $N \times N$ matrix, randomly placing the player, Wumpus, gold, and pits, ensuring the start tile is safe.
2. **Entity Movement**: Implement turn-based movement logic for the Player and Wumpus, including boundary collision.
3. **Game State Resolution**: Detect win/loss conditions (falling in a pit, Wumpus eats player, player finds gold).

---

## Reasoning

### Why start with a headless engine?

**Current Problems:**

- We need an environment to train an RL agent.
- We need a system to serve game states to a React frontend.

**Solution:**

- A pure Python class that manages state. It will act as the single source of truth that both the Gymnasium wrapper and the FastAPI server will eventually wrap around.

---

## Files to Change

### Files to MODIFY (Create New)

#### Core Data Structures

1. `backend/engine/game_state.py` - **MAJOR** - Holds the `GameEngine` class.
2. `backend/engine/entities.py` - **MINOR** - Defines coordinate structures or enums for `Player`, `Wumpus`, `Pit`, `Gold`.

---

## Pseudocode Reference

### `backend/engine/entities.py`

```python
from dataclasses import dataclass
from enum import Enum

class Direction(Enum):
    NORTH = 0
    SOUTH = 1
    EAST = 2
    WEST = 3

class TileContent(Enum):
    EMPTY = "empty"
    PIT = "pit"
    GOLD = "gold"
    WUMPUS = "wumpus"
    PLAYER = "player"

@dataclass
class Position:
    x: int
    y: int

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Position):
            return NotImplemented
        return self.x == other.x and self.y == other.y

    def __hash__(self) -> int:
        return hash((self.x, self.y))
```

### `backend/engine/game_state.py` (skeleton)

```python
from __future__ import annotations
from typing import Literal
from .entities import Direction, Position, TileContent

GameStatus = Literal["Ongoing", "PlayerWon", "PlayerLost_Pit", "PlayerLost_Wumpus"]

class GameEngine:
    def __init__(self, size: int = 4, num_pits: int = 3) -> None:
        self.size = size
        self.num_pits = num_pits
        self.player_pos: Position
        self.wumpus_pos: Position
        self.gold_pos: Position
        self.pits: list[Position]
        self.status: GameStatus = "Ongoing"
        self._reset_board()

    def _reset_board(self) -> None:
        """Place all entities randomly, ensuring the start tile (0,0) is always safe."""
        ...

    def move_player(self, direction: Direction) -> GameStatus:
        """Move the player one step. Clamp to grid boundaries. Return updated status."""
        ...

    def move_wumpus(self, direction: Direction) -> None:
        """Move the Wumpus one step. Wumpus cannot leave the grid."""
        ...

    def check_game_over(self) -> GameStatus:
        """Evaluate current positions and update self.status accordingly."""
        ...
```

---

## Implementation Approach

### GameEngine Component

**Purpose:** Acts as the referee and board manager.

**Key Responsibilities:**

- `__init__(size: int = 4, num_pits: int = 3)` — randomly places all entities with safe spawn guarantee at `(0, 0)`.
- `move_player(direction: Direction) -> GameStatus` — clamped movement, triggers `check_game_over` internally.
- `move_wumpus(direction: Direction) -> None` — clamped movement, no status side-effects (the RL env drives resolution).
- `check_game_over() -> GameStatus` — pure position comparison; no I/O or side-effects.
- `get_senses(pos: Position) -> dict[str, bool | int]` — returns `{"breeze": bool, "stench": bool, "shine": bool}` for any position by inspecting adjacent tiles. (Implementation detailed in TODO 002.)

**Integration Points:**

- Will be consumed by the Scent & Memory system in TODO 002.
- Will be consumed by the RL Environment in TODO 003.
- Will be consumed directly by the FastAPI server in TODO 005.

---

## Acceptance Criteria

### Functional Requirements

- [ ] Grid initializes with exactly 1 Player, 1 Wumpus, 1 Gold, and `num_pits` Pits.
- [ ] Starting tile `(0, 0)` is **always** free of pits, gold, and the Wumpus.
- [ ] Player and Wumpus cannot move outside grid boundaries (position is clamped, not wrapped).
- [ ] `check_game_over()` returns `"PlayerLost_Pit"` when the player shares a tile with a pit.
- [ ] `check_game_over()` returns `"PlayerLost_Wumpus"` when the player shares a tile with the Wumpus.
- [ ] `check_game_over()` returns `"PlayerWon"` when the player shares a tile with the gold.
- [ ] `check_game_over()` returns `"Ongoing"` in all other cases.

### Code Quality

- [ ] No RL, FastAPI, or networking dependencies imported anywhere in `backend/engine/`.
- [ ] All functions and class attributes are annotated with Python type hints.
- [ ] No `Any` type annotations anywhere in these files.

---

## Testing Requirements

### Unit Tests

1. **EngineSetupTests** (`test_engine_setup.py`)
   - `test_safe_spawn`: Assert tile `(0, 0)` is never a pit, gold, or Wumpus after 100 random initializations.
   - `test_entity_counts`: Assert exactly 1 Player, 1 Wumpus, 1 Gold, and `num_pits` Pits are placed.
   - `test_no_entity_overlap`: Assert no two entities occupy the same starting tile.
2. **MovementTests** (`test_movement.py`)
   - `test_boundary_north`: Player at row 0 moving NORTH stays at row 0.
   - `test_boundary_east`: Player at column `size-1` moving EAST stays in place.
   - `test_valid_move`: Player at `(1, 1)` moving SOUTH lands on `(1, 2)` (or whichever axis is column-major in your coordinate system — be consistent).
3. **GameOverTests** (`test_game_over.py`)
   - `test_player_falls_in_pit`: Manually place player on a pit tile; assert `"PlayerLost_Pit"`.
   - `test_wumpus_catches_player`: Place Wumpus on player's tile; assert `"PlayerLost_Wumpus"`.
   - `test_player_finds_gold`: Place player on gold tile; assert `"PlayerWon"`.
