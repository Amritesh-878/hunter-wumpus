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

GameStatus = Literal["Ongoing", "PlayerWon", "PlayerLost_Pit", "PlayerLost_Wumpus"]


class StartRequest(BaseModel):
    grid_size: int = Field(default=10, ge=4, le=16)


class MoveRequest(BaseModel):
    game_id: str
    player_action: ActionType


class SensesPayload(BaseModel):
    breeze: bool
    stench: bool
    shine: bool


class GameStateResponse(BaseModel):
    game_id: str
    status: GameStatus
    grid_size: int
    turn: int
    player_pos: tuple[int, int]
    arrows_remaining: int
    explored_tiles: list[tuple[int, int]]
    senses: SensesPayload
    message: str
