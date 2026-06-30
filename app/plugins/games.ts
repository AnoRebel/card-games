/**
 * Register all game modules with the engine registry at app startup, so the
 * registry is the single lookup point for game logic (no game-specific imports
 * scattered through the UI).
 */
import { registerLastCard } from '@card-games/game-last-card'
import { registerAlbastini } from '@card-games/game-albastini'

export default defineNuxtPlugin(() => {
  registerLastCard()
  registerAlbastini()
})
