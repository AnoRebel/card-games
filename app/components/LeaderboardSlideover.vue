<script setup lang="ts">
/**
 * Leaderboard as a slideover (no scrolling needed). Separates public / private /
 * offline boards via a scope toggle.
 */
import type { LeaderboardScope } from '~/composables/useLeaderboard'

const props = defineProps<{ gameId: string }>()
const open = defineModel<boolean>('open', { default: false })

const scope = ref<LeaderboardScope>('all')
const { rows } = useLeaderboard(
  () => props.gameId,
  () => scope.value,
)
const modalUi = useThemedModalUi()
const medal = (i: number) => ['🥇', '🥈', '🥉'][i] ?? `${i + 1}`

// `labelKey` resolves via $t in the template so scope labels follow the locale.
const scopes: { id: LeaderboardScope; labelKey: string; icon: string }[] = [
  { id: 'all', labelKey: 'leaderboard.scopeAll', icon: 'i-lucide-list' },
  { id: 'public', labelKey: 'leaderboard.scopePublic', icon: 'i-lucide-globe' },
  { id: 'private', labelKey: 'leaderboard.scopePrivate', icon: 'i-lucide-lock' },
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

        <p v-if="!rows.length" class="text-sm" :style="{ color: 'var(--cg-text-muted)' }">
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
