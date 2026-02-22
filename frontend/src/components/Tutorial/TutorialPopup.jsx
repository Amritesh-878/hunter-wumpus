import PropTypes from 'prop-types';

import '../../styles/Modal.css';

export default function TutorialPopup({
  title,
  body,
  onDismiss,
  dismissLabel,
  icon,
}) {
  return (
    <div className='modal-overlay' role='dialog' aria-modal='true'>
      <div className='modal-box tutorial-popup__box'>
        {icon ? (
          <img
            src={icon}
            alt=''
            className='tutorial-popup__icon'
            aria-hidden='true'
          />
        ) : null}
        <h2 className='modal-box__title--win'>{title}</h2>
        <p>{body}</p>
        <button type='button' className='play-again-btn' onClick={onDismiss}>
          {dismissLabel ?? 'Got it →'}
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
  icon: PropTypes.string,
};