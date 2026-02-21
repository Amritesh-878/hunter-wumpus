import { render, screen } from '@testing-library/react';

import Tile from './Tile';

describe('Tile', () => {
  const senses = { breeze: true, stench: true, shine: true };

  it('renders unexplored tiles as fog with no child content', () => {
    const { container } = render(
      <Tile
        x={1}
        y={2}
        isExplored={false}
        isPlayerHere={false}
        senses={senses}
        revealPit={false}
        revealGold={false}
      />,
    );

    const tile = container.querySelector('.tile');

    expect(tile).toHaveClass('tile--fog');
    expect(tile).not.toHaveClass('tile--explored');
    expect(tile).toBeEmptyDOMElement();
  });

  it('renders explored player tile with player and active sense classes', () => {
    const { container } = render(
      <Tile
        x={0}
        y={0}
        isExplored={true}
        isPlayerHere={true}
        senses={senses}
        revealPit={false}
        revealGold={false}
      />,
    );

    const tile = container.querySelector('.tile');

    expect(tile).toHaveClass('tile--explored');
    expect(tile).toHaveClass('tile--player');
    expect(tile).toHaveClass('tile--sense-breeze');
    expect(tile).toHaveClass('tile--sense-stench');
    expect(tile).toHaveClass('tile--sense-shine');
    expect(screen.getByText('🧍')).toBeInTheDocument();
  });
});
