import { useState } from 'react';
import type { ShoeRecord } from '@/engine/types.js';
import { formatCurrency, formatPercent } from '@/utils/formatters.js';
import HandRow from './HandRow.js';

interface ShoeSectionProps {
  shoe: ShoeRecord;
}

function gradeColor(grade: number): string {
  if (grade >= 90) return 'var(--success)';
  if (grade >= 75) return 'var(--gold)';
  if (grade >= 60) return 'var(--warning)';
  return 'var(--danger)';
}

export default function ShoeSection({ shoe }: ShoeSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const accuracy = shoe.totalDecisions > 0
    ? shoe.correctDecisions / shoe.totalDecisions
    : 1;

  return (
    <div className="shoe-section">
      <div className="shoe-section__header" onClick={() => setExpanded(!expanded)}>
        <div className="shoe-section__top-line">
          <span className="shoe-section__title">Shoe {shoe.shoeNumber}</span>
          <span className="shoe-section__hands">{shoe.hands.length} hand{shoe.hands.length !== 1 ? 's' : ''}</span>
          <span
            className="shoe-section__grade"
            style={{ background: gradeColor(shoe.grade) }}
          >
            {shoe.grade}
          </span>
        </div>
        <div className="shoe-section__bottom-line">
          <span className="shoe-section__accuracy">{formatPercent(accuracy)}</span>
          <span className={`shoe-section__profit ${shoe.netProfit >= 0 ? 'shoe-section__profit--positive' : 'shoe-section__profit--negative'}`}>
            {shoe.netProfit >= 0 ? '+' : ''}{formatCurrency(shoe.netProfit)}
          </span>
          <span className="shoe-section__expand">{expanded ? '\u25B2' : '\u25BC'}</span>
        </div>
      </div>

      {expanded && (
        <div className="shoe-section__hands-list">
          {shoe.hands.map((hand, i) => (
            <HandRow key={i} hand={hand} />
          ))}
        </div>
      )}
    </div>
  );
}
