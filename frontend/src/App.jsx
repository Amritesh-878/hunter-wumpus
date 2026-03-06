import { useState } from 'react';

import { startGame as startGameRequest } from './api/gameService';
import { useAuth } from './auth/AuthContext';
import GameOverModal from './components/GameOverModal';
import GameUI from './components/GameUI';
import Grid from './components/Grid';
import LoadingOverlay from './components/LoadingOverlay';
import Login from './components/Login';
import TutorialMode from './components/Tutorial/TutorialMode';
import { useControls } from './hooks/useControls';
import { useGame } from './store/GameContext';
import './styles/App.css';

function GameShell() {
  const { state, dispatch } = useGame();
  const { isAiming, toggleAim } = useControls();
  const { user, token, loading: authLoading } = useAuth();
  const [appMode, setAppMode] = useState('menu');

  const runStartGame = async (resetBeforeRequest) => {
    if (resetBeforeRequest) dispatch({ type: 'RESET_STATE' });
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const gameState = await startGameRequest(state.gridSize, token);
      if (!resetBeforeRequest) dispatch({ type: 'RESET_STATE' });
      dispatch({ type: 'UPDATE_STATE', payload: gameState });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      dispatch({ type: 'SET_ERROR', payload: message });
    }
  };

  if (authLoading) {
    return <LoadingOverlay />;
  }

  if (!user) {
    return (
      <main className='app'>
        <header className='app__titlebar'>
          <h1>HUNT THE WUMPUS</h1>
          <div className='app__title-divider' aria-hidden='true' />
        </header>
        <section className='app__content app__content--menu'>
          <Login />
        </section>
      </main>
    );
  }

  const startRealGame = async () => {
    setAppMode('playing');
    await runStartGame(true);
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

      <section className={`app__content${appMode === 'menu' ? ' app__content--menu' : ''}`}>
        {appMode === 'menu' ? (
          <section className='menu-panel' aria-label='Main menu'>
            <p className='menu-panel__subtitle'>Choose your path</p>
            <button
              type='button'
              className='btn-start'
              onClick={() => {
                void startRealGame();
              }}
              disabled={state.isLoading}
            >
              Start Game
            </button>
            <button
              type='button'
              className='btn-aim menu-panel__tutorial-btn'
              onClick={() => {
                setAppMode('tutorial');
              }}
              disabled={state.isLoading}
            >
              Tutorial
            </button>
          </section>
        ) : null}

        {appMode === 'tutorial' ? (
          <TutorialMode
            onComplete={() => {
              void startRealGame();
            }}
          />
        ) : null}

        {appMode === 'playing' ? (
          <>
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
          </>
        ) : null}
      </section>
      {state.error ? (
        <p role='alert' className='app__error'>
          Error: {state.error}
        </p>
      ) : null}
      {state.isLoading ? <LoadingOverlay /> : null}
      {appMode === 'playing' && isGameOver ? (
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
  return <GameShell />;
}
