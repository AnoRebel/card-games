/**
 * Build a LocalTransport for an offline game from the engine registry.
 *
 * Per-tab game session metadata (which game, seats) is the kind of state that
 * lives in sessionStorage when persisted, but the live transport itself is
 * held in component scope (recreated on reload).
 */
import {
  requireGame,
  type BaseGameState,
  type BaseMove,
  type Player,
} from '@card-games/engine-core'
import { LocalTransport } from '~/transports/LocalTransport'

export interface LocalGameSetup {
  gameId: string
  /** Number of seats; remaining (non-human) seats become bots. */
  totalPlayers: number
  humanCount: number
  /** Display names for human seats (seat 0..humanCount-1). */
  humanNames?: string[]
  seed?: string
  config?: unknown
}

let seedCounter = 0

export function createLocalTransport(setup: LocalGameSetup) {
  const game = requireGame(setup.gameId)

  const players: Player[] = []
  for (let seat = 0; seat < setup.totalPlayers; seat++) {
    const isHuman = seat < setup.humanCount
    players.push({
      id: isHuman ? `you-${seat}` : `bot-${seat}`,
      name: isHuman
        ? (setup.humanNames?.[seat] ?? `Player ${seat + 1}`)
        : `Bot ${seat + 1}`,
      seat,
      bot: !isHuman,
    })
  }

  const humanSeats = players.filter((p) => !p.bot).map((p) => p.seat)
  const config = setup.config ?? game.defaultConfig()
  // Seeds vary per launch without ambient RNG in engine code: a UI-side counter
  // combined with the chosen seed keeps deals fresh yet reproducible per launch.
  const seed = setup.seed ?? `local-${setup.gameId}-${seedCounter++}`

  return new LocalTransport<BaseGameState, BaseMove, unknown>({
    game,
    players,
    config,
    seed,
    humanSeats,
  })
}
