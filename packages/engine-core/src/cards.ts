/**
 * Card model shared by all games.
 *
 * Cards map to the `DeckCards.svg` sprite, whose symbols are keyed
 * `<rank><suit>` with rank 1–13 and suit letters c/s/h/d
 * (e.g. `13c` = King of clubs, `1h` = Ace of hearts). The `spriteId` helper
 * produces exactly that id so the presentation layer can `<use>` it directly.
 */

export type Suit = 'c' | 's' | 'h' | 'd'

/** Numeric rank 1..13 (1 = Ace, 11 = Jack, 12 = Queen, 13 = King). */
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13

export interface Card {
  rank: Rank
  suit: Suit
}

export const SUITS: readonly Suit[] = ['c', 's', 'h', 'd']
export const RANKS: readonly Rank[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]

export const SUIT_NAMES: Record<Suit, string> = {
  c: 'clubs',
  s: 'spades',
  h: 'hearts',
  d: 'diamonds',
}

export const SUIT_SYMBOLS: Record<Suit, string> = {
  c: '♣',
  s: '♠',
  h: '♥',
  d: '♦',
}

const RANK_NAMES: Record<Rank, string> = {
  1: 'Ace',
  2: 'Two',
  3: 'Three',
  4: 'Four',
  5: 'Five',
  6: 'Six',
  7: 'Seven',
  8: 'Eight',
  9: 'Nine',
  10: 'Ten',
  11: 'Jack',
  12: 'Queen',
  13: 'King',
}

const RANK_SHORT: Record<Rank, string> = {
  1: 'A',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'J',
  12: 'Q',
  13: 'K',
}

/** Whether a suit is rendered in red (hearts/diamonds). */
export function isRed(suit: Suit): boolean {
  return suit === 'h' || suit === 'd'
}

/** Sprite symbol id for the DeckCards.svg sheet, e.g. `13c`. */
export function spriteId(card: Card): string {
  return `${card.rank}${card.suit}`
}

/** Stable string id for a card, used as a key / set member, e.g. `13c`. */
export function cardId(card: Card): string {
  return `${card.rank}${card.suit}`
}

/** Parse a `cardId` back into a Card (throws on malformed input). */
export function parseCardId(id: string): Card {
  const suit = id.slice(-1) as Suit
  const rank = Number(id.slice(0, -1)) as Rank
  if (!SUITS.includes(suit) || !RANKS.includes(rank)) {
    throw new Error(`Invalid card id: ${id}`)
  }
  return { rank, suit }
}

/** Human label, e.g. "King of clubs". */
export function cardName(card: Card): string {
  return `${RANK_NAMES[card.rank]} of ${SUIT_NAMES[card.suit]}`
}

/** Short label, e.g. "K♣". */
export function cardShort(card: Card): string {
  return `${RANK_SHORT[card.rank]}${SUIT_SYMBOLS[card.suit]}`
}

/** A full 52-card deck in canonical order (suit-major, ascending rank). */
export function standardDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit })
    }
  }
  return deck
}

/**
 * A deck with the given ranks removed (e.g. Albastini strips 2,8,9,10).
 * Returns a fresh array in canonical order.
 */
export function deckWithout(ranksToRemove: readonly Rank[]): Card[] {
  const remove = new Set<Rank>(ranksToRemove)
  return standardDeck().filter((c) => !remove.has(c.rank))
}
