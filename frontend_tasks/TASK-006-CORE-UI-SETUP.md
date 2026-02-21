# TODO 006: Core UI & State Setup

## Overview

Set up the React project foundation, defining the global game state context, and building the basic API service to communicate with the Python FastAPI backend.

## Goals

1. **React Setup**: Initialize the base project structure and layout.
2. **API Service**: Write clean wrappers to call backend endpoints (`/game/start`, `/game/move`).
3. **State Management**: Create a Context or Zustand store to hold the `game_id`, grid dimensions, and active sensory data.

---

## Reasoning

### Why Core UI & State Setup?

**Current Problems:**

- The frontend has no way to communicate with the backend or store the game session.

**Solution:**

- Establishing a robust API service layer and global state first ensures that subsequent UI components (like the grid and controls) have a reliable source of truth to pull data from.

---

## Files to Change

### Files to MODIFY (Create New)

#### API & State

1. `frontend/src/api/gameService.js` - **MAJOR** - Handles Axios/Fetch logic.
2. `frontend/src/store/GameContext.jsx` - **MAJOR** - Global state provider.
3. `frontend/.env` - **MINOR** - Environment variables (API base URL).

#### Core Components

1. `frontend/src/App.jsx` - **MAJOR** - Main application wrapper.

---

## Implementation Approach

### API Service Layer

**Purpose:** Handle all HTTP requests to the FastAPI server.
**Key Responsibilities:**

- `startGame()`: POSTs to `/game/start`, returns the full `GameStateResponse` object.
- `movePlayer(game_id, action)`: POSTs to `/game/move` with `{ game_id, player_action }`, returns new `GameStateResponse`.
- Base URL must be read from `import.meta.env.VITE_API_BASE_URL` — never hardcoded.

**`.env` setup:**

```
# frontend/.env
VITE_API_BASE_URL=http://localhost:8000
```

### GameContext

**Purpose:** Distribute game state to all React components without prop drilling.

**State Shape (JSDoc):**

```javascript
/**
 * @typedef {Object} Senses
 * @property {boolean} breeze
 * @property {boolean} stench
 * @property {boolean} shine
 */

/**
 * @typedef {Object} GameState
 * @property {string | null}  game_id         - UUID from the backend, null before game starts.
 * @property {number}         grid_size        - N for an N×N board.
 * @property {[number,number] | null} player_pos - [x, y] coordinates.
 * @property {[number,number][]} explored_tiles - Array of [x,y] pairs the player has visited.
 * @property {'idle'|'Ongoing'|'PlayerWon'|'PlayerLost_Pit'|'PlayerLost_Wumpus'} status
 * @property {Senses}         senses
 * @property {boolean}        isLoading        - True while an API call is in-flight.
 */
```

**`isLoading`** must be part of the context state. Components must be able to read it to disable inputs (see TODO 009).

---

## Acceptance Criteria

### Functional Requirements

- [x] Clicking "Start Game" successfully fetches the initial state from the Python backend and populates the context.
- [x] Global state correctly holds all fields defined in the `GameState` JSDoc typedef above.
- [x] `isLoading` is set to `true` before any API call and `false` on both success **and** failure.

### Code Quality

- [x] No hardcoded URLs in components — all requests go through `gameService.js` using `import.meta.env.VITE_API_BASE_URL`.
- [x] Context provider wraps the entire application in `App.jsx`.
- [x] The context default value matches the `GameState` typedef (no `undefined` fields).

---

## Testing Requirements

### Unit Tests

1. **API Service Tests** (`gameService.test.js`)
   - Mock `fetch`/`axios` and verify `startGame()` returns an object with `game_id`, `grid_size`, `player_pos`, `explored_tiles`, `senses`, and `status`.
   - Verify `movePlayer()` sends a POST body of `{ game_id, player_action }` and returns the updated state.
   - Verify that if the fetch throws, the function propagates the error (does **not** silently swallow it).

---

## Related TODOs

- **TODO 005**: Dependency - Relies on the FastAPI server endpoints.
- **TODO 007**: Blocker - Grid rendering needs this state to function.

---

## Handoff Template

**Status:** ✅ Completed

```text
Completed by: GPT-5.3-Codex
Build status: ✅ PASS

### What was done:
- Scaffolded Vite + React project and configured Vitest, ESLint, and Node 24 engine requirement.
- Added `gameService` wrappers for `/game/start`, `/game/move`, and `/game/{id}/status` with throw-on-error behavior.
- Added `gameReducer` with locked `initialState` and exact API snake_case to state camelCase mapping in `UPDATE_STATE`.
- Added `GameContext` provider/hook and wired it in `App.jsx` and `main.jsx`.
- Added unit tests for API service behavior and reducer mapping/reset logic.

### Blockers encountered:
- None.

### Test summary:
- `pnpm run lint:fix` ✅
- `pnpm test` ✅ (6/6 tests passing)
```

---

## Notes

Complexity: Medium

Files Affected: ~4 files
