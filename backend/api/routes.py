from __future__ import annotations

import random
import uuid
from dataclasses import dataclass, field

from fastapi import APIRouter, Depends, HTTPException

from api.auth import get_optional_user, update_user_profile
from api.schemas import ActionType, GameStateResponse, MoveRequest, SensesPayload, StartRequest
from api.telemetry import enqueue_stats
from engine.entities import Direction, Position
from engine.game_state import GameEngine
from rl import model_registry


@dataclass
class SessionState:
    engine: GameEngine
    turn: int = 0
    arrows_remaining: int = 1
    explored_tiles: list[tuple[int, int]] = field(default_factory=lambda: [(0, 0)])
    explored_set: set[tuple[int, int]] = field(default_factory=lambda: {(0, 0)})
    message: str = "The hunt begins. Find the gold. Survive."
    user_id: str | None = None
    pacing_interval: int = 1
    difficulty: str = "medium"


PACING_BY_DIFFICULTY: dict[str, int] = {
    "easy": 2,
}


router = APIRouter()
_sessions: dict[str, SessionState] = {}


def _to_pair(position: Position) -> tuple[int, int]:
    return (position.x, position.y)


def _add_explored(session: SessionState) -> None:
    player_pair = _to_pair(session.engine.player_pos)
    if player_pair not in session.explored_set:
        session.explored_set.add(player_pair)
        session.explored_tiles.append(player_pair)


def _status_message(status: str) -> str:
    if status == "PlayerWon":
        return "You found the gold and escaped. Victory."
    if status == "WumpusKilled":
        return "The Wumpus is dead. Silence fills the dungeon."
    if status == "PlayerLost_Pit":
        return "The ground gave way. There was no bottom."
    if status == "PlayerLost_Wumpus":
        return "The Wumpus found you in the dark."
    return ""


def _sense_message(senses: dict[str, bool | str | None]) -> str:
    stench = senses.get("stench_direction")
    if senses["breeze"] and stench == "ALL":
        return "You feel a draft, and the stench overwhelms from every direction."
    if senses["breeze"] and stench is not None:
        return f"You feel a draft, and the stench is stronger to the {stench}."
    if senses["breeze"]:
        return "You feel a cold draft. A pit may be nearby."
    if stench == "ALL":
        return "The stench overwhelms you from every direction."
    if stench is not None:
        return f"The stench is stronger to the {stench}."
    if senses["shine"]:
        return "A faint glimmer catches your eye."
    return ""


def _action_to_direction(action: ActionType) -> tuple[Direction, bool]:
    if action == "NORTH":
        return Direction.NORTH, False
    if action == "SOUTH":
        return Direction.SOUTH, False
    if action == "EAST":
        return Direction.EAST, False
    if action == "WEST":
        return Direction.WEST, False
    if action == "SHOOT_NORTH":
        return Direction.NORTH, True
    if action == "SHOOT_SOUTH":
        return Direction.SOUTH, True
    if action == "SHOOT_EAST":
        return Direction.EAST, True
    return Direction.WEST, True


def _direction_label(direction: Direction) -> str:
    if direction == Direction.NORTH:
        return "NORTH"
    if direction == Direction.SOUTH:
        return "SOUTH"
    if direction == Direction.EAST:
        return "EAST"
    return "WEST"


def _arrow_hits_wumpus(engine: GameEngine, direction: Direction) -> int | None:
    """Return index of first wumpus hit by an arrow, or None."""
    player = engine.player_pos
    for i, wumpus in enumerate(engine.wumpus_positions):
        hit = False
        if direction == Direction.NORTH:
            hit = player.x == wumpus.x and wumpus.y < player.y
        elif direction == Direction.SOUTH:
            hit = player.x == wumpus.x and wumpus.y > player.y
        elif direction == Direction.EAST:
            hit = player.y == wumpus.y and wumpus.x > player.x
        elif direction == Direction.WEST:
            hit = player.y == wumpus.y and wumpus.x < player.x
        if hit:
            return i
    return None


def _observation_state_for_wumpus(
    engine: GameEngine, wumpus_pos: Position,
) -> dict[str, object]:
    return {
        "grid_size": engine.size,
        "player_pos": [engine.player_pos.x, engine.player_pos.y],
        "wumpus_pos": [wumpus_pos.x, wumpus_pos.y],
        "scent_grid": [row[:] for row in engine.scent_grid],
    }


def _build_response(
    game_id: str,
    session: SessionState,
    senses_override: dict[str, bool | str | None] | None = None,
) -> GameStateResponse:
    senses = senses_override or session.engine.get_senses(session.engine.player_pos)
    return GameStateResponse(
        game_id=game_id,
        status=session.engine.status,
        grid_size=session.engine.size,
        difficulty=session.difficulty,
        turn=session.turn,
        player_pos=_to_pair(session.engine.player_pos),
        arrows_remaining=session.arrows_remaining,
        explored_tiles=session.explored_tiles,
        senses=SensesPayload(**senses),
        message=session.message,
        wumpuses_remaining=len(session.engine.wumpus_positions),
    )


def _require_session(game_id: str) -> SessionState:
    if game_id not in _sessions:
        raise HTTPException(status_code=404, detail="Game not found.")
    return _sessions[game_id]


def _maybe_update_profile(session: SessionState) -> None:
    if session.user_id is None:
        return
    won = session.engine.status in ("PlayerWon", "WumpusKilled")
    update_user_profile(session.user_id, "", won)


