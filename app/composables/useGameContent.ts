/**
 * Per-game learnability content lookup (rules + tutorial steps).
 *
 * Each game module ships its content in English plus a Swahili translation.
 * We select the array by the active locale (falling back to English), so the
 * shared RulesPanel and tutorial launcher render fully-localized material.
 */
import {
  lastCardRules,
  lastCardTutorial,
  lastCardRulesSw,
  lastCardTutorialSw,
  type RulesSection,
  type TutorialStep,
} from '@card-games/game-last-card'
import {
  albastiniRules,
  albastiniTutorial,
  albastiniRulesSw,
  albastiniTutorialSw,
} from '@card-games/game-albastini'

type Content = { rules: RulesSection[]; tutorial: TutorialStep[] }

// English (default) and per-locale overrides, keyed by game id.
const EN: Record<string, Content> = {
  'last-card': { rules: lastCardRules, tutorial: lastCardTutorial },
  albastini: { rules: albastiniRules, tutorial: albastiniTutorial },
}
const BY_LOCALE: Record<string, Record<string, Content>> = {
  sw: {
    'last-card': { rules: lastCardRulesSw, tutorial: lastCardTutorialSw },
    albastini: { rules: albastiniRulesSw, tutorial: albastiniTutorialSw },
  },
}

const EMPTY: Content = { rules: [], tutorial: [] }

export function useGameContent(gameId: string) {
  const { $getLocale } = useI18n()

  const content = computed<Content>(() => {
    const locale = $getLocale()
    return BY_LOCALE[locale]?.[gameId] ?? EN[gameId] ?? EMPTY
  })

  return {
    rules: computed(() => content.value.rules),
    tutorial: computed(() => content.value.tutorial),
  }
}
