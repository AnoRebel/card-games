<script setup lang="ts">
/**
 * Leaderboard slideover. The GLOBAL board is server-authoritative (only ranked
 * online matches, shared across everyone). The other scopes (all/public/private/
 * offline) are this device's LOCAL history — honest "your games", never merged
 * with the global ranking.
 */
import type { LeaderboardScope } from '~/composables/useLeaderboard'

type Scope = 'global' | LeaderboardScope
interface Row { playerId: string; playerName: string; played: number; wins: number }

const props = defineProps<{ gameId: string }>()
const open = defineModel<boolean>('open', { default: false })

const scope = ref<Scope>('global')
const localScope = computed<LeaderboardScope>(() =>
  scope.value === 'global' ? 'all' : scope.value,
)
const { rows: localRows } = useLeaderboard(() => props.gameId, () => localScope.value)

// Global board — fetched from the server (only when the tab is active + open).
const globalUnavailable = ref(false)
const { data: globalData } = await useAsyncData(
  () => `lb-${props.gameId}`,
  async () => {
    try {
      const res = await $fetch<{ rows: Row[]; unavailable?: boolean }>(`/api/leaderboard/${props.gameId}`)
      globalUnavailable.value = !!res.unavailable
      return res.rows
    } catch {
      globalUnavailable.value = true
      return [] as Row[]
    }
  },
  { watch: [() => props.gameId, open], server: false, immediate: false },
)

const rows = computed<Row[]>(() =>
  scope.value === 'global' ? (globalData.value ?? []) : localRows.value,
)
const modalUi = useThemedModalUi()
const medal = (i: number) => ['🥇', '🥈', '🥉'][i] ?? `${i + 1}`

// `labelKey` resolves via $t in the template so scope labels follow the locale.
const scopes: { id: Scope; labelKey: string; icon: string }[] = [
  { id: 'global', labelKey: 'leaderboard.scopeGlobal', icon: 'i-lucide-trophy' },
  { id: 'all', labelKey: 'leaderboard.scopeAll', icon: 'i-lucide-list' },
  { id: 'offline', labelKey: 'leaderboard.scopeOffline', icon: 'i-lucide-monitor' },
]
</script>

<template>
  <USlideover v-model:open="open" :title="$t('leaderboard.title')" side="right" :ui="modalUi">
    <template #body>
      <div class="space-y-4">
        <UFieldGroup class="w-full flex-wrap">
          <UButton
            v-for="s in scopes"
            :key="s.id"
            size="xs"
            :icon="s.icon"
            :variant="scope === s.id ? 'solid' : 'outline'"
            :color="scope === s.id ? 'primary' : 'neutral'"
            class="flex-1 justify-center"
            @click="scope = s.id"
          >
            {{ $t(s.labelKey) }}
          </UButton>
        </UFieldGroup>

        <p v-if="scope === 'global' && globalUnavailable" class="text-sm" :style="{ color: 'var(--cg-text-muted)' }">
          {{ $t('leaderboard.globalUnavailable') }}
        </p>
        <p v-else-if="!rows.length" class="text-sm" :style="{ color: 'var(--cg-text-muted)' }">
          {{ $t('leaderboard.empty') }}
        </p>
        <ol v-else class="space-y-0.5">
          <li
            v-for="(row, i) in rows"
            :key="row.playerId"
            class="flex items-center gap-3 py-2 border-b last:border-b-0"
            :style="{ borderColor: 'var(--cg-border)' }"
          >
            <span class="w-7 text-center text-lg">{{ medal(i) }}</span>
            <span class="flex-1 truncate font-medium">{{ row.playerName }}</span>
            <span class="text-sm whitespace-nowrap" :style="{ color: 'var(--cg-text-muted)' }">
              {{ $t('leaderboard.wins', { count: row.wins }) }} ·
              {{ $t('leaderboard.played', { count: row.played }) }}
            </span>
          </li>
        </ol>
      </div>
    </template>
  </USlideover>
</template>
