# TODO 010: Game Loop & Game Over Sequences

## Overview

Polish the turn-based flow (handling loading states while the AI "thinks") and build the win/loss modals for game resolution.

## Goals

1. **Loading States**: Show an indicator while waiting for the RL inference.
2. **Endgame Modals**: Build distinct UI popups based on win/loss conditions.
3. **Reset Flow**: Allow the player to seamlessly start a new game.

---

## Reasoning

### Why Loading States and Modals?

**Current Problems:**

- The player does not know if the game is frozen or if the AI is calculating its move.
- When the game ends, the player needs to know exactly _why_ they died or won.

**Solution:**

- Add a visible loading state hooked to the API request promise.
- Render conditional modals based on the `status` string returned from the backend.

---

## Files to Change

### Files to MODIFY (Create New)

#### UI Components

1. `frontend/src/components/GameOverModal.jsx` - **MAJOR** - The modal UI.
2. `frontend/src/App.jsx` - **MINOR** - Wire up the modal rendering and loading spinner.

---

## Implementation Approach

### GameOverModal

**Purpose:** Clearly communicate the endgame state and offer a restart.

**Key Responsibilities:**

- Read `status` from `GameContext`. Render the modal **only** when `status !== 'Ongoing' && status !== 'idle'`.
- Display distinct message per outcome:
  | `status` | Title | Body |
  |----------|-------|------|
  | `PlayerWon` | "You Found the Gold!" | "You escaped the Wumpus and claimed the treasure." |
  | `PlayerLost_Wumpus` | "Devoured." | "The Wumpus found you. You never stood a chance." |
  | `PlayerLost_Pit` | "You Fell." | "The ground gave way. There was no bottom." |
- The modal must be a **full-screen overlay** (`position: fixed; inset: 0`) to block all input while visible.
- "Play Again" button: calls `startGame()` from `gameService.js`, dispatches `RESET_STATE` to context, and closes the modal.

### Loading Overlay

- While `isLoading === true`, render a **full-screen semi-transparent overlay** (`position: fixed; inset: 0; background: rgba(0,0,0,0.6)`) with centered text: _"The Wumpus is thinking..."_
- This overlay prevents accidental double-clicks and key spamming during the AI inference window.
- In `App.jsx`, conditionally render `{isLoading && <LoadingOverlay />}` above all other UI.
- The `z-index` of the `LoadingOverlay` must be lower than the `GameOverModal` so a final-turn game-over shows the modal, not the spinner.

---

## Acceptance Criteria

### Functional Requirements

- [ ] A full-screen `LoadingOverlay` appears during every API call and disappears on both success **and** failure.
- [ ] The overlay displays the text _"The Wumpus is thinking..."_ so the player knows the AI is calculating.
- [ ] `GameOverModal` renders for all three terminal statuses (`PlayerWon`, `PlayerLost_Wumpus`, `PlayerLost_Pit`).
- [ ] Each status shows a **distinct** title and body message (see table in Implementation Approach above).
- [ ] "Play Again" successfully resets all frontend state to `idle` and fetches a fresh game from the backend.
- [ ] If the "Play Again" API call fails, a toast/error message is shown and the modal remains open — the player can try again.
- [ ] `GameOverModal` has a `z-index` higher than `LoadingOverlay` to prevent the spinner eclipsing the endgame screen.

---

## Related TODOs

- **TODO 009**: Dependency - Terminal `status` values are set when player actions resolve in `useControls`.
- **TODO 006**: Dependency - Uses `startGame()` from `gameService.js` and `RESET_STATE` dispatch from `GameContext`.

## Handoff Template

**Status:** ⏳ Not Started

```text
Completed by: [Name/AI Model]
Build status: ❓

### What was done:
- [Fill in]

### Blockers encountered:
- [Fill in]
```

## Notes

Complexity: Low

Files Affected: ~2 files
