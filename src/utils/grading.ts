import type { HandRecord, ShoeRecord, DecisionRecord } from '@/engine/types.js';

function isPressureDecision(d: DecisionRecord): boolean {
  // Hard 15-16 vs dealer 7+
  if (!d.isSoftHand && !d.isPair) {
    const total = d.handTotal.best;
    const dealerRank = d.dealerUpcard.rank;
    const highDealer = ['7', '8', '9', '10', 'J', 'Q', 'K', 'A'].includes(dealerRank);
    if ((total === 15 || total === 16) && highDealer) return true;
  }
  // Pair of 8s
  if (d.isPair && d.playerCards.length >= 2 && d.playerCards[0].rank === '8') return true;
  // Soft 18 vs 9, 10, or A
  if (d.isSoftHand && d.handTotal.best === 18) {
    const dealerRank = d.dealerUpcard.rank;
    if (['9', '10', 'J', 'Q', 'K', 'A'].includes(dealerRank)) return true;
  }
  return false;
}

export function buildShoeRecord(
  shoeNumber: number,
  hands: HandRecord[],
  startBankroll: number,
  endBankroll: number
): ShoeRecord {
  let correctDecisions = 0;
  let totalDecisions = 0;

  for (const hand of hands) {
    for (const d of hand.decisions) {
      totalDecisions++;
      if (d.isCorrect) correctDecisions++;
    }
  }

  const grade = computeGrade(hands, correctDecisions, totalDecisions);

  return {
    shoeNumber,
    hands,
    correctDecisions,
    totalDecisions,
    grade,
    netProfit: endBankroll - startBankroll,
    startingBankroll: startBankroll,
    endingBankroll: endBankroll,
  };
}

function computeGrade(
  hands: HandRecord[],
  correctDecisions: number,
  totalDecisions: number
): number {
  if (totalDecisions === 0) return 100;

  // 60% - Strategy accuracy
  const strategyScore = (correctDecisions / totalDecisions) * 100;

  // 25% - Bet sizing accuracy
  let betScoreSum = 0;
  let betCount = 0;
  for (const hand of hands) {
    if (hand.recommendedBet > 0) {
      const deviation = Math.abs(hand.bet - hand.recommendedBet) / hand.recommendedBet;
      betScoreSum += Math.max(0, 1 - deviation);
      betCount++;
    }
  }
  const betScore = betCount > 0 ? (betScoreSum / betCount) * 100 : 100;

  // 15% - Play quality (pressure decisions weighted 2x)
  let qualityWeightedCorrect = 0;
  let qualityWeightedTotal = 0;
  for (const hand of hands) {
    for (const d of hand.decisions) {
      const weight = isPressureDecision(d) ? 2 : 1;
      qualityWeightedTotal += weight;
      if (d.isCorrect) qualityWeightedCorrect += weight;
    }
  }
  const qualityScore = qualityWeightedTotal > 0
    ? (qualityWeightedCorrect / qualityWeightedTotal) * 100
    : 100;

  return Math.round(strategyScore * 0.6 + betScore * 0.25 + qualityScore * 0.15);
}
