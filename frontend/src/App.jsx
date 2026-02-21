import { startGame as startGameRequest } from './api/gameService';
import GameOverModal from './components/GameOverModal';
import GameUI from './components/GameUI';
import Grid from './components/Grid';
import LoadingOverlay from './components/LoadingOverlay';
import { useControls } from './hooks/useControls';
import { GameProvider, useGame } from './store/GameContext';
import './styles/App.css';

function GameShell() {
  const { state, dispatch } = useGame();
  const { isAiming, toggleAim } = useControls();

  const runStartGame = async (resetBeforeRequest) => {
    if (resetBeforeRequest) dispatch({ type: 'RESET_STATE' });
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const gameState = await startGameRequest(state.gridSize);
      if (!resetBeforeRequest) dispatch({ type: 'RESET_STATE' });
      dispatch({ type: 'UPDATE_STATE', payload: gameState });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      dispatch({ type: 'SET_ERROR', payload: message });
    }
  };

  const isGameOver = ['PlayerWon', 'PlayerLost_Pit', 'PlayerLost_Wumpus'].includes(
    state.status,
  );

  return (
    <main className='app'>
      <h1>Hunter Wumpus</h1>
      {state.message ? <p className='app__message'>{state.message}</p> : null}
      <Grid
        gridSize={state.gridSize}
        playerPos={state.playerPos}
        exploredTiles={state.exploredTiles}
        senses={state.senses}
        status={state.status}
      />
      <aside className='app__right-panel'>
        <GameUI
          arrowsRemaining={state.arrowsRemaining}
          isAiming={isAiming}
          isLoading={state.isLoading}
          status={state.status}
          turn={state.turn}
          playerPos={state.playerPos}
          onStartGame={() => runStartGame(true)}
          onToggleAim={toggleAim}
        />
      </aside>
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
          onPlayAgain={() => runStartGame(false)}
        />
      ) : null}
    </main>
  );
}

export default function App() {
  return <GameProvider><GameShell /></GameProvider>;
}
