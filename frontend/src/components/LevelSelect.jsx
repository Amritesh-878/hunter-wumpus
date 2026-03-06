import PropTypes from 'prop-types';

import '../styles/LevelSelect.css';

const DIFFICULTIES = [
  { value: 'easy', label: 'Easy', description: 'Wumpus moves every 2 turns' },
  {
    value: 'medium',
    label: 'Medium',
    description: 'Standard 1:1 pacing',
    isDefault: true,
  },
  { value: 'hard', label: 'Hard', description: 'Smarter Wumpus AI' },
  {
    value: 'impossible_i',
    label: 'Impossible I',
    description: '1-2 Wumpuses, more pits',
  },
  {
    value: 'impossible_ii',
    label: 'Impossible II',
    description: '2-3 Wumpuses, many pits',
  },
  {
    value: 'impossible_iii',
    label: 'Impossible III',
    description: '3-4 Wumpuses, maximum chaos',
  },
];

export { DIFFICULTIES };

export default function LevelSelect({ value, onChange, onConfirm, onBack }) {
  return (
    <section className='level-select' aria-label='Select difficulty'>
      <h2 className='level-select__title'>Select Difficulty</h2>
      <div className='level-select__grid'>
        {DIFFICULTIES.map((d) => (
          <button
            key={d.value}
            type='button'
            className={`level-card${d.value === value ? ' level-card--selected' : ''}`}
            onClick={() => onChange(d.value)}
            aria-pressed={d.value === value}
          >
            <span className='level-card__name'>{d.label}</span>
            <span className='level-card__desc'>{d.description}</span>
            {d.isDefault ? (
              <span className='level-card__badge'>Default</span>
            ) : null}
          </button>
        ))}
      </div>
      <button
        type='button'
        className='level-select__confirm'
        onClick={onConfirm}
      >
        Confirm
      </button>
      {onBack ? (
        <button type='button' className='level-select__back' onClick={onBack}>
          ← Back
        </button>
      ) : null}
    </section>
  );
}

LevelSelect.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onBack: PropTypes.func,
};
