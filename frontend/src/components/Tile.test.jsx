import { render, screen } from '@testing-library/react';

import Tile from './Tile';

describe('Tile', () => {
  const noSenses = { breeze: false, stench: false, shine: false };
  const allSenses = { breeze: true, stench: true, shine: true };

  const renderTile = (overrides = {}) =>
    render(
      <Tile
        x={1}
        y={2}
        isExplored={true}
        isPlayerHere={true}
        senses={noSenses}
        status='Ongoing'
        revealPit={false}
        revealGold={false}
        revealWumpus={false}
        {...overrides}
      />,
    );

  it('renders unexplored tiles as fog with no child content', () => {
    const { container } = render(
      <Tile
        x={1}
        y={2}
        isExplored={false}
        isPlayerHere={false}
        senses={allSenses}
        status='Ongoing'
        revealPit={false}
        revealGold={false}
        revealWumpus={false}
      />,
    );

    const tile = container.querySelector('.tile');

    expect(tile).toHaveClass('tile--fog');
    expect(tile).not.toHaveClass('tile--explored');
    expect(tile).toBeEmptyDOMElement();
  });

  it('renders breeze indicator on player tile', () => {
    const { container } = renderTile({
      senses: { ...noSenses, breeze: true },
    });

    const tile = container.querySelector('.tile');

    expect(tile).toHaveClass('tile--sense-breeze');
    expect(screen.getByAltText('Breeze')).toBeInTheDocument();
  });

  it('renders stench indicator on player tile', () => {
    const { container } = renderTile({
      senses: { ...noSenses, stench: true },
    });

    const tile = container.querySelector('.tile');

    expect(tile).toHaveClass('tile--sense-stench');
    expect(screen.getByAltText('Stench')).toBeInTheDocument();
  });

  it('renders shine indicator on player tile', () => {
    const { container } = renderTile({
      senses: { ...noSenses, shine: true },
    });

    const tile = container.querySelector('.tile');

    expect(tile).toHaveClass('tile--sense-shine');
    expect(screen.getByAltText('Shine')).toBeInTheDocument();
  });

  it('does not render senses on non-player tile', () => {
    const { container } = renderTile({
      isPlayerHere: false,
      senses: allSenses,
    });

    const tile = container.querySelector('.tile');

    expect(tile).not.toHaveClass('tile--sense-breeze');
    expect(tile).not.toHaveClass('tile--sense-stench');
    expect(tile).not.toHaveClass('tile--sense-shine');
    expect(screen.queryByAltText('Breeze')).not.toBeInTheDocument();
    expect(screen.queryByAltText('Stench')).not.toBeInTheDocument();
    expect(screen.queryByAltText('Shine')).not.toBeInTheDocument();
  });

  it('renders all senses with distinct classes and icons', () => {
    const { container } = renderTile({ senses: allSenses });
    const tile = container.querySelector('.tile');

    expect(tile).toHaveClass('tile--sense-breeze');
    expect(tile).toHaveClass('tile--sense-stench');
    expect(tile).toHaveClass('tile--sense-shine');
    expect(screen.getByAltText('Breeze')).toBeInTheDocument();
    expect(screen.getByAltText('Stench')).toBeInTheDocument();
    expect(screen.getByAltText('Shine')).toBeInTheDocument();
  });

  it('reveals pit and gold sprites on terminal statuses', () => {
    const { rerender } = renderTile({ status: 'PlayerLost_Pit' });
    expect(screen.getByAltText('Pit')).toBeInTheDocument();

    rerender(
      <Tile
        x={1}
        y={2}
        isExplored={true}
        isPlayerHere={true}
        senses={noSenses}
        status='PlayerWon'
        revealPit={false}
        revealGold={false}
        revealWumpus={false}
      />,
    );

    expect(screen.getByAltText('Gold')).toBeInTheDocument();
  });
});
