/**
 * Simple offline bot: picks a random legal move, with light heuristics to make
 * play feel sensible rather than purely random. Sufficient for seat-filling in
 * local games (advanced strategy is out of scope — see design Non-Goals).
 */
import type {
  BaseGameState,
  BaseMove,
  GameModule,
  Seat,
} from '@card-games/engine-core'

/**
 * Choose a move for `seat`. Prefers a non-draw play when available (so bots
 * actually shed cards / play tricks), otherwise the first legal move.
 * Deterministic given the move list order — randomness, if any, comes from
 * the index derived from state.version to avoid ambient RNG.
 */
export function chooseBotMove<S extends BaseGameState, M extends BaseMove, C>(
  game: GameModule<S, M, C>,
  state: S,
  seat: Seat,
): M | null {
  const moves = game.getLegalMoves(state, seat)
  if (moves.length === 0) return null

  // Prefer "play"/"bid" moves over "draw"/"pass" so bots make progress.
  const progress = moves.filter(
    (m) => m.type !== 'draw' && m.type !== 'pass' && m.type !== 'pass-bid',
  )
  let pool = progress.length > 0 ? progress : moves

  // Always call "Last Card" when possible — a play that declares alongside it,
  // or a standalone out-of-turn declare — to dodge the missed-call penalty.
  const declaring = moves.filter(
    (m) =>
      m.type === 'declare-last-card' ||
      (m as { declareLastCard?: boolean }).declareLastCard === true,
  )
  if (declaring.length > 0) {
    // A pending standalone declare is urgent → do it now.
    const standalone = declaring.filter((m) => m.type === 'declare-last-card')
    if (standalone.length > 0) return standalone[0] ?? null
    pool = declaring
  }

  // Among plays, prefer shedding the MOST cards (multi same-rank bundles) so a
  // larger move set never stalls progress toward a win.
  const playCount = (m: M) =>
    m.type === 'play' ? 1 + ((m as { extraCards?: unknown[] }).extraCards?.length ?? 0) : 0
  const maxShed = Math.max(...pool.map(playCount))
  if (maxShed > 1) pool = pool.filter((m) => playCount(m) === maxShed)

  // Deterministic pseudo-pick from state.version (no Math.random in app logic
  // either, keeping bot behaviour reproducible for a given game).
  const idx = state.version % pool.length
  return pool[idx] ?? moves[0] ?? null
}
