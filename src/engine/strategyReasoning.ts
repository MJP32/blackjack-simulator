import type { DecisionRecord } from './types.js';
import { cardLabel } from './card.js';

const ACTION_NAMES: Record<string, string> = {
  hit: 'hit',
  stand: 'stand',
  double: 'double down',
  split: 'split',
  surrender: 'surrender',
};

const CODE_DESCRIPTIONS: Record<string, string> = {
  H: 'hit',
  S: 'stand',
  D: 'double down (hit if not allowed)',
  Ds: 'double down (stand if not allowed)',
  P: 'split',
  Ph: 'split (hit if not allowed)',
  Rh: 'surrender (hit if not allowed)',
  Rs: 'surrender (stand if not allowed)',
};

function describeHand(d: DecisionRecord): string {
  if (d.isPair) {
    const rank = d.playerCards[0]?.rank ?? '?';
    const display = rank === 'A' ? 'Aces' : `${rank}s`;
    return `Pair of ${display}`;
  }
  if (d.isSoftHand) {
    return `Soft ${d.handTotal.best}`;
  }
  return `Hard ${d.handTotal.best}`;
}

export function getDecisionSummary(d: DecisionRecord): string {
  const handDesc = describeHand(d);
  const correctName = ACTION_NAMES[d.correctAction] ?? d.correctAction;
  const playerName = ACTION_NAMES[d.playerAction] ?? d.playerAction;
  return `${handDesc}: should ${correctName}, chose ${playerName}`;
}

export function getDecisionReasoning(d: DecisionRecord): string {
  const handDesc = describeHand(d);
  const dealerLabel = cardLabel(d.dealerUpcard);
  const correctName = ACTION_NAMES[d.correctAction] ?? d.correctAction;
  const playerName = ACTION_NAMES[d.playerAction] ?? d.playerAction;
  const codeDesc = d.strategyCode ? CODE_DESCRIPTIONS[d.strategyCode] ?? d.strategyCode : correctName;

  if (d.isCorrect) {
    return `${handDesc} vs dealer ${dealerLabel}: Basic strategy says ${codeDesc}. You correctly chose ${playerName}.`;
  }
  return `${handDesc} vs dealer ${dealerLabel}: Basic strategy says ${codeDesc}. You chose ${playerName} instead of ${correctName}.`;
}
