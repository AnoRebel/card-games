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
    content:
      'When a play leaves you on your last card (or last same-rank group), the game asks — on your turn — to call “Last Card”. Call it, or stay quiet and risk a penalty.',
  },
]

// --- Swahili translations (selected by locale in useGameContent) ------------

export const lastCardRulesSw: RulesSection[] = [
  {
    heading: 'Lengo',
    body: ['Kuwa wa kwanza kumaliza karata zako zote. Alama chache zaidi hushinda mchezo.'],
  },
  {
    heading: 'Maandalizi',
    body: [
      'Kila mchezaji hupewa karata 7 kutoka pakiti ya karata 54 (52 za kawaida pamoja na majoka 2).',
      'Karata ya juu ya pakiti hugeuzwa kuanzisha rundo la kutupa.',
    ],
  },
  {
    heading: 'Zamu yako',
    body: [
      'Cheza karata inayolingana na rundo la kutupa kwa aina au kwa daraja.',
      'Una karata mbili au zaidi za daraja moja? Waweza kuzicheza zote pamoja kwa zamu moja.',
      'Kama huwezi kucheza, lamba karata moja na zamu yako inaisha.',
      'Huwezi kushinda kwa karata ya kitendo — karata yako ya mwisho lazima iwe ya kawaida.',
    ],
  },
  {
    heading: 'Karata za kitendo',
    body: [
      '2 — mchezaji anayefuata huchukua karata 2 (hizi hurundikana).',
      'Joka — mchezaji anayefuata huchukua karata 5. Joka laweza kurundikwa juu ya 2 iliyosubiri (2 + 5 = 7), lakini 2 haiwezi kurundikwa juu ya Joka.',
      '7 — huruka mchezaji anayefuata.',
      '8 — hubadili mwelekeo wa mchezo.',
      'Jeki — badili aina kuwa unayoichagua.',
    ],
  },
  {
    heading: 'Lia Kadi!',
    body: [
      'Unapofikia karata yako ya mwisho (au kundi lako la mwisho la daraja moja), lazima ulie "Lia Kadi".',
      'Mchezo utakuuliza kwenye zamu yako — itangaze, au nyamaza uhatarishe adhabu ya karata 2 ukidakwa.',
    ],
  },
]

export const lastCardTutorialSw: TutorialStep[] = [
  {
    target: '[data-tour="hand"]',
    title: 'Mkono wako',
    content: 'Hizi ni karata zako. Gusa karata kuicheza kwenye zamu yako.',
  },
  {
    target: '[data-tour="discard"]',
    title: 'Rundo la kutupa',
    content: 'Linganisha karata ya juu kwa aina au daraja ili kucheza.',
  },
  {
    target: '[data-tour="draw"]',
    title: 'Pakiti ya kulamba',
    content: 'Huna cha kucheza? Lamba kutoka hapa.',
  },
  {
    target: '[data-tour="last-card"]',
    title: 'Lia Kadi',
    content:
      'Uchezaji ukikuachia karata yako ya mwisho (au kundi la mwisho la daraja moja), mchezo utakuuliza — kwenye zamu yako — ulie "Lia Kadi". Itangaze, au nyamaza uhatarishe adhabu.',
  },
]
