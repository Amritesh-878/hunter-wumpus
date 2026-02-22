import { useCallback, useEffect, useRef } from 'react';

import { movePlayer } from '../api/gameService';
import { useGame } from '../store/GameContext';

const CODE_TO_DIRECTION = {
  KeyW: 'NORTH',
  ArrowUp: 'NORTH',
  KeyS: 'SOUTH',
  ArrowDown: 'SOUTH',
  KeyD: 'EAST',
  ArrowRight: 'EAST',
  KeyA: 'WEST',
  ArrowLeft: 'WEST',
};

export function useControls() {
  const { state, dispatch } = useGame();
  const actionInFlightRef = useRef(false);

  const sendDirectionAction = useCallback(
    async (direction) => {
      if (
        !state.gameId ||
        state.status !== 'Ongoing' ||
        state.isLoading ||
        actionInFlightRef.current
      ) {
        return;
      }

      actionInFlightRef.current = true;
      const action = state.isAiming ? `SHOOT_${direction}` : direction;

      try {
        const gameState = await movePlayer(state.gameId, action);
        dispatch({ type: 'UPDATE_STATE', payload: gameState });
        dispatch({ type: 'SET_AIMING', payload: false });
      } catch {
        dispatch({ type: 'SET_ERROR', payload: 'Connection lost. Try again.' });
      } finally {
        actionInFlightRef.current = false;
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
      if (state.isLoading || state.status !== 'Ongoing' || actionInFlightRef.current) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        toggleAim();
        return;
      }

      const direction = CODE_TO_DIRECTION[e.code];

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
