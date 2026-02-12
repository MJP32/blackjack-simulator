import type { HandState } from '@/engine/types.js';
import Hand from '@/components/cards/Hand.js';

interface DealerAreaProps {
  hand: HandState;
}

export default function DealerArea({ hand }: DealerAreaProps) {
  return (
    <div className="dealer-area">
      <span className="dealer-area__label">Dealer</span>
      <Hand hand={hand} />
    </div>
  );
}
