import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

export default function GameUI({
  arrowsRemaining,
  isAiming,
  isLoading,
  message,
  status,
  turn,
  onStartGame,
  onToggleAim,
}) {
  const [messageLog, setMessageLog] = useState([]);

  useEffect(() => {
    if (!message) {
      return;
    }

    setMessageLog((previousMessages) => {
      if (previousMessages[0] === message) {
        return previousMessages;
      }

      return [message, ...previousMessages].slice(0, 3);
    });
  }, [message]);

  useEffect(() => {
    if (status === 'idle') {
      setMessageLog([]);
    }
  }, [status]);

  const canToggleAim =
    status === 'Ongoing' && !isLoading && arrowsRemaining > 0;
  const isArrowReady = arrowsRemaining > 0;
  const turnLabel = `Turn #${turn}`;

  return (
    <section className={`game-ui ${isAiming ? 'ui--aiming' : ''}`}>
      <p className='game-ui__label'>Dungeon Log</p>

      {isAiming ? <p className='game-ui__aim-warning'>⚠ AIM MODE</p> : null}

      <button
        type='button'
        className='btn-start'
        onClick={onStartGame}
        disabled={isLoading}
      >
        {isLoading ? 'Starting...' : status === 'Ongoing' ? 'New Game' : 'Start Game'}
      </button>

      <div className='hud-row game-ui__turn-row'>
        <p className='game-ui__turn'>{turnLabel}</p>
      </div>

      <div className='hud-row game-ui__arrow-row'>
        <span className='game-ui__arrow-label'>Arrow</span>
        <span className='game-ui__arrow-value'>
          {isArrowReady ? '🏹 Ready' : '✗ Spent'}
        </span>
      </div>

      <button
        type='button'
        className={`btn-aim ${isAiming ? 'btn-aim--active' : ''}`}
        onClick={onToggleAim}
        disabled={!canToggleAim}
      >
        {isAiming ? '🎯 AIM MODE — SHOOT WITH WASD' : '🏹 Press Space to Aim'}
      </button>

      <section className='game-ui__log' aria-live='polite'>
        {messageLog.length ? (
          messageLog.map((entry, index) => (
            <p key={`${entry}-${index}`} className='game-ui__message'>
              {entry}
            </p>
          ))
        ) : (
          <p className='game-ui__message game-ui__message--empty'>Awaiting signs in the dark...</p>
        )}
      </section>

      <div className='controls-legend'>
        <p className='controls-title'>Controls</p>
        <div className='controls-grid'>
          <kbd>W / A / S / D</kbd>
          <span>Move</span>
          <kbd>↑ / ↓ / ← / →</kbd>
          <span>Also move</span>
          <kbd>Space</kbd>
          <span>Aim / Cancel</span>
          <kbd>Aim + WASD</kbd>
          <span>Shoot</span>
        </div>
      </div>
    </section>
  );
}

GameUI.propTypes = {
  arrowsRemaining: PropTypes.number.isRequired,
  isAiming: PropTypes.bool.isRequired,
  isLoading: PropTypes.bool.isRequired,
  message: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
  turn: PropTypes.number.isRequired,
  onStartGame: PropTypes.func.isRequired,
  onToggleAim: PropTypes.func.isRequired,
};
