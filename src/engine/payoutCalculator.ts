import type { HandState, GameSettings, HandResult } from './types.js';
import { getHandTotal, isBlackjack } from './hand.js';

export interface ResolvedHand {
  result: HandResult;
  payout: number;
}

export function resolveHand(
  playerHand: HandState,
  dealerCards: HandState,
  settings: GameSettings
): ResolvedHand {
  if (playerHand.isSurrendered) {
    return { result: 'surrender', payout: -(playerHand.bet * 0.5) };
  }

  const playerTotal = getHandTotal(playerHand.cards);
  const dealerTotal = getHandTotal(dealerCards.cards);
  const playerBJ = isBlackjack(playerHand.cards);
  const dealerBJ = isBlackjack(dealerCards.cards);

  // Player busted
  if (playerTotal.best > 21) {
    return { result: 'loss', payout: -playerHand.bet };
  }

  // Both blackjack
  if (playerBJ && dealerBJ) {
    return { result: 'push', payout: 0 };
  }

  // Player blackjack
  if (playerBJ) {
    return { result: 'blackjack', payout: playerHand.bet * settings.blackjackPayout };
  }

  // Dealer blackjack
  if (dealerBJ) {
    return { result: 'loss', payout: -playerHand.bet };
  }

  // Dealer busted
  if (dealerTotal.best > 21) {
    return { result: 'win', payout: playerHand.bet };
  }

  // Compare totals
  if (playerTotal.best > dealerTotal.best) {
    return { result: 'win', payout: playerHand.bet };
  } else if (playerTotal.best < dealerTotal.best) {
    return { result: 'loss', payout: -playerHand.bet };
  } else {
    return { result: 'push', payout: 0 };
  }
}

export function resolveInsurance(
  dealerCards: HandState,
  insuranceBet: number
): number {
  const dealerBJ = isBlackjack(dealerCards.cards);
  if (dealerBJ) {
    return insuranceBet * 2; // pays 2:1
  }
  return -insuranceBet;
}
