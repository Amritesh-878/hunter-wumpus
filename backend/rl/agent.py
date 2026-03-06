from __future__ import annotations

import random
from typing import Any, Protocol

import numpy as np
import numpy.typing as npt

from engine.entities import Direction, Position
from engine.senses import MAX_SCENT


class PredictableModel(Protocol):
    def predict(
        self, observation: npt.NDArray[np.float32], deterministic: bool = True
    ) -> tuple[Any, Any]: ...


class RandomWumpusAgent:
    """Fallback agent used when the trained model file is not available."""

    def build_observation(self, game_state: dict[str, Any]) -> npt.NDArray[np.float32]:
        return np.zeros(9, dtype=np.float32)

    def get_wumpus_action(self, obs: npt.NDArray[np.float32]) -> Direction:
        return random.choice(list(Direction))


class WumpusAgent:
    def __init__(self, model: PredictableModel) -> None:
        self.model = model

    def get_wumpus_action(self, obs: npt.NDArray[np.float32]) -> Direction:
        normalized_obs = np.asarray(obs, dtype=np.float32).reshape((9,))
        action, _ = self.model.predict(normalized_obs, deterministic=True)
        action_value = int(np.asarray(action, dtype=np.int64).item())
        return Direction(action_value)

    def decide_from_state(self, game_state: dict[str, Any]) -> Direction:
        observation = self.build_observation(game_state)
        return self.get_wumpus_action(observation)

    def build_observation(self, game_state: dict[str, Any]) -> npt.NDArray[np.float32]:
        grid_size = int(game_state["grid_size"])
        denom = float(max(1, grid_size - 1))

        wumpus_x, wumpus_y = self._pair_to_position(game_state["wumpus_pos"])
        player_x, player_y = self._pair_to_position(game_state["player_pos"])
        scent_grid_raw = game_state["scent_grid"]
        scent_grid = [[int(value) for value in row] for row in scent_grid_raw]

        wumpus = Position(x=wumpus_x, y=wumpus_y)
        obs: npt.NDArray[np.float32] = np.array(
            [
                wumpus.x / denom,
                wumpus.y / denom,
                player_x / denom,
                player_y / denom,
                self._scent_at(scent_grid, grid_size, wumpus),
                self._scent_at(scent_grid, grid_size, Position(x=wumpus.x, y=wumpus.y - 1)),
                self._scent_at(scent_grid, grid_size, Position(x=wumpus.x + 1, y=wumpus.y)),
                self._scent_at(scent_grid, grid_size, Position(x=wumpus.x, y=wumpus.y + 1)),
                self._scent_at(scent_grid, grid_size, Position(x=wumpus.x - 1, y=wumpus.y)),
            ],
            dtype=np.float32,
        )
        return obs

    def _scent_at(self, scent_grid: list[list[int]], grid_size: int, position: Position) -> float:
        if position.x < 0 or position.x >= grid_size or position.y < 0 or position.y >= grid_size:
            return 0.0
        scent_value = scent_grid[position.y][position.x]
        return float(scent_value) / float(MAX_SCENT)

    def _pair_to_position(self, pair: Any) -> tuple[int, int]:
        if not isinstance(pair, (list, tuple)) or len(pair) != 2:
            raise ValueError("Expected [x, y] pair")
        return int(pair[0]), int(pair[1])