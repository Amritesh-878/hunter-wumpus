import { fireEvent, render, screen, within } from '@testing-library/react';

import TutorialMode from './TutorialMode';

function dismissPopup(label = 'Got it →') {
  fireEvent.click(screen.getByRole('button', { name: label }));
}

describe('TutorialMode', () => {
  it('runs the modal-based tutorial flow and completes into real game handoff', () => {
    const onComplete = vi.fn();

    render(<TutorialMode onComplete={onComplete} />);

    expect(screen.getByText('The Hunt Begins')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Skip Tutorial' })).toBeInTheDocument();
    expect(screen.getByText('Turn #0')).toBeInTheDocument();

    fireEvent.keyDown(window, { code: 'KeyD', key: 'd' });
    expect(screen.getByText('The Hunt Begins')).toBeInTheDocument();

    dismissPopup();
    expect(screen.getByText('Movement')).toBeInTheDocument();

    dismissPopup();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.keyDown(window, { code: 'KeyD', key: 'd' });
    fireEvent.keyDown(window, { code: 'KeyD', key: 'd' });
    fireEvent.keyDown(window, { code: 'KeyD', key: 'd' });
    fireEvent.keyDown(window, { code: 'KeyS', key: 's' });
    expect(screen.getByText('You Feel a Cold Draft')).toBeInTheDocument();

    dismissPopup();

    fireEvent.keyDown(window, { code: 'KeyD', key: 'd' });
    fireEvent.keyDown(window, { code: 'KeyD', key: 'd' });
    fireEvent.keyDown(window, { code: 'KeyS', key: 's' });
    fireEvent.keyDown(window, { code: 'KeyS', key: 's' });
    fireEvent.keyDown(window, { code: 'KeyS', key: 's' });
    fireEvent.keyDown(window, { code: 'KeyS', key: 's' });
    expect(screen.getByText('Something Foul Lurks Nearby')).toBeInTheDocument();

    dismissPopup();
    fireEvent.keyDown(window, { code: 'Space', key: ' ' });
    expect(screen.getByText('AIM MODE — SHOOT WITH WASD')).toBeInTheDocument();

    fireEvent.keyDown(window, { code: 'KeyD', key: 'd' });
    expect(screen.getByText('The Wumpus is Dead')).toBeInTheDocument();

    dismissPopup();

    fireEvent.keyDown(window, { code: 'KeyS', key: 's' });
    fireEvent.keyDown(window, { code: 'KeyS', key: 's' });
    fireEvent.keyDown(window, { code: 'KeyS', key: 's' });
    expect(screen.getByText('A Golden Glimmer')).toBeInTheDocument();

    dismissPopup();

    fireEvent.keyDown(window, { code: 'KeyA', key: 'a' });
    expect(screen.getByText('You Survived')).toBeInTheDocument();

    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Start Real Game →',
      }),
    );
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('skips tutorial immediately from right panel button', () => {
    const onComplete = vi.fn();

    render(<TutorialMode onComplete={onComplete} />);

    fireEvent.click(screen.getByRole('button', { name: 'Skip Tutorial' }));

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('steps back one tile after pit death instead of returning to start', () => {
    render(<TutorialMode onComplete={vi.fn()} />);

    dismissPopup();
    dismissPopup();

    fireEvent.keyDown(window, { code: 'KeyD', key: 'd' });
    fireEvent.keyDown(window, { code: 'KeyD', key: 'd' });
    fireEvent.keyDown(window, { code: 'KeyD', key: 'd' });
    fireEvent.keyDown(window, { code: 'KeyS', key: 's' });
    dismissPopup();
    fireEvent.keyDown(window, { code: 'KeyS', key: 's' });

    expect(screen.getByText('You Fell Into a Pit')).toBeInTheDocument();
    dismissPopup('Try Again →');

    const player = screen.getByAltText('Player');
    const playerTile = player.closest('[data-x][data-y]');

    expect(playerTile).not.toBeNull();
    expect(playerTile).toHaveAttribute('data-x', '3');
    expect(playerTile).toHaveAttribute('data-y', '1');
  });
});
