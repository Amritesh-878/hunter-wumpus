import { fireEvent, render, screen } from '@testing-library/react';

import TutorialMode from './TutorialMode';

function getActiveStepTitle() {
  const activeNode = document.querySelector('.tutorial-step--active .tutorial-step__title');
  return activeNode?.textContent;
}

describe('TutorialMode', () => {
  it('progresses through core tutorial steps and enables start game on completion', () => {
    const onComplete = vi.fn();

    render(<TutorialMode onComplete={onComplete} />);

    expect(getActiveStepTitle()).toBe('Step 1 — Movement');

    fireEvent.keyDown(window, { code: 'KeyD', key: 'd' });
    expect(getActiveStepTitle()).toBe('Step 2 — Breeze Warning');

    fireEvent.keyDown(window, { code: 'ArrowRight', key: 'ArrowRight' });
    expect(getActiveStepTitle()).toBe('Step 3 — Stench Warning');

    fireEvent.keyDown(window, { code: 'KeyE', key: 'e' });
    expect(getActiveStepTitle()).toBe('Step 4 — Shooting');

    fireEvent.keyDown(window, { code: 'ArrowDown', key: 'ArrowDown' });

    expect(getActiveStepTitle()).toBe('Step 5 — Shine & Gold');
    expect(screen.getByText(/The Wumpus is dead. Now find the gold./i)).toBeInTheDocument();

    fireEvent.keyDown(window, { code: 'ArrowDown', key: 'ArrowDown' });
    fireEvent.keyDown(window, { code: 'ArrowDown', key: 'ArrowDown' });
    fireEvent.keyDown(window, { code: 'ArrowLeft', key: 'ArrowLeft' });
    fireEvent.keyDown(window, { code: 'ArrowDown', key: 'ArrowDown' });
    expect(getActiveStepTitle()).toBe('Step 6 — Completion');

    const startGameButton = screen.getByRole('button', { name: 'Start Game' });
    fireEvent.click(startGameButton);

    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
