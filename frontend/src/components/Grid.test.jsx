import { render } from '@testing-library/react';

import Grid from './Grid';

describe('Grid', () => {
  const senses = { breeze: false, stench: false, shine: false };

  it('renders N×N tiles and sets --grid-size', () => {
    const { container } = render(
      <Grid
        gridSize={4}
        playerPos={[0, 0]}
        exploredTiles={[[0, 0]]}
        senses={senses}
      />,
    );

    const grid = container.querySelector('.grid');
    const tiles = container.querySelectorAll('.tile');

    expect(grid.style.getPropertyValue('--grid-size')).toBe('4');
    expect(tiles).toHaveLength(16);
  });

  it('keeps player tile explored even if absent from exploredTiles list', () => {
    const { container } = render(
      <Grid
        gridSize={4}
        playerPos={[2, 2]}
        exploredTiles={[[0, 0]]}
        senses={senses}
      />,
    );

    const playerTile = container.querySelector('[data-x="2"][data-y="2"]');

    expect(playerTile).toHaveClass('tile--player');
    expect(playerTile).toHaveClass('tile--explored');
    expect(playerTile).not.toHaveClass('tile--fog');
  });
});
