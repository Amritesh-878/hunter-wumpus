import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const { mockStartGame, mockToggleAim } = vi.hoisted(() => ({
  mockStartGame: vi.fn(),
  mockToggleAim: vi.fn(),
}));

vi.mock('./api/gameService', () => ({
  startGame: mockStartGame,
}));

vi.mock('./hooks/useControls', () => ({
  useControls: () => ({
    isAiming: false,
    toggleAim: mockToggleAim,
  }),
}));

import App from './App';

describe('App game loop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts a game and clears loading overlay on success', async () => {
    let resolveStart;
    const pendingStart = new Promise((resolve) => {
      resolveStart = resolve;
    });

    mockStartGame.mockReturnValueOnce(pendingStart);

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Start Game' }));

    expect(mockStartGame).toHaveBeenCalledWith(10);
    expect(screen.getByText('The Wumpus is thinking...')).toBeInTheDocument();

    resolveStart({
      game_id: 'game-1',
      status: 'Ongoing',
      grid_size: 10,
      turn: 0,
      player_pos: [0, 0],
      arrows_remaining: 1,
      explored_tiles: [[0, 0]],
      senses: { breeze: false, stench: false, shine: false },
      message: 'The hunt begins. Find the gold. Survive.',
    });

    await waitFor(() => {
      expect(screen.queryByText('The Wumpus is thinking...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Status: Ongoing')).toBeInTheDocument();
  });

  it('keeps modal open on play-again failure and allows retry', async () => {
    mockStartGame
      .mockResolvedValueOnce({
        game_id: 'game-1',
        status: 'PlayerLost_Pit',
        grid_size: 10,
        turn: 3,
        player_pos: [2, 1],
        arrows_remaining: 1,
        explored_tiles: [
          [0, 0],
          [1, 0],
          [2, 0],
          [2, 1],
        ],
        senses: { breeze: false, stench: false, shine: false },
        message: 'The ground gave way. There was no bottom.',
      })
      .mockRejectedValueOnce(new Error('Retry failed.'))
      .mockResolvedValueOnce({
        game_id: 'game-2',
        status: 'Ongoing',
        grid_size: 10,
        turn: 0,
        player_pos: [0, 0],
        arrows_remaining: 1,
        explored_tiles: [[0, 0]],
        senses: { breeze: false, stench: false, shine: false },
        message: 'The hunt begins. Find the gold. Survive.',
      });

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Start Game' }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Play Again' }));

    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(
        alerts.some((alert) => alert.textContent?.includes('Retry failed.')),
      ).toBe(true);
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Play Again' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Status: Ongoing')).toBeInTheDocument();
    expect(mockStartGame).toHaveBeenCalledTimes(3);
  });
});