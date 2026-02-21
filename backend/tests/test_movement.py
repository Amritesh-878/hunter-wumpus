from __future__ import annotations

import pytest

from engine.entities import Direction, Position
from engine.game_state import GameEngine


@pytest.fixture
def engine() -> GameEngine:
    return GameEngine(size=4, num_pits=1)


def test_boundary_north(engine: GameEngine) -> None:
    engine.player_pos = Position(x=0, y=0)
    engine.move_player(Direction.NORTH)
    assert engine.player_pos == Position(x=0, y=0)


def test_boundary_east(engine: GameEngine) -> None:
    engine.player_pos = Position(x=engine.size - 1, y=1)
    engine.move_player(Direction.EAST)
    assert engine.player_pos == Position(x=engine.size - 1, y=1)


def test_valid_move(engine: GameEngine) -> None:
    engine.player_pos = Position(x=1, y=1)
    engine.move_player(Direction.SOUTH)
    assert engine.player_pos == Position(x=1, y=2)
