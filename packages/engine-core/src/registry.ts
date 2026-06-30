/**
 * Game registry.
 *
 * Games register themselves here; the app/transport layers look them up by id
 * with no game-specific imports. Pure and framework-free.
 */

import type { BaseGameState, BaseMove, GameModule } from './types'

// Loosely-typed module alias for storage — concrete games keep their own types.
type AnyGameModule = GameModule<BaseGameState, BaseMove, unknown>

const registry = new Map<string, AnyGameModule>()

/** Register a game module (idempotent overwrite by id). */
export function registerGame(game: AnyGameModule): void {
  registry.set(game.id, game)
}

/** Get a registered game by id, or undefined. */
export function getGame(id: string): AnyGameModule | undefined {
  return registry.get(id)
}

/** Get a registered game by id, throwing if missing. */
export function requireGame(id: string): AnyGameModule {
  const game = registry.get(id)
  if (!game) {
    throw new Error(`No game registered with id "${id}"`)
  }
  return game
}

/** List all registered games (metadata-friendly). */
export function listGames(): AnyGameModule[] {
  return [...registry.values()]
}

/** Test/host helper: clear the registry. */
export function clearGames(): void {
  registry.clear()
}
