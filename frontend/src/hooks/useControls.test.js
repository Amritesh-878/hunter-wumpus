import { renderHook, waitFor } from '@testing-library/react';
import { createElement } from 'react';

import { movePlayer } from '../api/gameService';
import { GameContext } from '../store/GameContext';
import { initialState } from '../store/gameReducer';
import { useControls } from './useControls';

vi.mock('../api/gameService', () => ({
  movePlayer: vi.fn(),
}));

function createWrapper(state, dispatch = vi.fn()) {
  return function Wrapper({ children }) {
    return createElement(
      GameContext.Provider,
      { value: { state, dispatch } },
      children,
    );
  };
}

describe('useControls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps directional keys to movement actions', async () => {
    const dispatch = vi.fn();
    const state = {
      ...initialState,
      gameId: 'game-1',
      status: 'Ongoing',
    };

    movePlayer.mockResolvedValue({
      game_id: 'game-1',
      status: 'Ongoing',
      grid_size: 10,
      turn: 1,
      player_pos: [0, 1],
      arrows_remaining: 1,
      explored_tiles: [
        [0, 0],
        [0, 1],
      ],
      senses: { breeze: false, stench: false, shine: false },
      message: '',
    });

    renderHook(() => useControls(), {
      wrapper: createWrapper(state, dispatch),
    });

    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'w', code: 'KeyW' }),
    );

    await waitFor(() => {
      expect(movePlayer).toHaveBeenCalledWith('game-1', 'NORTH');
    });
  });

  it('uses e.code for spacebar to toggle aim mode', () => {
    const dispatch = vi.fn();
    const state = {
      ...initialState,
      gameId: 'game-1',
      status: 'Ongoing',
      isAiming: false,
    };

    renderHook(() => useControls(), {
      wrapper: createWrapper(state, dispatch),
    });

    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', code: 'Space' }),
    );

    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_AIMING',
      payload: true,
    });
  });

  it('sends SHOOT_ action when aiming', async () => {
    const dispatch = vi.fn();
    const state = {
      ...initialState,
      gameId: 'game-1',
      status: 'Ongoing',
      isAiming: true,
    };

    movePlayer.mockResolvedValue({
      game_id: 'game-1',
      status: 'Ongoing',
      grid_size: 10,
      turn: 1,
      player_pos: [1, 0],
      arrows_remaining: 0,
      explored_tiles: [[0, 0]],
      senses: { breeze: false, stench: false, shine: false },
      message: '',
    });

    renderHook(() => useControls(), {
      wrapper: createWrapper(state, dispatch),
    });

    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', code: 'ArrowRight' }),
    );

    await waitFor(() => {
      expect(movePlayer).toHaveBeenCalledWith('game-1', 'SHOOT_EAST');
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_AIMING',
      payload: false,
    });
  });

  it('cleans up keydown listener on unmount', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const state = {
      ...initialState,
      gameId: 'game-1',
      status: 'Ongoing',
    };

    const { unmount } = renderHook(() => useControls(), {
      wrapper: createWrapper(state),
    });

    unmount();

    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
