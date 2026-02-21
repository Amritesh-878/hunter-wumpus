from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class Direction(Enum):
    NORTH = 0
    SOUTH = 1
    EAST = 2
    WEST = 3


class TileContent(Enum):
    EMPTY = "empty"
    PIT = "pit"
    GOLD = "gold"
    WUMPUS = "wumpus"
    PLAYER = "player"


@dataclass(frozen=True)
class Position:
    x: int
    y: int

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Position):
            return NotImplemented
        return self.x == other.x and self.y == other.y

    def __hash__(self) -> int:
        return hash((self.x, self.y))
