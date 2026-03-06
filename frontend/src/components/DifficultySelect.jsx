import PropTypes from 'prop-types';

const DIFFICULTIES = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'impossible_i', label: 'Impossible I' },
  { value: 'impossible_ii', label: 'Impossible II' },
  { value: 'impossible_iii', label: 'Impossible III' },
];

export default function DifficultySelect({ value, onChange, disabled }) {
  return (
    <div className='difficulty-select' role='group' aria-label='Difficulty'>
      {DIFFICULTIES.map((d) => (
        <button
          key={d.value}
          type='button'
          className={`difficulty-btn${d.value === value ? ' difficulty-btn--active' : ''}`}
          disabled={disabled}
          onClick={() => onChange(d.value)}
          aria-pressed={d.value === value}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}

DifficultySelect.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired,
};
