import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import Grid from '../Grid';
import '../../styles/Tutorial.css';

const GRID_SIZE = 4;
const PIT_TILES = [[1, 1]];
const WUMPUS_POS = [2, 1];
const GOLD_POS = [1, 3];

const STEP_CONTENT = [
  {
    title: 'Step 1 — Movement',
    text: 'Use WASD or arrow keys to move. Try moving East →',
  },
  {
    title: 'Step 2 — Breeze Warning',
    text: "You feel a cold draft. A pit is nearby. Avoid tiles near breezes unless you've confirmed they are safe.",
  },
  {
    title: 'Step 3 — Stench Warning',
    text: 'A foul smell. The Wumpus lurks nearby. You can shoot it with your arrow.',
  },
  {
    title: 'Step 4 — Shooting',
    text: 'Press E to enter aim mode, then press a direction to shoot. Shoot South now.',
  },
  {
    title: 'Step 5 — Shine & Gold',
    text: 'A faint glimmer — gold is near. Move to the gold tile to win.',
  },
  {
    title: 'Step 6 — Completion',
    text: "You've mastered the basics. Ready to hunt for real?",
  },
];

function toTileKey([x, y]) {
  return `${x},${y}`;
}

function isAdjacent(a, b) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;
}

function getSenses(playerPos, isWumpusAlive) {
  return {
    breeze: PIT_TILES.some((pit) => isAdjacent(playerPos, pit)),
    stench: isWumpusAlive && isAdjacent(playerPos, WUMPUS_POS),
    shine: isAdjacent(playerPos, GOLD_POS) || toTileKey(playerPos) === toTileKey(GOLD_POS),
  };
}

function getNextPosition(playerPos, direction) {
  const [x, y] = playerPos;

  switch (direction) {
    case 'NORTH':
      return [x, Math.max(0, y - 1)];
    case 'SOUTH':
      return [x, Math.min(GRID_SIZE - 1, y + 1)];
    case 'EAST':
      return [Math.min(GRID_SIZE - 1, x + 1), y];
    case 'WEST':
      return [Math.max(0, x - 1), y];
    default:
      return playerPos;
  }
}

const KEY_TO_DIRECTION = {
  KeyW: 'NORTH',
  ArrowUp: 'NORTH',
  KeyS: 'SOUTH',
  ArrowDown: 'SOUTH',
  KeyD: 'EAST',
  ArrowRight: 'EAST',
  KeyA: 'WEST',
  ArrowLeft: 'WEST',
};

function canHitWumpus(playerPos, direction) {
  const [playerX, playerY] = playerPos;
  const [wumpusX, wumpusY] = WUMPUS_POS;

  if (direction === 'NORTH') {
    return playerX === wumpusX && wumpusY < playerY;
  }

  if (direction === 'SOUTH') {
    return playerX === wumpusX && wumpusY > playerY;
  }

  if (direction === 'EAST') {
    return playerY === wumpusY && wumpusX > playerX;
  }

  if (direction === 'WEST') {
    return playerY === wumpusY && wumpusX < playerX;
  }

  return false;
}

