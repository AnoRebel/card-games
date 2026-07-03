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
      'Each player is dealt 7 cards from a 54-card deck (standard 52 plus 2 jokers).',
      'The top of the remaining deck is turned over to start the discard pile.',
    ],
  },
  {
    heading: 'Your turn',
    body: [
      'Play a card matching the discard pile by suit or by rank.',
      'Holding two or more of the same rank? You can play them all together in one turn.',
      'If you cannot play, draw one card and your turn ends.',
      'You cannot win on an action card — your final card must be a plain one.',
    ],
  },
  {
    heading: 'Action cards',
    body: [
      '2 — the next player picks up 2 (these stack).',
      'Joker — the next player picks up 5. A Joker can stack onto a pending 2 (2 + 5 = 7), but a 2 cannot stack onto a Joker.',
      '7 — skips the next player.',
      '8 — reverses the direction of play.',
      'Jack — change the suit to one of your choosing.',
    ],
  },
  {
    heading: 'Last Card!',
    body: [
      'When you play down to your last card (or your last same-rank group), you must call “Last Card”.',
      'The game prompts you on your turn — call it, or stay quiet and risk a 2-card penalty if you are caught.',
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
