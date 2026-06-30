import { describe, it, expect } from 'vitest'
import {
  createRng,
  nextFloat,
  nextInt,
  shuffle,
  hashSeed,
  standardDeck,
} from '../src/index'

describe('seeded RNG', () => {
  it('is pure: nextFloat does not mutate input state', () => {
    const s = createRng('abc')
    const snapshot = { ...s }
    nextFloat(s)
    expect(s).toEqual(snapshot)
  })

  it('produces identical sequences for identical seeds', () => {
    const seqOf = (seed: string) => {
      let s = createRng(seed)
      const out: number[] = []
      for (let i = 0; i < 20; i++) {
        const r = nextFloat(s)
        out.push(r.value)
        s = r.state
      }
      return out
    }
    expect(seqOf('hello')).toEqual(seqOf('hello'))
  })

  it('produces different sequences for different seeds', () => {
    const first = nextFloat(createRng('seed-a')).value
    const second = nextFloat(createRng('seed-b')).value
    expect(first).not.toEqual(second)
  })

  it('nextFloat stays within [0, 1)', () => {
    let s = createRng(12345)
    for (let i = 0; i < 1000; i++) {
      const r = nextFloat(s)
      expect(r.value).toBeGreaterThanOrEqual(0)
      expect(r.value).toBeLessThan(1)
      s = r.state
    }
  })

  it('nextInt stays within [0, max) and rejects non-positive max', () => {
    let s = createRng('x')
    for (let i = 0; i < 200; i++) {
      const r = nextInt(s, 7)
      expect(r.value).toBeGreaterThanOrEqual(0)
      expect(r.value).toBeLessThan(7)
      s = r.state
    }
    expect(() => nextInt(createRng('y'), 0)).toThrow()
  })

  it('hashSeed is stable and 32-bit', () => {
    expect(hashSeed('deal')).toBe(hashSeed('deal'))
    expect(hashSeed('deal')).toBeGreaterThanOrEqual(0)
    expect(hashSeed('deal')).toBeLessThanOrEqual(0xffffffff)
  })
})

describe('seeded shuffle (deal reproducibility)', () => {
  it('same seed shuffles a deck identically', () => {
    const a = shuffle(standardDeck(), createRng('deal-1')).items
    const b = shuffle(standardDeck(), createRng('deal-1')).items
    expect(a).toEqual(b)
  })

  it('different seeds shuffle differently', () => {
    const a = shuffle(standardDeck(), createRng('deal-1')).items
    const b = shuffle(standardDeck(), createRng('deal-2')).items
    expect(a).not.toEqual(b)
  })

  it('is a permutation: no cards lost or duplicated', () => {
    const deck = standardDeck()
    const { items } = shuffle(deck, createRng('p'))
    expect(items).toHaveLength(52)
    expect(new Set(items.map((c) => `${c.rank}${c.suit}`)).size).toBe(52)
  })

  it('does not mutate the input array', () => {
    const deck = standardDeck()
    const copy = deck.slice()
    shuffle(deck, createRng('z'))
    expect(deck).toEqual(copy)
  })
})
