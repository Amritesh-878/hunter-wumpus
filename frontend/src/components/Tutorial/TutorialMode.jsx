import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import Grid from '../Grid';
import TutorialPopup from './TutorialPopup';
import breezeIcon from '../../assets/breeze.svg';
import goldIcon from '../../assets/gold.svg';
import pitIcon from '../../assets/pit.svg';
import shineIcon from '../../assets/shine.svg';
import stenchIcon from '../../assets/stench.svg';
import wumpusIcon from '../../assets/wumpus.svg';
import '../../styles/Tutorial.css';

const GRID_SIZE = 10;
const START_POS = [0, 0];

const PIT_TILES = [[3, 2], [6, 1], [8, 4], [2, 7], [7, 7]];
const WUMPUS_POS = [6, 5];
const GOLD_POS = [4, 8];

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

const POPUP_CONTENT = {
  welcome: {
    title: 'The Hunt Begins',
    body: 'Welcome to the dungeon, Hunter. Your goal is to find the gold hidden somewhere in these tunnels and escape alive. Standing between you and victory are bottomless pits — invisible cracks in the floor that will swallow you whole — and the Wumpus, a territorial predator that hunts by scent. You have one arrow. The dungeon does not forgive mistakes.',
    icon: null,
  },
  move: {
    title: 'Movement',
    body: 'Use WASD or the Arrow Keys to move one tile at a time in any direction. The dungeon is hidden — tiles only reveal themselves when you step on them. Explore carefully. Your starting tile is safe. What lies beyond it is unknown.',
    icon: null,
  },
  breeze: {
    title: 'You Feel a Cold Draft',
    body: 'A chill in the air. This means a bottomless pit lies in one of the four tiles directly adjacent to you — up, down, left, or right. Pits are completely invisible. The breeze is your only warning. Never step into an unexplored tile that borders a breeze unless you have ruled it out from a different angle. Cross-reference breezes from multiple positions to locate the pit exactly.',
    icon: breezeIcon,
  },
  stench: {
    title: 'Something Foul Lurks Nearby',
    body: 'A rancid stench fills the corridor. The Wumpus is in a tile directly adjacent to you. The Wumpus moves every turn in the real game — each time you move, it moves too, closing the gap. To survive, you must kill it first. You have one arrow. Press Space to enter Aim Mode, then press a direction key to fire your arrow down that entire corridor. The arrow travels the full length — if the Wumpus is anywhere in that line, it dies. Choose your shot carefully.',
    icon: stenchIcon,
  },
  wumpus_killed: {
    title: 'The Wumpus is Dead',
    body: "Your arrow cut through the dark and found its mark. The Wumpus is slain. The dungeon is quieter now. But the pits remain — watch for breezes. Your next goal is the gold. You'll sense a faint golden glimmer when you are near it. Follow the glimmer and step onto the gold tile to escape.",
    icon: wumpusIcon,
  },
  shine: {
    title: 'A Golden Glimmer',
    body: "You sense the unmistakable shimmer of gold. It's in a tile adjacent to you — or right beneath your feet. This is what you came here for. Step onto the gold tile to claim it and escape the dungeon.",
    icon: shineIcon,
  },
  complete: {
    title: 'You Survived',
    body: "You found the gold and made it out alive. You've learned to read the dungeon's warnings — the breezes that speak of pits, the stench that betrays the Wumpus, and the glimmer that marks your prize. In the real game, the Wumpus hunts you actively and there are no second chances. Trust your senses. Think before you step. Good luck, Hunter.",
    icon: goldIcon,
  },
  death_pit: {
    title: 'You Fell Into a Pit',
    body: 'There was no bottom. In the real game, this ends your run permanently. A cold breeze always precedes a pit — if you felt a draft, it was warning you. Before entering any unknown tile, check whether you have felt a breeze from adjacent explored tiles. Cross-reference multiple positions to narrow down where the pit actually is. You have been stepped back to your previous position.',
    icon: pitIcon,
  },
  death_wumpus: {
    title: 'The Wumpus Got You',
    body: 'It was over in an instant. In the real game, the Wumpus moves toward you every turn — it hunts by tracking your scent trail. The stench icon warns you when it is adjacent. When you smell something foul, do not advance blindly. Use Space to enter Aim Mode and fire your arrow in the direction of the stench before the Wumpus closes in. You have been stepped back to your previous position.',
    icon: wumpusIcon,
  },
};

const PHASE_MESSAGES = {
  exploring: 'Explore safely. Use clues before committing to unknown tiles.',
  aim: 'Press Space to enter Aim Mode, then fire with a direction key.',
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

  if (currentPhase === 'stench') {
    return 'aim';
  }

  return currentPhase;
}

