import { getStatus, movePlayer, startGame } from './gameService';

describe('gameService', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  it('startGame returns backend game state', async () => {
    const payload = {
      game_id: 'test-id',
      status: 'Ongoing',
      grid_size: 10,
      turn: 0,
      player_pos: [0, 0],
      arrows_remaining: 1,
      explored_tiles: [[0, 0]],
      senses: { breeze: false, stench: false, shine: false },
      message: 'The hunt begins. Find the gold. Survive.',
    };

    globalThis.fetch.mockResolvedValue({
      ok: true,
      json: async () => payload,
    });

    const result = await startGame();

    expect(result).toEqual(payload);
    expect(result).toEqual(
      expect.objectContaining({
        game_id: expect.any(String),
        grid_size: 10,
        player_pos: [0, 0],
        explored_tiles: [[0, 0]],
        senses: expect.any(Object),
        status: 'Ongoing',
      }),
    );
  });

  it('movePlayer sends expected payload and returns state', async () => {
    const payload = {
      game_id: 'test-id',
      status: 'Ongoing',
      grid_size: 10,
      turn: 1,
      player_pos: [1, 0],
      arrows_remaining: 1,
      explored_tiles: [
        [0, 0],
        [1, 0],
      ],
      senses: { breeze: false, stench: false, shine: false },
      message: '',
    };

    globalThis.fetch.mockResolvedValue({
      ok: true,
      json: async () => payload,
    });

    const result = await movePlayer('test-id', 'EAST');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/game/move',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ game_id: 'test-id', player_action: 'EAST' }),
      }),
    );
    expect(result).toEqual(payload);
  });

  it('getStatus throws when backend returns non-2xx', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ detail: 'Game not found.' }),
    });

    await expect(getStatus('missing-id')).rejects.toThrow('Game not found.');
  });

  it('startGame propagates network errors', async () => {
    const networkError = new Error('network down');
    globalThis.fetch.mockRejectedValue(networkError);

    await expect(startGame()).rejects.toThrow('network down');
  });
});
