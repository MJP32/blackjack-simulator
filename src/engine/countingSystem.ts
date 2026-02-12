import type { BetRecommendation } from './types.js';

export function calculatePlayerAdvantage(trueCount: number): number {
  // Base house edge ~0.5%, each true count point adds ~0.5%
  return -0.005 + (trueCount * 0.005);
}

export function getRecommendedBet(
  trueCount: number,
  minimumBet: number,
  bankroll: number
): BetRecommendation {
  let units: number;

  if (trueCount <= 1) {
    units = 1;
  } else if (trueCount === 2) {
    units = 2;
  } else if (trueCount === 3) {
    units = 4;
  } else if (trueCount === 4) {
    units = 8;
  } else {
    units = 12;
  }

  const amount = Math.min(units * minimumBet, bankroll);
  const advantage = calculatePlayerAdvantage(trueCount);

  return { units, amount, advantage };
}
