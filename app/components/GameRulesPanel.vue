<script setup lang="ts">
/**
 * Always-accessible "Rules / How to Play" overlay. Renders per-game content in
 * a slideover so it opens mid-game without losing state (game-learnability).
 */
const props = defineProps<{ gameId: string }>()
const open = defineModel<boolean>('open', { default: false })

const { rules } = useGameContent(props.gameId)
</script>

<template>
  <USlideover v-model:open="open" :title="$t('common.howToPlay')" side="right">
    <template #body>
      <div class="space-y-5">
        <section v-for="section in rules" :key="section.heading" class="space-y-1">
          <h3 class="font-semibold text-highlighted">{{ section.heading }}</h3>
          <ul class="list-disc ps-5 space-y-1 text-sm text-muted">
            <li v-for="(line, i) in section.body" :key="i">{{ line }}</li>
          </ul>
        </section>
        <p v-if="!rules.length" class="text-sm text-muted">
          {{ $t('common.noRules') }}
        </p>
      </div>
    </template>
  </USlideover>
</template>
