from __future__ import annotations

import pytest

from engine.entities import Position
from engine.game_state import GameEngine


@pytest.fixture()
def engine() -> GameEngine:
    eng = GameEngine(size=10, num_pits=0)
    eng.pits = []
    eng.gold_pos = Position(x=9, y=9)
    return eng


def test_stench_direction_north(engine: GameEngine) -> None:
    engine.wumpus_pos = Position(x=3, y=2)
    senses = engine.get_senses(Position(x=3, y=3))
    assert senses["stench_direction"] == "NORTH"


def test_stench_direction_south(engine: GameEngine) -> None:
    engine.wumpus_pos = Position(x=3, y=4)
    senses = engine.get_senses(Position(x=3, y=3))
    assert senses["stench_direction"] == "SOUTH"


def test_stench_direction_east(engine: GameEngine) -> None:
    engine.wumpus_pos = Position(x=4, y=3)
    senses = engine.get_senses(Position(x=3, y=3))
    assert senses["stench_direction"] == "EAST"


def test_stench_direction_west(engine: GameEngine) -> None:
    engine.wumpus_pos = Position(x=2, y=3)
    senses = engine.get_senses(Position(x=3, y=3))
    assert senses["stench_direction"] == "WEST"


def test_stench_direction_all_when_on_same_tile(engine: GameEngine) -> None:
    engine.wumpus_pos = Position(x=3, y=3)
    senses = engine.get_senses(Position(x=3, y=3))
    assert senses["stench_direction"] == "ALL"


def test_stench_direction_none_when_not_adjacent(engine: GameEngine) -> None:
    engine.wumpus_pos = Position(x=5, y=5)
    senses = engine.get_senses(Position(x=0, y=0))
    assert senses["stench_direction"] is None


def test_stench_direction_none_diagonal(engine: GameEngine) -> None:
    engine.wumpus_pos = Position(x=4, y=4)
    senses = engine.get_senses(Position(x=3, y=3))
    assert senses["stench_direction"] is None


def test_breeze_and_shine_unchanged(engine: GameEngine) -> None:
    engine.wumpus_pos = Position(x=5, y=5)
    engine.pits = [Position(x=1, y=0)]
    engine.gold_pos = Position(x=0, y=1)
    senses = engine.get_senses(Position(x=0, y=0))
    assert senses["breeze"] is True
    assert senses["shine"] is True
    assert senses["stench_direction"] is None


def test_stench_direction_at_grid_edge(engine: GameEngine) -> None:
    engine.wumpus_pos = Position(x=1, y=0)
    senses = engine.get_senses(Position(x=0, y=0))
    assert senses["stench_direction"] == "EAST"
