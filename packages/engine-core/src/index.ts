// @card-games/engine-core — public surface.
//
// Pure, deterministic, framework-free. Imports no network, DOM, or UI code:
// the whole package type-checks against packages/tsconfig.base.json, whose
// `lib` excludes the DOM, so any such import is a compile error.

export const ENGINE_CORE_VERSION = '0.1.0'

// Deterministic RNG
export {
  type RngState,
  hashSeed,
  createRng,
  nextFloat,
  nextInt,
  shuffle,
} from './rng'

// Card / deck model
export {
  type Suit,
  type Rank,
  type Card,
  SUITS,
  RANKS,
  SUIT_NAMES,
  SUIT_SYMBOLS,
  isRed,
  spriteId,
  cardId,
  parseCardId,
  cardName,
  cardShort,
  standardDeck,
  deckWithout,
} from './cards'

// Turn order
export {
  type Direction,
  nextSeat,
  advanceSeat,
  seatOrder,
} from './turn'

// Core contract & shared types
export type {
  Seat,
  Player,
  BaseGameState,
  BaseMove,
  ReducerResult,
  ScoreResult,
  GameMeta,
  GameModule,
} from './types'

// Move application / validation / replay
export { applyMove, replay, hasLegalMove } from './apply'

// Registry
export {
  registerGame,
  getGame,
  requireGame,
  listGames,
  clearGames,
} from './registry'
