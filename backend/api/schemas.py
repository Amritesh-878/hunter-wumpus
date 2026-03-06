from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

ActionType = Literal[
    "NORTH",
    "SOUTH",
    "EAST",
    "WEST",
    "SHOOT_NORTH",
    "SHOOT_SOUTH",
    "SHOOT_EAST",
    "SHOOT_WEST",
]

GameStatus = Literal[
    "Ongoing",
    "PlayerWon",
    "WumpusKilled",
    "PlayerLost_Pit",
    "PlayerLost_Wumpus",
]


DifficultyType = Literal[
    "easy",
    "medium",
    "hard",
    "impossible_i",
    "impossible_ii",
    "impossible_iii",
]


class StartRequest(BaseModel):
    grid_size: int = Field(default=10, ge=4, le=16)
    difficulty: DifficultyType = "medium"


class MoveRequest(BaseModel):
    game_id: str
    player_action: ActionType


class SensesPayload(BaseModel):
    breeze: bool
    stench_direction: str | None = None
    shine: bool


class GameStateResponse(BaseModel):
    game_id: str
    status: GameStatus
    grid_size: int
    difficulty: str
    turn: int
    player_pos: tuple[int, int]
    arrows_remaining: int
    explored_tiles: list[tuple[int, int]]
    senses: SensesPayload
    message: str
