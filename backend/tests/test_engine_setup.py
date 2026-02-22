from __future__ import annotations

from collections.abc import Generator

import pytest

from engine.game_state import GameEngine


def _manhattan_distance(x: int, y: int) -> int:
    return abs(x) + abs(y)


@pytest.fixture
def engine() -> Generator[GameEngine, None, None]:
    yield GameEngine(size=4, num_pits=3)


def test_safe_spawn() -> None:
    for _ in range(100):
        game_engine = GameEngine(size=4, num_pits=3)
        assert game_engine.wumpus_pos != game_engine.player_pos
        assert game_engine.gold_pos != game_engine.player_pos
        assert game_engine.player_pos not in game_engine.pits
        assert _manhattan_distance(game_engine.wumpus_pos.x, game_engine.wumpus_pos.y) >= 3
        assert _manhattan_distance(game_engine.gold_pos.x, game_engine.gold_pos.y) >= 2


def test_wumpus_spawn_distance_fallback_for_tiny_grid() -> None:
    for _ in range(100):
        game_engine = GameEngine(size=2, num_pits=0)
        assert _manhattan_distance(game_engine.wumpus_pos.x, game_engine.wumpus_pos.y) >= 2


def test_entity_counts(engine: GameEngine) -> None:
    assert engine.player_pos.x == 0 and engine.player_pos.y == 0
    assert isinstance(engine.wumpus_pos, type(engine.player_pos))
    assert isinstance(engine.gold_pos, type(engine.player_pos))
    assert len(engine.pits) == engine.num_pits


def test_no_entity_overlap(engine: GameEngine) -> None:
    occupied_tiles = {engine.player_pos, engine.wumpus_pos, engine.gold_pos, *engine.pits}
    expected_count = 3 + engine.num_pits
    assert len(occupied_tiles) == expected_count
