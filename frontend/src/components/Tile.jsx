import PropTypes from 'prop-types';

import '../styles/Tile.css';

export default function Tile({
  x,
  y,
  isExplored,
  isPlayerHere,
  senses,
  revealPit,
  revealGold,
}) {
  const classNames = ['tile', isExplored ? 'tile--explored' : 'tile--fog'];

  if (isPlayerHere) {
    classNames.push('tile--player');
  }

  if (isPlayerHere && senses.breeze) {
    classNames.push('tile--sense-breeze');
  }

  if (isPlayerHere && senses.stench) {
    classNames.push('tile--sense-stench');
  }

  if (isPlayerHere && senses.shine) {
    classNames.push('tile--sense-shine');
  }

  if (revealPit) {
    classNames.push('tile--pit');
  }

  if (revealGold) {
    classNames.push('tile--gold');
  }

  if (!isExplored) {
    return (
      <div
        className={classNames.join(' ')}
        data-x={x}
        data-y={y}
        aria-hidden='true'
      />
    );
  }

  return (
    <div className={classNames.join(' ')} data-x={x} data-y={y}>
      {isPlayerHere ? '🧍' : null}
    </div>
  );
}

Tile.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  isExplored: PropTypes.bool.isRequired,
  isPlayerHere: PropTypes.bool.isRequired,
  senses: PropTypes.shape({
    breeze: PropTypes.bool.isRequired,
    stench: PropTypes.bool.isRequired,
    shine: PropTypes.bool.isRequired,
  }).isRequired,
  revealPit: PropTypes.bool.isRequired,
  revealGold: PropTypes.bool.isRequired,
};
