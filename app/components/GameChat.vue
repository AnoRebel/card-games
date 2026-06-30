<script setup lang="ts">
/**
 * Floating chat — draggable (move via header) and resizable (CSS resize handle).
 * Minimizable to a bubble with an unread-message badge. Position/size persist.
 */
import { format } from 'date-fns'
import { TZDate } from '@date-fns/tz'
import { useDraggable } from '@vueuse/core'
import type { GameTransport } from '~/transports/types'

const props = defineProps<{ transport: GameTransport; name: string }>()

const session = useGameSession(props.transport)
const draft = ref('')
const open = ref(false)
const unread = ref(0)
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
const listRef = ref<HTMLElement | null>(null)
const handleRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)

// Persisted panel position (bottom-right by default via initialValue).
const stored = useLocalStorage('cg:chat-pos', { x: -1, y: -1 })
const initial =
  import.meta.client && stored.value.x >= 0
    ? { x: stored.value.x, y: stored.value.y }
    : { x: 0, y: 0 }

const { x, y, style } = useDraggable(panelRef, {
  handle: handleRef,
  initialValue: initial,
  preventDefault: true,
  onEnd: () => {
    stored.value = { x: x.value, y: y.value }
  },
})
const positioned = computed(() => stored.value.x >= 0)

watch(
  () => session.chat.value.length,
  (n, prev) => {
    if (!open.value && n > (prev ?? 0)) unread.value += n - (prev ?? 0)
    if (open.value) nextTick(scrollToEnd)
  },
)
watch(open, (o) => {
  if (o) {
    unread.value = 0
    nextTick(scrollToEnd)
  }
})

function scrollToEnd() {
  if (listRef.value) listRef.value.scrollTop = listRef.value.scrollHeight
}
async function send() {
  const body = draft.value.trim()
  if (!body) return
  const res = await session.sendChat(body)
  if (res.ok) draft.value = ''
}
function time(iso: string) {
  try {
    return format(new TZDate(iso, tz), 'HH:mm')
  } catch {
    return ''
  }
}
</script>

<template>
  <div>
    <!-- Panel (draggable + resizable) -->
    <Transition name="chat-pop">
      <div
        v-if="open"
        ref="panelRef"
        class="fixed z-50 rounded-2xl overflow-hidden shadow-2xl flex flex-col resize"
        :class="positioned ? '' : 'bottom-4 right-4'"
        :style="[
          positioned ? style : {},
          {
            background: 'var(--cg-surface-solid)',
            border: '1px solid var(--cg-border)',
            width: '20rem',
            height: '24rem',
            minWidth: '14rem',
            minHeight: '12rem',
            maxWidth: '90vw',
            maxHeight: '80vh',
          },
        ]"
      >
        <div
          ref="handleRef"
          class="flex items-center justify-between px-3 py-2 border-b text-sm font-semibold cursor-move select-none"
          :style="{ borderColor: 'var(--cg-border)' }"
        >
          <span class="flex items-center gap-1.5">
            <UIcon name="i-lucide-grip-horizontal" :style="{ color: 'var(--cg-text-muted)' }" />
            {{ $t('chat.title') }}
          </span>
          <UButton
            size="xs"
            variant="ghost"
            color="neutral"
            icon="i-lucide-minus"
            title="Minimize"
            @click="open = false"
          />
        </div>

        <div ref="listRef" class="flex-1 overflow-y-auto p-3 space-y-1.5 text-sm" data-tour="chat">
          <p v-if="!session.chat.value.length" :style="{ color: 'var(--cg-text-muted)' }">
            {{ $t('chat.empty') }}
          </p>
          <div v-for="m in session.chat.value" :key="m.id" class="flex gap-2">
            <span class="text-xs shrink-0 tabular-nums" :style="{ color: 'var(--cg-text-muted)' }">
              {{ time(m.at) }}
            </span>
            <span><span class="font-medium">{{ m.senderName }}:</span> {{ m.body }}</span>
          </div>
        </div>

        <form
          class="flex gap-1.5 p-2 border-t"
          :style="{ borderColor: 'var(--cg-border)' }"
          @submit.prevent="send"
        >
          <UInput v-model="draft" :placeholder="$t('chat.placeholder')" size="sm" class="flex-1" :maxlength="500" />
          <UButton type="submit" size="sm" icon="i-lucide-send" :disabled="!draft.trim()" title="Send" />
        </form>

        <!-- visible resize affordance (the panel itself is CSS-resizable) -->
        <span
          class="pointer-events-none absolute bottom-1 right-1 opacity-50"
          :style="{ color: 'var(--cg-text-muted)' }"
          aria-hidden="true"
        >
          <UIcon name="i-lucide-move-diagonal-2" class="size-3.5" />
        </span>
      </div>
    </Transition>

    <!-- Bubble -->
    <button
      v-if="!open"
      type="button"
      class="fixed bottom-4 right-4 z-50 grid place-items-center w-12 h-12 rounded-full shadow-xl transition hover:scale-105"
      :style="{ background: 'var(--cg-accent)', color: 'var(--cg-accent-contrast)' }"
      :title="$t('chat.title')"
      @click="open = true"
    >
      <UIcon name="i-lucide-message-circle" class="text-xl" />
      <span
        v-if="unread"
        class="absolute -top-1 -right-1 min-w-5 h-5 px-1 grid place-items-center rounded-full bg-red-500 text-white text-[11px] font-bold"
      >
        {{ unread > 9 ? '9+' : unread }}
      </span>
    </button>
  </div>
</template>

<style scoped>
.chat-pop-enter-active,
.chat-pop-leave-active {
  transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
  transform-origin: bottom right;
}
.chat-pop-enter-from,
.chat-pop-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(8px);
}
</style>
