import { memo } from 'react';
import PropTypes from 'prop-types';
import breezeIcon from '../assets/breeze.svg';
import goldSprite from '../assets/gold.svg';
import pitSprite from '../assets/pit.svg';
import playerSprite from '../assets/player.svg';
import shineIcon from '../assets/shine.svg';
import wumpusSprite from '../assets/wumpus.svg';

import DirectionalSense from './DirectionalSense';
import '../styles/Tile.css';

function Tile({
  x,
  y,
  isExplored,
  isPlayerHere,
  showBreeze,
  stenchDirection,
  showShine,
  revealPit,
  revealGold,
  revealWumpus,
}) {
  const classNames = ['tile', isExplored ? 'tile--explored' : 'tile--fog'];

  if (isPlayerHere) {
    classNames.push('tile--player');
  }

  if (showBreeze) {
    classNames.push('tile--sense-breeze');
  }

  if (stenchDirection) {
    const lower = stenchDirection.toLowerCase();
    if (lower === 'all') {
      classNames.push('tile--stench-all');
    } else {
      classNames.push(`tile--stench-${lower}`);
    }
  }

  if (showShine) {
    classNames.push('tile--sense-shine');
  }

  if (revealPit) {
    classNames.push('tile--pit');
  }

  if (revealGold) {
    classNames.push('tile--gold');
  }

  if (!isExplored && !revealPit && !revealGold && !revealWumpus) {
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
      {revealPit ? <img src={pitSprite} alt='Pit' data-entity='pit' /> : null}
      {revealGold ? (
        <img src={goldSprite} alt='Gold' data-entity='gold' />
      ) : null}
      {revealWumpus ? (
        <img src={wumpusSprite} alt='Wumpus' data-entity='wumpus' />
      ) : null}
      {showBreeze ? (
        <img src={breezeIcon} alt='Breeze' data-sense='breeze' />
      ) : null}
      <DirectionalSense direction={stenchDirection} />
      {showShine ? (
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
  showBreeze: PropTypes.bool.isRequired,
  stenchDirection: PropTypes.string,
  showShine: PropTypes.bool.isRequired,
  revealPit: PropTypes.bool.isRequired,
  revealGold: PropTypes.bool.isRequired,
  revealWumpus: PropTypes.bool.isRequired,
};

export default memo(Tile);
