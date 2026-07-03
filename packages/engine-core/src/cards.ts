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
  /**
   * Jokers are suitless wild cards used by some games (e.g. Last Card's
   * pick-up-five). They carry `joker: true` and a per-copy `jokerId` (0-based)
   * so two jokers have distinct card ids; their `rank`/`suit` are placeholders
   * (0/'c') and must never be interpreted as a normal rank/suit. Use the
   * `isJoker` guard rather than reading `rank`/`suit` on a possible joker.
   */
  joker?: true
  /** Distinguishes the multiple joker copies in a deck (0, 1, …). */
  jokerId?: number
}

/** True for a Joker card. Prefer this over inspecting rank/suit. */
export function isJoker(card: Card): boolean {
  return card.joker === true
}

/** Build a single Joker card (jokerId distinguishes copies). */
export function joker(jokerId = 0): Card {
  return { rank: 0 as Rank, suit: 'c', joker: true, jokerId }
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

/** Sprite symbol id for the DeckCards.svg sheet, e.g. `13c`. Jokers have no
 * sprite (rendered via a fallback), so this returns '' for them. */
export function spriteId(card: Card): string {
  if (isJoker(card)) return ''
  return `${card.rank}${card.suit}`
}

/** Stable string id for a card, used as a key / set member, e.g. `13c`.
 * Jokers are `j0` (colored) / `j1` (black) — see `jokerId`. */
export function cardId(card: Card): string {
  if (isJoker(card)) return `j${card.jokerId ?? 0}`
  return `${card.rank}${card.suit}`
}

/** Parse a `cardId` back into a Card (throws on malformed input). */
export function parseCardId(id: string): Card {
  if (id[0] === 'j') {
    const n = Number(id.slice(1))
    if (!Number.isInteger(n) || n < 0) throw new Error(`Invalid card id: ${id}`)
    return joker(n)
  }
  const suit = id.slice(-1) as Suit
  const rank = Number(id.slice(0, -1)) as Rank
  if (!SUITS.includes(suit) || !RANKS.includes(rank)) {
    throw new Error(`Invalid card id: ${id}`)
  }
  return { rank, suit }
}

/** Human label, e.g. "King of clubs" or "Joker". */
export function cardName(card: Card): string {
  if (isJoker(card)) return card.jokerId === 1 ? 'Black Joker' : 'Red Joker'
  return `${RANK_NAMES[card.rank]} of ${SUIT_NAMES[card.suit]}`
}

/** Short label, e.g. "K♣" or "★". */
export function cardShort(card: Card): string {
  if (isJoker(card)) return '★'
  return `${RANK_SHORT[card.rank]}${SUIT_SYMBOLS[card.suit]}`
}

/** The two standard jokers: id 0 = colored/red, id 1 = black/monochrome. */
export function jokers(): Card[] {
  return [joker(0), joker(1)]
}

/**
 * A full 52-card deck in canonical order (suit-major, ascending rank).
 * Pass `withJokers` to append the two jokers (54-card deck).
 */
export function standardDeck(withJokers = false): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit })
    }
  }
  if (withJokers) deck.push(...jokers())
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
