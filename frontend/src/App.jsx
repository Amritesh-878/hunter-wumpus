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

  const isGameOver = ['PlayerWon', 'WumpusKilled', 'PlayerLost_Pit', 'PlayerLost_Wumpus'].includes(
    state.status,
  );

  return (
    <main className='app'>
      <header className='app__titlebar'>
        <h1>HUNT THE WUMPUS</h1>
        <div className='app__title-divider' aria-hidden='true' />
      </header>

      <section className='app__content'>
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
            message={state.message}
            status={state.status}
            turn={state.turn}
            onStartGame={() => runStartGame(true)}
            onToggleAim={toggleAim}
          />
        </aside>
      </section>
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
  return (
    <GameProvider>
      <GameShell />
    </GameProvider>
  );
}
