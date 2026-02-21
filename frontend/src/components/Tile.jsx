import { memo, useEffect, useRef, useState } from 'react';
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
  showBreeze,
  showStench,
  showShine,
  revealPit,
  revealGold,
  revealWumpus,
}) {
  const [isFlashing, setIsFlashing] = useState(false);
  const previousExplored = useRef(isExplored);

  useEffect(() => {
    let flashTimer;

    if (!previousExplored.current && isExplored) {
      setIsFlashing(true);
      flashTimer = setTimeout(() => {
        setIsFlashing(false);
      }, 600);
    }

    previousExplored.current = isExplored;

    return () => {
      if (flashTimer) {
        clearTimeout(flashTimer);
      }
    };
  }, [isExplored]);

  const classNames = ['tile', isExplored ? 'tile--explored' : 'tile--fog'];

  if (isFlashing) {
    classNames.push('tile--flash');
  }

  if (isPlayerHere) {
    classNames.push('tile--player');
  }

  if (showBreeze) {
    classNames.push('tile--sense-breeze');
  }

  if (showStench) {
    classNames.push('tile--sense-stench');
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
      {revealGold ? <img src={goldSprite} alt='Gold' data-entity='gold' /> : null}
      {revealWumpus ? (
        <img src={wumpusSprite} alt='Wumpus' data-entity='wumpus' />
      ) : null}
      {showBreeze ? (
        <img src={breezeIcon} alt='Breeze' data-sense='breeze' />
      ) : null}
      {showStench ? (
        <img src={stenchIcon} alt='Stench' data-sense='stench' />
      ) : null}
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
  showStench: PropTypes.bool.isRequired,
  showShine: PropTypes.bool.isRequired,
  revealPit: PropTypes.bool.isRequired,
  revealGold: PropTypes.bool.isRequired,
  revealWumpus: PropTypes.bool.isRequired,
};

export default memo(Tile);
