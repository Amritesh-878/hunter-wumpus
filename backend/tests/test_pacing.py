from __future__ import annotations

from typing import Any

from fastapi.testclient import TestClient

from api.main import app
from api.routes import _sessions
from engine.entities import Direction, Position


class StubAgent:
    def build_observation(self, game_state: dict[str, object]) -> object:
        return game_state

    def get_wumpus_action(self, obs: object) -> Direction:
        del obs
        return Direction.WEST


def _start_game(client: TestClient) -> dict[str, Any]:
    response = client.post("/game/start", json={"grid_size": 10})
    payload: dict[str, Any] = response.json()
    return payload


def test_pacing_interval_defaults_to_one(monkeypatch: Any) -> None:
    _sessions.clear()
    client = TestClient(app)
    monkeypatch.setattr("api.routes._get_agent", lambda: StubAgent())

    payload = _start_game(client)
    game_id = payload["game_id"]
    session = _sessions[game_id]
    assert session.pacing_interval == 1


def test_pacing_interval_two_skips_wumpus_on_odd_turns(monkeypatch: Any) -> None:
    _sessions.clear()
    client = TestClient(app)
    monkeypatch.setattr("api.routes._get_agent", lambda: StubAgent())

    payload = _start_game(client)
    game_id = payload["game_id"]
    session = _sessions[game_id]
    session.pacing_interval = 2
    session.engine.pits = []
    session.engine.gold_pos = Position(x=9, y=9)

    # Place Wumpus far away so it won't kill player
    session.engine.wumpus_pos = Position(x=8, y=8)
    session.engine.player_pos = Position(x=0, y=0)
    wumpus_before = Position(x=session.engine.wumpus_pos.x, y=session.engine.wumpus_pos.y)

    # Turn 1 (odd): Wumpus should NOT move (1 % 2 != 0)
    client.post("/game/move", json={"game_id": game_id, "player_action": "EAST"})
    wumpus_after_turn1 = Position(
        x=session.engine.wumpus_pos.x, y=session.engine.wumpus_pos.y
    )
    assert wumpus_after_turn1 == wumpus_before

    # Turn 2 (even): Wumpus SHOULD move (2 % 2 == 0)
    client.post("/game/move", json={"game_id": game_id, "player_action": "EAST"})
    wumpus_after_turn2 = Position(
        x=session.engine.wumpus_pos.x, y=session.engine.wumpus_pos.y
    )
    assert wumpus_after_turn2 != wumpus_before
