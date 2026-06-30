/**
 * Last Card variant configuration.
 *
 * The rules of Last Card vary widely by source, so action cards are modelled as
 * toggleable config rather than hardcoded. Defaults reflect the most common
 * ruleset (standard 52-card deck, 7-card hands, 2 = pickup-2, 8 = skip, Jack =
 * suit change, Ace = suit change with reverse off).
 */

import type { Rank } from '@card-games/engine-core'

/** What a player must do when they cannot follow suit/rank. */
export type DrawRule = 'draw-one' | 'draw-until-playable'

export interface LastCardConfig {
  /** Cards dealt to each player at the start of a round. */
  handSize: number
  /** Draw behaviour when a player has no legal play. */
  drawRule: DrawRule
  /**
   * If the turned starting card is an action card, re-draw a plain card to
   * start instead of applying its effect.
   */
  redrawActionStart: boolean

  /** Ranks that force the next player to pick up, with the pickup amount. */
  pickupCards: { rank: Rank; amount: number }[]
  /** Allow stacking matching pickup cards to pass on an accumulating penalty. */
  allowPickupStacking: boolean

  /** Ranks that skip the next player's turn. */
  skipCards: Rank[]
  /** Ranks that reverse play direction. */
  reverseCards: Rank[]
  /** Ranks that let the player nominate the next suit (wild). */
  suitChangeCards: Rank[]

  /** Require declaring "Last Card" when reducing to one card. */
  requireLastCardCall: boolean
  /** Penalty cards drawn for a missed "Last Card" call. */
  missedCallPenalty: number
  /**
   * Whether an action card (pickup/skip/reverse/suit-change) may be the final
   * card played to win. The common rule is `false`: you must go out on a plain
   * card, so an action card cannot be your last.
   */
  allowActionCardFinish: boolean

  /**
   * Allow playing several cards of the SAME RANK in one turn (pairs, triplets,
   * quadruplets…). The first (lead) card must be a legal play; the rest stack on
   * top. Action effects (pickup/skip) apply per card played.
   */
  allowMultiSameRank: boolean

  /** Number of rounds; 1 = single round, >1 = cumulative lowest score wins. */
  rounds: number
}

export function defaultLastCardConfig(): LastCardConfig {
  return {
    handSize: 7,
    drawRule: 'draw-one',
    redrawActionStart: true,
    pickupCards: [{ rank: 2, amount: 2 }],
    allowPickupStacking: true,
    skipCards: [8],
    reverseCards: [],
    suitChangeCards: [11], // Jack
    requireLastCardCall: true,
    missedCallPenalty: 2,
    allowActionCardFinish: false,
    allowMultiSameRank: true,
    rounds: 1,
  }
}

/** Penalty point value of a card left in hand at round end. */
export function cardPenaltyValue(rank: Rank): number {
  if (rank === 1) return 1 // Ace
  if (rank >= 11) return 10 // J/Q/K
  return rank // pip value
}
