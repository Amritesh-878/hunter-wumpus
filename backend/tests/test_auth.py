from __future__ import annotations

from typing import Any
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

from api import auth


@pytest.fixture(autouse=True)
def _reset_firebase() -> Any:
    """Ensure each test starts with Firebase disabled."""
    original = auth._firebase_available
    auth._firebase_available = False
    yield
    auth._firebase_available = original


def test_get_optional_user_returns_none_without_header() -> None:
    import asyncio

    result = asyncio.get_event_loop().run_until_complete(
        auth.get_optional_user(None)
    )
    assert result is None


def test_get_optional_user_returns_none_when_firebase_unavailable() -> None:
    import asyncio

    result = asyncio.get_event_loop().run_until_complete(
        auth.get_optional_user("Bearer some-token")
    )
    assert result is None


def test_get_optional_user_rejects_invalid_scheme() -> None:
    import asyncio

    auth._firebase_available = True
    with pytest.raises(HTTPException) as exc_info:
        asyncio.get_event_loop().run_until_complete(
            auth.get_optional_user("Basic abc")
        )
    assert exc_info.value.status_code == 401


@patch("api.auth.verify_firebase_token")
def test_get_optional_user_returns_uid_on_valid_token(
    mock_verify: MagicMock,
) -> None:
    import asyncio

    auth._firebase_available = True
    mock_verify.return_value = {"uid": "user-123", "email": "a@b.com"}
    result = asyncio.get_event_loop().run_until_complete(
        auth.get_optional_user("Bearer good-token")
    )
    assert result == "user-123"
    mock_verify.assert_called_once_with("good-token")


def test_verify_firebase_token_raises_on_bad_token() -> None:
    mock_auth = MagicMock()
    mock_auth.verify_id_token.side_effect = Exception("bad")
    with patch.dict("sys.modules", {"firebase_admin.auth": mock_auth}):
        with pytest.raises(HTTPException) as exc_info:
            auth.verify_firebase_token("bad-token")
        assert exc_info.value.status_code == 401
