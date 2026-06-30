/**
 * Last Card learnability content: rules summary + tutorial steps.
 * Consumed by the platform's RulesPanel and v-tour-guide launcher.
 */

export interface RulesSection {
  heading: string
  body: string[]
}

export const lastCardRules: RulesSection[] = [
  {
    heading: 'Goal',
    body: ['Be the first to get rid of all your cards. Lowest score wins a match.'],
  },
  {
    heading: 'Setup',
    body: [
      'Each player is dealt 7 cards from a standard 52-card deck.',
      'The top of the remaining deck is turned over to start the discard pile.',
    ],
  },
  {
    heading: 'Your turn',
    body: [
      'Play a card matching the discard pile by suit or by rank.',
      'If you cannot play, draw a card. If it still cannot be played, your turn ends.',
    ],
  },
  {
    heading: 'Action cards',
    body: [
      '2 — the next player picks up 2 cards (these can stack).',
      '8 — skips the next player.',
      'Jack — change the suit to one of your choosing.',
    ],
  },
  {
    heading: 'Last Card!',
    body: [
      'When you play down to one card, you must declare “Last Card”.',
      'Forget, and you pick up a 2-card penalty.',
    ],
  },
]

export interface TutorialStep {
  /** CSS selector / element ref the tour highlights. */
  target: string
  title: string
  content: string
}

export const lastCardTutorial: TutorialStep[] = [
  {
    target: '[data-tour="hand"]',
    title: 'Your hand',
    content: 'These are your cards. Tap a card to play it on your turn.',
  },
  {
    target: '[data-tour="discard"]',
    title: 'The discard pile',
    content: 'Match the top card by suit or rank to play.',
  },
  {
    target: '[data-tour="draw"]',
    title: 'The draw pile',
    content: 'No legal play? Draw from here.',
  },
  {
    target: '[data-tour="last-card"]',
    title: 'Call Last Card',
    content: 'Down to one card? Declare “Last Card” or risk a penalty!',
  },
]
