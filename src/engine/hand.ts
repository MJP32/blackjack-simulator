import type { Card, HandTotal, HandState, Action } from './types.js';
import { cardValue } from './card.js';

export function getHandTotal(cards: Card[]): HandTotal {
  let hard = 0;
  let aceCount = 0;

  for (const card of cards) {
    const values = cardValue(card);
    if (values.length === 2) {
      // Ace
      aceCount++;
      hard += 1;
    } else {
      hard += values[0];
    }
  }

  // Calculate soft total (count one ace as 11 if possible)
  let soft = hard;
  if (aceCount > 0 && hard + 10 <= 21) {
    soft = hard + 10;
  }

  const best = soft <= 21 ? soft : hard;

  return { hard, soft, best };
}

export function isBlackjack(cards: Card[]): boolean {
  if (cards.length !== 2) return false;
  const total = getHandTotal(cards);
  return total.best === 21;
}

export function isBusted(cards: Card[]): boolean {
  return getHandTotal(cards).best > 21;
}

export function isSoft(cards: Card[]): boolean {
  const total = getHandTotal(cards);
  return total.soft !== total.hard && total.soft <= 21;
}

export function canSplit(hand: HandState, bankroll: number): boolean {
  if (hand.cards.length !== 2) return false;
  if (bankroll < hand.bet) return false;
  const v1 = cardValue(hand.cards[0])[0];
  const v2 = cardValue(hand.cards[1])[0];
  return v1 === v2;
}

export function canDouble(hand: HandState, bankroll: number): boolean {
  if (hand.cards.length !== 2) return false;
  if (bankroll < hand.bet) return false;
  return !hand.isDoubled;
}

export function canSurrender(hand: HandState): boolean {
  return hand.cards.length === 2 && !hand.isDoubled;
}

export function getAvailableActions(
  hand: HandState,
  bankroll: number,
  allowSurrender: boolean,
  allowDoubleAfterSplit: boolean,
  isSplitHand: boolean
): Action[] {
  const actions: Action[] = ['hit', 'stand'];

  if (canDouble(hand, bankroll)) {
    if (!isSplitHand || allowDoubleAfterSplit) {
      actions.push('double');
    }
  }

  if (canSplit(hand, bankroll)) {
    actions.push('split');
  }

  if (allowSurrender && canSurrender(hand) && !isSplitHand) {
    actions.push('surrender');
  }

  return actions;
}

export function createEmptyHand(bet: number = 0): HandState {
  return {
    cards: [],
    bet,
    isDoubled: false,
    isSurrendered: false,
    isInsured: false,
    insuranceBet: 0,
  };
}
