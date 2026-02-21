# TODO 009: Player Controls & Combat Mechanics

## Overview

Hook up keyboard/button controls for movement and implement the single-use "Shoot Arrow" mechanic.

## Goals

1. **Movement**: Arrow keys or WASD trigger the `movePlayer` API call.
2. **Shoot Mechanic**: Pressing a designated button (e.g., Spacebar) toggles "Shoot Mode", changing the next directional input to an attack.

---

## Reasoning

### Why custom control hooks?

**Current Problems:**

- React state updates can lag behind rapid keyboard spamming, leading to out-of-sync API calls.

**Solution:**

- Create a dedicated hook to listen to keystrokes, debounce them, and lock inputs while waiting for the FastAPI server to respond.

---

## Files to Change

### Files to MODIFY (Create New)

#### Hooks & UI

1. `frontend/src/hooks/useControls.js` - **MAJOR** - Custom hook for keyboard listeners.
2. `frontend/src/components/GameUI.jsx` - **MINOR** - Add ammo indicator and "Shoot Mode" toggle UI.

---

## Implementation Approach

### useControls Hook

**Purpose:** Translate physical inputs into API commands.

**Key Responsibilities:**

- Listen for `keydown` events on `window` for: `ArrowUp`/`w`, `ArrowDown`/`s`, `ArrowLeft`/`a`, `ArrowRight`/`d`, and `Space`.
- Read `isLoading` from `GameContext` and bail early if `true` — **do not** maintain a separate `isLocked` state; use the shared context loading flag so the grid and buttons are consistently locked.
- Maintain a local `isAiming` state. If `true`, the next directional key fires an arrow instead of moving.
- On API success, set `isAiming` back to `false`.
- On API **failure**, set `isLoading` to `false` in context and display a toast notification: _"Connection lost. Try again."_ — do **not** leave the UI locked.
- The `keydown` listener must be cleaned up in the `useEffect` return function to prevent memory leaks.

---

## Acceptance Criteria

### Functional Requirements

- [ ] Arrow keys and WASD both trigger movement.
- [ ] Inputs are ignored while `isLoading` is `true` in context.
- [ ] Pressing `Space` toggles `isAiming`. The UI must clearly reflect aim mode (e.g., a highlighted "AIM" indicator in `GameUI.jsx`).
- [ ] Shooting in aim mode consumes the single arrow, sends an `"SHOOT_*"` action to the API, and disables the shoot button afterward.
- [ ] If the API call **fails**, `isLoading` is set back to `false` and a toast/error message is shown — the game remains playable.
- [ ] No `keydown` listener is active after the component unmounts (cleanup in `useEffect` return).

---

## Pseudocode Examples

### Control Flow

```javascript
// useControls.js
import { useEffect, useState, useContext } from 'react';
import { GameContext } from '../store/GameContext';
import { movePlayer } from '../api/gameService';

const KEY_TO_ACTION = {
  ArrowUp: 'NORTH',
  w: 'NORTH',
  ArrowDown: 'SOUTH',
  s: 'SOUTH',
  ArrowLeft: 'WEST',
  a: 'WEST',
  ArrowRight: 'EAST',
  d: 'EAST',
};

export function useControls() {
  const { state, dispatch } = useContext(GameContext);
  const [isAiming, setIsAiming] = useState(false);

  useEffect(() => {
    const handleKeyDown = async (e) => {
      if (state.isLoading || state.status !== 'Ongoing') return;

      // Toggle aim mode with Spacebar
      // IMPORTANT: use e.code, not e.key, for the spacebar.
      // e.key for the spacebar is ' ' (a space character), not 'Space'.
      if (e.code === 'Space') {
        e.preventDefault();
        setIsAiming((prev) => !prev);
        return;
      }

      const direction = KEY_TO_ACTION[e.key];
      if (!direction) return;

      e.preventDefault();
      const action = isAiming ? `SHOOT_${direction}` : direction;

      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const newState = await movePlayer(state.game_id, action);
        dispatch({ type: 'UPDATE_STATE', payload: newState });
        setIsAiming(false);
      } catch (err) {
        dispatch({ type: 'SET_LOADING', payload: false });
        // Trigger toast notification here (e.g., via a Toast context or library)
        console.error('Move failed:', err);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isLoading, state.status, state.game_id, isAiming, dispatch]);

  return { isAiming };
}
```

> **Bug Note:** `e.key` for the spacebar is `' '` (a single space character). Using `e.key === 'Space'` is a **silent bug** — the condition never matches. Always use `e.code === 'Space'` for spacebar detection.

## Related TODOs

- **TODO 006**: Dependency - Calls the API service and reads/writes `isLoading` from GameContext.
- **TODO 010**: Blocker - Game over modals are triggered via the `status` field updated here.

## Notes

- Complexity: Medium
- Files Affected: ~2 files
