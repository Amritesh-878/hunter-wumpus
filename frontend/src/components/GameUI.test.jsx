import { fireEvent, render, screen } from '@testing-library/react';

import GameUI from './GameUI';

describe('GameUI', () => {
  it('shows ammo and aim state', () => {
    render(
      <GameUI
        arrowsRemaining={1}
        isAiming={true}
        isLoading={false}
        status='Ongoing'
        onStartGame={() => {}}
        onToggleAim={() => {}}
      />,
    );

    expect(screen.getByText('Ammo: 1')).toBeInTheDocument();
    expect(screen.getByText('Aim Mode: ON')).toBeInTheDocument();
    expect(screen.getByText('Cancel Aim')).toBeInTheDocument();
  });

  it('disables aim button with no arrows', () => {
    render(
      <GameUI
        arrowsRemaining={0}
        isAiming={false}
        isLoading={false}
        status='Ongoing'
        onStartGame={() => {}}
        onToggleAim={() => {}}
      />,
    );

    expect(screen.getByText('Enter Aim')).toBeDisabled();
  });

  it('calls handlers on button clicks', () => {
    const onStartGame = vi.fn();
    const onToggleAim = vi.fn();

    render(
      <GameUI
        arrowsRemaining={1}
        isAiming={false}
        isLoading={false}
        status='Ongoing'
        onStartGame={onStartGame}
        onToggleAim={onToggleAim}
      />,
    );

    fireEvent.click(screen.getByText('Start Game'));
    fireEvent.click(screen.getByText('Enter Aim'));

    expect(onStartGame).toHaveBeenCalledTimes(1);
    expect(onToggleAim).toHaveBeenCalledTimes(1);
  });
});
