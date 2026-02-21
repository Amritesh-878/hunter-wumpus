import { fireEvent, render, screen } from '@testing-library/react';

import GameOverModal from './GameOverModal';

describe('GameOverModal', () => {
  it.each([
    [
      'PlayerWon',
      'You Found the Gold!',
      'You escaped the Wumpus and claimed the treasure.',
    ],
    [
      'PlayerLost_Wumpus',
      'Devoured.',
      'The Wumpus found you. You never stood a chance.',
    ],
    [
      'PlayerLost_Pit',
      'You Fell.',
      'The ground gave way. There was no bottom.',
    ],
    [
      'WumpusKilled',
      'The Hunt Ends.',
      'Your arrow found its mark in the dark. The Wumpus is slain.',
    ],
  ])('renders status message for %s', (status, title, body) => {
    const { container } = render(
      <GameOverModal
        status={status}
        isLoading={false}
        error={null}
        onPlayAgain={() => {}}
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText(body)).toBeInTheDocument();
    expect(container.querySelector('.modal-box')).toHaveAttribute(
      'data-status',
      status,
    );
  });

  it('renders WumpusKilled message', () => {
    render(
      <GameOverModal
        status='WumpusKilled'
        isLoading={false}
        onPlayAgain={() => {}}
      />,
    );

    expect(screen.getByText('The Hunt Ends.')).toBeInTheDocument();
  });

  it('does not render for non-terminal status', () => {
    const { container } = render(
      <GameOverModal
        status='Ongoing'
        isLoading={false}
        error={null}
        onPlayAgain={() => {}}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('calls play-again handler and displays modal error', () => {
    const onPlayAgain = vi.fn();

    render(
      <GameOverModal
        status='PlayerLost_Pit'
        isLoading={false}
        error='Connection lost. Try again.'
        onPlayAgain={onPlayAgain}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Play Again' }));

    expect(onPlayAgain).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Connection lost. Try again.',
    );
  });
});