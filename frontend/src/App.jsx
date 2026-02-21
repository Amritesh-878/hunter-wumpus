import { startGame } from './api/gameService';
import Grid from './components/Grid';
import { GameProvider, useGame } from './store/GameContext';

function GameShell() {
  const { state, dispatch } = useGame();

  const handleStartGame = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const gameState = await startGame(state.gridSize);
      dispatch({ type: 'UPDATE_STATE', payload: gameState });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      dispatch({ type: 'SET_ERROR', payload: message });
    }
  };

  return (
    <main>
      <h1>Hunter Wumpus</h1>
      <button
        type='button'
        onClick={handleStartGame}
        disabled={state.isLoading}
      >
        {state.isLoading ? 'Starting...' : 'Start Game'}
      </button>
      <p>Status: {state.status}</p>
      <p>Turn: {state.turn}</p>
      <p>
        Position: ({state.playerPos[0]}, {state.playerPos[1]})
      </p>
      <Grid
        gridSize={state.gridSize}
        playerPos={state.playerPos}
        exploredTiles={state.exploredTiles}
        senses={state.senses}
      />
      {state.error ? <p role='alert'>Error: {state.error}</p> : null}
    </main>
  );
}

export default function App() {
  return (
    <GameProvider>
      <GameShell />
    </GameProvider>
  );
}
