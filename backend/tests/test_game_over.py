from __future__ import annotations

import pytest

from engine.entities import Position
from engine.game_state import GameEngine


@pytest.fixture
def engine() -> GameEngine:
    return GameEngine(size=4, num_pits=1)


def test_player_falls_in_pit(engine: GameEngine) -> None:
    pit_position = Position(x=2, y=2)
    engine.pits = [pit_position]
    engine.player_pos = pit_position
    assert engine.check_game_over() == "PlayerLost_Pit"


def test_wumpus_catches_player(engine: GameEngine) -> None:
    player_position = Position(x=1, y=1)
    engine.player_pos = player_position
    engine.wumpus_pos = player_position
    engine.pits = [Position(x=3, y=0)]
    assert engine.check_game_over() == "PlayerLost_Wumpus"


def test_player_finds_gold(engine: GameEngine) -> None:
    player_position = Position(x=3, y=3)
    engine.player_pos = player_position
    engine.gold_pos = player_position
    engine.wumpus_pos = Position(x=0, y=3)
    engine.pits = [Position(x=3, y=0)]
    assert engine.check_game_over() == "PlayerWon"
