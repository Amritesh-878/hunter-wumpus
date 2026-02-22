from __future__ import annotations

import pytest

from engine.entities import Direction, Position
from engine.game_state import GameEngine
from engine.senses import MAX_SCENT


@pytest.fixture
def engine() -> GameEngine:
    game_engine = GameEngine(size=4, num_pits=0)
    game_engine.player_pos = Position(x=0, y=0)
    game_engine.wumpus_pos = Position(x=3, y=3)
    game_engine.gold_pos = Position(x=3, y=0)
    game_engine.pits = []
    return game_engine


def test_scent_placement(engine: GameEngine) -> None:
    engine.move_player(Direction.EAST)
    engine.move_wumpus(Direction.WEST)
    engine._update_scent()

    assert engine.scent_grid[0][0] == MAX_SCENT


def test_scent_decay(engine: GameEngine) -> None:
    engine.move_player(Direction.EAST)
    engine.move_wumpus(Direction.WEST)
    engine._update_scent()
    assert engine.scent_grid[0][0] == MAX_SCENT

    engine.move_player(Direction.SOUTH)
    engine.move_wumpus(Direction.WEST)
    engine._update_scent()
    assert engine.scent_grid[0][0] == MAX_SCENT - 1

    engine.move_player(Direction.SOUTH)
    engine.move_wumpus(Direction.WEST)
    engine._update_scent()
    assert engine.scent_grid[0][0] == MAX_SCENT - 2

    for _ in range(10):
        engine.move_player(Direction.SOUTH)
        engine.move_wumpus(Direction.WEST)
        engine._update_scent()

    assert engine.scent_grid[0][0] == 0


def test_scent_timing(engine: GameEngine) -> None:
    engine.scent_grid[0][0] = 1
    engine.move_player(Direction.EAST)

    assert engine.scent_grid[0][0] == 1

    engine.move_wumpus(Direction.WEST)
    engine._update_scent()
    assert engine.scent_grid[0][0] == MAX_SCENT


def test_wumpus_memory_logging(engine: GameEngine) -> None:
    initial_count = len(engine.wumpus_visited)

    engine.move_wumpus(Direction.WEST)
    assert len(engine.wumpus_visited) == initial_count + 1

    engine.move_wumpus(Direction.NORTH)
    assert len(engine.wumpus_visited) == initial_count + 2


def test_senses_breeze(engine: GameEngine) -> None:
    engine.pits = [Position(x=2, y=1)]

    senses = engine.get_senses(Position(x=2, y=0))
    assert senses["breeze"] is True


def test_senses_no_diagonal(engine: GameEngine) -> None:
    engine.pits = [Position(x=2, y=2)]

    senses = engine.get_senses(Position(x=1, y=1))
    assert senses["breeze"] is False


def test_stench_when_wumpus_on_same_tile(engine: GameEngine) -> None:
    engine.wumpus_pos = Position(x=1, y=1)

    senses = engine.get_senses(Position(x=1, y=1))
    assert senses["stench"] is True