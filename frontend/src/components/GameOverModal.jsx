import PropTypes from 'prop-types';

import '../styles/Modal.css';

const TERMINAL_MESSAGES = {
  PlayerWon: {
    title: 'You Found the Gold!',
    body: 'You escaped the Wumpus and claimed the treasure.',
  },
  PlayerLost_Wumpus: {
    title: 'Devoured.',
    body: 'The Wumpus found you. You never stood a chance.',
  },
  PlayerLost_Pit: {
    title: 'You Fell.',
    body: 'The ground gave way. There was no bottom.',
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
        <h2>{message.title}</h2>
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