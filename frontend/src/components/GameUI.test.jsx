import { fireEvent, render, screen } from '@testing-library/react';

import GameUI from './GameUI';

describe('GameUI', () => {
  it('shows ammo and aim state', () => {
    render(
      <GameUI
        arrowsRemaining={1}
        isAiming={true}
        isLoading={false}
        message='You feel a cold draft.'
        isMessageFading={false}
        status='Ongoing'
        turn={4}
        onStartGame={() => {}}
        onToggleAim={() => {}}
      />,
    );

    expect(screen.getByText('Turn: 4')).toBeInTheDocument();
    expect(screen.getByText('Arrow: 🏹')).toBeInTheDocument();
    expect(screen.getByText('🎯 AIM MODE — SHOOT WITH WASD')).toBeInTheDocument();
    expect(screen.getByText('You feel a cold draft.')).toBeInTheDocument();
  });

  it('disables aim button with no arrows', () => {
    render(
      <GameUI
        arrowsRemaining={0}
        isAiming={false}
        isLoading={false}
        message=''
        isMessageFading={false}
        status='Ongoing'
        turn={0}
        onStartGame={() => {}}
        onToggleAim={() => {}}
      />,
    );

    expect(screen.getByText('🏹 Press Space to Aim')).toBeDisabled();
  });

  it('calls handlers on button clicks', () => {
    const onStartGame = vi.fn();
    const onToggleAim = vi.fn();

    render(
      <GameUI
        arrowsRemaining={1}
        isAiming={false}
        isLoading={false}
        message=''
        isMessageFading={false}
        status='Ongoing'
        turn={0}
        onStartGame={onStartGame}
        onToggleAim={onToggleAim}
      />,
    );

    fireEvent.click(screen.getByText('New Game'));
    fireEvent.click(screen.getByText('🏹 Press Space to Aim'));

    expect(onStartGame).toHaveBeenCalledTimes(1);
    expect(onToggleAim).toHaveBeenCalledTimes(1);
  });
});
