from __future__ import annotations

from typing import Any, cast

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


def _start_game(client: TestClient, grid_size: int = 6) -> dict[str, Any]:
    response = client.post("/game/start", json={"grid_size": grid_size})
    assert response.status_code == 200
    return cast(dict[str, Any], response.json())


def test_start_game_returns_contract_shape_and_no_hidden_fields() -> None:
    _sessions.clear()
    client = TestClient(app)
    payload = _start_game(client)

    assert payload["status"] == "Ongoing"
    assert payload["turn"] == 0
    assert payload["arrows_remaining"] == 1
    assert payload["explored_tiles"] == [[0, 0]]
    assert payload["message"] == "The hunt begins. Find the gold. Survive."
    assert "wumpus_pos" not in payload
    assert "pit_positions" not in payload
    assert "gold_pos" not in payload
    assert "scent_grid" not in payload


def test_move_unknown_game_returns_404() -> None:
    _sessions.clear()
    client = TestClient(app)
    response = client.post(
        "/game/move",
        json={"game_id": "missing", "player_action": "NORTH"},
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Game not found."}


def test_move_invalid_action_returns_422() -> None:
    _sessions.clear()
    client = TestClient(app)
    start_payload = _start_game(client)

    response = client.post(
        "/game/move",
        json={"game_id": start_payload["game_id"], "player_action": "JUMP"},
    )

    assert response.status_code == 422


def test_move_shoot_without_arrows_returns_400() -> None:
    _sessions.clear()
    client = TestClient(app)
    start_payload = _start_game(client)
    game_id = start_payload["game_id"]
    session = _sessions[game_id]
    session.arrows_remaining = 0

    response = client.post(
        "/game/move",
        json={"game_id": game_id, "player_action": "SHOOT_EAST"},
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "No arrows remaining."}


def test_move_resolves_turn_in_order_and_increments_turn(monkeypatch: Any) -> None:
    _sessions.clear()
    client = TestClient(app)
    monkeypatch.setattr("api.routes._get_agent", lambda: StubAgent())

    start_payload = _start_game(client)
    game_id = start_payload["game_id"]
    session = _sessions[game_id]
    session.engine.player_pos = Position(x=0, y=0)
    session.engine.wumpus_pos = Position(x=2, y=0)
    session.engine.pits = [Position(x=5, y=5)]
    session.engine.gold_pos = Position(x=5, y=4)

    response = client.post(
        "/game/move",
        json={"game_id": game_id, "player_action": "EAST"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["turn"] == 1
    assert payload["player_pos"] == [1, 0]
    assert payload["status"] in {
        "Ongoing",
        "PlayerWon",
        "WumpusKilled",
        "PlayerLost_Pit",
        "PlayerLost_Wumpus",
    }
    assert "wumpus_pos" not in payload
    assert "pit_positions" not in payload
    assert "gold_pos" not in payload
    assert "scent_grid" not in payload


def test_status_returns_existing_state_without_advancing_turn() -> None:
    _sessions.clear()
    client = TestClient(app)
    start_payload = _start_game(client)
    game_id = start_payload["game_id"]

    status_response = client.get(f"/game/{game_id}/status")

    assert status_response.status_code == 200
    payload = status_response.json()
    assert payload["game_id"] == game_id
    assert payload["turn"] == 0


def test_status_unknown_game_returns_404() -> None:
    _sessions.clear()
    client = TestClient(app)

    status_response = client.get("/game/unknown/status")

    assert status_response.status_code == 404
    assert status_response.json() == {"detail": "Game not found."}
