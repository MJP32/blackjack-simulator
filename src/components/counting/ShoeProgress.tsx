import type { ShoeState } from '@/engine/types.js';

interface ShoeProgressProps {
  shoeState: ShoeState;
  highlight?: string;
}

export default function ShoeProgress({ shoeState, highlight }: ShoeProgressProps) {
  const percent = shoeState.penetration * 100;
  const fillClass = percent > 75
    ? 'shoe-progress__fill shoe-progress__fill--high'
    : percent > 50
    ? 'shoe-progress__fill shoe-progress__fill--mid'
    : 'shoe-progress__fill shoe-progress__fill--low';

  return (
    <div className={`sidebar__section ${highlight ?? ''}`}>
      <div className="sidebar__title">Shoe Progress</div>
      <div className="shoe-progress">
        <div className="shoe-progress__bar">
          <div
            className={fillClass}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
        <div className="shoe-progress__label">
          {shoeState.cardsDealt} / {shoeState.totalCards} cards dealt ({Math.round(percent)}%)
          {shoeState.needsReshuffle && ' — Reshuffle pending'}
        </div>
      </div>
    </div>
  );
}
