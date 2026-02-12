import type { DecisionRecord } from '@/engine/types.js';
import { getDecisionReasoning } from '@/engine/strategyReasoning.js';
import { cardLabel } from '@/engine/card.js';
import { formatCount, formatTrueCount } from '@/utils/formatters.js';

interface DecisionRowProps {
  decision: DecisionRecord;
  index: number;
}

export default function DecisionRow({ decision, index }: DecisionRowProps) {
  const reasoning = getDecisionReasoning(decision);

  return (
    <div className={`decision-row ${decision.isCorrect ? 'decision-row--correct' : 'decision-row--incorrect'}`}>
      <div className="decision-row__header">
        <span className="decision-row__indicator">
          {decision.isCorrect ? '\u2713' : '\u2717'}
        </span>
        <span className="decision-row__action">
          Decision {index + 1}: {decision.playerAction}
          {!decision.isCorrect && (
            <span className="decision-row__should"> (should: {decision.correctAction})</span>
          )}
        </span>
      </div>
      <div className="decision-row__reasoning">{reasoning}</div>
      <div className="decision-row__meta">
        Cards: {decision.playerCards.map(c => cardLabel(c)).join(' ')} | RC: {formatCount(decision.runningCount)} | TC: {formatTrueCount(decision.trueCount)}
      </div>
    </div>
  );
}
