from __future__ import annotations

from pathlib import Path


def resolve_backend_dir() -> Path:
    return Path(__file__).resolve().parents[1]


def resolve_models_dir() -> Path:
    backend_dir = resolve_backend_dir()
    candidates = [
        backend_dir / "models",
        backend_dir.parent.parent / "Hunter Wumpus" / "backend" / "models",
    ]

    for candidate in candidates:
        if candidate.exists():
            return candidate

    searched = "\n".join(str(path) for path in candidates)
    raise FileNotFoundError(f"Could not find models directory. Searched:\n{searched}")
