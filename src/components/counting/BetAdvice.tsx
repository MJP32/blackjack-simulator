import type { CountInfo } from '@/engine/types.js';
import { getRecommendedBet } from '@/engine/countingSystem.js';
import { formatCurrency, formatPercent } from '@/utils/formatters.js';

interface BetAdviceProps {
  countInfo: CountInfo;
  minimumBet: number;
  bankroll: number;
  highlight?: string;
}

export default function BetAdvice({ countInfo, minimumBet, bankroll, highlight }: BetAdviceProps) {
  const rec = getRecommendedBet(Math.floor(countInfo.trueCount), minimumBet, bankroll);

  return (
    <div className={`sidebar__section ${highlight ?? ''}`}>
      <div className="sidebar__title">Bet Advice</div>
      <div className="bet-advice">
        <div className="bet-advice__recommended">
          {formatCurrency(rec.amount)}
        </div>
        <div className="bet-advice__detail">
          {rec.units} unit{rec.units !== 1 ? 's' : ''} ({formatCurrency(minimumBet)}/unit)
        </div>
        <div className="bet-advice__detail">
          Player advantage: {formatPercent(rec.advantage)}
        </div>
      </div>
    </div>
  );
}
