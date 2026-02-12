import type { Card, Action, HandState } from './types.js';
import { cardValue } from './card.js';
import { getHandTotal, isSoft } from './hand.js';

type DealerUpcard = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'A';

function getDealerUpcardKey(card: Card): DealerUpcard {
  if (['J', 'Q', 'K'].includes(card.rank)) return '10';
  return card.rank as DealerUpcard;
}

// H17 6-deck basic strategy
// H = Hit, S = Stand, D = Double (hit if can't), Ds = Double (stand if can't), P = Split, Rh = Surrender (hit if can't), Rs = Surrender (stand if can't), Ph = Split (hit if can't)

// Hard totals: player hard total vs dealer upcard
const hardTotals: Record<number, Record<DealerUpcard, string>> = {
  5:  { '2': 'H', '3': 'H', '4': 'H', '5': 'H', '6': 'H', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  6:  { '2': 'H', '3': 'H', '4': 'H', '5': 'H', '6': 'H', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  7:  { '2': 'H', '3': 'H', '4': 'H', '5': 'H', '6': 'H', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  8:  { '2': 'H', '3': 'H', '4': 'H', '5': 'H', '6': 'H', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  9:  { '2': 'H', '3': 'D', '4': 'D', '5': 'D', '6': 'D', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  10: { '2': 'D', '3': 'D', '4': 'D', '5': 'D', '6': 'D', '7': 'D', '8': 'D', '9': 'D', '10': 'H', 'A': 'H' },
  11: { '2': 'D', '3': 'D', '4': 'D', '5': 'D', '6': 'D', '7': 'D', '8': 'D', '9': 'D', '10': 'D', 'A': 'D' },
  12: { '2': 'H', '3': 'H', '4': 'S', '5': 'S', '6': 'S', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  13: { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  14: { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  15: { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'H', '8': 'H', '9': 'H', '10': 'Rh', 'A': 'Rh' },
  16: { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'H', '8': 'H', '9': 'Rh', '10': 'Rh', 'A': 'Rh' },
  17: { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'S', '8': 'S', '9': 'S', '10': 'S', 'A': 'Rs' },
  18: { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'S', '8': 'S', '9': 'S', '10': 'S', 'A': 'S' },
  19: { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'S', '8': 'S', '9': 'S', '10': 'S', 'A': 'S' },
  20: { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'S', '8': 'S', '9': 'S', '10': 'S', 'A': 'S' },
  21: { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'S', '8': 'S', '9': 'S', '10': 'S', 'A': 'S' },
};

// Soft totals: player soft total vs dealer upcard
const softTotals: Record<number, Record<DealerUpcard, string>> = {
  13: { '2': 'H', '3': 'H', '4': 'H', '5': 'D', '6': 'D', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  14: { '2': 'H', '3': 'H', '4': 'H', '5': 'D', '6': 'D', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  15: { '2': 'H', '3': 'H', '4': 'D', '5': 'D', '6': 'D', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  16: { '2': 'H', '3': 'H', '4': 'D', '5': 'D', '6': 'D', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  17: { '2': 'H', '3': 'D', '4': 'D', '5': 'D', '6': 'D', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  18: { '2': 'Ds', '3': 'Ds', '4': 'Ds', '5': 'Ds', '6': 'Ds', '7': 'S', '8': 'S', '9': 'H', '10': 'H', 'A': 'H' },
  19: { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'Ds', '7': 'S', '8': 'S', '9': 'S', '10': 'S', 'A': 'S' },
  20: { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'S', '8': 'S', '9': 'S', '10': 'S', 'A': 'S' },
  21: { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'S', '8': 'S', '9': 'S', '10': 'S', 'A': 'S' },
};

// Pairs: pair rank vs dealer upcard (use card value, not rank)
const pairs: Record<string, Record<DealerUpcard, string>> = {
  '2':  { '2': 'Ph', '3': 'Ph', '4': 'P', '5': 'P', '6': 'P', '7': 'P', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  '3':  { '2': 'Ph', '3': 'Ph', '4': 'P', '5': 'P', '6': 'P', '7': 'P', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  '4':  { '2': 'H', '3': 'H', '4': 'H', '5': 'Ph', '6': 'Ph', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  '5':  { '2': 'D', '3': 'D', '4': 'D', '5': 'D', '6': 'D', '7': 'D', '8': 'D', '9': 'D', '10': 'H', 'A': 'H' },
  '6':  { '2': 'Ph', '3': 'P', '4': 'P', '5': 'P', '6': 'P', '7': 'H', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  '7':  { '2': 'P', '3': 'P', '4': 'P', '5': 'P', '6': 'P', '7': 'P', '8': 'H', '9': 'H', '10': 'H', 'A': 'H' },
  '8':  { '2': 'P', '3': 'P', '4': 'P', '5': 'P', '6': 'P', '7': 'P', '8': 'P', '9': 'P', '10': 'P', 'A': 'P' },
  '9':  { '2': 'P', '3': 'P', '4': 'P', '5': 'P', '6': 'P', '7': 'S', '8': 'P', '9': 'P', '10': 'S', 'A': 'S' },
  '10': { '2': 'S', '3': 'S', '4': 'S', '5': 'S', '6': 'S', '7': 'S', '8': 'S', '9': 'S', '10': 'S', 'A': 'S' },
  'A':  { '2': 'P', '3': 'P', '4': 'P', '5': 'P', '6': 'P', '7': 'P', '8': 'P', '9': 'P', '10': 'P', 'A': 'P' },
};

function resolveAction(code: string, availableActions: Action[]): Action {
  switch (code) {
    case 'H': return 'hit';
    case 'S': return 'stand';
    case 'D':
      return availableActions.includes('double') ? 'double' : 'hit';
    case 'Ds':
      return availableActions.includes('double') ? 'double' : 'stand';
    case 'P':
    case 'Ph':
      return availableActions.includes('split') ? 'split' : 'hit';
    case 'Rh':
      return availableActions.includes('surrender') ? 'surrender' : 'hit';
    case 'Rs':
      return availableActions.includes('surrender') ? 'surrender' : 'stand';
    default:
      return 'stand';
  }
}

export function getBasicStrategyAction(
  hand: HandState,
  dealerUpcard: Card,
  availableActions: Action[]
): Action {
  const cards = hand.cards;
  const dealerKey = getDealerUpcardKey(dealerUpcard);
  const total = getHandTotal(cards);

  // Check for pairs first
  if (cards.length === 2) {
    const v1 = cardValue(cards[0])[0];
    const v2 = cardValue(cards[1])[0];
    if (v1 === v2) {
      const pairKey = cards[0].rank === 'J' || cards[0].rank === 'Q' || cards[0].rank === 'K'
        ? '10'
        : cards[0].rank;
      const pairTable = pairs[pairKey];
      if (pairTable) {
        const code = pairTable[dealerKey];
        return resolveAction(code, availableActions);
      }
    }
  }

  // Check soft totals
  if (isSoft(cards)) {
    const softTable = softTotals[total.best];
    if (softTable) {
      const code = softTable[dealerKey];
      return resolveAction(code, availableActions);
    }
  }

  // Hard totals
  const hardKey = Math.min(Math.max(total.best, 5), 21);
  const hardTable = hardTotals[hardKey];
  if (hardTable) {
    const code = hardTable[dealerKey];
    return resolveAction(code, availableActions);
  }

  return 'stand';
}

export function getBasicStrategyActionCode(
  hand: HandState,
  dealerUpcard: Card
): string | null {
  const cards = hand.cards;
  const dealerKey = getDealerUpcardKey(dealerUpcard);
  const total = getHandTotal(cards);

  // Check for pairs
  if (cards.length === 2) {
    const v1 = cardValue(cards[0])[0];
    const v2 = cardValue(cards[1])[0];
    if (v1 === v2) {
      const pairKey = cards[0].rank === 'J' || cards[0].rank === 'Q' || cards[0].rank === 'K'
        ? '10'
        : cards[0].rank;
      const pairTable = pairs[pairKey];
      if (pairTable) return pairTable[dealerKey];
    }
  }

  if (isSoft(cards)) {
    const softTable = softTotals[total.best];
    if (softTable) return softTable[dealerKey];
  }

  const hardKey = Math.min(Math.max(total.best, 5), 21);
  const hardTable = hardTotals[hardKey];
  if (hardTable) return hardTable[dealerKey];

  return null;
}
