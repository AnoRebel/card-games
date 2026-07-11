<script setup lang="ts">
/**
 * Online room controls. Reads REACTIVE room metadata (host, visibility, phase,
 * spectator) from the session so the Start button + Public/Private badge update
 * correctly. Spectators see a read-only indicator and no share/host controls.
 */
import type { WsTransport, RoomInfo } from '~/transports/WsTransport'
import type { BaseGameState, BaseMove } from '@card-games/engine-core'

const props = defineProps<{
  transport: WsTransport<BaseGameState, BaseMove>
  shareUrl: string
  spectatorUrl: string
  passcode?: string | null
}>()

const session = useGameSession(props.transport)
const { copy } = useClipboard()
const { track } = useAnalytics()
const copiedKey = ref<string | null>(null)

function copyAs(key: string, value: string) {
  copy(value)
  track('share_link_copied', { kind: key })
  copiedKey.value = key
  setTimeout(() => {
    if (copiedKey.value === key) copiedKey.value = null
  }, 1500)
}

const info = computed(
  () => (session.roomInfo.value ?? null) as RoomInfo | null,
)
const isHost = computed(() => info.value?.isHost ?? false)
const amSpectator = computed(() => info.value?.amSpectator ?? false)
const isLocked = computed(() => info.value?.visibility === 'locked')
const phase = computed(() => info.value?.phase ?? 'lobby')
const seated = computed(() => info.value?.seated ?? 0)
const here = computed(() => info.value?.here ?? 0)
const minPlayers = computed(() => info.value?.minPlayers ?? 2)
const canStart = computed(
  () => isHost.value && phase.value === 'lobby' && seated.value >= minPlayers.value,
)

// Reconnect countdown: when a seated player drops mid-game the server sets a
// grace deadline; show a live countdown so everyone knows the game will end if
// they don't return. A 1s ticker drives the remaining seconds.
const now = ref(Date.now())
let ticker: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  ticker = setInterval(() => (now.value = Date.now()), 500)
})
onBeforeUnmount(() => {
  if (ticker) clearInterval(ticker)
})
const graceSeconds = computed(() => {
  const until = info.value?.disconnectGraceUntil ?? null
  if (!until) return null
  const s = Math.ceil((until - now.value) / 1000)
  return s > 0 ? s : 0
})

// Socket connection state — show a "reconnecting" banner on a transient drop so
// the player knows the game isn't lost (the server holds their seat).
const connState = ref(props.transport.getConnectionState())
let offConn: (() => void) | null = null
onMounted(() => { offConn = props.transport.onConnection((s) => { connState.value = s }) })
onBeforeUnmount(() => offConn?.())
</script>

<template>
  <div class="space-y-2">
    <!-- Our own socket dropped — reconnecting (server holds our seat) -->
    <UAlert
      v-if="connState === 'reconnecting'"
      color="warning"
      variant="subtle"
      icon="i-lucide-wifi-off"
      :title="$t('room.reconnecting')"
      :description="$t('room.reconnectingBody')"
    />

    <!-- Reconnect countdown (a seated player dropped mid-game) -->
    <UAlert
      v-if="graceSeconds !== null"
      color="warning"
      variant="subtle"
      icon="i-lucide-user-x"
      :title="$t('game.playerLeftTitle')"
      :description="$t('game.playerLeftCountdown', { count: graceSeconds })"
    />

    <div class="cg-surface rounded-xl p-2.5 flex flex-wrap items-center gap-2">
    <UBadge color="info" variant="subtle" icon="i-lucide-users">
      {{ $t('game.seated', { count: seated }) }} ·
      {{ $t('game.here', { count: here }) }}
    </UBadge>

    <!-- Spectator indicator (read-only) -->
    <UBadge v-if="amSpectator" color="neutral" variant="subtle" icon="i-lucide-eye">
      {{ $t('common.spectating') }}
    </UBadge>

    <UBadge
      :color="isLocked ? 'warning' : 'success'"
      variant="subtle"
      :icon="isLocked ? 'i-lucide-lock' : 'i-lucide-globe'"
    >
      {{ isLocked ? $t('common.private') : $t('common.public') }}
    </UBadge>

    <!-- Click/focus (default) mode so the help is reachable by keyboard and
         touch, not hover-only. -->
    <UPopover>
      <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-info" :aria-label="$t('room.aboutLinks')" />
      <template #content>
        <div class="p-3 text-xs max-w-64 space-y-1.5" :style="{ color: 'var(--cg-text-muted)' }">
          <p><strong class="text-default">{{ $t('room.playerLink') }}</strong> — {{ $t('room.playerLinkExplain') }}</p>
          <p><strong class="text-default">{{ $t('room.spectatorLink') }}</strong> — {{ $t('room.spectatorLinkExplain') }}</p>
          <p v-if="isLocked">{{ $t('room.privateExplain') }}</p>
          <p v-else>{{ $t('room.publicExplain') }}</p>
        </div>
      </template>
    </UPopover>

    <!-- Share controls: PLAYERS only (spectators can't invite). The QR popover
         carries both the player and spectator links (QR + copy + native share);
         the passcode stays a separate chip since it's not a link. -->
    <template v-if="!amSpectator">
      <RoomShare :share-url="shareUrl" :spectator-url="spectatorUrl || undefined" :title="$t('app.title')" />
      <UButton
        v-if="passcode"
        size="xs"
        variant="soft"
        color="warning"
        icon="i-lucide-key-round"
        :title="$t('room.copyPasscode')"
        @click="copyAs('code', passcode)"
      >
        {{ copiedKey === 'code' ? $t('game.copied') : passcode }}
      </UButton>
    </template>

    <span class="flex-1" />

    <!-- Host controls -->
    <template v-if="isHost">
      <UButton
        size="xs"
        color="primary"
        icon="i-lucide-play"
        :disabled="!canStart"
        :title="canStart ? $t('room.startGame') : $t('room.needPlayers', { min: minPlayers })"
        @click="transport.startGame()"
      >
        {{ $t('common.start') }}
      </UButton>
      <UButton
        v-if="phase === 'in-progress'"
        size="xs"
        color="error"
        variant="soft"
        icon="i-lucide-square"
        :title="$t('room.endGame')"
        @click="transport.endGame()"
      >
        {{ $t('common.end') }}
      </UButton>
    </template>
    <UBadge v-else color="neutral" variant="subtle">
      {{ phase === 'lobby' ? $t('room.waitingForHost') : $t(`lobby.phase${phase === 'in-progress' ? 'InProgress' : 'Finished'}`) }}
    </UBadge>
    </div>
  </div>
</template>
