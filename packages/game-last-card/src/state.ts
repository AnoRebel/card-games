/**
 * Last Card state & move types.
 */

import type { BaseGameState, BaseMove, Card, Seat, Suit } from '@card-games/engine-core'
import type { LastCardConfig } from './config'

export interface LastCardState extends BaseGameState {
  gameId: 'last-card'
  config: LastCardConfig
  /** Each seat's hand. Hidden from other seats via redactFor. */
  hands: Record<Seat, Card[]>
  /** Face-down draw pile (top = last element). */
  drawPile: Card[]
  /** Face-up discard pile (top = last element). */
  discardPile: Card[]
  /** Active suit demand — set by a suit-change card; otherwise top card's suit. */
  activeSuit: Suit
  /** Play direction: 1 clockwise, -1 counter-clockwise. */
  direction: 1 | -1
  /** Accumulated pickup penalty waiting to land on the next non-stacker. */
  pendingPickup: number
  /** Seat that has validly declared "Last Card" (cleared when they play out). */
  declaredLastCard: Seat | null
  /**
   * Seat that reduced to one card but has not yet declared, pending the next
   * player's action (when the window closes, the penalty applies).
   */
  awaitingCall: Seat | null
  /** 'playing' | 'finished'. */
  phase: 'playing' | 'finished'
  /** Round index (0-based) and cumulative scores across rounds. */
  round: number
  cumulativeScores: Record<Seat, number>
  /** Seat that emptied their hand to win the current/last round. */
  roundWinner: Seat | null
}

export type LastCardMove =
  | {
      type: 'play'
      seat: Seat
      /** Lead card (must be a legal play). */
      card: Card
      /**
       * Additional cards of the SAME RANK as `card`, played together in one turn
       * (pair/triplet/…). Optional; omitted/empty for a single-card play.
       */
      extraCards?: Card[]
      chosenSuit?: Suit
      declareLastCard?: boolean
    }
  | { type: 'draw'; seat: Seat }
  | { type: 'declare-last-card'; seat: Seat }
  | { type: 'pass'; seat: Seat }

// Ensure the move union is assignable to BaseMove.
type _AssertMove = LastCardMove extends BaseMove ? true : never
const _moveOk: _AssertMove = true
void _moveOk

// Ensure the state is assignable to BaseGameState.
type _AssertState = LastCardState extends BaseGameState ? true : never
const _stateOk: _AssertState = true
void _stateOk
