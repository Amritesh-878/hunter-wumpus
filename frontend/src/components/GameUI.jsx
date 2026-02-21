import PropTypes from 'prop-types';

export default function GameUI({
  arrowsRemaining,
  isAiming,
  isLoading,
  status,
  onStartGame,
  onToggleAim,
}) {
  const canToggleAim =
    status === 'Ongoing' && !isLoading && arrowsRemaining > 0;

  return (
    <section className={`game-ui ${isAiming ? 'ui--aiming' : ''}`}>
      <button type='button' onClick={onStartGame} disabled={isLoading}>
        {isLoading ? 'Starting...' : 'Start Game'}
      </button>
      <p>Ammo: {arrowsRemaining}</p>
      <p>Aim Mode: {isAiming ? 'ON' : 'OFF'}</p>
      <button type='button' onClick={onToggleAim} disabled={!canToggleAim}>
        {isAiming ? 'Cancel Aim' : 'Enter Aim'}
      </button>
    </section>
  );
}

GameUI.propTypes = {
  arrowsRemaining: PropTypes.number.isRequired,
  isAiming: PropTypes.bool.isRequired,
  isLoading: PropTypes.bool.isRequired,
  status: PropTypes.string.isRequired,
  onStartGame: PropTypes.func.isRequired,
  onToggleAim: PropTypes.func.isRequired,
};
