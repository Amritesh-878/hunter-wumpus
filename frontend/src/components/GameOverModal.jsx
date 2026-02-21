import PropTypes from 'prop-types';

import '../styles/Modal.css';

const TERMINAL_MESSAGES = {
  PlayerWon: {
    icon: '🏆',
    title: 'You Found the Gold!',
    body: 'You escaped the Wumpus and claimed the treasure.',
    statusClass: 'modal-box__title--win',
  },
  PlayerLost_Wumpus: {
    icon: '💀',
    title: 'Devoured.',
    body: 'The Wumpus found you. You never stood a chance.',
    statusClass: 'modal-box__title--wumpus',
  },
  PlayerLost_Pit: {
    icon: '🕳',
    title: 'You Fell.',
    body: 'The ground gave way. There was no bottom.',
    statusClass: 'modal-box__title--pit',
  },
};

export default function GameOverModal({
  status,
  isLoading,
  error = null,
  onPlayAgain,
}) {
  const message = TERMINAL_MESSAGES[status];

  if (!message) {
    return null;
  }

  return (
    <div className='modal-overlay' role='dialog' aria-modal='true'>
      <div className='modal-box' data-status={status}>
        <p className='modal-icon' aria-hidden='true'>
          {message.icon}
        </p>
        <h2 className={message.statusClass}>{message.title}</h2>
        <p>{message.body}</p>
        {error ? (
          <p role='alert' className='modal-error'>
            Error: {error}
          </p>
        ) : null}
        <button
          type='button'
          className='play-again-btn'
          onClick={onPlayAgain}
          disabled={isLoading}
        >
          {isLoading ? 'Starting...' : 'Play Again'}
        </button>
      </div>
    </div>
  );
}

GameOverModal.propTypes = {
  status: PropTypes.string.isRequired,
  isLoading: PropTypes.bool.isRequired,
  error: PropTypes.string,
  onPlayAgain: PropTypes.func.isRequired,
};