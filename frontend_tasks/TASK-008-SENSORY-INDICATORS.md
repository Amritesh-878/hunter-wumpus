# TODO 008: Sensory Indicators & Sprites

## Overview

Render the visual cues on the revealed tiles (wavy lines for Breeze, green mist for Stench, sparkles for Shine) based on the backend JSON data.

## Goals

1. **Entity Sprites**: Render visual representations for Gold, Pits, and the Wumpus (if the tile is revealed **and** the game is over — Wumpus location is never shown while the game is in progress).
2. **Sensory UI**: Map backend sensory booleans (`breeze`, `stench`, `shine`) to distinct visual overlays on the player's current tile.

---

## Reasoning

### Why Sensory Indicators?

**Current Problems:**

- The player relies entirely on environmental clues to avoid pits and the Wumpus.

**Solution:**

- Render clear, distinct visual icons on the player's current tile to indicate adjacent dangers.

---

## Files to Change

### Files to MODIFY

#### UI Components

1. `frontend/src/components/Tile.jsx` - **MAJOR** - Add rendering logic for senses/entities.
2. `frontend/src/assets/` - **MINOR** - Add SVGs, PNGs, or CSS icons.

---

## Implementation Approach

### Tile Component Update

**Purpose:** Translate JSON state into visuals.

**Key Responsibilities:**

- Read `senses` from `GameContext`. When the tile is the player's current tile (`isPlayerHere === true`), overlay the appropriate icons:
  - **Breeze** (`senses.breeze === true`) → wavy/wind icon, CSS class `.sense-breeze`.
  - **Stench** (`senses.stench === true`) → green mist icon, CSS class `.sense-stench`.
  - **Shine** (`senses.shine === true`) → sparkle/star icon, CSS class `.sense-shine`.
- Sensory icons must be **corner-anchored** (e.g., `position: absolute; bottom: 2px; right: 2px`) so they never obscure the player character sprite in the tile center.
- If a tile is `isExplored && hasPit`, render the pit sprite.
- If a tile is `isExplored && hasGold && status !== "PlayerWon"`, render the gold sprite.

**Considerations:**

- `hasPit` and `hasGold` are **not** in the API response (the backend withholds them). These props are only populated after game-over when the backend may optionally reveal the full board. For MVP, simply don’t render these sprites during an active game unless the player is on the tile and the relevant `status` string confirms it.

### CSS Classes Reference

```css
/* Applied to the player's current tile only */
.sense-breeze::after {
  content: '\1F32C'; /* wind face emoji or replace with SVG */
  position: absolute;
  bottom: 2px;
  left: 2px;
  font-size: 0.75rem;
  opacity: 0.85;
}

.sense-stench::after {
  content: '\1F9AA'; /* or a custom green mist SVG */
  position: absolute;
  bottom: 2px;
  right: 2px;
  font-size: 0.75rem;
  opacity: 0.85;
}

.sense-shine::after {
  content: '\2728'; /* sparkles */
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 0.75rem;
}
```

---

## Acceptance Criteria

### Functional Requirements

- [ ] `breeze` indicator (wind icon / `.sense-breeze`) is visible on the player's tile when `senses.breeze === true`.
- [ ] `stench` indicator (mist icon / `.sense-stench`) is visible on the player's tile when `senses.stench === true`.
- [ ] `shine` indicator (sparkle / `.sense-shine`) is visible on the player's tile when `senses.shine === true`.
- [ ] Sensory icons do **not** overlap or obscure the player character sprite.
- [ ] Sensory icons are **not** rendered on tiles where `isPlayerHere === false`.

---

## Testing Requirements

### Unit Tests (`Tile.test.jsx`)

1. `test_breeze_renders`: Pass `{ senses: { breeze: true, stench: false, shine: false }, isPlayerHere: true }` via context; assert the `.sense-breeze` element is present in the DOM.
2. `test_stench_renders`: Same pattern for `stench: true`.
3. `test_shine_renders`: Same pattern for `shine: true`.
4. `test_no_senses_on_other_tile`: Pass `isPlayerHere: false` with all senses `true`; assert no sense indicators render.
5. `test_senses_not_stacked_visually`: Render all three senses simultaneously and assert no `z-index` overlap by checking each icon has a distinct CSS class.

---

## Related TODOs

- **TODO 007**: Dependency - Builds directly onto the `Tile.jsx` component.

## Notes

- **Complexity:** Low
- **Files Affected:** ~2 files
