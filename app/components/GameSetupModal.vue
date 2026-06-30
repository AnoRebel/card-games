<script setup lang="ts">
/**
 * Game setup modal — pick offline vs online, players, spectator visibility.
 * Emits `start` with the chosen config. Used from the home cards and the play
 * route so there's no dedicated setup page.
 */
import { getGame } from '@card-games/engine-core'

const props = defineProps<{ gameId: string }>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{
  startOffline: [{ totalPlayers: number; humanCount: number }]
  startOnline: [
    { totalPlayers: number; visibility: 'public' | 'locked'; customId?: string },
  ]
}>()

const { $t } = useI18n()
const { name } = usePlayerIdentity()

const meta = computed(() => getGame(props.gameId)?.meta ?? null)
const counts = computed(() => meta.value?.supportedPlayerCounts ?? [2, 3, 4])
const totalPlayers = ref(2)
const humanCount = ref(1)
const visibility = ref<'public' | 'locked'>('public')
const mode = ref<'offline' | 'online'>('offline')
const customId = ref('')

watch(meta, (m) => { if (m) totalPlayers.value = m.supportedPlayerCounts[0] ?? 2 }, { immediate: true })
watch(totalPlayers, (n) => { if (humanCount.value > n) humanCount.value = n })

const title = computed(() => meta.value?.name ?? 'Game')
const modalUi = useThemedModalUi()

function start() {
  open.value = false
  if (mode.value === 'offline') {
    emit('startOffline', { totalPlayers: totalPlayers.value, humanCount: humanCount.value })
  } else {
    emit('startOnline', {
      totalPlayers: totalPlayers.value,
      visibility: visibility.value,
      customId: customId.value.trim() || undefined,
    })
  }
}
</script>

<template>
  <UModal v-model:open="open" :title="`${$t('common.play')} ${title}`" :ui="modalUi">
    <template #body>
      <div class="space-y-4">
        <UFormField :label="$t('common.yourName')" size="sm">
          <UInput v-model="name" size="sm" />
        </UFormField>

        <!-- mode -->
        <UFieldGroup class="w-full">
          <UButton
            class="flex-1 justify-center"
            icon="i-lucide-monitor"
            :variant="mode === 'offline' ? 'solid' : 'outline'"
            color="primary"
            @click="mode = 'offline'"
          >
            {{ $t('lobby.playOffline') }}
          </UButton>
          <UButton
            class="flex-1 justify-center"
            icon="i-lucide-wifi"
            :variant="mode === 'online' ? 'solid' : 'outline'"
            color="primary"
            @click="mode = 'online'"
          >
            {{ $t('lobby.playOnline') }}
          </UButton>
        </UFieldGroup>

        <div class="grid grid-cols-2 gap-3">
          <UFormField :label="$t('common.players')" size="sm">
            <USelect
              v-model="totalPlayers"
              size="sm"
              :items="counts.map((c) => ({ label: `${c}`, value: c }))"
            />
          </UFormField>
          <UFormField v-if="mode === 'offline'" :label="$t('lobby.humans')" size="sm">
            <USelect
              v-model="humanCount"
              size="sm"
              :items="Array.from({ length: totalPlayers }, (_, i) => ({ label: `${i + 1}`, value: i + 1 }))"
            />
          </UFormField>
          <UFormField v-else :label="$t('lobby.spectators')" size="sm">
            <USelect
              v-model="visibility"
              size="sm"
              :items="[
                { label: $t('lobby.spectatorPublic'), value: 'public' },
                { label: $t('lobby.spectatorLocked'), value: 'locked' },
              ]"
            />
          </UFormField>
        </div>

        <UFormField
          v-if="mode === 'online'"
          :label="$t('lobby.customRoomId')"
          :hint="$t('common.optional')"
          size="sm"
        >
          <UInput
            v-model="customId"
            size="sm"
            class="w-full"
            :placeholder="$t('lobby.customRoomIdPlaceholder')"
            icon="i-lucide-hash"
          />
        </UFormField>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton variant="ghost" color="neutral" @click="open = false">
          {{ $t('game.cancel') }}
        </UButton>
        <UButton color="primary" icon="i-lucide-play" @click="start">
          {{ $t('common.start') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
