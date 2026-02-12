import type { CountInfo } from '@/engine/types.js';
import { formatCount, formatTrueCount } from '@/utils/formatters.js';

interface CountPanelProps {
  countInfo: CountInfo;
  highlight?: string;
}

function getCountClass(value: number): string {
  if (value > 0) return 'count-panel__value count-panel__value--positive';
  if (value < 0) return 'count-panel__value count-panel__value--negative';
  return 'count-panel__value count-panel__value--neutral';
}

export default function CountPanel({ countInfo, highlight }: CountPanelProps) {
  return (
    <div className={`sidebar__section ${highlight ?? ''}`}>
      <div className="sidebar__title">Card Count</div>
      <div className="count-panel">
        <div className="count-panel__row">
          <span className="count-panel__label">Running Count</span>
          <span className={getCountClass(countInfo.runningCount)}>
            {formatCount(countInfo.runningCount)}
          </span>
        </div>
        <div className="count-panel__row">
          <span className="count-panel__label">True Count</span>
          <span className={getCountClass(countInfo.trueCount)}>
            {formatTrueCount(countInfo.trueCount)}
          </span>
        </div>
        <div className="count-panel__row">
          <span className="count-panel__label">Decks Remaining</span>
          <span className="count-panel__value count-panel__value--neutral">
            {countInfo.decksRemaining}
          </span>
        </div>
      </div>
    </div>
  );
}
