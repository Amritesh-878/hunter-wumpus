# Orchestrator Chat

## My Understanding

You want to implement the full **Hunter Wumpus** project as described in `MASTER_PLAN.md`. This is a 10-task project:

**Backend (Python/FastAPI):**

- TASK-001: Core Game Engine & State Management
- TASK-002: Scent Trail & Memory System
- TASK-003: RL Environment Wrapper (Gymnasium)
- TASK-004: Agent Training & Inference
- TASK-005: REST API Server

**Frontend (React/Vite):**

- TASK-006: Core UI & State Setup
- TASK-007: Grid Rendering & Fog of War
- TASK-008: Sensory Indicators & Sprites
- TASK-009: Player Controls & Combat Mechanics
- TASK-010: Game Loop & Game Over Sequences

The backend tasks must run **sequentially** (001 → 002 → 003 → 004 → 005).
The frontend tasks must also run **sequentially** (006 → 007 → 008 → 009 → 010).
Backend and frontend can run in **parallel** once TASK-005 API contract is stable.

---

## Questions Before I Start

1. **Scope**: Do you want me to implement ALL 10 tasks end-to-end right now, or start with a specific subset (e.g., just backend first)?

2. **RL Training**: TASK-004 involves training a PPO model which takes ~10 minutes. Should the agent implementation include a **stub/mock** agent for development (so the API works before training), or do you want the real training pipeline fully wired up?

3. **Python environment**: Is Python 3.11 and a virtual environment already set up, or should the implementation agent set that up from scratch?

4. **Node.js**: Is Node 20 already installed on this machine?

---

_Please answer below this line, then write `AGENT, CONTINUE.` when done._

1. Do all 10 tasks, as u said above sequentaly. Make sure to use sub agents.
2. I want the real training pipeline fully wired up.
3. Do implementation agent set that up from scratch, make sure the sub agent check the versions of the python env and the lib which will be used.
4. I have version v24.11.0 use this instead of node 20.

AGENT, CONTINUE.

---
