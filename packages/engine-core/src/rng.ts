/**
 * Deterministic, seedable PRNG.
 *
 * The whole engine is deterministic: identical seed + identical moves must
 * reproduce identical state (see the `game-engine-core` spec). No engine or
 * game code may call `Math.random` — all randomness flows through here.
 *
 * Algorithm: mulberry32 — a tiny, fast, well-distributed 32-bit generator.
 * The generator is *pure-ish*: it carries its 32-bit state explicitly so it
 * can be serialized into game state and resumed exactly.
 */

/** A serializable RNG: just its 32-bit integer state. */
export interface RngState {
  seed: number
}

/** Hash an arbitrary string into a 32-bit seed (FNV-1a + avalanche). */
export function hashSeed(input: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    // FNV prime multiply via shifts to stay in 32-bit integer space.
    h = Math.imul(h, 0x01000193)
  }
  // Final avalanche so adjacent seeds diverge.
  h ^= h >>> 16
  h = Math.imul(h, 0x21f0aaad)
  h ^= h >>> 15
  h = Math.imul(h, 0x735a2d97)
  h ^= h >>> 15
  return h >>> 0
}

/** Create an RNG state from a string or numeric seed. */
export function createRng(seed: string | number): RngState {
  return { seed: (typeof seed === 'number' ? seed >>> 0 : hashSeed(seed)) >>> 0 }
}

/**
 * Advance the RNG and return the next float in [0, 1) along with the new state.
 * Pure: does not mutate the input state.
 */
export function nextFloat(state: RngState): { value: number; state: RngState } {
  const a = (state.seed + 0x6d2b79f5) >>> 0
  let t = a
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296
  return { value, state: { seed: a } }
}

/**
 * Return an integer in [0, maxExclusive) and the advanced state.
 * Pure: does not mutate the input state.
 */
export function nextInt(
  state: RngState,
  maxExclusive: number,
): { value: number; state: RngState } {
  if (maxExclusive <= 0) {
    throw new RangeError('nextInt: maxExclusive must be > 0')
  }
  const { value, state: next } = nextFloat(state)
  return { value: Math.floor(value * maxExclusive), state: next }
}

/**
 * Fisher–Yates shuffle producing a NEW array and the advanced RNG state.
 * Pure: the input array is not mutated.
 */
export function shuffle<T>(
  items: readonly T[],
  state: RngState,
): { items: T[]; state: RngState } {
  const out = items.slice()
  let s = state
  for (let i = out.length - 1; i > 0; i--) {
    const r = nextInt(s, i + 1)
    s = r.state
    const j = r.value
    const tmp = out[i] as T
    out[i] = out[j] as T
    out[j] = tmp
  }
  return { items: out, state: s }
}
