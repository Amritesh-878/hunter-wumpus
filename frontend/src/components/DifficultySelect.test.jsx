import { fireEvent, render, screen } from '@testing-library/react';

import DifficultySelect from './DifficultySelect';

describe('DifficultySelect', () => {
  const allLabels = [
    'Easy',
    'Medium',
    'Hard',
    'Impossible I',
    'Impossible II',
    'Impossible III',
  ];

  it('renders all 6 difficulty options', () => {
    render(
      <DifficultySelect
        value='medium'
        onChange={() => {}}
        disabled={false}
      />,
    );

    for (const label of allLabels) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('calls onChange with correct difficulty string on click', () => {
    const onChange = vi.fn();

    render(
      <DifficultySelect
        value='medium'
        onChange={onChange}
        disabled={false}
      />,
    );

    fireEvent.click(screen.getByText('Hard'));
    expect(onChange).toHaveBeenCalledWith('hard');

    fireEvent.click(screen.getByText('Impossible II'));
    expect(onChange).toHaveBeenCalledWith('impossible_ii');
  });

  it('disables all buttons when disabled is true', () => {
    render(
      <DifficultySelect
        value='easy'
        onChange={() => {}}
        disabled={true}
      />,
    );

    for (const label of allLabels) {
      expect(screen.getByText(label)).toBeDisabled();
    }
  });

  it('marks active difficulty with aria-pressed', () => {
    render(
      <DifficultySelect
        value='hard'
        onChange={() => {}}
        disabled={false}
      />,
    );

    expect(screen.getByText('Hard')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Easy')).toHaveAttribute('aria-pressed', 'false');
  });
});
