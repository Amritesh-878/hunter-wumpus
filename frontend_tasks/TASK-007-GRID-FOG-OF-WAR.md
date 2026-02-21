# TODO 007: Grid Rendering & Fog of War

## Overview

Build the CSS and React components for the visual grid, implementing the darkness mechanic that obscures the board until explored.

## Goals

1. **Grid Component**: Render an N x N CSS Grid based on backend state.
2. **Fog of War**: Keep tiles pitch black/unexplored until the player moves onto them or senses them.

---

## Reasoning

### Why Fog of War?

**Current Problems:**

- If the player sees the whole board, it's not a puzzle or a horror game—it's just a maze.

**Solution:**

- Track `explored_tiles` in state. If a tile's coordinate is not in that list, apply a CSS class that obscures it entirely.

---

## Files to Change

### Files to MODIFY (Create New)

#### UI Components

1. `frontend/src/components/Grid.jsx` - **MAJOR** - Renders the board.
2. `frontend/src/components/Tile.jsx` - **MAJOR** - Represents a single square.
3. `frontend/src/styles/Grid.css` - **MINOR** - CSS Grid layout and fog classes.

---

## Implementation Approach

### Grid & Tile Components

**Purpose:** Visually represent the game state.

**Key Responsibilities:**

- Dynamically generate `N * N` Tile components based on `grid_size` from Context.
- Check if `(x, y)` exists in `explored_tiles`. If not, render as a black square with no child content.
- Render the player's current position based on `player_pos`.
- Each Tile receives its own coordinate pair as props (`x` and `y`) so it can determine its own render state from context without the parent passing large prop trees.

**Considerations:**

- Use CSS Grid (`grid-template-columns: repeat(N, 1fr)`) for perfect scaling regardless of board size.
- The `N` value must be dynamically injected from context using a CSS custom property or inline style — not hardcoded.

### CSS Classes Reference (`Grid.css`)

```css
.grid {
  display: grid;
  /* N is injected as --grid-size via inline style on the Grid component */
  grid-template-columns: repeat(var(--grid-size), 1fr);
  width: min(80vw, 600px);
  aspect-ratio: 1 / 1;
  gap: 2px;
  background-color: #111;
}

.tile {
  background-color: #2a2a2a;
  border: 1px solid #333;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.tile.fog-of-war {
  background-color: #000;
  border-color: #000;
}

.tile.explored {
  background-color: #3d3d3d;
}
```

---

## Acceptance Criteria

### Functional Requirements

- [ ] Board scales cleanly for any N × N size without layout breakage (test 4×4 and 6×6).
- [ ] Unexplored tiles render as pure black; their child content (pits, gold) is **never** in the DOM until explored.
- [ ] Explored tiles remain visible permanently once visited — fog does **not** return.
- [ ] The player's current tile is always shown as explored.
- [ ] `--grid-size` CSS custom property is set on the `.grid` element via inline style based on `grid_size` from context.

### Code Quality

- [ ] `Grid.jsx` and `Tile.jsx` both define PropTypes for all props.
- [ ] No game logic lives inside these components — they are purely presentational.

---

## Pseudocode Examples

### Fog Logic

```jsx
import PropTypes from 'prop-types';

const Tile = ({ x, y, isExplored, isPlayerHere }) => {
  if (!isExplored) {
    // Render nothing - not even an empty div with content
    return <div className='tile fog-of-war' aria-hidden='true' />;
  }
  return (
    <div className='tile explored'>{isPlayerHere && <PlayerSprite />}</div>
  );
};

Tile.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  isExplored: PropTypes.bool.isRequired,
  isPlayerHere: PropTypes.bool.isRequired,
};
```

---

## Related TODOs

- **TODO 006**: Dependency - Requires the global state (`grid_size`, `player_pos`, `explored_tiles`) from `GameContext`.
- **TODO 008**: Blocker - Sensory indicators are overlaid on top of the `Tile` component built here.

## Notes

- Complexity: Medium
- Files Affected: ~3 files
