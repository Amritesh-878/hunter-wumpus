import { memo } from 'react';
import PropTypes from 'prop-types';
import breezeIcon from '../assets/breeze.svg';
import goldSprite from '../assets/gold.svg';
import pitSprite from '../assets/pit.svg';
import playerSprite from '../assets/player.svg';
import shineIcon from '../assets/shine.svg';
import stenchIcon from '../assets/stench.svg';
import wumpusSprite from '../assets/wumpus.svg';

import '../styles/Tile.css';

function Tile({
  x,
  y,
  isExplored,
  isPlayerHere,
  senses,
  status,
  revealPit,
  revealGold,
  revealWumpus,
}) {
  const showPit = revealPit || (isPlayerHere && status === 'PlayerLost_Pit');
  const showGold = revealGold || (isPlayerHere && status === 'PlayerWon');
  const showWumpus =
    revealWumpus || (isPlayerHere && status === 'PlayerLost_Wumpus');

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

  if (showPit) {
    classNames.push('tile--pit');
  }

  if (showGold) {
    classNames.push('tile--gold');
  }

  if (!isExplored && !showPit && !showGold && !showWumpus) {
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
      {isPlayerHere ? (
        <img src={playerSprite} alt='Player' data-entity='player' />
      ) : null}
      {showPit ? <img src={pitSprite} alt='Pit' data-entity='pit' /> : null}
      {showGold ? <img src={goldSprite} alt='Gold' data-entity='gold' /> : null}
      {showWumpus ? (
        <img src={wumpusSprite} alt='Wumpus' data-entity='wumpus' />
      ) : null}
      {isPlayerHere && senses.breeze ? (
        <img src={breezeIcon} alt='Breeze' data-sense='breeze' />
      ) : null}
      {isPlayerHere && senses.stench ? (
        <img src={stenchIcon} alt='Stench' data-sense='stench' />
      ) : null}
      {isPlayerHere && senses.shine ? (
        <img src={shineIcon} alt='Shine' data-sense='shine' />
      ) : null}
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
  status: PropTypes.string.isRequired,
  revealPit: PropTypes.bool.isRequired,
  revealGold: PropTypes.bool.isRequired,
  revealWumpus: PropTypes.bool.isRequired,
};

function areTilePropsEqual(previousProps, nextProps) {
  return (
    previousProps.x === nextProps.x &&
    previousProps.y === nextProps.y &&
    previousProps.isExplored === nextProps.isExplored &&
    previousProps.isPlayerHere === nextProps.isPlayerHere &&
    previousProps.status === nextProps.status &&
    previousProps.revealPit === nextProps.revealPit &&
    previousProps.revealGold === nextProps.revealGold &&
    previousProps.revealWumpus === nextProps.revealWumpus &&
    previousProps.senses.breeze === nextProps.senses.breeze &&
    previousProps.senses.stench === nextProps.senses.stench &&
    previousProps.senses.shine === nextProps.senses.shine
  );
}

export default memo(Tile, areTilePropsEqual);