export default function TutorialMode({ onComplete }) {
  const [playerPos, setPlayerPos] = useState([0, 0]);
  const [exploredTiles, setExploredTiles] = useState([[0, 0]]);
  const [stepIndex, setStepIndex] = useState(0);
  const [isAiming, setIsAiming] = useState(false);
  const [isWumpusAlive, setIsWumpusAlive] = useState(true);
  const [arrowsRemaining, setArrowsRemaining] = useState(1);
  const [message, setMessage] = useState(STEP_CONTENT[0].text);
  const [isComplete, setIsComplete] = useState(false);

  const senses = useMemo(
    () => getSenses(playerPos, isWumpusAlive),
    [isWumpusAlive, playerPos],
  );

  const addExplored = (pos) => {
    setExploredTiles((prev) => {
      const key = toTileKey(pos);

      if (prev.some((tile) => toTileKey(tile) === key)) {
        return prev;
      }

      return [...prev, pos];
    });
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (isComplete) {
        return;
      }

      if (event.code === 'KeyE') {
        if (stepIndex === 2 && arrowsRemaining > 0 && isWumpusAlive) {
          event.preventDefault();
          setStepIndex(3);
          setIsAiming(true);
          setMessage(STEP_CONTENT[3].text);
          return;
        }

        if (stepIndex === 3 && arrowsRemaining > 0 && isWumpusAlive) {
          event.preventDefault();
          setIsAiming((prev) => !prev);
        }

        return;
      }

      const direction = KEY_TO_DIRECTION[event.code];

      if (!direction) {
        return;
      }

      event.preventDefault();

      if (isAiming) {
        if (
          stepIndex === 3 &&
          arrowsRemaining > 0 &&
          canHitWumpus(playerPos, direction)
        ) {
          setArrowsRemaining(0);
          setIsWumpusAlive(false);
          setIsAiming(false);
          setStepIndex(4);
          setMessage('The Wumpus is dead. Now find the gold.');
        }

        return;
      }

      const nextPos = getNextPosition(playerPos, direction);

      if (toTileKey(nextPos) === toTileKey(playerPos)) {
        return;
      }

      setPlayerPos(nextPos);
      addExplored(nextPos);

      const nextSenses = getSenses(nextPos, isWumpusAlive);

      if (stepIndex === 0 && direction === 'EAST' && toTileKey(nextPos) === '1,0') {
        setStepIndex(1);
        setMessage(STEP_CONTENT[1].text);
        return;
      }

      if (stepIndex === 1 && nextSenses.stench) {
        setStepIndex(2);
        setMessage(STEP_CONTENT[2].text);
        return;
      }

      if (stepIndex === 4 && toTileKey(nextPos) === toTileKey(GOLD_POS)) {
        setStepIndex(5);
        setIsComplete(true);
        setMessage(STEP_CONTENT[5].text);
        return;
      }

      if (stepIndex === 4 && nextSenses.shine) {
        setMessage(STEP_CONTENT[4].text);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [arrowsRemaining, isAiming, isComplete, isWumpusAlive, playerPos, stepIndex]);

  return (
    <>
      <Grid
        gridSize={GRID_SIZE}
        playerPos={playerPos}
        exploredTiles={exploredTiles}
        senses={senses}
        status={isComplete ? 'PlayerWon' : 'Ongoing'}
        pitTiles={PIT_TILES}
        goldPos={GOLD_POS}
        wumpusPos={isWumpusAlive ? WUMPUS_POS : null}
      />
      <aside className='app__right-panel'>
        <section className={`tutorial-panel ${isAiming ? 'tutorial-panel--aiming' : ''}`}>
          <p className='tutorial-panel__label'>Tutorial</p>
          <p className='tutorial-panel__message'>{message}</p>
          <p className='tutorial-panel__status'>
            Arrow: {arrowsRemaining > 0 ? 'Ready' : 'Spent'}
          </p>
          <p className='tutorial-panel__status'>
            Wumpus: {isWumpusAlive ? 'Alive' : 'Dead'}
          </p>

          <ol className='tutorial-panel__steps'>
            {STEP_CONTENT.map((step, index) => {
              const stepClassName =
                index === stepIndex
                  ? 'tutorial-step tutorial-step--active'
                  : index < stepIndex
                    ? 'tutorial-step tutorial-step--done'
                    : 'tutorial-step';

              return (
                <li key={step.title} className={stepClassName}>
                  <p className='tutorial-step__title'>{step.title}</p>
                </li>
              );
            })}
          </ol>

          {isComplete ? (
            <button type='button' className='btn-start' onClick={onComplete}>
              Start Game
            </button>
          ) : null}
        </section>
      </aside>
    </>
  );
}

TutorialMode.propTypes = {
  onComplete: PropTypes.func.isRequired,
};