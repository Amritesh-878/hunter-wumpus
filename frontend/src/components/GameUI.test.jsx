import { fireEvent, render, screen } from '@testing-library/react';

import GameUI from './GameUI';

function renderGameUI(overrides = {}) {
  const props = {
    arrowsRemaining: 1,
    difficulty: 'medium',
    isAiming: false,
    isLoading: false,
    message: '',
    status: 'Ongoing',
    turn: 0,
    onDifficultyChange: () => {},
    onStartGame: () => {},
    onToggleAim: () => {},
    ...overrides,
  };
  return render(<GameUI {...props} />);
}

describe('GameUI', () => {
  it('shows ammo and aim state', () => {
    renderGameUI({
      arrowsRemaining: 1,
      isAiming: true,
      message: 'You feel a cold draft.',
      turn: 4,
    });

    expect(screen.getByText('Turn #4')).toBeInTheDocument();
    expect(screen.getByText('1 Arrow')).toBeInTheDocument();
    expect(screen.getByText('AIM MODE — SHOOT WITH WASD')).toBeInTheDocument();
    expect(screen.getByText('You feel a cold draft.')).toBeInTheDocument();
    expect(
      screen.getByText('Arrows travel the entire corridor.'),
    ).toBeInTheDocument();
  });

  it('disables aim button with no arrows', () => {
    renderGameUI({ arrowsRemaining: 0 });
    expect(screen.getByText('Press Space to Aim')).toBeDisabled();
  });

  it('calls handlers on button clicks', () => {
    const onStartGame = vi.fn();
    const onToggleAim = vi.fn();

    renderGameUI({
      arrowsRemaining: 1,
      onStartGame,
      onToggleAim,
    });

    fireEvent.click(screen.getByText('New Game'));
    fireEvent.click(screen.getByText('Press Space to Aim'));

    expect(onStartGame).toHaveBeenCalledTimes(1);
    expect(onToggleAim).toHaveBeenCalledTimes(1);
  });

  it('renders DifficultySelect with all 6 options', () => {
    renderGameUI();
    expect(screen.getByText('Easy')).toBeInTheDocument();
    expect(screen.getByText('Hard')).toBeInTheDocument();
    expect(screen.getByText('Impossible III')).toBeInTheDocument();
  });

  it('disables DifficultySelect during active game', () => {
    renderGameUI({ status: 'Ongoing' });
    expect(screen.getByText('Easy')).toBeDisabled();
  });

  it('shows wumpus count HUD for Impossible tiers', () => {
    renderGameUI({
      difficulty: 'impossible_ii',
      wumpusesRemaining: 3,
    });
    expect(screen.getByText('3 remaining')).toBeInTheDocument();
  });

  it('hides wumpus count HUD for non-Impossible tiers', () => {
    renderGameUI({
      difficulty: 'medium',
      wumpusesRemaining: 1,
    });
    expect(screen.queryByText('1 remaining')).not.toBeInTheDocument();
  });
});