export default function TutorialMode({ onComplete }) {
  const [playerPos, setPlayerPos] = useState([...START_POS]);
  const [prevPos, setPrevPos] = useState([...START_POS]);
  const [exploredTiles, setExploredTiles] = useState([[...START_POS]]);
  const [tutorialPhase, setTutorialPhase] = useState('welcome');
  const [phaseBeforeDeath, setPhaseBeforeDeath] = useState('exploring');
  const [isAiming, setIsAiming] = useState(false);
  const [isWumpusAlive, setIsWumpusAlive] = useState(true);
  const [turn, setTurn] = useState(0);
  const [message, setMessage] = useState('Dismiss the tutorial prompts to begin.');
  const [messageLog, setMessageLog] = useState([]);
  const [seenBreeze, setSeenBreeze] = useState(false);
  const [seenStench, setSeenStench] = useState(false);
  const [seenShine, setSeenShine] = useState(false);

  const onSkipTutorial = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const isPopupPhase = POPUP_PHASES.has(tutorialPhase);

  const senses = useMemo(
    () => getSenses(playerPos, isWumpusAlive),
    [isWumpusAlive, playerPos],
  );

  const popupContent = POPUP_CONTENT[tutorialPhase] ?? null;

  useEffect(() => {
    if (!message) {
      return;
    }

    setMessageLog((previousMessages) => {
      if (previousMessages[0] === message) {
        return previousMessages;
      }

      return [message, ...previousMessages].slice(0, 3);
    });
  }, [message]);

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
      setPlayerPos([...prevPos]);
      setIsAiming(false);
      setTutorialPhase(resolvePostDeathPhase(phaseBeforeDeath));
      setMessage('You were stepped back one tile. Continue carefully.');
    }
  };

  const addExplored = useCallback((nextPos) => {
    setExploredTiles((prev) => {
      const key = toTileKey(nextPos);

      if (prev.some((tile) => toTileKey(tile) === key)) {
        return prev;
      }

      return [...prev, nextPos];
    });
  }, []);

  const handleShoot = useCallback((direction) => {
    if (!isWumpusAlive) {
      setMessage('The Wumpus is already dead.');
      return;
    }

    setTurn((previousTurn) => previousTurn + 1);

    if (canHitWumpus(playerPos, direction)) {
      setIsWumpusAlive(false);
      setIsAiming(false);
      setTutorialPhase('wumpus_killed');
      return;
    }

    setMessage('Your arrow flies down the corridor and misses.');
  }, [isWumpusAlive, playerPos]);

  const handleMove = useCallback((direction) => {
    const nextPos = getNextPosition(playerPos, direction);

    if (isSameTile(nextPos, playerPos)) {
      return;
    }

    setPrevPos([...playerPos]);
    setPlayerPos(nextPos);
    addExplored(nextPos);
    setTurn((previousTurn) => previousTurn + 1);

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

    if (tutorialPhase === 'aim') {
      setMessage(PHASE_MESSAGES.aim);
      return;
    }

    setMessage(PHASE_MESSAGES.exploring);
  }, [addExplored, isWumpusAlive, playerPos, seenBreeze, seenShine, seenStench, tutorialPhase]);

  const toggleAimMode = useCallback(() => {
    setIsAiming((previousAiming) => {
      const nextAiming = !previousAiming;
      setMessage(
        nextAiming
          ? 'Aim mode on. Press a direction to fire.'
          : 'Aim mode off. Movement restored.',
      );
      return nextAiming;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (isPopupPhase) {
        return;
      }

      if (event.code === 'Space') {
        event.preventDefault();
        toggleAimMode();
        return;
      }

      const direction = KEY_TO_DIRECTION[event.code];

      if (!direction) {
        return;
      }

      event.preventDefault();

      if (isAiming) {
        handleShoot(direction);
        return;
      }

      handleMove(direction);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAiming, isPopupPhase, handleMove, handleShoot, toggleAimMode]);

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
          <p className='game-ui__label'>Dungeon Log</p>

          <button type='button' className='btn-start' onClick={onSkipTutorial}>
            Skip Tutorial
          </button>

          <div className='hud-row game-ui__turn-row'>
            <p className='game-ui__turn'>Turn #{turn}</p>
          </div>

          <div className='hud-row game-ui__arrow-row'>
            <span className='game-ui__arrow-label'>Arrow</span>
            <span className='game-ui__arrow-value hud-arrows--ready'>
              Unlimited (Tutorial)
            </span>
          </div>

          <button
            type='button'
            className={`btn-aim${isAiming ? ' btn-aim--active' : ''}`}
            onClick={toggleAimMode}
            disabled={isPopupPhase}
          >
            {isAiming ? 'AIM MODE — SHOOT WITH WASD' : 'Press Space to Aim'}
          </button>

          <section className='game-ui__log' aria-live='polite'>
            {messageLog.length > 0 ? (
              messageLog.map((entry, i) => (
                <p key={`${entry}-${i}`} className='game-ui__message'>
                  {entry}
                </p>
              ))
            ) : (
              <p className='game-ui__message game-ui__message--empty'>
                Awaiting signs in the dark...
              </p>
            )}
          </section>

          <div className='controls-legend'>
            <p className='controls-title'>Controls</p>
            <div className='controls-grid'>
              <kbd>W / A / S / D</kbd>
              <span>Move</span>
              <kbd>↑ / ↓ / ← / →</kbd>
              <span>Also move</span>
              <kbd>Space</kbd>
              <span>Aim / Cancel</span>
              <kbd>Aim + WASD</kbd>
              <span>Shoot</span>
              <kbd>Arrows</kbd>
              <span>Travel the full corridor</span>
            </div>
          </div>

          {tutorialPhase === 'complete' && (
            <button type='button' className='btn-start' onClick={onComplete}>
              Start Real Game →
            </button>
          )}
        </section>
      </aside>
      {popupContent && (
        <TutorialPopup
          title={popupContent.title}
          body={popupContent.body}
          onDismiss={handlePopupDismiss}
          dismissLabel={dismissLabel}
          icon={popupContent.icon}
        />
      )}
    </>
  );
}

TutorialMode.propTypes = {
  onComplete: PropTypes.func.isRequired,
};