"""Local-first JSONL telemetry queue with async Google Sheets batch uploader."""

from __future__ import annotations

import json
import logging
import os
import threading
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

TELEMETRY_QUEUE_PATH = Path(__file__).resolve().parents[1] / "telemetry_queue.jsonl"
MAX_QUEUE_SIZE = 10_000

_write_lock = threading.Lock()
_sheets_client: Any = None
_sheets_inited = False


def enqueue_stats(
    *,
    user_id: str | None,
    difficulty: str,
    status: str,
    turns: int,
    arrows_used: int,
    player_x: int,
    player_y: int,
    wumpus_count: int,
    pit_count: int,
) -> None:
    """Append one JSON line to the local telemetry queue file (<1ms)."""
    entry = {
        "timestamp": datetime.now(tz=timezone.utc).isoformat(),
        "user_id": user_id or "anonymous",
        "difficulty": difficulty,
        "status": status,
        "turns": turns,
        "arrows_used": arrows_used,
        "player_x": player_x,
        "player_y": player_y,
        "wumpus_count": wumpus_count,
        "pit_count": pit_count,
    }
    try:
        with _write_lock:
            with open(TELEMETRY_QUEUE_PATH, "a", encoding="utf-8") as fh:
                fh.write(json.dumps(entry) + "\n")
    except OSError:
        logger.warning("Failed to write telemetry entry to %s", TELEMETRY_QUEUE_PATH)


def init_sheets_client() -> Any:
    """Authenticate with Google Sheets via service account. Returns worksheet or None."""
    global _sheets_client, _sheets_inited  # noqa: PLW0603
    if _sheets_inited:
        return _sheets_client
    _sheets_inited = True

    secret_path = os.environ.get(
        "GCP_CLIENT_SECRET",
        str(Path(__file__).resolve().parents[2] / "client_secret.json"),
    )
    sheet_id = os.environ.get("GOOGLE_SHEETS_ID")

    if not sheet_id or not Path(secret_path).exists():
        logger.info("Sheets credentials missing — telemetry will stay local-only.")
        return None

    try:
        import gspread  # type: ignore[import-untyped]
        from google.oauth2.service_account import Credentials  # type: ignore[import-untyped]

        scopes = [
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive",
        ]
        creds = Credentials.from_service_account_file(secret_path, scopes=scopes)
        gc = gspread.authorize(creds)
        _sheets_client = gc.open_by_key(sheet_id).sheet1
        logger.info("Google Sheets client initialized for sheet %s", sheet_id)
    except Exception:
        logger.exception("Failed to init Google Sheets client")
        _sheets_client = None

    return _sheets_client


_COLUMNS = [
    "timestamp", "user_id", "difficulty", "status", "turns",
    "arrows_used", "player_x", "player_y", "wumpus_count", "pit_count",
]


def flush_queue() -> int:
    """Read all lines from the JSONL queue, upload to Sheets, truncate on success.

    Returns the number of rows uploaded (0 if nothing to do or on failure).
    """
    ws = init_sheets_client()
    if ws is None:
        return 0

    with _write_lock:
        if not TELEMETRY_QUEUE_PATH.exists():
            return 0
        raw = TELEMETRY_QUEUE_PATH.read_text(encoding="utf-8").strip()
        if not raw:
            return 0
        lines = raw.splitlines()

    rows: list[list[Any]] = []
    for line in lines:
        try:
            entry = json.loads(line)
            rows.append([entry.get(col, "") for col in _COLUMNS])
        except json.JSONDecodeError:
            logger.warning("Skipping malformed telemetry line: %s", line[:80])

    if not rows:
        return 0

    try:
        ws.append_rows(rows, value_input_option="RAW")
        with _write_lock:
            TELEMETRY_QUEUE_PATH.write_text("", encoding="utf-8")
        logger.info("Uploaded %d telemetry rows to Google Sheets", len(rows))
        return len(rows)
    except Exception:
        logger.exception("Sheets upload failed — entries preserved in queue for retry")
        return 0


def start_processor() -> threading.Thread | None:
    """Spawn a daemon thread that flushes the telemetry queue periodically."""
    if init_sheets_client() is None:
        logger.info("Telemetry processor not started (no Sheets client).")
        return None

    def _loop() -> None:
        time.sleep(10)
        while True:
            try:
                flush_queue()
            except Exception:
                logger.exception("Telemetry flush cycle error")
            time.sleep(300)

    thread = threading.Thread(target=_loop, daemon=True, name="telemetry-processor")
    thread.start()
    logger.info("Telemetry processor thread started.")
    return thread
