/**
 * POST /api/rooms — create a room. Returns the room id and (for locked rooms)
 * the spectator passcode the host can bake into a spectator link.
 */
import { requireGame } from '@card-games/engine-core'
import { getRoomHub } from '../utils/roomHub'
import type { RoomConfig, SpectatorVisibility } from '../utils/roomTypes'

interface CreateBody {
  gameId: string
  gameConfig?: unknown
  playerCount?: number
  spectatorVisibility?: SpectatorVisibility
  spectatorPasscode?: string
  /** Optional memorable room id; sanitized server-side, falls back if taken. */
  customId?: string
  /** Optional per-turn time limit (ms); auto-plays an idle seat on expiry. */
  turnTimeoutMs?: number
}

export default defineEventHandler(async (event) => {
  const body = await readBody<CreateBody>(event)
  if (!body?.gameId) {
    throw createError({ statusCode: 400, statusMessage: 'gameId required' })
  }

  // Touch the hub first so games are registered in this server runtime.
  const hub = getRoomHub()

  let game
  try {
    game = requireGame(body.gameId)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'unknown game' })
  }

  const visibility: SpectatorVisibility = body.spectatorVisibility ?? 'public'
  // Generate a passcode for locked rooms when none supplied.
  const passcode =
    visibility === 'locked'
      ? (body.spectatorPasscode || Math.abs(Date.now() % 1_000_000).toString().padStart(6, '0'))
      : ''

  const maxPlayers = Math.min(
    body.playerCount ?? game.meta.maxPlayers,
    game.meta.maxPlayers,
  )

  const config: RoomConfig = {
    gameId: body.gameId,
    gameConfig: body.gameConfig ?? game.defaultConfig(),
    maxPlayers,
    minPlayers: game.meta.minPlayers,
    spectatorVisibility: visibility,
    spectatorPasscode: passcode,
    // Clamp to a sane range (5s–120s) if a limit was requested.
    turnTimeoutMs:
      body.turnTimeoutMs && body.turnTimeoutMs > 0
        ? Math.min(120_000, Math.max(5_000, body.turnTimeoutMs))
        : undefined,
  }

  const roomId = hub.createRoom(config, body.customId)
  return {
    roomId,
    spectatorVisibility: visibility,
    spectatorPasscode: passcode || undefined,
  }
})
