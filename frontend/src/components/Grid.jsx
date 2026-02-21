import { memo, useMemo } from 'react';
import PropTypes from 'prop-types';

import Tile from './Tile';
import '../styles/Grid.css';

function tileKey(x, y) {
  return `${x},${y}`;
}

function Grid({
  gridSize,
  playerPos,
  exploredTiles,
  senses,
  status,
  pitTiles = [],
  goldPos = null,
  wumpusPos = null,
}) {
  const [playerX, playerY] = playerPos;
  const exploredSet = useMemo(
    () => new Set(exploredTiles.map(([x, y]) => tileKey(x, y))),
    [exploredTiles],
  );
  const pitSet = useMemo(
    () => new Set(pitTiles.map(([x, y]) => tileKey(x, y))),
    [pitTiles],
  );
  const goldKey = useMemo(
    () => (goldPos ? tileKey(goldPos[0], goldPos[1]) : null),
    [goldPos],
  );
  const wumpusKey = useMemo(
    () => (wumpusPos ? tileKey(wumpusPos[0], wumpusPos[1]) : null),
    [wumpusPos],
  );
  const isTerminal = status !== 'idle' && status !== 'Ongoing';
  const terminalPit = status === 'PlayerLost_Pit';
  const terminalWumpus = status === 'PlayerLost_Wumpus';
  const terminalGold = status === 'PlayerWon';
  const tiles = [];

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const isPlayerHere = x === playerX && y === playerY;
      const isExplored = isPlayerHere || exploredSet.has(tileKey(x, y));
      const currentKey = tileKey(x, y);

      tiles.push(
        <Tile
          key={tileKey(x, y)}
          x={x}
          y={y}
          isExplored={isExplored}
          isPlayerHere={isPlayerHere}
          showBreeze={isPlayerHere && senses.breeze}
          showStench={isPlayerHere && senses.stench}
          showShine={isPlayerHere && senses.shine}
          revealPit={isTerminal && (pitSet.has(currentKey) || (isPlayerHere && terminalPit))}
          revealGold={isTerminal && (goldKey === currentKey || (isPlayerHere && terminalGold))}
          revealWumpus={isTerminal && (wumpusKey === currentKey || (isPlayerHere && terminalWumpus))}
        />,
      );
    }
  }

  return (
    <section
      className='grid'
      style={{ '--grid-size': gridSize }}
      aria-label='Game grid'
    >
      {tiles}
    </section>
  );
}

Grid.propTypes = {
  gridSize: PropTypes.number.isRequired,
  playerPos: PropTypes.arrayOf(PropTypes.number).isRequired,
  exploredTiles: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number))
    .isRequired,
  senses: PropTypes.shape({
    breeze: PropTypes.bool.isRequired,
    stench: PropTypes.bool.isRequired,
    shine: PropTypes.bool.isRequired,
  }).isRequired,
  status: PropTypes.string.isRequired,
  pitTiles: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
  goldPos: PropTypes.arrayOf(PropTypes.number),
  wumpusPos: PropTypes.arrayOf(PropTypes.number),
};

export default memo(Grid);
