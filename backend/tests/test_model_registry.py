from __future__ import annotations

from typing import Any
from unittest.mock import MagicMock, patch

import numpy as np

from engine.entities import Direction
from rl.agent import RandomWumpusAgent, WumpusAgent
from rl.model_registry import DIFFICULTY_MODELS, clear_cache, load_model


def _make_mock_ppo() -> MagicMock:
    mock = MagicMock()
    mock.predict.return_value = (np.array([0], dtype=np.int64), None)
    return mock


def test_all_difficulty_strings_are_mapped() -> None:
    expected = {"easy", "medium", "hard", "impossible_i", "impossible_ii", "impossible_iii"}
    assert set(DIFFICULTY_MODELS.keys()) == expected


def test_load_model_returns_random_agent_when_file_missing() -> None:
    clear_cache()
    agent = load_model("easy")
    assert isinstance(agent, RandomWumpusAgent)


def test_load_model_caches_result() -> None:
    clear_cache()
    first = load_model("medium")
    second = load_model("medium")
    assert first is second


def test_load_model_loads_ppo_when_file_exists(tmp_path: Any) -> None:
    clear_cache()
    mock_ppo = _make_mock_ppo()

    with patch("rl.model_registry._MODELS_DIR", tmp_path):
        fake_zip = tmp_path / "easy.zip"
        fake_zip.write_text("fake")

        with patch("rl.model_registry.PPO.load", return_value=mock_ppo):
            agent = load_model("easy")

    assert isinstance(agent, WumpusAgent)
    obs = np.zeros(9, dtype=np.float32)
    action = agent.get_wumpus_action(obs)
    assert action == Direction.NORTH


def test_load_model_unknown_difficulty_returns_random() -> None:
    clear_cache()
    agent = load_model("nonexistent")
    assert isinstance(agent, RandomWumpusAgent)


def test_clear_cache_resets_state() -> None:
    clear_cache()
    _ = load_model("easy")
    clear_cache()
    # After clearing, a new instance should be created
    agent = load_model("easy")
    assert isinstance(agent, RandomWumpusAgent)
