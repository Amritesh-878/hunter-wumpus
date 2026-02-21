# TODO 002: Scent Trail & Memory System

## Overview

Implement the specific mechanics required to balance the Hunter Wumpus: the player's fading scent trail and the Wumpus's visited-tile memory.

## Goals

1. **Scent Trail**: The player leaves a scent integer on their current tile that degrades by 1 each turn.
2. **Wumpus Memory**: Track the coordinates the Wumpus has visited so it doesn't get stuck in a loop.
3. **Sensory Output**: Generate the immediate sensory data for a given coordinate (Breeze, Stench).

---

## Reasoning

### Why Scent and Memory?

**Current Problems:**

- A completely blind Wumpus will wander endlessly and fall into pits.
- An omniscient Wumpus makes the game unwinnable.

**Solution:**

- The scent trail acts as breadcrumbs.
- The visited-tiles tracker acts as a primitive local memory for the RL agent to discourage backtracking.

---

## Files to Change

### Files to MODIFY

1. `backend/engine/game_state.py` - **MAJOR** - Add scent matrix and memory array.

---

## Implementation Approach

### Scent Tracker

**Key Responsibilities:**

- Every time the player moves, set **the tile the player just left** (their previous position) to a `MAX_SCENT` constant (e.g., `3`).
- Scent decays **after** both the player and the Wumpus have completed their moves for the turn. Decrement all non-zero scent values by `1` (floor at `0`).
- Scent on the player's current tile should **not** be set during the player's move — only the trail they leave behind matters.

### Wumpus Memory

**Key Responsibilities:**

- Maintain a `visited_tiles: set[tuple[int, int]]` on the `GameEngine`.
- After every Wumpus move, add its new position to the set.
- This set is exposed as part of the RL observation in TODO 003 to discourage revisiting tiles.

### Sensory Output

**Key Responsibilities:**

- `get_senses(pos: Position) -> dict[str, bool]` returns a dict describing the immediate danger/reward level for the given position:
  ```python
  {
      "breeze": bool,   # True if any orthogonally adjacent tile contains a pit
      "stench": bool,   # True if any orthogonally adjacent tile contains the Wumpus
      "shine":  bool,   # True if any orthogonally adjacent tile contains gold (or the pos IS the gold tile)
  }
  ```
- Only orthogonally adjacent tiles (N, S, E, W) trigger senses — diagonals do **not**.

---

## Pseudocode Reference

```python
MAX_SCENT: int = 3

def _update_scent(self) -> None:
    """Called once per full turn (after both player and Wumpus have moved)."""
    prev = self._prev_player_pos          # stored before player moves
    if prev is not None:
        self.scent_grid[prev.y][prev.x] = MAX_SCENT
    # Decay all tiles
    for y in range(self.size):
        for x in range(self.size):
            if self.scent_grid[y][x] > 0:
                self.scent_grid[y][x] -= 1

def get_senses(self, pos: Position) -> dict[str, bool]:
    neighbors = self._get_orthogonal_neighbors(pos)
    return {
        "breeze": any(n in self.pits for n in neighbors),
        "stench": any(n == self.wumpus_pos for n in neighbors),
        "shine":  pos == self.gold_pos or any(n == self.gold_pos for n in neighbors),
    }
```

---

## Acceptance Criteria

- [ ] `scent_grid` initializes as an $N \times N$ matrix of zeros.
- [ ] After the player moves from tile A to tile B, tile A's scent value equals `MAX_SCENT` at end of that turn.
- [ ] Two turns later, tile A's scent value equals `MAX_SCENT - 2`.
- [ ] Scent decays **after** both the player and Wumpus moves have resolved — not mid-turn.
- [ ] `wumpus_visited` set correctly logs `(x, y)` tuples after every Wumpus step.
- [ ] `get_senses` returns `True` for `breeze` when a pit is orthogonally adjacent.
- [ ] `get_senses` returns `True` for `stench` when the Wumpus is orthogonally adjacent.
- [ ] `get_senses` returns `True` for `shine` when the player is on or adjacent to the gold tile.
- [ ] `get_senses` does **not** consider diagonal tiles.

---

## Testing Requirements

### Unit Tests (`test_scent_memory.py`)

1. `test_scent_placement`: After player moves, previous tile has scent = `MAX_SCENT` at turn end.
2. `test_scent_decay`: Verify scent decrements by 1 each turn and never goes below 0.
3. `test_scent_timing`: Assert scent is still the old value mid-turn (decay only at end).
4. `test_wumpus_memory_logging`: Assert `wumpus_visited` grows by 1 after each Wumpus move.
5. `test_senses_breeze`: Place a pit at `(2, 1)`, call `get_senses(Position(2, 0))`; assert `breeze == True`.
6. `test_senses_no_diagonal`: Place a pit at `(2, 2)`, call `get_senses(Position(1, 1))`; assert `breeze == False`.
