import { fireEvent, render, screen } from '@testing-library/react';

import LevelSelect from './LevelSelect';

describe('LevelSelect', () => {
  const allLabels = [
    'Easy',
    'Medium',
    'Hard',
    'Impossible I',
    'Impossible II',
    'Impossible III',
  ];

  it('renders all 6 difficulty cards', () => {
    render(
      <LevelSelect value='medium' onChange={() => {}} onConfirm={() => {}} />,
    );

    for (const label of allLabels) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('renders descriptions for each difficulty', () => {
    render(
      <LevelSelect value='medium' onChange={() => {}} onConfirm={() => {}} />,
    );

    expect(screen.getByText('Wumpus moves every 2 turns')).toBeInTheDocument();
    expect(screen.getByText('Standard 1:1 pacing')).toBeInTheDocument();
    expect(screen.getByText('Smarter Wumpus AI')).toBeInTheDocument();
    expect(
      screen.getByText('3-4 Wumpuses, maximum chaos'),
    ).toBeInTheDocument();
  });

  it('calls onChange with correct difficulty on card click', () => {
    const onChange = vi.fn();
    render(
      <LevelSelect value='medium' onChange={onChange} onConfirm={() => {}} />,
    );

    fireEvent.click(screen.getByText('Hard'));
    expect(onChange).toHaveBeenCalledWith('hard');

    fireEvent.click(screen.getByText('Impossible II'));
    expect(onChange).toHaveBeenCalledWith('impossible_ii');
  });

  it('marks selected card with aria-pressed', () => {
    render(
      <LevelSelect value='hard' onChange={() => {}} onConfirm={() => {}} />,
    );

    expect(screen.getByText('Hard').closest('button')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByText('Easy').closest('button')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('calls onConfirm when Confirm button is clicked', () => {
    const onConfirm = vi.fn();
    render(
      <LevelSelect value='medium' onChange={() => {}} onConfirm={onConfirm} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('shows Default badge on medium difficulty', () => {
    render(
      <LevelSelect value='medium' onChange={() => {}} onConfirm={() => {}} />,
    );

    expect(screen.getByText('Default')).toBeInTheDocument();
  });

  it('renders the title', () => {
    render(
      <LevelSelect value='medium' onChange={() => {}} onConfirm={() => {}} />,
    );

    expect(screen.getByText('Select Difficulty')).toBeInTheDocument();
  });
});
