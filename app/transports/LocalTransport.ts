/**
 * LocalTransport — offline play. Runs the engine in-memory with no network.
 *
 * Supports hotseat (the human viewer follows the active human seat) and
 * bot-filled seats. Same `GameTransport` surface as the online transport, so
 * the UI is identical for both (design D3 / transport parity).
 */
import {
  type BaseGameState,
  type BaseMove,
  type GameModule,
  type Player,
  type Seat,
  applyMove,
} from '@card-games/engine-core'
import { chooseBotMove } from './bot'
import type {
  ChatMessage,
  GameTransport,
  PresenceInfo,
  TransportView,
} from './types'

export interface LocalTransportOptions<S extends BaseGameState, M extends BaseMove, C> {
  game: GameModule<S, M, C>
  players: Player[]
  config: C
  seed: string | number
  /** Human-controlled seats (others are bots). Hotseat = all humans. */
  humanSeats: Seat[]
  /** ms delay before a bot acts, for watchability. */
  botDelayMs?: number
  /** Stamp messages without engine Date use (injected by the caller). */
  now?: () => string
}

export class LocalTransport<
  S extends BaseGameState,
  M extends BaseMove,
  C,
> implements GameTransport<S, M>
{
  readonly mode = 'local' as const

  private game: GameModule<S, M, C>
  private state: S
  private humanSeats: Set<Seat>
  private players: Player[]
  private botDelayMs: number
  private now: () => string

  private changeCbs = new Set<(v: TransportView<S, M>) => void>()
  private chatCbs = new Set<(m: ChatMessage[]) => void>()
  private chat: ChatMessage[] = []
  private botTimer: ReturnType<typeof setTimeout> | null = null
  private destroyed = false

  constructor(opts: LocalTransportOptions<S, M, C>) {
    this.game = opts.game
    this.players = opts.players
    this.humanSeats = new Set(opts.humanSeats)
    this.botDelayMs = opts.botDelayMs ?? 600
    this.now = opts.now ?? (() => new Date().toISOString())
    this.state = opts.game.createInitialState(
      opts.config,
      opts.players,
      opts.seed,
    )
    this.scheduleBotIfNeeded()
  }

  /** In hotseat, the viewer IS whoever's turn it is (among humans). */
  get viewerSeat(): Seat | null {
    const active = this.state.activeSeat
    if (active !== null && this.humanSeats.has(active)) return active
    // Default to the first human seat when it's a bot's turn (read-only view).
    return this.humanSeats.size ? [...this.humanSeats][0]! : null
  }

  getView(): TransportView<S, M> {
    const viewer = this.viewerSeat
    const redacted = this.game.redactFor(this.state, viewer)
    const active = this.state.activeSeat
    const isMyTurn = active !== null && active === viewer
    return {
      ready: true,
      state: redacted,
      legalMoves:
        isMyTurn && viewer !== null
          ? this.game.getLegalMoves(this.state, viewer)
          : [],
      scores: this.game.isTerminal(this.state)
        ? this.game.getScores(this.state)
        : null,
      isMyTurn,
    }
  }

  async submitMove(move: M): Promise<{ ok: boolean; error?: string }> {
    if (this.destroyed) return { ok: false, error: 'destroyed' }
    const result = applyMove(this.game, this.state, move)
    if (!result.ok) return { ok: false, error: result.error }
    this.state = result.state
    this.emitChange()
    this.scheduleBotIfNeeded()
    return { ok: true }
  }

  private scheduleBotIfNeeded() {
    if (this.botTimer) {
      clearTimeout(this.botTimer)
      this.botTimer = null
    }
    const active = this.state.activeSeat
    if (active === null || this.game.isTerminal(this.state)) return
    if (this.humanSeats.has(active)) return // human's turn

    this.botTimer = setTimeout(() => {
      if (this.destroyed) return
      const move = chooseBotMove(this.game, this.state, active)
      if (move) void this.submitMove(move)
    }, this.botDelayMs)
  }

  onChange(cb: (v: TransportView<S, M>) => void): () => void {
    this.changeCbs.add(cb)
    cb(this.getView())
    return () => this.changeCbs.delete(cb)
  }

  private emitChange() {
    const view = this.getView()
    for (const cb of this.changeCbs) cb(view)
  }

  getPresence(): PresenceInfo[] {
    return this.players.map((p) => ({
      playerId: p.id,
      name: p.name,
      seat: p.seat,
      connected: true,
      spectator: false,
    }))
  }

  async sendChat(body: string): Promise<{ ok: boolean; error?: string }> {
    const trimmed = body.trim()
    if (!trimmed) return { ok: false, error: 'empty' }
    if (trimmed.length > 500) return { ok: false, error: 'too-long' }
    const viewer = this.viewerSeat
    const player = this.players.find((p) => p.seat === viewer)
    this.chat = [
      ...this.chat,
      {
        id: `${this.chat.length}-${this.state.version}`,
        senderId: player?.id ?? 'local',
        senderName: player?.name ?? 'You',
        body: trimmed,
        at: this.now(),
      },
    ]
    for (const cb of this.chatCbs) cb(this.chat)
    return { ok: true }
  }

  onChat(cb: (m: ChatMessage[]) => void): () => void {
    this.chatCbs.add(cb)
    cb(this.chat)
    return () => this.chatCbs.delete(cb)
  }

  getChat(): ChatMessage[] {
    return this.chat
  }

  getPlayers(): Player[] {
    return this.players
  }

  destroy() {
    this.destroyed = true
    if (this.botTimer) clearTimeout(this.botTimer)
    this.changeCbs.clear()
    this.chatCbs.clear()
  }
}
