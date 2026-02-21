from __future__ import annotations

from pathlib import Path
from typing import Any

import numpy as np
import pytest

from engine.entities import Direction
from rl.agent import WumpusAgent


class MockModel:
    def __init__(self, action: int) -> None:
        self.action = action
        self.calls: list[np.ndarray] = []

    def predict(
        self,
        observation: np.ndarray,
        deterministic: bool = True,
    ) -> tuple[np.ndarray, None]:
        assert deterministic is True
        self.calls.append(np.asarray(observation, dtype=np.float32))
        return np.array([self.action], dtype=np.int64), None


def _sample_game_state() -> dict[str, Any]:
    return {
        "grid_size": 4,
        "player_pos": [1, 2],
        "wumpus_pos": [2, 1],
        "scent_grid": [
            [0, 0, 1, 0],
            [0, 2, 3, 0],
            [0, 1, 2, 0],
            [0, 0, 0, 0],
        ],
    }


def test_build_observation_follows_locked_index_table(monkeypatch: Any) -> None:
    mock_model = MockModel(action=2)
    monkeypatch.setattr("rl.agent.PPO.load", lambda _: mock_model)

    agent = WumpusAgent(model_path="unused.zip")
    obs = agent.build_observation(_sample_game_state())

    expected = np.array(
        [
            2 / 3,
            1 / 3,
            1 / 3,
            2 / 3,
            1.0,
            1 / 3,
            0.0,
            2 / 3,
            2 / 3,
        ],
        dtype=np.float32,
    )
    np.testing.assert_allclose(obs, expected)


def test_get_wumpus_action_is_deterministic_for_same_obs(monkeypatch: Any) -> None:
    mock_model = MockModel(action=3)
    monkeypatch.setattr("rl.agent.PPO.load", lambda _: mock_model)

    agent = WumpusAgent(model_path="unused.zip")
    obs = np.zeros((9,), dtype=np.float32)

    first_action = agent.get_wumpus_action(obs)
    second_action = agent.get_wumpus_action(obs)

    assert first_action == Direction.WEST
    assert second_action == Direction.WEST
    assert len(mock_model.calls) == 2


def test_real_trained_model_loads_and_predicts_when_available() -> None:
    model_path = Path(__file__).resolve().parents[1] / "models" / "hunter_wumpus_model.zip"
    if not model_path.exists():
        pytest.skip(f"No trained model artifact at {model_path} (gitignored — run training first)")

    agent = WumpusAgent(model_path=model_path)
    action = agent.get_wumpus_action(np.zeros((9,), dtype=np.float32))

    assert action in {
        Direction.NORTH,
        Direction.SOUTH,
        Direction.EAST,
        Direction.WEST,
    }