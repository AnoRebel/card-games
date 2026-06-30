<script setup lang="ts">
/**
 * Injects the DeckCards.svg definitions into the DOM once, hidden, so every
 * <PlayingCard> can reference card faces via `<use href="#c13">`.
 *
 * The sprite wraps everything in a single <defs>: the 52 card <symbol>s AND the
 * shared art they reference (#card frame, suit pips like #largeClub/#aceClub,
 * rank glyphs like #one, face-card groups like #blackking). We must inject the
 * ENTIRE defs content — injecting only <symbol>s leaves their internal <use>
 * references dangling and the cards render blank.
 *
 * The raw sprite is imported at build time (?raw) — no network fetch.
 */
import sprite from '~/assets/cards/deck.svg?raw'

const defsContent = computed(() => {
  // Grab everything inside the top-level <defs>…</defs>.
  const match = sprite.match(/<defs[^>]*>([\s\S]*)<\/defs>/i)
  if (match) return match[1] ?? ''
  // Fallback: at least the symbols.
  return (sprite.match(/<symbol[\s\S]*?<\/symbol>/g) ?? []).join('\n')
})
</script>

<template>
  <svg
    aria-hidden="true"
    focusable="false"
    width="0"
    height="0"
    style="position: absolute; width: 0; height: 0; overflow: hidden"
  >
    <!-- eslint-disable vue/no-v-html -- our own build-time static SVG, never user input -->
    <defs v-html="defsContent" />
    <!-- eslint-enable vue/no-v-html -->
  </svg>
</template>
