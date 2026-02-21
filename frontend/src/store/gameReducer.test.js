import { gameReducer, initialState } from './gameReducer';

describe('gameReducer', () => {
  it('maps backend snake_case fields to camelCase state on UPDATE_STATE', () => {
    const action = {
      type: 'UPDATE_STATE',
      payload: {
        game_id: 'abc-123',
        status: 'Ongoing',
        grid_size: 12,
        turn: 4,
        player_pos: [3, 2],
        arrows_remaining: 0,
        explored_tiles: [
          [0, 0],
          [1, 0],
        ],
        senses: { breeze: true, stench: false, shine: false },
        message: 'You feel a cold draft. A pit may be nearby.',
      },
    };

    const nextState = gameReducer(initialState, action);

    expect(nextState.gameId).toBe('abc-123');
    expect(nextState.gridSize).toBe(12);
    expect(nextState.playerPos).toEqual([3, 2]);
    expect(nextState.arrowsRemaining).toBe(0);
    expect(nextState.exploredTiles).toEqual([
      [0, 0],
      [1, 0],
    ]);
    expect(nextState.senses.breeze).toBe(true);
    expect(nextState.isLoading).toBe(false);
    expect(nextState.error).toBeNull();
  });

  it('handles loading and reset actions', () => {
    const loadingState = gameReducer(initialState, {
      type: 'SET_LOADING',
      payload: true,
    });

    expect(loadingState.isLoading).toBe(true);

    const resetState = gameReducer(loadingState, {
      type: 'RESET_STATE',
    });

    expect(resetState).toEqual(initialState);
  });

  it('merges explored tiles without duplicates on UPDATE_STATE', () => {
    const currentState = {
      ...initialState,
      exploredTiles: [
        [0, 0],
        [1, 0],
      ],
    };

    const action = {
      type: 'UPDATE_STATE',
      payload: {
        game_id: 'abc-123',
        status: 'Ongoing',
        grid_size: 10,
        turn: 2,
        player_pos: [2, 0],
        arrows_remaining: 1,
        explored_tiles: [
          [1, 0],
          [2, 0],
        ],
        senses: { breeze: false, stench: false, shine: false },
        message: '',
      },
    };

    const nextState = gameReducer(currentState, action);

    expect(nextState.exploredTiles).toEqual([
      [0, 0],
      [1, 0],
      [2, 0],
    ]);
  });
});
