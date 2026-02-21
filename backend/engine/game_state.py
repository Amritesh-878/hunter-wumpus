from __future__ import annotations

import random
from typing import Literal

from .entities import Direction, Position

GameStatus = Literal["Ongoing", "PlayerWon", "PlayerLost_Pit", "PlayerLost_Wumpus"]


class GameEngine:
    def __init__(self, size: int = 4, num_pits: int = 3) -> None:
        if size < 2:
            raise ValueError("size must be at least 2")
        if num_pits < 0:
            raise ValueError("num_pits must be >= 0")
        max_pits = (size * size) - 3
        if num_pits > max_pits:
            raise ValueError("num_pits is too large for the selected board size")

        self.size = size
        self.num_pits = num_pits
        self.player_pos: Position = Position(0, 0)
        self.wumpus_pos: Position = Position(0, 0)
        self.gold_pos: Position = Position(0, 0)
        self.pits: list[Position] = []
        self.status: GameStatus = "Ongoing"
        self._reset_board()

    def _all_non_start_positions(self) -> list[Position]:
        positions: list[Position] = []
        for y in range(self.size):
            for x in range(self.size):
                if x == 0 and y == 0:
                    continue
                positions.append(Position(x=x, y=y))
        return positions

    def _reset_board(self) -> None:
        self.player_pos = Position(0, 0)
        self.status = "Ongoing"

        available_positions = self._all_non_start_positions()
        selected_positions = random.sample(available_positions, 2 + self.num_pits)

        self.wumpus_pos = selected_positions[0]
        self.gold_pos = selected_positions[1]
        self.pits = selected_positions[2:]

    def _clamp_position(self, position: Position) -> Position:
        x = max(0, min(self.size - 1, position.x))
        y = max(0, min(self.size - 1, position.y))
        return Position(x=x, y=y)

    def _next_position(self, position: Position, direction: Direction) -> Position:
        if direction == Direction.NORTH:
            return self._clamp_position(Position(x=position.x, y=position.y - 1))
        if direction == Direction.SOUTH:
            return self._clamp_position(Position(x=position.x, y=position.y + 1))
        if direction == Direction.EAST:
            return self._clamp_position(Position(x=position.x + 1, y=position.y))
        return self._clamp_position(Position(x=position.x - 1, y=position.y))

    def move_player(self, direction: Direction) -> GameStatus:
        self.player_pos = self._next_position(self.player_pos, direction)
        return self.check_game_over()

    def move_wumpus(self, direction: Direction) -> None:
        self.wumpus_pos = self._next_position(self.wumpus_pos, direction)

    def check_game_over(self) -> GameStatus:
        if self.player_pos in self.pits:
            self.status = "PlayerLost_Pit"
            return self.status
        if self.player_pos == self.wumpus_pos:
            self.status = "PlayerLost_Wumpus"
            return self.status
        if self.player_pos == self.gold_pos:
            self.status = "PlayerWon"
            return self.status
        self.status = "Ongoing"
        return self.status
