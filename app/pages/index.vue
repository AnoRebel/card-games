<script setup lang="ts">
import { standardDeck } from '@card-games/engine-core'

const { $t } = useI18n()
useHead({ title: () => $t('app.title') })

const games = [
  {
    id: 'last-card',
    name: 'Last Card',
    tagline: 'Shed your hand first — mind the action cards, and call your last!',
    players: '2–6',
    to: '/play/last-card',
    font: 'font-last-card',
    accent: 'oklch(0.72 0.15 25)',
    sample: [
      { rank: 7 as const, suit: 'h' as const },
      { rank: 11 as const, suit: 's' as const },
      { rank: 2 as const, suit: 'd' as const },
    ],
  },
  {
    id: 'albastini',
    name: 'Albastini',
    tagline: 'Trick-taking with trumps, otea bidding and the mighty Jike (7).',
    players: '2·3·4·6',
    to: '/play/albastini',
    font: 'font-albastini italic',
    accent: 'oklch(0.7 0.14 150)',
    sample: [
      { rank: 1 as const, suit: 'c' as const },
      { rank: 7 as const, suit: 'h' as const },
      { rank: 13 as const, suit: 's' as const },
    ],
  },
]

const root = ref<HTMLElement | null>(null)
onMounted(() => {
  if (root.value) dealIn(root.value.querySelectorAll('[data-reveal]'))
})

void standardDeck
</script>

<template>
  <div ref="root" class="space-y-6">
    <CardSprite />

    <section data-reveal class="pt-6 pb-2 text-center sm:text-left">
      <p
        class="text-xs font-semibold uppercase tracking-[0.2em] mb-2"
        :style="{ color: 'var(--cg-accent)' }"
      >
        offline · online · realtime
      </p>
      <h1
        class="font-display text-4xl sm:text-6xl font-extrabold tracking-tight leading-[0.95]"
      >
        {{ $t('app.tagline') }}
      </h1>
      <p class="mt-3 max-w-xl text-sm sm:text-base" :style="{ color: 'var(--cg-text-muted)' }">
        {{ $t('app.subtitle') }}
      </p>
    </section>

    <section class="grid gap-3 sm:grid-cols-2">
      <NuxtLink
        v-for="game in games"
        :key="game.id"
        :to="game.to"
        data-reveal
        class="cg-game-card group relative overflow-hidden rounded-2xl p-5 cg-surface transition-transform"
      >
        <!-- floating sample cards -->
        <div
          class="absolute -right-4 -top-2 flex opacity-90 transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-3"
        >
          <PlayingCard
            v-for="(c, i) in game.sample"
            :key="i"
            :card="c"
            :width="58"
            class="-ml-7 first:ml-0 drop-shadow-xl"
            :style="{ transform: `rotate(${(i - 1) * 8}deg)`, zIndex: i }"
          />
        </div>

        <div class="relative z-10 mt-16 sm:mt-20">
          <div class="flex items-baseline gap-2">
            <h2 :class="['text-2xl font-bold', game.font]">{{ game.name }}</h2>
            <span
              class="text-[11px] font-semibold px-1.5 py-0.5 rounded-full"
              :style="{ background: 'color-mix(in oklch, var(--cg-accent) 18%, transparent)', color: 'var(--cg-accent)' }"
            >
              {{ game.players }}
            </span>
          </div>
          <p class="mt-1.5 text-sm min-h-10" :style="{ color: 'var(--cg-text-muted)' }">
            {{ game.tagline }}
          </p>
          <div class="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold cg-accent-text">
            {{ $t('common.play') }}
            <UIcon name="i-lucide-arrow-right" class="transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </NuxtLink>
    </section>

    <section data-reveal class="flex justify-center pb-4">
      <UButton to="/rooms" variant="soft" color="neutral" size="lg" icon="i-lucide-radio">
        {{ $t('lobby.browseRooms') }}
      </UButton>
    </section>
  </div>
</template>

<style scoped>
.cg-game-card:hover {
  transform: translateY(-3px);
}
.cg-game-card:active {
  transform: translateY(0) scale(0.99);
}
</style>
