from __future__ import annotations

import random
from typing import Literal

from .entities import Direction, Position
from .senses import ScentMemorySystem

GameStatus = Literal[
    "Ongoing",
    "PlayerWon",
    "WumpusKilled",
    "PlayerLost_Pit",
    "PlayerLost_Wumpus",
]


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
        self._scent_memory: ScentMemorySystem | None = None
        self._reset_board()

    def _all_non_start_positions(self) -> list[Position]:
        positions: list[Position] = []
        for y in range(self.size):
            for x in range(self.size):
                if x == 0 and y == 0:
                    continue
                positions.append(Position(x=x, y=y))
        return positions

    def _manhattan_distance(self, pos_a: Position, pos_b: Position) -> int:
        return abs(pos_a.x - pos_b.x) + abs(pos_a.y - pos_b.y)

    def _sample_with_distance_fallback(
        self,
        available_positions: list[Position],
        *,
        count: int,
        origin: Position,
        preferred_min_distance: int,
        fallback_min_distance: int,
    ) -> list[Position]:
        for min_distance in range(preferred_min_distance, fallback_min_distance - 1, -1):
            candidates = [
                position
                for position in available_positions
                if self._manhattan_distance(origin, position) >= min_distance
            ]
            if len(candidates) >= count:
                return random.sample(candidates, count)

        fallback_candidates = [
            position
            for position in available_positions
            if self._manhattan_distance(origin, position) >= fallback_min_distance
        ]
        if len(fallback_candidates) >= count:
            return random.sample(fallback_candidates, count)

        return random.sample(available_positions, count)

    def _reset_board(self) -> None:
        self.player_pos = Position(0, 0)
        self.status = "Ongoing"

        available_positions = self._all_non_start_positions()
        self.wumpus_pos = self._sample_with_distance_fallback(
            available_positions,
            count=1,
            origin=self.player_pos,
            preferred_min_distance=3,
            fallback_min_distance=2,
        )[0]
        available_positions.remove(self.wumpus_pos)

        self.gold_pos = self._sample_with_distance_fallback(
            available_positions,
            count=1,
            origin=self.player_pos,
            preferred_min_distance=2,
            fallback_min_distance=1,
        )[0]
        available_positions.remove(self.gold_pos)

        self.pits = self._sample_with_distance_fallback(
            available_positions,
            count=self.num_pits,
            origin=self.player_pos,
            preferred_min_distance=1,
            fallback_min_distance=1,
        )
        self._scent_memory = ScentMemorySystem(size=self.size, wumpus_start=self.wumpus_pos)

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
        previous_player_pos = self.player_pos
        self.player_pos = self._next_position(self.player_pos, direction)
        self._require_scent_memory().queue_player_trail(previous_player_pos, self.player_pos)
        return self.check_game_over()

    def move_wumpus(self, direction: Direction) -> None:
        self.wumpus_pos = self._next_position(self.wumpus_pos, direction)
        self._require_scent_memory().record_wumpus_visit(self.wumpus_pos)

    def _update_scent(self) -> None:
        self._require_scent_memory().update_scent()

    def get_senses(self, pos: Position) -> dict[str, bool]:
        return self._require_scent_memory().get_senses(
            pos=pos,
            pits=self.pits,
            wumpus_pos=self.wumpus_pos,
            gold_pos=self.gold_pos,
        )

    @property
    def scent_grid(self) -> list[list[int]]:
        return self._require_scent_memory().scent_grid

    @property
    def wumpus_visited(self) -> set[tuple[int, int]]:
        return self._require_scent_memory().wumpus_visited

    def _require_scent_memory(self) -> ScentMemorySystem:
        if self._scent_memory is None:
            raise RuntimeError("Scent memory system has not been initialized")
        return self._scent_memory

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
