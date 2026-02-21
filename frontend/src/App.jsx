import { startGame as startGameRequest } from './api/gameService';
import GameOverModal from './components/GameOverModal';
import GameUI from './components/GameUI';
import Grid from './components/Grid';
import LoadingOverlay from './components/LoadingOverlay';
import { useControls } from './hooks/useControls';
import { GameProvider, useGame } from './store/GameContext';
import './styles/App.css';

const TERMINAL_STATUSES = new Set([
  'PlayerWon',
  'PlayerLost_Pit',
  'PlayerLost_Wumpus',
]);

function isTerminalStatus(status) {
  return TERMINAL_STATUSES.has(status);
}

function GameShell() {
  const { state, dispatch } = useGame();
  const { isAiming, toggleAim } = useControls();

  const startGame = async () => {
    dispatch({ type: 'RESET_STATE' });
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const gameState = await startGameRequest(state.gridSize);
      dispatch({ type: 'UPDATE_STATE', payload: gameState });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      dispatch({ type: 'SET_ERROR', payload: message });
    }
  };

  const resetGame = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const gameState = await startGameRequest(state.gridSize);
      dispatch({ type: 'RESET_STATE' });
      dispatch({ type: 'UPDATE_STATE', payload: gameState });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      dispatch({ type: 'SET_ERROR', payload: message });
    }
  };

  const isGameOver = isTerminalStatus(state.status);

  return (
    <main className='app'>
      <h1>Hunter Wumpus</h1>
      <GameUI
        arrowsRemaining={state.arrowsRemaining}
        isAiming={isAiming}
        isLoading={state.isLoading}
        status={state.status}
        onStartGame={startGame}
        onToggleAim={toggleAim}
      />
      <p className='app__meta'>Status: {state.status}</p>
      <p className='app__meta'>Turn: {state.turn}</p>
      <p>
        Position: ({state.playerPos[0]}, {state.playerPos[1]})
      </p>
      <Grid
        gridSize={state.gridSize}
        playerPos={state.playerPos}
        exploredTiles={state.exploredTiles}
        senses={state.senses}
        status={state.status}
      />
      {state.error ? (
        <p role='alert' className='app__error'>
          Error: {state.error}
        </p>
      ) : null}
      {state.isLoading ? <LoadingOverlay /> : null}
      {isGameOver ? (
        <GameOverModal
          status={state.status}
          isLoading={state.isLoading}
          error={state.error}
          onPlayAgain={resetGame}
        />
      ) : null}
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
