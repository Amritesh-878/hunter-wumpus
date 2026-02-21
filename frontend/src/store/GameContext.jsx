import { createContext, useContext, useMemo, useReducer } from 'react';

import { gameReducer, initialState } from './gameReducer';

const noop = () => {};

export const GameContext = createContext({
  state: initialState,
  dispatch: noop,
});

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);

  if (!context) {
    throw new Error('useGame must be used within a GameProvider.');
  }

  return context;
}
