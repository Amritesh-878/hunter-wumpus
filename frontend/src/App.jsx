import { startGame } from './api/gameService';
import GameUI from './components/GameUI';
import Grid from './components/Grid';
import { useControls } from './hooks/useControls';
import { GameProvider, useGame } from './store/GameContext';
import './styles/App.css';

function GameShell() {
  const { state, dispatch } = useGame();
  const { isAiming, toggleAim } = useControls();

  const handleStartGame = async () => {
    dispatch({ type: 'RESET_STATE' });
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
    <main className='app'>
      <h1>Hunter Wumpus</h1>
      <GameUI
        arrowsRemaining={state.arrowsRemaining}
        isAiming={isAiming}
        isLoading={state.isLoading}
        status={state.status}
        onStartGame={handleStartGame}
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
