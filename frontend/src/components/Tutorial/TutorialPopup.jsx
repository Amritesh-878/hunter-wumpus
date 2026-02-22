import PropTypes from 'prop-types';

import '../../styles/Modal.css';

export default function TutorialPopup({
  title,
  body,
  onDismiss,
  dismissLabel = 'Got it →',
}) {
  return (
    <div className='modal-overlay' role='dialog' aria-modal='true'>
      <div className='modal-box'>
        <h2 className='tutorial-popup__title'>{title}</h2>
        <p>{body}</p>
        <button type='button' className='play-again-btn' onClick={onDismiss}>
          {dismissLabel}
        </button>
      </div>
    </div>
  );
}

TutorialPopup.propTypes = {
  title: PropTypes.string.isRequired,
  body: PropTypes.string.isRequired,
  onDismiss: PropTypes.func.isRequired,
  dismissLabel: PropTypes.string,
};