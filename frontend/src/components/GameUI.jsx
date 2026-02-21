import PropTypes from 'prop-types';

export default function GameUI({
  arrowsRemaining,
  isAiming,
  isLoading,
  message,
  isMessageFading,
  status,
  turn,
  onStartGame,
  onToggleAim,
}) {
  const canToggleAim =
    status === 'Ongoing' && !isLoading && arrowsRemaining > 0;

  return (
    <section className={`game-ui ${isAiming ? 'ui--aiming' : ''}`}>
      <button
        type='button'
        className='btn-start'
        onClick={onStartGame}
        disabled={isLoading}
      >
        {isLoading ? 'Starting...' : status === 'Ongoing' ? 'New Game' : 'Start Game'}
      </button>

      <div className='hud-row'>
        <span>Turn: {turn}</span>
        <span>Arrow: {arrowsRemaining > 0 ? '🏹' : '✗'}</span>
      </div>

      <button
        type='button'
        className={`btn-aim ${isAiming ? 'btn-aim--active' : ''}`}
        onClick={onToggleAim}
        disabled={!canToggleAim}
      >
        {isAiming ? '🎯 AIM MODE — SHOOT WITH WASD' : '🏹 Press Space to Aim'}
      </button>

      <div className='controls-legend'>
        <p className='controls-title'>Controls</p>
        <div className='controls-grid'>
          <kbd>W A S D</kbd>
          <span>Move</span>
          <kbd>↑ ↓ ← →</kbd>
          <span>Also move</span>
          <kbd>Space</kbd>
          <span>Aim / Cancel</span>
          <kbd>Aim + WASD</kbd>
          <span>Shoot</span>
        </div>
      </div>

      {message ? (
        <p
          className={`game-ui__message ${
            isMessageFading ? 'game-ui__message--fading' : ''
          }`}
        >
          {message}
        </p>
      ) : null}
    </section>
  );
}

GameUI.propTypes = {
  arrowsRemaining: PropTypes.number.isRequired,
  isAiming: PropTypes.bool.isRequired,
  isLoading: PropTypes.bool.isRequired,
  message: PropTypes.string.isRequired,
  isMessageFading: PropTypes.bool.isRequired,
  status: PropTypes.string.isRequired,
  turn: PropTypes.number.isRequired,
  onStartGame: PropTypes.func.isRequired,
  onToggleAim: PropTypes.func.isRequired,
};
