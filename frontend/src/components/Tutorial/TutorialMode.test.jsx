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

    fireEvent.keyDown(window, { code: 'KeyD', key: 'd' });
    expect(screen.getByText('The Hunt Begins')).toBeInTheDocument();

    dismissPopup();
    expect(screen.getByText('How to Move')).toBeInTheDocument();

    dismissPopup();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.keyDown(window, { code: 'KeyD', key: 'd' });
    fireEvent.keyDown(window, { code: 'KeyS', key: 's' });
    expect(screen.getByText('A Cold Draft')).toBeInTheDocument();

    dismissPopup();

    fireEvent.keyDown(window, { code: 'KeyS', key: 's' });
    expect(screen.getByText('Something Foul')).toBeInTheDocument();

    dismissPopup();
    fireEvent.keyDown(window, { code: 'KeyE', key: 'e' });
    expect(screen.getByText('— AIM MODE —')).toBeInTheDocument();

    fireEvent.keyDown(window, { code: 'KeyD', key: 'd' });
    expect(screen.getByText('The Wumpus is Dead')).toBeInTheDocument();

    dismissPopup();

    fireEvent.keyDown(window, { code: 'KeyA', key: 'a' });
    expect(screen.getByText('A Golden Glimmer')).toBeInTheDocument();

    dismissPopup();

    fireEvent.keyDown(window, { code: 'KeyS', key: 's' });
    expect(screen.getByText('You Survived')).toBeInTheDocument();

    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Start Real Game →',
      }),
    );
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
