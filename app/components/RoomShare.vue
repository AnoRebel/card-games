<script setup lang="ts">
/**
 * Frictionless room invites: a QR code (scan to join — great across a table) and
 * a native share-sheet button on supporting devices, both wrapped in a popover
 * off a single "Invite" button. Falls back to copy where share isn't available.
 */
import { renderSVG } from 'uqr'

const props = defineProps<{ shareUrl: string; title?: string }>()
const { $t } = useI18n()
const { track } = useAnalytics()
const { share, isSupported: canShare } = useShare()
const { copy, copied } = useClipboard({ source: () => props.shareUrl })

// QR as an inline SVG data string (no network, no image asset).
const qrSvg = computed(() => {
  if (!props.shareUrl) return ''
  try {
    return renderSVG(props.shareUrl, { border: 2 })
  } catch {
    return ''
  }
})

async function nativeShare() {
  track('share_link_copied', { kind: 'native' })
  try {
    await share({ title: props.title ?? 'Card Games', text: $t('invite.shareText'), url: props.shareUrl })
  } catch { /* user cancelled */ }
}
</script>

<template>
  <UPopover>
    <UButton size="xs" variant="soft" color="primary" icon="i-lucide-user-plus">
      {{ $t('invite.invite') }}
    </UButton>
    <template #content>
      <div class="p-3 space-y-3 w-56 text-center">
        <p class="text-xs font-medium" :style="{ color: 'var(--cg-text-muted)' }">
          {{ $t('invite.scanToJoin') }}
        </p>
        <!-- eslint-disable-next-line vue/no-v-html -- our own generated QR SVG, not user input -->
        <div class="mx-auto w-40 h-40 rounded-lg overflow-hidden bg-white p-2 [&>svg]:w-full [&>svg]:h-full" v-html="qrSvg" />
        <div class="flex gap-2">
          <UButton
            v-if="canShare"
            size="xs"
            block
            color="primary"
            icon="i-lucide-share-2"
            @click="nativeShare"
          >
            {{ $t('invite.share') }}
          </UButton>
          <UButton
            size="xs"
            block
            variant="outline"
            color="neutral"
            :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
            @click="copy()"
          >
            {{ copied ? $t('game.copied') : $t('invite.copyLink') }}
          </UButton>
        </div>
      </div>
    </template>
  </UPopover>
</template>
