import { useCallback, useEffect } from 'react';

import { movePlayer } from '../api/gameService';
import { useGame } from '../store/GameContext';

const KEY_TO_DIRECTION = {
  w: 'NORTH',
  ArrowUp: 'NORTH',
  s: 'SOUTH',
  ArrowDown: 'SOUTH',
  d: 'EAST',
  ArrowRight: 'EAST',
  a: 'WEST',
  ArrowLeft: 'WEST',
};

export function useControls() {
  const { state, dispatch } = useGame();

  const sendDirectionAction = useCallback(
    async (direction) => {
      if (!state.gameId || state.status !== 'Ongoing' || state.isLoading) {
        return;
      }

      const action = state.isAiming ? `SHOOT_${direction}` : direction;

      dispatch({ type: 'SET_LOADING', payload: true });

      try {
        const gameState = await movePlayer(state.gameId, action);
        dispatch({ type: 'UPDATE_STATE', payload: gameState });
        dispatch({ type: 'SET_AIMING', payload: false });
      } catch {
        dispatch({ type: 'SET_ERROR', payload: 'Connection lost. Try again.' });
      }
    },
    [dispatch, state.gameId, state.isAiming, state.isLoading, state.status],
  );

  const toggleAim = useCallback(() => {
    if (
      state.isLoading ||
      state.status !== 'Ongoing' ||
      state.arrowsRemaining <= 0
    ) {
      return;
    }

    dispatch({ type: 'SET_AIMING', payload: !state.isAiming });
  }, [
    dispatch,
    state.arrowsRemaining,
    state.isAiming,
    state.isLoading,
    state.status,
  ]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (state.isLoading || state.status !== 'Ongoing') {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        toggleAim();
        return;
      }

      const direction = KEY_TO_DIRECTION[e.key];

      if (!direction) {
        return;
      }

      e.preventDefault();
      void sendDirectionAction(direction);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [sendDirectionAction, state.isLoading, state.status, toggleAim]);

  return {
    isAiming: state.isAiming,
    toggleAim,
  };
}
