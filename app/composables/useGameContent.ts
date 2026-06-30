/**
 * Per-game learnability content lookup (rules + tutorial steps).
 *
 * Each game module ships its own content; this maps a gameId to it so the
 * shared RulesPanel and tutorial launcher render game-specific material.
 */
import {
  lastCardRules,
  lastCardTutorial,
  type RulesSection,
  type TutorialStep,
} from '@card-games/game-last-card'
import {
  albastiniRules,
  albastiniTutorial,
} from '@card-games/game-albastini'

const CONTENT: Record<
  string,
  { rules: RulesSection[]; tutorial: TutorialStep[] }
> = {
  'last-card': { rules: lastCardRules, tutorial: lastCardTutorial },
  albastini: { rules: albastiniRules, tutorial: albastiniTutorial },
}

export function useGameContent(gameId: string) {
  const content = computed(
    () => CONTENT[gameId] ?? { rules: [], tutorial: [] },
  )
  return {
    rules: computed(() => content.value.rules),
    tutorial: computed(() => content.value.tutorial),
  }
}
