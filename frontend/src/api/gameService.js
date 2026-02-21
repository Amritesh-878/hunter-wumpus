const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

async function parseResponse(response) {
  if (response.ok) {
    return response.json();
  }

  let detail = 'Request failed';

  try {
    const errorBody = await response.json();

    if (typeof errorBody?.detail === 'string') {
      detail = errorBody.detail;
    }
  } catch {
    detail = `${detail} (${response.status})`;
  }

  throw new Error(detail);
}

export async function startGame(gridSize = 10) {
  const response = await fetch(`${BASE_URL}/game/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ grid_size: gridSize }),
  });

  return parseResponse(response);
}

export async function movePlayer(gameId, action) {
  const response = await fetch(`${BASE_URL}/game/move`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ game_id: gameId, player_action: action }),
  });

  return parseResponse(response);
}
