import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import Grid from '../Grid';
import TutorialPopup from './TutorialPopup';
import '../../styles/Tutorial.css';

const GRID_SIZE = 4;
const START_POS = [0, 0];

// Tutorial fixed layout:
// Player start: [0,0], Pit: [2,1], Wumpus: [2,2], Gold: [0,3].
const PIT_TILES = [[2, 1]];
const WUMPUS_POS = [2, 2];
const GOLD_POS = [0, 3];

const POPUP_PHASES = new Set([
  'welcome',
  'move',
  'breeze',
  'stench',
  'wumpus_killed',
  'shine',
  'complete',
  'death_pit',
  'death_wumpus',
]);

const AIM_ALLOWED_PHASES = new Set(['aim', 'find_gold', 'shine']);

const POPUP_CONTENT = {
  welcome: {
    title: 'The Hunt Begins',
    body: 'Your goal is to find the gold hidden somewhere in this dungeon and escape alive. Danger lurks in every corridor — bottomless pits are scattered across the floor, invisible until you fall in. The Wumpus, a predatory creature, moves through the tunnels hunting you. You carry one arrow. Use it wisely.',
  },
  move: {
    title: 'How to Move',
    body: 'Use WASD or the Arrow Keys to move in any direction. You can only see tiles you have already stepped on — the dungeon reveals itself as you explore. Your starting position is the only safe tile you are guaranteed.',
  },
  breeze: {
    title: 'A Cold Draft',
    body: 'You feel a cold breeze. One of the tiles directly adjacent to you (up, down, left, or right) contains a bottomless pit. Pits are invisible — the breeze is your only warning. Do not enter a tile that is adjacent to a breeze unless you have confirmed it from multiple angles.',
  },
  stench: {
    title: 'Something Foul',
    body: 'A rancid stench fills the air. The Wumpus is in a tile directly adjacent to you. The Wumpus moves each turn to hunt you. You can kill it with your single arrow. Press E to enter Aim Mode, then press a direction key to fire your arrow down that entire corridor. If the Wumpus is anywhere in that corridor — it dies.',
  },
  wumpus_killed: {
    title: 'The Wumpus is Dead',
    body: "Your arrow flew true. The Wumpus's hunt is over. The dungeon is quieter now — but the pits remain. Find the gold and escape. You will feel a faint golden glimmer when you are near it.",
  },
  shine: {
    title: 'A Golden Glimmer',
    body: 'You sense the faint glow of gold nearby. The treasure is in an adjacent tile — or beneath your feet. Step onto it to claim it and escape the dungeon.',
  },
  complete: {
    title: 'You Survived',
    body: 'You found the gold and made it out. You now know how the dungeon works — the breezes, the stench, the arrow. In the real game the Wumpus moves and the stakes are final. Good luck, Hunter.',
  },
  death_pit: {
    title: 'You Fell',
    body: 'You stepped into a bottomless pit. In the real game, this ends your run instantly. Remember: a breeze means a pit is in an adjacent tile. Never step blindly into an unexplored tile when you have felt a breeze. You have been returned to the start.',
  },
  death_wumpus: {
    title: 'The Wumpus Got You',
    body: 'You walked directly into the Wumpus. In the real game, the Wumpus hunts you — it moves toward you each turn. The stench warns you when it is adjacent. Use your arrow (E + direction) to kill it before it catches you. You have been returned to the start.',
  },
};

const PHASE_MESSAGES = {
  exploring: 'Explore safely. Use clues before committing to unknown tiles.',
  aim: 'Press E to enter aim mode, then fire with a direction key.',
  find_gold: 'The Wumpus is down. Keep hunting for the gold.',
  shine: 'Gold is close. Step carefully and claim it.',
};

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

function toTileKey([x, y]) {
  return `${x},${y}`;
}

function isSameTile(a, b) {
  return a[0] === b[0] && a[1] === b[1];
}

function isAdjacent(a, b) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;
}

