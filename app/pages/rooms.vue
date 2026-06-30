<script setup lang="ts">
/**
 * Public rooms lobby — browse open, public games and jump in to spectate (or
 * take a seat if the lobby still has room). Locked rooms never appear here.
 * Polls the room list so newly created rooms show up without a manual refresh.
 */
import { getGame } from '@card-games/engine-core'

interface PublicRoomInfo {
  id: string
  gameId: string
  phase: 'lobby' | 'in-progress' | 'finished'
  seated: number
  spectators: number
  maxPlayers: number
  startedAt: string | null
}

const { $t } = useI18n()
useHead({ title: () => $t('lobby.browseRooms') })

const { data, refresh, pending } = await useFetch<{ rooms: PublicRoomInfo[] }>(
  '/api/rooms',
  { default: () => ({ rooms: [] }) },
)
const rooms = computed(() => data.value?.rooms ?? [])

// Light polling so the list stays fresh while a player waits.
let timer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  timer = setInterval(() => refresh(), 5000)
})
onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})

const gameName = (id: string) => getGame(id)?.meta.name ?? id
const phaseLabel = (p: PublicRoomInfo['phase']) =>
  p === 'lobby'
    ? $t('lobby.phaseLobby')
    : p === 'in-progress'
      ? $t('lobby.phaseInProgress')
      : $t('lobby.phaseFinished')

const router = useRouter()
function spectate(r: PublicRoomInfo) {
  router.push({ path: `/play/${r.gameId}`, query: { room: r.id, spectate: '1' } })
}
function joinSeat(r: PublicRoomInfo) {
  router.push({ path: `/play/${r.gameId}`, query: { room: r.id } })
}
const hasSeat = (r: PublicRoomInfo) => r.phase === 'lobby' && r.seated < r.maxPlayers
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-2 min-w-0">
        <UButton to="/" variant="ghost" color="neutral" size="sm" icon="i-lucide-arrow-left" square />
        <h1 class="text-xl font-bold flex items-center gap-2">
          <UIcon name="i-lucide-radio" :style="{ color: 'var(--cg-accent)' }" />
          {{ $t('lobby.browseRooms') }}
        </h1>
      </div>
      <UButton
        variant="ghost"
        color="neutral"
        size="sm"
        icon="i-lucide-refresh-cw"
        :loading="pending"
        :title="$t('common.refresh')"
        :aria-label="$t('common.refresh')"
        @click="refresh()"
      />
    </div>

    <p class="text-sm" :style="{ color: 'var(--cg-text-muted)' }">
      {{ $t('lobby.browseRoomsHint') }}
    </p>

    <div
      v-if="!rooms.length"
      class="cg-surface rounded-2xl p-10 text-center space-y-2"
    >
      <p class="text-3xl">🪑</p>
      <p class="text-sm" :style="{ color: 'var(--cg-text-muted)' }">
        {{ $t('lobby.noPublicRooms') }}
      </p>
    </div>

    <ul v-else class="space-y-2">
      <li
        v-for="r in rooms"
        :key="r.id"
        class="cg-surface rounded-xl p-3 flex items-center gap-3 flex-wrap"
      >
        <div class="min-w-0 flex-1">
          <p class="font-semibold truncate">{{ gameName(r.gameId) }}</p>
          <p class="text-xs flex flex-wrap items-center gap-x-3 gap-y-0.5" :style="{ color: 'var(--cg-text-muted)' }">
            <span class="inline-flex items-center gap-1">
              <UIcon name="i-lucide-hash" /> {{ r.id }}
            </span>
            <span class="inline-flex items-center gap-1">
              <UIcon name="i-lucide-users" /> {{ r.seated }}/{{ r.maxPlayers }}
            </span>
            <span class="inline-flex items-center gap-1">
              <UIcon name="i-lucide-eye" /> {{ r.spectators }}
            </span>
            <span
              class="inline-flex items-center gap-1 rounded-full px-2 py-0.5"
              :style="{ background: 'var(--cg-surface-solid)' }"
            >
              {{ phaseLabel(r.phase) }}
            </span>
          </p>
        </div>
        <div class="flex gap-2">
          <UButton
            v-if="hasSeat(r)"
            size="sm"
            color="primary"
            icon="i-lucide-log-in"
            @click="joinSeat(r)"
          >
            {{ $t('lobby.joinAsPlayer') }}
          </UButton>
          <UButton
            size="sm"
            variant="outline"
            color="neutral"
            icon="i-lucide-eye"
            @click="spectate(r)"
          >
            {{ $t('lobby.spectate') }}
          </UButton>
        </div>
      </li>
    </ul>
  </div>
</template>
