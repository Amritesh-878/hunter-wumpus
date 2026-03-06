"""Tests for the telemetry JSONL queue and Google Sheets uploader."""

from __future__ import annotations

import json
import threading
from pathlib import Path
from typing import Any
from unittest.mock import MagicMock, patch

import pytest

from api import telemetry


@pytest.fixture(autouse=True)
def _reset_telemetry_state(tmp_path: Path) -> Any:
    """Reset module-level state and redirect queue to tmp_path."""
    original_path = telemetry.TELEMETRY_QUEUE_PATH
    original_client = telemetry._sheets_client
    original_inited = telemetry._sheets_inited
    telemetry.TELEMETRY_QUEUE_PATH = tmp_path / "test_queue.jsonl"
    telemetry._sheets_client = None
    telemetry._sheets_inited = False
    yield
    telemetry.TELEMETRY_QUEUE_PATH = original_path
    telemetry._sheets_client = original_client
    telemetry._sheets_inited = original_inited


def test_enqueue_stats_writes_valid_json_line() -> None:
    telemetry.enqueue_stats(
        user_id="u1",
        difficulty="hard",
        status="PlayerWon",
        turns=10,
        arrows_used=1,
        player_x=3,
        player_y=7,
        wumpus_count=1,
        pit_count=2,
    )
    lines = telemetry.TELEMETRY_QUEUE_PATH.read_text(encoding="utf-8").strip().splitlines()
    assert len(lines) == 1
    entry = json.loads(lines[0])
    assert entry["user_id"] == "u1"
    assert entry["difficulty"] == "hard"
    assert entry["status"] == "PlayerWon"
    assert entry["turns"] == 10


def test_enqueue_stats_appends_multiple_lines() -> None:
    for i in range(3):
        telemetry.enqueue_stats(
            user_id=f"u{i}",
            difficulty="easy",
            status="Ongoing",
            turns=i,
            arrows_used=0,
            player_x=0,
            player_y=0,
            wumpus_count=1,
            pit_count=2,
        )
    lines = telemetry.TELEMETRY_QUEUE_PATH.read_text(encoding="utf-8").strip().splitlines()
    assert len(lines) == 3
    for line in lines:
        json.loads(line)  # should not raise


def test_flush_queue_uploads_and_truncates() -> None:
    telemetry.enqueue_stats(
        user_id="u1",
        difficulty="medium",
        status="PlayerLost_Pit",
        turns=5,
        arrows_used=0,
        player_x=1,
        player_y=2,
        wumpus_count=1,
        pit_count=3,
    )
    mock_ws = MagicMock()
    telemetry._sheets_client = mock_ws
    telemetry._sheets_inited = True

    count = telemetry.flush_queue()

    assert count == 1
    mock_ws.append_rows.assert_called_once()
    rows = mock_ws.append_rows.call_args[0][0]
    assert len(rows) == 1
    assert rows[0][2] == "medium"
    # File should be truncated
    assert telemetry.TELEMETRY_QUEUE_PATH.read_text(encoding="utf-8") == ""


def test_flush_queue_preserves_on_upload_failure() -> None:
    telemetry.enqueue_stats(
        user_id="u1",
        difficulty="hard",
        status="PlayerLost_Wumpus",
        turns=8,
        arrows_used=0,
        player_x=5,
        player_y=5,
        wumpus_count=2,
        pit_count=4,
    )
    mock_ws = MagicMock()
    mock_ws.append_rows.side_effect = RuntimeError("API error")
    telemetry._sheets_client = mock_ws
    telemetry._sheets_inited = True

    count = telemetry.flush_queue()

    assert count == 0
    lines = telemetry.TELEMETRY_QUEUE_PATH.read_text(encoding="utf-8").strip().splitlines()
    assert len(lines) == 1  # preserved for retry


def test_init_sheets_client_returns_none_with_missing_creds() -> None:
    telemetry._sheets_inited = False
    with patch.dict("os.environ", {"GOOGLE_SHEETS_ID": ""}, clear=False):
        result = telemetry.init_sheets_client()
    assert result is None


def test_init_sheets_client_uses_oauth_flow(tmp_path: Path) -> None:
    """Verify init_sheets_client uses OAuth Desktop App credentials, not service account."""
    telemetry._sheets_inited = False
    secret_file = tmp_path / "client_secret.json"
    secret_file.write_text('{"installed":{}}', encoding="utf-8")

    mock_creds = MagicMock()
    mock_creds.valid = True
    mock_creds.to_json.return_value = '{"token": "test"}'

    mock_gc = MagicMock()
    mock_ws = MagicMock()
    mock_gc.open_by_key.return_value.sheet1 = mock_ws

    env = {"GCP_CLIENT_SECRET": str(secret_file), "GOOGLE_SHEETS_ID": "test-sheet-id"}
    with patch.dict("os.environ", env, clear=False):
        with patch("builtins.__import__", wraps=__import__):
            # Pre-inject mocked modules into sys.modules so the lazy imports resolve
            import sys
            sentinel_creds_mod = MagicMock()
            sentinel_creds_mod.Credentials.from_authorized_user_file.return_value = mock_creds
            sentinel_flow_mod = MagicMock()

            old_modules: dict[str, Any] = {}
            inject = {
                "gspread": MagicMock(authorize=MagicMock(return_value=mock_gc)),
                "google.oauth2.credentials": sentinel_creds_mod,
                "google.auth.transport.requests": MagicMock(),
                "google_auth_oauthlib.flow": sentinel_flow_mod,
            }
            for k, v in inject.items():
                old_modules[k] = sys.modules.get(k)
                sys.modules[k] = v

            try:
                # Write a fake token.json next to client_secret so the "from_authorized_user_file" path is hit
                token_file = Path(telemetry.__file__).resolve().parents[2] / "token.json"
                token_existed = token_file.exists()
                if not token_existed:
                    token_file.write_text('{"token":"x"}', encoding="utf-8")

                result = telemetry.init_sheets_client()
                assert result is mock_ws

                # OAuth credentials module was used (not service_account)
                sentinel_creds_mod.Credentials.from_authorized_user_file.assert_called_once()
            finally:
                for k, v in old_modules.items():
                    if v is None:
                        sys.modules.pop(k, None)
                    else:
                        sys.modules[k] = v
                if not token_existed and token_file.exists():
                    token_file.unlink()


def test_start_processor_does_not_start_without_client() -> None:
    telemetry._sheets_inited = True
    telemetry._sheets_client = None
    result = telemetry.start_processor()
    assert result is None


def test_start_processor_spawns_daemon_thread() -> None:
    mock_ws = MagicMock()
    telemetry._sheets_client = mock_ws
    telemetry._sheets_inited = True

    with patch.object(threading, "Thread", wraps=threading.Thread):
        thread = telemetry.start_processor()
        assert thread is not None
        assert thread.daemon is True
        assert thread.name == "telemetry-processor"
        # Clean up: we can't easily stop the thread, but it's a daemon