_ENTITY_COUNTS: dict[str, tuple[tuple[int, int], tuple[int, int]]] = {
    "impossible_i": ((1, 2), (3, 6)),
    "impossible_ii": ((2, 3), (4, 8)),
    "impossible_iii": ((3, 4), (6, 10)),
}


def _get_entity_counts(difficulty: str, grid_size: int) -> tuple[int, int]:
    """Return (wumpus_count, pit_count) for the given difficulty."""
    if difficulty in _ENTITY_COUNTS:
        (wmin, wmax), (pmin, pmax) = _ENTITY_COUNTS[difficulty]
        return random.randint(wmin, wmax), random.randint(pmin, pmax)
    # Easy/Medium/Hard: 1 wumpus, standard pit formula
    pit_count = max(2, min(8, int(grid_size * 0.2)))
    return 1, pit_count


def _fire_telemetry(session: SessionState) -> None:
    enqueue_stats(
        user_id=session.user_id,
        difficulty=session.difficulty,
        status=session.engine.status,
        turns=session.turn,
        arrows_used=1 if session.arrows_remaining == 0 else 0,
        player_x=session.engine.player_pos.x,
        player_y=session.engine.player_pos.y,
        wumpus_count=session.engine.num_wumpuses,
        pit_count=len(session.engine.pits),
    )


@router.post("/game/start", response_model=GameStateResponse)
async def start_game(
    request: StartRequest,
    user_id: str | None = Depends(get_optional_user),
) -> GameStateResponse:
    wumpus_count, pit_count = _get_entity_counts(request.difficulty, request.grid_size)
    engine = GameEngine(
        size=request.grid_size, num_pits=pit_count, num_wumpuses=wumpus_count,
    )
    game_id = str(uuid.uuid4())
    pacing = PACING_BY_DIFFICULTY.get(request.difficulty, 1)
    session = SessionState(
        engine=engine,
        user_id=user_id,
        difficulty=request.difficulty,
        pacing_interval=pacing,
    )
    _sessions[game_id] = session
    return _build_response(game_id, session)


@router.post("/game/move", response_model=GameStateResponse)
async def move(
    request: MoveRequest,
    user_id: str | None = Depends(get_optional_user),
) -> GameStateResponse:
    session = _require_session(request.game_id)
    if user_id is not None:
        session.user_id = user_id
    if session.engine.status != "Ongoing":
        raise HTTPException(status_code=400, detail="Game is already over.")

    direction, is_shoot = _action_to_direction(request.player_action)
    session.turn += 1
    pre_wumpus_senses: dict[str, bool | str | None] | None = None
    response_senses_override: dict[str, bool | str | None] | None = None

    if is_shoot:
        if session.arrows_remaining == 0:
            raise HTTPException(status_code=400, detail="No arrows remaining.")
        session.arrows_remaining = 0
        hit_index = _arrow_hits_wumpus(session.engine, direction)
        if hit_index is not None:
            session.engine.remove_wumpus(hit_index)
            if len(session.engine.wumpus_positions) == 0:
                session.engine.status = "WumpusKilled"
                session.message = "Your arrow finds its mark. The Wumpus is dead."
            else:
                session.message = (
                    "Your arrow strikes! A Wumpus falls, but others lurk in the dark."
                )
        else:
            session.engine.status = session.engine.check_game_over()
            session.message = (
                f"Your arrow flies {_direction_label(direction)} through "
                "the corridor but finds nothing."
            )
    else:
        session.engine.move_player(direction)
        _add_explored(session)
        session.engine.status = session.engine.check_game_over()
        session.message = _status_message(session.engine.status)
        if session.engine.status == "Ongoing":
            pre_wumpus_senses = session.engine.get_senses(session.engine.player_pos)

    if session.engine.status != "Ongoing":
        _maybe_update_profile(session)
        _fire_telemetry(session)
        return _build_response(request.game_id, session, response_senses_override)

    should_move_wumpus = session.turn % session.pacing_interval == 0
    if should_move_wumpus:
        agent = model_registry.load_model(session.difficulty)
        for i, wp in enumerate(session.engine.wumpus_positions):
            obs_state = _observation_state_for_wumpus(session.engine, wp)
            obs = agent.build_observation(obs_state)
            wumpus_action = agent.get_wumpus_action(obs)
            session.engine.move_wumpus(i, wumpus_action)
        session.engine.status = session.engine.check_game_over()
    session.engine._update_scent()

    if session.engine.status == "Ongoing":
        current_senses = session.engine.get_senses(session.engine.player_pos)
        if is_shoot:
            sense_message = _sense_message(current_senses)
            if sense_message:
                session.message = f"{session.message} {sense_message}"
        else:
            session.message = _sense_message(current_senses)
    else:
        if (
            session.engine.status == "PlayerLost_Wumpus"
            and pre_wumpus_senses is not None
            and pre_wumpus_senses["stench_direction"]
        ):
            session.message = "The stench was overwhelming — the Wumpus was upon you."
            response_senses_override = pre_wumpus_senses
        else:
            session.message = _status_message(session.engine.status)

    if session.engine.status != "Ongoing":
        _maybe_update_profile(session)
        _fire_telemetry(session)
    return _build_response(request.game_id, session, response_senses_override)


@router.get("/game/{game_id}/status", response_model=GameStateResponse)
def get_status(game_id: str) -> GameStateResponse:
    session = _require_session(game_id)
    return _build_response(game_id, session)
