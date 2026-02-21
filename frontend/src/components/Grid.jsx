import PropTypes from 'prop-types';

import Tile from './Tile';
import '../styles/Grid.css';

function tileKey(x, y) {
  return `${x},${y}`;
}

export default function Grid({ gridSize, playerPos, exploredTiles, senses }) {
  const [playerX, playerY] = playerPos;
  const exploredSet = new Set(exploredTiles.map(([x, y]) => tileKey(x, y)));
  const tiles = [];

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const isPlayerHere = x === playerX && y === playerY;
      const isExplored = isPlayerHere || exploredSet.has(tileKey(x, y));

      tiles.push(
        <Tile
          key={tileKey(x, y)}
          x={x}
          y={y}
          isExplored={isExplored}
          isPlayerHere={isPlayerHere}
          senses={senses}
          revealPit={false}
          revealGold={false}
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
};
