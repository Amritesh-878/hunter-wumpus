import { render, screen } from '@testing-library/react';

import Tile from './Tile';

describe('Tile', () => {
  const renderTile = (overrides = {}) =>
    render(
      <Tile
        x={1}
        y={2}
        isExplored={true}
        isPlayerHere={true}
        showBreeze={false}
        showStench={false}
        showShine={false}
        revealPit={false}
        revealGold={false}
        revealWumpus={false}
        {...overrides}
      />,
    );

  it('renders unexplored tiles as fog with no child content', () => {
    const { container } = renderTile({
      isExplored: false,
      isPlayerHere: false,
    });

    const tile = container.querySelector('.tile');

    expect(tile).toHaveClass('tile--fog');
    expect(tile).not.toHaveClass('tile--explored');
    expect(tile).toBeEmptyDOMElement();
  });

  it('renders breeze indicator when showBreeze is true', () => {
    const { container } = renderTile({ showBreeze: true });

    const tile = container.querySelector('.tile');

    expect(tile).toHaveClass('tile--sense-breeze');
    expect(screen.getByAltText('Breeze')).toBeInTheDocument();
  });

  it('renders stench indicator when showStench is true', () => {
    const { container } = renderTile({ showStench: true });

    const tile = container.querySelector('.tile');

    expect(tile).toHaveClass('tile--sense-stench');
    expect(screen.getByAltText('Stench')).toBeInTheDocument();
  });

  it('renders shine indicator when showShine is true', () => {
    const { container } = renderTile({ showShine: true });

    const tile = container.querySelector('.tile');

    expect(tile).toHaveClass('tile--sense-shine');
    expect(screen.getByAltText('Shine')).toBeInTheDocument();
  });

  it('does not render senses when show flags are false', () => {
    const { container } = renderTile({
      isPlayerHere: false,
      showBreeze: false,
      showStench: false,
      showShine: false,
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
    const { container } = renderTile({
      showBreeze: true,
      showStench: true,
      showShine: true,
    });
    const tile = container.querySelector('.tile');

    expect(tile).toHaveClass('tile--sense-breeze');
    expect(tile).toHaveClass('tile--sense-stench');
    expect(tile).toHaveClass('tile--sense-shine');
    expect(screen.getByAltText('Breeze')).toBeInTheDocument();
    expect(screen.getByAltText('Stench')).toBeInTheDocument();
    expect(screen.getByAltText('Shine')).toBeInTheDocument();
  });

  it('reveals pit sprite when revealPit is true', () => {
    renderTile({ revealPit: true, isExplored: true });
    expect(screen.getByAltText('Pit')).toBeInTheDocument();
  });

  it('reveals gold sprite when revealGold is true', () => {
    renderTile({ revealGold: true, isExplored: true });
    expect(screen.getByAltText('Gold')).toBeInTheDocument();
  });

  it('reveals wumpus sprite when revealWumpus is true', () => {
    renderTile({ revealWumpus: true, isExplored: true });
    expect(screen.getByAltText('Wumpus')).toBeInTheDocument();
  });
});

