from __future__ import annotations

import logging
from pathlib import Path
from typing import Union

from stable_baselines3 import PPO

from rl.agent import RandomWumpusAgent, WumpusAgent

logger = logging.getLogger(__name__)

_MODELS_DIR = Path(__file__).resolve().parents[1] / "models"

DIFFICULTY_MODELS: dict[str, str] = {
    "easy": "easy.zip",
    "medium": "medium.zip",
    "hard": "hard.zip",
    "impossible_i": "impossible.zip",
    "impossible_ii": "impossible.zip",
    "impossible_iii": "impossible.zip",
}

WumpusPolicy = Union[WumpusAgent, RandomWumpusAgent]

_cache: dict[str, WumpusPolicy] = {}


def load_model(difficulty: str) -> WumpusPolicy:
    """Load (or return cached) agent for the given difficulty tier."""
    if difficulty in _cache:
        return _cache[difficulty]

    filename = DIFFICULTY_MODELS.get(difficulty)
    if filename is None:
        logger.warning("Unknown difficulty %r, falling back to random agent", difficulty)
        agent: WumpusPolicy = RandomWumpusAgent()
        _cache[difficulty] = agent
        return agent

    model_path = _MODELS_DIR / filename
    if not model_path.exists():
        logger.warning("Model file %s not found, using random agent", model_path)
        agent = RandomWumpusAgent()
        _cache[difficulty] = agent
        return agent

    ppo = PPO.load(str(model_path))
    agent = WumpusAgent(model=ppo)
    _cache[difficulty] = agent
    return agent


def clear_cache() -> None:
    """Clear the model cache (useful for testing)."""
    _cache.clear()
