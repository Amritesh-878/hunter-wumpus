from __future__ import annotations

import logging
import os

from fastapi import Header, HTTPException

logger = logging.getLogger(__name__)

_firebase_available: bool = False


def init_firebase() -> None:
    """Initialise Firebase Admin SDK if credentials are available."""
    global _firebase_available  # noqa: PLW0603
    cred_path = os.getenv("FIREBASE_CREDENTIALS")
    if not cred_path:
        logger.warning("FIREBASE_CREDENTIALS not set — auth disabled.")
        return
    try:
        import firebase_admin  # type: ignore[import-untyped]
        from firebase_admin import credentials  # type: ignore[import-untyped]

        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        _firebase_available = True
        logger.info("Firebase Admin SDK initialised.")
    except Exception:
        logger.exception("Firebase init failed — auth disabled.")


def verify_firebase_token(token: str) -> dict[str, str]:
    """Verify a Firebase JWT and return ``{'uid': ..., 'email': ...}``."""
    from firebase_admin import auth  # type: ignore[import-untyped]

    try:
        decoded = auth.verify_id_token(token)
        return {"uid": decoded["uid"], "email": decoded.get("email", "")}
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid token.") from exc


async def get_optional_user(
    authorization: str | None = Header(None),
) -> str | None:
    """FastAPI dependency: extract uid from Bearer token, or ``None``."""
    if authorization is None:
        return None
    if not _firebase_available:
        return None
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token.")
    token = authorization[len("Bearer "):]
    info = verify_firebase_token(token)
    return info["uid"]


def update_user_profile(uid: str, email: str, won: bool) -> None:
    """Increment Firestore user profile counters after a terminal game."""
    if not _firebase_available:
        return
    try:
        from firebase_admin import firestore  # type: ignore[import-untyped]

        db = firestore.client()
        doc_ref = db.collection("users").document(uid)
        data: dict[str, object] = {
            "uid": uid,
            "email": email,
            "games_played": firestore.Increment(1),
        }
        if won:
            data["wins"] = firestore.Increment(1)
        else:
            data["losses"] = firestore.Increment(1)
        doc_ref.set(data, merge=True)
    except Exception:
        logger.exception("Failed to update Firestore profile for %s", uid)