function getSenses(playerPos, isWumpusAlive) {
  return {
    breeze: PIT_TILES.some((pit) => isAdjacent(playerPos, pit)),
    stench: isWumpusAlive && isAdjacent(playerPos, WUMPUS_POS),
    shine: isAdjacent(playerPos, GOLD_POS) || isSameTile(playerPos, GOLD_POS),
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

function resolvePostDeathPhase(currentPhase) {
  if (currentPhase === 'welcome' || currentPhase === 'move') {
    return 'exploring';
  }

  return currentPhase;
}

export default function TutorialMode({ onComplete }) {
  const [playerPos, setPlayerPos] = useState([0, 0]);
  const [exploredTiles, setExploredTiles] = useState([[0, 0]]);
  const [tutorialPhase, setTutorialPhase] = useState('welcome');
  const [phaseBeforeDeath, setPhaseBeforeDeath] = useState('exploring');
  const [isAiming, setIsAiming] = useState(false);
  const [isWumpusAlive, setIsWumpusAlive] = useState(true);
  const [message, setMessage] = useState('Dismiss the tutorial prompts to begin.');
  const [seenBreeze, setSeenBreeze] = useState(false);
  const [seenStench, setSeenStench] = useState(false);
  const [seenShine, setSeenShine] = useState(false);

  const arrowsRemaining = 1;
  const isPopupPhase = POPUP_PHASES.has(tutorialPhase);

  const senses = useMemo(
    () => getSenses(playerPos, isWumpusAlive),
    [isWumpusAlive, playerPos],
  );

  const popupContent = POPUP_CONTENT[tutorialPhase] ?? null;

  const dismissLabel =
    tutorialPhase === 'complete'
      ? 'Start Real Game →'
      : tutorialPhase === 'death_pit' || tutorialPhase === 'death_wumpus'
        ? 'Try Again →'
        : 'Got it →';

  const handlePopupDismiss = () => {
    if (tutorialPhase === 'welcome') {
      setTutorialPhase('move');
      return;
    }

    if (tutorialPhase === 'move') {
      setTutorialPhase('exploring');
      setMessage(PHASE_MESSAGES.exploring);
      return;
    }

    if (tutorialPhase === 'breeze') {
      setTutorialPhase('exploring');
      setMessage(PHASE_MESSAGES.exploring);
      return;
    }

    if (tutorialPhase === 'stench') {
      setTutorialPhase('aim');
      setMessage(PHASE_MESSAGES.aim);
      return;
    }

    if (tutorialPhase === 'wumpus_killed') {
      setTutorialPhase('find_gold');
      setMessage(PHASE_MESSAGES.find_gold);
      return;
    }

    if (tutorialPhase === 'shine') {
      setTutorialPhase('find_gold');
      setMessage(PHASE_MESSAGES.shine);
      return;
    }

    if (tutorialPhase === 'complete') {
      onComplete();
      return;
    }

    if (tutorialPhase === 'death_pit' || tutorialPhase === 'death_wumpus') {
      setPlayerPos([...START_POS]);
      setExploredTiles([[...START_POS]]);
      setIsAiming(false);
      setTutorialPhase(resolvePostDeathPhase(phaseBeforeDeath));
      setMessage('You are back at the start. Continue the tutorial.');
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (isPopupPhase) {
        return;
      }

      if (event.code === 'KeyE') {
        if (isWumpusAlive && AIM_ALLOWED_PHASES.has(tutorialPhase)) {
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
        if (isWumpusAlive && canHitWumpus(playerPos, direction)) {
          setIsWumpusAlive(false);
          setIsAiming(false);
          setTutorialPhase('wumpus_killed');
          return;
        }

        setMessage('Your arrow flies into the dark...');
        return;
      }

      const nextPos = getNextPosition(playerPos, direction);

      if (isSameTile(nextPos, playerPos)) {
        return;
      }

      setPlayerPos(nextPos);
      setExploredTiles((prev) => {
        const key = toTileKey(nextPos);

        if (prev.some((tile) => toTileKey(tile) === key)) {
          return prev;
        }

        return [...prev, nextPos];
      });

      if (PIT_TILES.some((pit) => isSameTile(pit, nextPos))) {
        setPhaseBeforeDeath(tutorialPhase);
        setTutorialPhase('death_pit');
        return;
      }

      if (isWumpusAlive && isSameTile(nextPos, WUMPUS_POS)) {
        setPhaseBeforeDeath(tutorialPhase);
        setTutorialPhase('death_wumpus');
        return;
      }

      if (isSameTile(nextPos, GOLD_POS)) {
        setTutorialPhase('complete');
        return;
      }

      const nextSenses = getSenses(nextPos, isWumpusAlive);

      if (!seenBreeze && nextSenses.breeze) {
        setSeenBreeze(true);
        setTutorialPhase('breeze');
        return;
      }

      if (seenBreeze && !seenStench && nextSenses.stench) {
        setSeenStench(true);
        setTutorialPhase('stench');
        return;
      }

      if (!seenShine && nextSenses.shine) {
        setSeenShine(true);
        setTutorialPhase('shine');
        return;
      }

      if (nextSenses.stench && isWumpusAlive) {
        setMessage('You smell the Wumpus nearby.');
        return;
      }

      if (nextSenses.breeze) {
        setMessage('You feel a cold breeze.');
        return;
      }

      if (nextSenses.shine) {
        setMessage('A golden glimmer is nearby.');
        return;
      }

      setMessage(PHASE_MESSAGES.exploring);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isAiming,
    isPopupPhase,
    isWumpusAlive,
    playerPos,
    seenBreeze,
    seenShine,
    seenStench,
    tutorialPhase,
  ]);

  const gridStatus =
    tutorialPhase === 'death_pit'
      ? 'PlayerLost_Pit'
      : tutorialPhase === 'death_wumpus'
        ? 'PlayerLost_Wumpus'
        : tutorialPhase === 'complete'
          ? 'PlayerWon'
          : 'Ongoing';

  const gridWumpusPos = isWumpusAlive ? WUMPUS_POS : null;

  return (
    <>
      <Grid
        gridSize={GRID_SIZE}
        playerPos={playerPos}
        exploredTiles={exploredTiles}
        senses={senses}
        status={gridStatus}
        pitTiles={PIT_TILES}
        goldPos={GOLD_POS}
        wumpusPos={gridWumpusPos}
      />
      <aside className='app__right-panel'>
        <section className={`game-ui${isAiming ? ' ui--aiming' : ''}`}>
          <p className='game-ui__label'>Tutorial</p>
          {isAiming ? <p className='game-ui__aim-warning'>— AIM MODE —</p> : null}
          <div className='hud-row game-ui__arrow-row'>
            <span className='game-ui__arrow-label'>Arrow</span>
            <span
              className={`game-ui__arrow-value ${
                arrowsRemaining > 0 ? 'hud-arrows--ready' : 'hud-arrows--spent'
              }`}
            >
              {arrowsRemaining > 0 ? '1 Arrow' : 'No Arrows'}
            </span>
          </div>
          <div className='hud-row game-ui__arrow-row'>
            <span className='game-ui__arrow-label'>Wumpus</span>
            <span
              className={`game-ui__arrow-value ${
                isWumpusAlive ? 'hud-arrows--ready' : 'hud-arrows--spent'
              }`}
            >
              {isWumpusAlive ? 'Alive' : 'Dead'}
            </span>
          </div>
          <div className='game-ui__log'>
            <p className='game-ui__message'>{message}</p>
          </div>
          {tutorialPhase === 'complete' ? (
            <button type='button' className='btn-start' onClick={onComplete}>
              Start Real Game →
            </button>
          ) : null}
        </section>
      </aside>
      {popupContent ? (
        <TutorialPopup
          title={popupContent.title}
          body={popupContent.body}
          onDismiss={handlePopupDismiss}
          dismissLabel={dismissLabel}
        />
      ) : null}
    </>
  );
}

TutorialMode.propTypes = {
  onComplete: PropTypes.func.isRequired,
};