/**
 * Generic move application, validation, and replay.
 *
 * These wrap a game's own reducer with the cross-cutting guarantees the engine
 * promises: legal-move + turn validation, version bumping, and deterministic
 * replay from an initial state + move log.
 */

import type {
  BaseGameState,
  BaseMove,
  GameModule,
  ReducerResult,
  Seat,
} from './types'

/** Deep structural equality for plain serializable game state/moves. */
function sameMove(a: BaseMove, b: BaseMove): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

/**
 * Validate then apply a move through the game's reducer.
 *
 * Enforces (regardless of what the game's own reducer does):
 *  - the move's seat must be the active seat (turn authority), and
 *  - the move must be among `getLegalMoves` for that seat.
 * On rejection, returns `{ ok: false, state }` with state unchanged.
 * On success, returns the reduced state with `version` incremented.
 */
export function applyMove<
  S extends BaseGameState,
  M extends BaseMove,
  C,
>(game: GameModule<S, M, C>, state: S, move: M): ReducerResult<S> {
  if (game.isTerminal(state)) {
    return { ok: false, error: 'Game is already over', state }
  }
  // `getLegalMoves` is the single source of truth for what a seat may do. It
  // already returns [] for a non-active seat EXCEPT for intentional off-turn
  // moves (e.g. an out-of-turn "Last Card" declaration). So the legal-set check
  // below subsumes the turn check — a seat with no legal move is rejected here.
  const legal = game.getLegalMoves(state, move.seat)
  if (!legal.some((m) => sameMove(m, move))) {
    return {
      ok: false,
      error: state.activeSeat !== null && move.seat !== state.activeSeat
        ? 'Not your turn'
        : 'Illegal move',
      state,
    }
  }

  const result = game.reducer(state, move)
  if (!result.ok) return result

  return { ok: true, state: { ...result.state, version: state.version + 1 } }
}

/**
 * Replay an initial state through an ordered move log.
 * Throws if any move is rejected — a replay of a previously-valid log must
 * succeed, so a rejection signals corruption / nondeterminism.
 */
export function replay<S extends BaseGameState, M extends BaseMove, C>(
  game: GameModule<S, M, C>,
  initial: S,
  moves: readonly M[],
): S {
  let state = initial
  for (const [i, move] of moves.entries()) {
    const result = applyMove(game, state, move)
    if (!result.ok) {
      throw new Error(`Replay failed at move ${i}: ${result.error}`)
    }
    state = result.state
  }
  return state
}

/** Convenience: are there any legal moves for `seat` right now? */
export function hasLegalMove<S extends BaseGameState, M extends BaseMove, C>(
  game: GameModule<S, M, C>,
  state: S,
  seat: Seat,
): boolean {
  return game.getLegalMoves(state, seat).length > 0
}
