/**
 * Albastini learnability content: rules summary + tutorial steps.
 */

export interface RulesSection {
  heading: string
  body: string[]
}

export const albastiniRules: RulesSection[] = [
  {
    heading: 'Goal',
    body: [
      'Win tricks containing valuable cards. Score the most points to earn victory points.',
    ],
  },
  {
    heading: 'The deck',
    body: [
      'Albastini is a trick-taking game from Tanzania, played with 36 cards (standard deck without 2s, 8s, 9s, 10s).',
      'Trick order high→low: Ace, 7, King, Jack, Queen, 6, 5, 4, 3. The 7 beats the King!',
      'Cards carry Swahili names: Ace = Dume (“male”), 7 = Jike (“female”), King = Mzungu (“foreigner”). The point-less low cards (6, 5, 4, 3) are the Ngarasha (“trash”).',
      'Points: Dume (Ace) 11, Jike (7) 10, Mzungu (King) 4, Jack 3, Queen 2 — 120 total.',
    ],
  },
  {
    heading: 'Bidding — Otea & trump',
    body: [
      'Otea is the bidding: before trump is shown, opponents may each bid one card of a different suit.',
      'The dealer turns the top stock card; its suit becomes trump. That card is slid under the deck and is the LAST card drawn.',
      'A bidder who named the trump suit exchanges: they take the turned trump card into hand and give up their bid card (which becomes the last card drawn instead).',
    ],
  },
  {
    heading: 'Playing — Kula (to eat)',
    body: [
      'There is no need to follow suit — play any card.',
      'Highest trump wins the trick; with no trump, the highest card of the led suit wins.',
      'The winner “eats” (kula) the cards, then everyone refills to 5 from the stock and the winner leads again.',
      'When a Jike (7) is beaten by the Ace of the same suit, that is Ndoa — a “marriage”.',
    ],
  },
  {
    heading: 'Scoring',
    body: [
      'Count the points in the cards you ate.',
      'Individual: 1 VP to the top scorer if everyone ate ≥10, otherwise 2 VP. Ties score nothing.',
    ],
  },
]

export interface TutorialStep {
  target: string
  title: string
  content: string
}

export const albastiniTutorial: TutorialStep[] = [
  {
    target: '[data-tour="hand"]',
    title: 'Your hand',
    content: 'Five cards. Play any of them — there is no follow-suit rule.',
  },
  {
    target: '[data-tour="trump"]',
    title: 'Trump',
    content: 'This suit beats all others. The 7 (Jike) ranks just below the Ace!',
  },
  {
    target: '[data-tour="trick"]',
    title: 'The trick',
    content: 'Highest trump (or highest led suit) wins and eats these cards.',
  },
  {
    target: '[data-tour="taken"]',
    title: 'Eaten cards',
    content: 'Cards you win pile up here — count their points to score.',
  },
]
