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
  isJoker,
  joker,
  jokers,
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

  describe('jokers', () => {
    it('there are exactly two jokers with distinct ids (j0 colored, j1 black)', () => {
      const js = jokers()
      expect(js).toHaveLength(2)
      expect(js.map(cardId)).toEqual(['j0', 'j1'])
      expect(js.every(isJoker)).toBe(true)
    })

    it('standardDeck(true) is 54 unique cards including 2 jokers', () => {
      const deck = standardDeck(true)
      expect(deck).toHaveLength(54)
      expect(new Set(deck.map(cardId)).size).toBe(54)
      expect(deck.filter(isJoker)).toHaveLength(2)
    })

    it('deckWithout never includes jokers', () => {
      expect(deckWithout([2, 8, 9, 10]).some(isJoker)).toBe(false)
    })

    it('joker cardId round-trips and has no sprite', () => {
      for (const j of jokers()) {
        expect(parseCardId(cardId(j))).toEqual(j)
        expect(spriteId(j)).toBe('')
      }
    })

    it('joker names/short labels', () => {
      expect(cardName(joker(0))).toBe('Red Joker')
      expect(cardName(joker(1))).toBe('Black Joker')
      expect(cardShort(joker(0))).toBe('★')
    })

    it('isJoker is false for normal cards', () => {
      expect(isJoker({ rank: 8, suit: 'c' })).toBe(false)
    })
  })
})
