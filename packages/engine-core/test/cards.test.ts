import { describe, it, expect } from 'vitest'
import {
  standardDeck,
  deckWithout,
  spriteId,
  cardId,
  parseCardId,
  cardName,
  cardShort,
  isRed,
} from '../src/index'

describe('card model', () => {
  it('standard deck has 52 unique cards', () => {
    const deck = standardDeck()
    expect(deck).toHaveLength(52)
    expect(new Set(deck.map(cardId)).size).toBe(52)
  })

  it('deckWithout strips ranks (Albastini: remove 2,8,9,10 → 36)', () => {
    const deck = deckWithout([2, 8, 9, 10])
    expect(deck).toHaveLength(36)
    expect(deck.some((c) => [2, 8, 9, 10].includes(c.rank))).toBe(false)
  })

  it('spriteId matches the DeckCards.svg key <rank><suit>', () => {
    expect(spriteId({ rank: 13, suit: 'c' })).toBe('13c')
    expect(spriteId({ rank: 1, suit: 'h' })).toBe('1h')
  })

  it('parseCardId round-trips cardId', () => {
    for (const card of standardDeck()) {
      expect(parseCardId(cardId(card))).toEqual(card)
    }
  })

  it('parseCardId rejects malformed ids', () => {
    expect(() => parseCardId('14c')).toThrow()
    expect(() => parseCardId('5x')).toThrow()
  })

  it('names and colours are correct', () => {
    expect(cardName({ rank: 13, suit: 'c' })).toBe('King of clubs')
    expect(cardShort({ rank: 1, suit: 'h' })).toBe('A♥')
    expect(isRed('h')).toBe(true)
    expect(isRed('d')).toBe(true)
    expect(isRed('c')).toBe(false)
    expect(isRed('s')).toBe(false)
  })
})
