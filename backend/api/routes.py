from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from typing import Protocol

from fastapi import APIRouter, HTTPException

from api.schemas import ActionType, GameStateResponse, MoveRequest, SensesPayload, StartRequest
from engine.entities import Direction, Position
from engine.game_state import GameEngine
from rl.agent import RandomWumpusAgent, WumpusAgent


class WumpusPolicy(Protocol):
    def build_observation(self, game_state: dict[str, object]) -> object:
        ...

    def get_wumpus_action(self, obs: object) -> Direction:
        ...


@dataclass
class SessionState:
    engine: GameEngine
    turn: int = 0
    arrows_remaining: int = 1
    explored_tiles: list[tuple[int, int]] = field(default_factory=lambda: [(0, 0)])
    explored_set: set[tuple[int, int]] = field(default_factory=lambda: {(0, 0)})
    message: str = "The hunt begins. Find the gold. Survive."


router = APIRouter()
_sessions: dict[str, SessionState] = {}
_agent: WumpusPolicy | None = None


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


def _sense_message(senses: dict[str, bool]) -> str:
    if senses["breeze"] and senses["stench"]:
        return "You feel both a draft and a stench. Tread carefully."
    if senses["breeze"]:
        return "You feel a cold draft. A pit may be nearby."
    if senses["stench"]:
        return "Something foul is close. The Wumpus is near."
    if senses["shine"]:
        return "A faint glimmer catches your eye."
    return ""


def _get_agent() -> WumpusPolicy:
    global _agent
    # Retry loading the real model if currently using the fallback random agent.
    # This allows the trained model to be picked up after training completes
    # without requiring a server restart.
    if _agent is None or isinstance(_agent, RandomWumpusAgent):
        try:
            _agent = WumpusAgent()
        except FileNotFoundError:
            _agent = RandomWumpusAgent()
    return _agent


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


def _arrow_hits_wumpus(engine: GameEngine, direction: Direction) -> bool:
    player = engine.player_pos
    wumpus = engine.wumpus_pos
    if direction == Direction.NORTH:
        return player.x == wumpus.x and wumpus.y < player.y
    if direction == Direction.SOUTH:
        return player.x == wumpus.x and wumpus.y > player.y
    if direction == Direction.EAST:
        return player.y == wumpus.y and wumpus.x > player.x
    return player.y == wumpus.y and wumpus.x < player.x


def _observation_state(engine: GameEngine) -> dict[str, object]:
    return {
        "grid_size": engine.size,
        "player_pos": [engine.player_pos.x, engine.player_pos.y],
        "wumpus_pos": [engine.wumpus_pos.x, engine.wumpus_pos.y],
        "scent_grid": [row[:] for row in engine.scent_grid],
    }


def _build_response(
    game_id: str,
    session: SessionState,
    senses_override: dict[str, bool] | None = None,
) -> GameStateResponse:
    senses = senses_override or session.engine.get_senses(session.engine.player_pos)
    return GameStateResponse(
        game_id=game_id,
        status=session.engine.status,
        grid_size=session.engine.size,
        turn=session.turn,
        player_pos=_to_pair(session.engine.player_pos),
        arrows_remaining=session.arrows_remaining,
        explored_tiles=session.explored_tiles,
        senses=SensesPayload(**senses),
        message=session.message,
    )


def _require_session(game_id: str) -> SessionState:
    if game_id not in _sessions:
        raise HTTPException(status_code=404, detail="Game not found.")
    return _sessions[game_id]


@router.post("/game/start", response_model=GameStateResponse)
def start_game(request: StartRequest) -> GameStateResponse:
    pit_count = max(2, min(8, int(request.grid_size * 0.2)))
    engine = GameEngine(size=request.grid_size, num_pits=pit_count)
    game_id = str(uuid.uuid4())
    session = SessionState(engine=engine)
    _sessions[game_id] = session
    return _build_response(game_id, session)


@router.post("/game/move", response_model=GameStateResponse)
def move(request: MoveRequest) -> GameStateResponse:
    session = _require_session(request.game_id)
    if session.engine.status != "Ongoing":
        raise HTTPException(status_code=400, detail="Game is already over.")

    direction, is_shoot = _action_to_direction(request.player_action)
    session.turn += 1
    pre_wumpus_senses: dict[str, bool] | None = None
    response_senses_override: dict[str, bool] | None = None

    if is_shoot:
        if session.arrows_remaining == 0:
            raise HTTPException(status_code=400, detail="No arrows remaining.")
        session.arrows_remaining = 0
        if _arrow_hits_wumpus(session.engine, direction):
            session.engine.status = "WumpusKilled"
            session.message = "Your arrow finds its mark. The Wumpus is dead."
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
        return _build_response(request.game_id, session, response_senses_override)

    agent = _get_agent()
    obs = agent.build_observation(_observation_state(session.engine))
    wumpus_action = agent.get_wumpus_action(obs)
    session.engine.move_wumpus(wumpus_action)
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
            and pre_wumpus_senses["stench"]
        ):
            session.message = "The stench was overwhelming — the Wumpus was upon you."
            response_senses_override = pre_wumpus_senses
        else:
            session.message = _status_message(session.engine.status)

    return _build_response(request.game_id, session, response_senses_override)


@router.get("/game/{game_id}/status", response_model=GameStateResponse)
def get_status(game_id: str) -> GameStateResponse:
    session = _require_session(game_id)
    return _build_response(game_id, session)
