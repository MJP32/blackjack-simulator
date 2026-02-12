import { AnimatePresence } from 'framer-motion';
import type { HandState } from '@/engine/types.js';
import { getHandTotal, isBlackjack, isBusted } from '@/engine/hand.js';
import Card from './Card.js';

interface HandProps {
  hand: HandState;
  showTotal?: boolean;
}

export default function Hand({ hand, showTotal = true }: HandProps) {
  const cards = hand.cards;
  const allFaceUp = cards.every(c => c.faceUp);
  const total = getHandTotal(cards.filter(c => c.faceUp));
  const fullTotal = getHandTotal(cards);
  const bj = isBlackjack(cards) && allFaceUp;
  const bust = isBusted(cards);

  let totalClass = 'hand__total';
  if (bj) totalClass += ' hand__total--blackjack';
  else if (bust) totalClass += ' hand__total--bust';

  return (
    <div className="hand">
      <AnimatePresence>
        {cards.map((card, i) => (
          <div className="hand__card-wrapper" key={`${card.rank}-${card.suit}-${i}`}>
            <Card card={card} index={i} />
          </div>
        ))}
      </AnimatePresence>
      {showTotal && cards.length > 0 && (
        <span className={totalClass}>
          {bj ? 'BJ' : allFaceUp ? fullTotal.best : total.best}
        </span>
      )}
    </div>
  );
}
