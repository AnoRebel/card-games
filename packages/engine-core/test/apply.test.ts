import { describe, it, expect, beforeEach } from 'vitest'
import {
  applyMove,
  replay,
  hasLegalMove,
  registerGame,
  getGame,
  requireGame,
  listGames,
  clearGames,
  createRng,
  nextInt,
  type BaseGameState,
  type BaseMove,
  type GameModule,
  type Player,
  type ReducerResult,
  type Seat,
} from '../src/index'

/**
 * Minimal mock game to exercise the engine's generic machinery:
 * each seat, in turn, adds a deterministic RNG-derived number to a shared
 * total; the game ends after `players.length * 2` moves. The highest
 * contributor wins.
 */
interface MockState extends BaseGameState {
  total: number
  contributions: Record<Seat, number>
  movesMade: number
  maxMoves: number
}

interface MockMove extends BaseMove {
  type: 'add'
}

const mockGame: GameModule<MockState, MockMove, unknown> = {
  id: 'mock',
  meta: {
    id: 'mock',
    name: 'Mock',
    tagline: 't',
    minPlayers: 2,
    maxPlayers: 4,
    supportedPlayerCounts: [2, 3, 4],
  },
  defaultConfig: () => ({}),
  createInitialState(_config, players, seed) {
    return {
      gameId: 'mock',
      rng: createRng(seed),
      players,
      activeSeat: 0,
      phase: 'playing',
      version: 0,
      total: 0,
      contributions: Object.fromEntries(players.map((p) => [p.seat, 0])),
      movesMade: 0,
      maxMoves: players.length * 2,
    }
  },
  reducer(state, move): ReducerResult<MockState> {
    const r = nextInt(state.rng, 100)
    const contributions = { ...state.contributions }
    contributions[move.seat] = (contributions[move.seat] ?? 0) + r.value
    const movesMade = state.movesMade + 1
    const done = movesMade >= state.maxMoves
    const nextActive = done
      ? null
      : (move.seat + 1) % state.players.length
    return {
      ok: true,
      state: {
        ...state,
        rng: r.state,
        total: state.total + r.value,
        contributions,
        movesMade,
        activeSeat: nextActive,
        phase: done ? 'finished' : 'playing',
      },
    }
  },
  getLegalMoves(state, seat) {
    if (state.activeSeat !== seat || state.phase === 'finished') return []
    return [{ type: 'add', seat }]
  },
  isTerminal: (state) => state.phase === 'finished',
  getScores(state) {
    const bySeat = state.contributions
    const max = Math.max(...Object.values(bySeat))
    const winners = Object.entries(bySeat)
      .filter(([, v]) => v === max)
      .map(([s]) => Number(s))
    return { bySeat, winners }
  },
  redactFor: (state) => state,
}

const players: Player[] = [
  { id: 'a', name: 'A', seat: 0 },
  { id: 'b', name: 'B', seat: 1 },
]

const init = (seed: string) => mockGame.createInitialState({}, players, seed)

describe('applyMove validation', () => {
  it('rejects an out-of-turn move and leaves state unchanged', () => {
    const state = init('s')
    const res = applyMove(mockGame, state, { type: 'add', seat: 1 })
    expect(res.ok).toBe(false)
    expect(res.state).toBe(state)
  })

  it('rejects an illegal move type', () => {
    const state = init('s')
    const res = applyMove(mockGame, state, {
      type: 'bogus',
      seat: 0,
    } as unknown as MockMove)
    expect(res.ok).toBe(false)
    expect(res.state).toBe(state)
  })

  it('accepts a legal move and bumps version', () => {
    const state = init('s')
    const res = applyMove(mockGame, state, { type: 'add', seat: 0 })
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.state.version).toBe(1)
      expect(res.state.activeSeat).toBe(1)
    }
  })

  it('rejects moves once terminal', () => {
    let state = init('s')
    // play the game out
    while (!mockGame.isTerminal(state) && state.activeSeat !== null) {
      const res = applyMove(mockGame, state, {
        type: 'add',
        seat: state.activeSeat,
      })
      if (res.ok) state = res.state
    }
    const res = applyMove(mockGame, state, { type: 'add', seat: 0 })
    expect(res.ok).toBe(false)
  })
})

describe('determinism & replay', () => {
  const fullLog: MockMove[] = [
    { type: 'add', seat: 0 },
    { type: 'add', seat: 1 },
    { type: 'add', seat: 0 },
    { type: 'add', seat: 1 },
  ]

  it('same seed + same moves → identical final state', () => {
    const a = replay(mockGame, init('seed-1'), fullLog)
    const b = replay(mockGame, init('seed-1'), fullLog)
    expect(a).toEqual(b)
  })

  it('different seeds → different outcomes', () => {
    const a = replay(mockGame, init('seed-1'), fullLog)
    const b = replay(mockGame, init('seed-2'), fullLog)
    expect(a.total).not.toBe(b.total)
  })

  it('incremental application equals replay', () => {
    let live = init('seed-1')
    for (const m of fullLog) {
      const res = applyMove(mockGame, live, m)
      expect(res.ok).toBe(true)
      if (res.ok) live = res.state
    }
    const replayed = replay(mockGame, init('seed-1'), fullLog)
    expect(replayed).toEqual(live)
  })

  it('replay throws on a corrupt (out-of-turn) log', () => {
    const badLog: MockMove[] = [
      { type: 'add', seat: 0 },
      { type: 'add', seat: 0 }, // seat 1 should act here
    ]
    expect(() => replay(mockGame, init('s'), badLog)).toThrow()
  })

  it('hasLegalMove reflects whose turn it is', () => {
    const state = init('s')
    expect(hasLegalMove(mockGame, state, 0)).toBe(true)
    expect(hasLegalMove(mockGame, state, 1)).toBe(false)
  })
})

describe('registry', () => {
  beforeEach(() => clearGames())

  it('registers, retrieves, requires and lists games', () => {
    registerGame(mockGame as unknown as GameModule)
    expect(getGame('mock')?.id).toBe('mock')
    expect(requireGame('mock').id).toBe('mock')
    expect(listGames()).toHaveLength(1)
  })

  it('requireGame throws on unknown id', () => {
    expect(() => requireGame('nope')).toThrow()
  })
})
