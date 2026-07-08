/**
 * The signed-in device's own play stats, aggregated from the local `results`
 * table (Dexie). Keyed to the stable identity id (usePlayerIdentity), so it
 * reflects THIS person's history — games played, win rate, current/best win
 * streak, and a per-game breakdown. Purely local; the honest "your journey"
 * view that pairs with the (forgeable) offline leaderboard.
 */
import { useDb, type GameResult } from '~/db'

export interface GameBreakdown {
  gameId: string
  played: number
  wins: number
}

export interface PlayerStats {
  played: number
  wins: number
  winRate: number // 0..1
  currentStreak: number
  bestStreak: number
  byGame: GameBreakdown[]
  lastPlayed: string | null
}

const EMPTY: PlayerStats = {
  played: 0, wins: 0, winRate: 0, currentStreak: 0, bestStreak: 0, byGame: [], lastPlayed: null,
}

export function usePlayerStats(playerId: MaybeRefOrGetter<string>) {
  const db = useDb()
  const pid = computed(() => toValue(playerId))

  const results = useLiveQuery<GameResult[]>(
    () =>
      pid.value
        ? db.results.where('playerId').equals(pid.value).toArray()
        : Promise.resolve([]),
    [],
  )

  const stats = computed<PlayerStats>(() => {
    const rows = [...results.value].sort((a, b) => a.playedAt.localeCompare(b.playedAt))
    if (!rows.length) return EMPTY

    let wins = 0
    let cur = 0
    let best = 0
    const byGame = new Map<string, GameBreakdown>()
    for (const r of rows) {
      if (r.won) { wins++; cur++; best = Math.max(best, cur) } else { cur = 0 }
      const g = byGame.get(r.gameId) ?? { gameId: r.gameId, played: 0, wins: 0 }
      g.played++
      if (r.won) g.wins++
      byGame.set(r.gameId, g)
    }
    return {
      played: rows.length,
      wins,
      winRate: wins / rows.length,
      currentStreak: cur, // streak up to the most recent game
      bestStreak: best,
      byGame: [...byGame.values()].sort((a, b) => b.played - a.played),
      lastPlayed: rows[rows.length - 1]!.playedAt,
    }
  })

  return { stats, results }
}
