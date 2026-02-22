from __future__ import annotations

from .entities import Position

MAX_SCENT: int = 3


class ScentMemorySystem:
    def __init__(self, size: int, wumpus_start: Position) -> None:
        self.size = size
        self.scent_grid: list[list[int]] = [[0 for _ in range(size)] for _ in range(size)]
        self.wumpus_visited: set[tuple[int, int]] = {(wumpus_start.x, wumpus_start.y)}
        self._pending_player_trail: Position | None = None

    def queue_player_trail(self, previous_pos: Position, current_pos: Position) -> None:
        if previous_pos != current_pos:
            self._pending_player_trail = previous_pos

    def update_scent(self) -> None:
        for y in range(self.size):
            for x in range(self.size):
                scent_value = self.scent_grid[y][x]
                if scent_value > 0:
                    self.scent_grid[y][x] = scent_value - 1

        if self._pending_player_trail is not None:
            trail_pos = self._pending_player_trail
            self.scent_grid[trail_pos.y][trail_pos.x] = MAX_SCENT
            self._pending_player_trail = None

    def record_wumpus_visit(self, position: Position) -> None:
        self.wumpus_visited.add((position.x, position.y))

    def _get_orthogonal_neighbors(self, pos: Position) -> list[Position]:
        candidates = [
            Position(x=pos.x, y=pos.y - 1),
            Position(x=pos.x, y=pos.y + 1),
            Position(x=pos.x + 1, y=pos.y),
            Position(x=pos.x - 1, y=pos.y),
        ]
        return [
            candidate
            for candidate in candidates
            if 0 <= candidate.x < self.size and 0 <= candidate.y < self.size
        ]

    def get_senses(
        self,
        pos: Position,
        pits: list[Position],
        wumpus_pos: Position,
        gold_pos: Position,
    ) -> dict[str, bool]:
        neighbors = self._get_orthogonal_neighbors(pos)
        return {
            "breeze": any(neighbor in pits for neighbor in neighbors),
            "stench": pos == wumpus_pos
            or any(neighbor == wumpus_pos for neighbor in neighbors),
            "shine": pos == gold_pos or any(neighbor == gold_pos for neighbor in neighbors),
        }