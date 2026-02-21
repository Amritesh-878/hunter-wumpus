from __future__ import annotations

import numpy as np
import pytest
from gymnasium import spaces

from engine.entities import Direction, Position
from rl.env import HunterWumpusEnv


def test_reset_returns_locked_observation_shape_and_dtype() -> None:
    env = HunterWumpusEnv(size=4, num_pits=1)
    obs, info = env.reset(seed=123)

    assert obs.shape == (9,)
    assert obs.dtype == np.float32
    assert info == {}
    assert env.observation_space.contains(obs)


def test_action_space_and_observation_space_are_locked() -> None:
    env = HunterWumpusEnv(size=4, num_pits=1)

    assert isinstance(env.action_space, spaces.Discrete)
    assert isinstance(env.observation_space, spaces.Box)
    assert env.action_space.n == 4
    assert env.observation_space.shape == (9,)


def test_wall_collision_applies_wall_and_step_penalty() -> None:
    env = HunterWumpusEnv(size=4, num_pits=0)
    env.reset(seed=0)
    env.engine.wumpus_pos = Position(x=0, y=0)
    env.engine.player_pos = Position(x=3, y=3)
    env.engine.pits = []
    env.engine.gold_pos = Position(x=3, y=2)

    _, reward, terminated, truncated, _ = env.step(0)

    assert reward == -6.0
    assert terminated is False
    assert truncated is False


def test_wumpus_catches_player_gives_terminal_positive_reward() -> None:
    env = HunterWumpusEnv(size=4, num_pits=0)
    env.reset(seed=0)
    env.engine.wumpus_pos = Position(x=0, y=0)
    env.engine.player_pos = Position(x=0, y=1)
    env.engine.pits = []
    env.engine.gold_pos = Position(x=3, y=3)

    _, reward, terminated, _, info = env.step(1)

    assert reward == 99.0
    assert terminated is True
    assert info["status"] == "PlayerLost_Wumpus"


def test_player_falls_in_pit_gives_positive_reward_to_wumpus(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    env = HunterWumpusEnv(size=4, num_pits=0)
    env.reset(seed=0)
    env.engine.wumpus_pos = Position(x=3, y=3)
    env.engine.player_pos = Position(x=0, y=0)
    env.engine.pits = [Position(x=0, y=1)]
    env.engine.gold_pos = Position(x=3, y=2)
    monkeypatch.setattr(env, "_sample_player_direction", lambda: Direction.SOUTH)

    _, reward, terminated, _, info = env.step(0)

    assert reward == 49.0
    assert terminated is True
    assert info["status"] == "PlayerLost_Pit"


def test_player_won_gives_terminal_negative_reward(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    env = HunterWumpusEnv(size=4, num_pits=0)
    env.reset(seed=0)
    env.engine.wumpus_pos = Position(x=3, y=3)
    env.engine.player_pos = Position(x=0, y=0)
    env.engine.pits = []
    env.engine.gold_pos = Position(x=0, y=1)
    monkeypatch.setattr(env, "_sample_player_direction", lambda: Direction.SOUTH)

    _, reward, terminated, _, info = env.step(0)

    assert reward == -101.0
    assert terminated is True
    assert info["status"] == "PlayerWon"
