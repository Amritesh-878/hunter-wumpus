from __future__ import annotations

import random
from typing import Any, ClassVar

import gymnasium as gym
import numpy as np
import numpy.typing as npt
from gymnasium import spaces

from engine.entities import Direction, Position
from engine.game_state import GameEngine
from engine.senses import MAX_SCENT


class HunterWumpusEnv(gym.Env):
    metadata: ClassVar[dict[str, list[str]]] = {"render_modes": []}

    def __init__(self, size: int = 4, num_pits: int = 3, max_steps: int = 200) -> None:
        super().__init__()
        self.size = size
        self.num_pits = num_pits
        self.max_steps = max_steps
        self.step_count = 0
        self.engine = GameEngine(size=self.size, num_pits=self.num_pits)

        self.action_space = spaces.Discrete(4)
        self.observation_space = spaces.Box(
            low=0.0,
            high=1.0,
            shape=(9,),
            dtype=np.float32,
        )

    def reset(
        self,
        *,
        seed: int | None = None,
        options: dict[str, Any] | None = None,
    ) -> tuple[npt.NDArray[np.float32], dict[str, Any]]:
        del options
        super().reset(seed=seed)
        if seed is not None:
            random.seed(seed)
        self.engine = GameEngine(size=self.size, num_pits=self.num_pits)
        self.step_count = 0
        return self._get_obs(), {}

    def step(
        self,
        action: int,
    ) -> tuple[npt.NDArray[np.float32], float, bool, bool, dict[str, Any]]:
        self.step_count += 1

        direction = self._action_to_direction(action)
        wumpus_before = self.engine.wumpus_pos
        self.engine.move_wumpus(direction)
        wumpus_after = self.engine.wumpus_pos

        status_after_wumpus = self.engine.check_game_over()
        terminated = status_after_wumpus != "Ongoing"

        player_status = status_after_wumpus
        if not terminated:
            player_direction = self._sample_player_direction()
            player_status = self.engine.move_player(player_direction)
            terminated = player_status != "Ongoing"

        reward = self._compute_reward(
            status=player_status,
            wumpus_before=wumpus_before,
            wumpus_after=wumpus_after,
        )

        self.engine._update_scent()

        truncated = self.step_count >= self.max_steps and not terminated
        info: dict[str, Any] = {"status": self.engine.status, "step_count": self.step_count}
        return self._get_obs(), reward, terminated, truncated, info

    def render(self) -> None:
        pass

    def _action_to_direction(self, action: int) -> Direction:
        action_value = int(action)
        mapping = {
            0: Direction.NORTH,
            1: Direction.SOUTH,
            2: Direction.EAST,
            3: Direction.WEST,
        }
        if action_value not in mapping:
            raise ValueError(f"Invalid action: {action}")
        return mapping[action_value]

    def _sample_player_direction(self) -> Direction:
        sampled = int(self.np_random.integers(0, 4))
        return self._action_to_direction(sampled)

    def _get_obs(self) -> npt.NDArray[np.float32]:
        denom = float(max(1, self.size - 1))
        wumpus = self.engine.wumpus_pos
        player = self.engine.player_pos

        obs: npt.NDArray[np.float32] = np.array(
            [
                wumpus.x / denom,
                wumpus.y / denom,
                player.x / denom,
                player.y / denom,
                self._scent_at(wumpus),
                self._scent_at(Position(x=wumpus.x, y=wumpus.y - 1)),
                self._scent_at(Position(x=wumpus.x + 1, y=wumpus.y)),
                self._scent_at(Position(x=wumpus.x, y=wumpus.y + 1)),
                self._scent_at(Position(x=wumpus.x - 1, y=wumpus.y)),
            ],
            dtype=np.float32,
        )
        return obs

    def _scent_at(self, pos: Position) -> float:
        if pos.x < 0 or pos.x >= self.size or pos.y < 0 or pos.y >= self.size:
            return 0.0
        return float(self.engine.scent_grid[pos.y][pos.x]) / float(MAX_SCENT)

    def _compute_reward(
        self,
        status: str,
        wumpus_before: Position,
        wumpus_after: Position,
    ) -> float:
        reward = -1.0

        if wumpus_before == wumpus_after:
            reward -= 5.0

        if self._scent_at(wumpus_after) > 0.0:
            reward += 2.0

        if status == "PlayerLost_Wumpus":
            reward += 100.0
        elif status == "PlayerLost_Pit":
            reward += 50.0
        elif status == "PlayerWon":
            reward -= 100.0

        return reward
