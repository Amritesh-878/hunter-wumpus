/**
 * @typedef {Object} Senses
 * @property {boolean} breeze
 * @property {boolean} stench
 * @property {boolean} shine
 */

/**
 * @typedef {Object} GameState
 * @property {string | null} gameId
 * @property {'idle'|'Ongoing'|'PlayerWon'|'PlayerLost_Pit'|'PlayerLost_Wumpus'} status
 * @property {number} gridSize
 * @property {number} turn
 * @property {[number, number]} playerPos
 * @property {[number, number][]} exploredTiles
 * @property {number} arrowsRemaining
 * @property {Senses} senses
 * @property {string} message
 * @property {boolean} isLoading
 * @property {boolean} isAiming
 * @property {string | null} error
 */

/** @type {GameState} */
export const initialState = {
  gameId: null,
  status: 'idle',
  gridSize: 10,
  turn: 0,
  playerPos: [0, 0],
  arrowsRemaining: 1,
  exploredTiles: [],
  senses: {
    breeze: false,
    stench: false,
    shine: false,
  },
  message: '',
  isLoading: false,
  isAiming: false,
  error: null,
};

export function gameReducer(state, action) {
  switch (action.type) {
    case 'UPDATE_STATE':
      return {
        ...state,
        gameId: action.payload.game_id,
        status: action.payload.status,
        gridSize: action.payload.grid_size,
        turn: action.payload.turn,
        playerPos: action.payload.player_pos,
        arrowsRemaining: action.payload.arrows_remaining,
        exploredTiles: action.payload.explored_tiles,
        senses: action.payload.senses,
        message: action.payload.message,
        isLoading: false,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_AIMING':
      return {
        ...state,
        isAiming: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    case 'RESET_STATE':
      return {
        ...initialState,
      };
    default:
      return state;
  }
}
