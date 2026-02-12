import { motion } from 'framer-motion';
import type { Card as CardType } from '@/engine/types.js';
import { suitSymbol, isRedSuit } from '@/engine/card.js';

interface CardProps {
  card: CardType;
  index?: number;
}

export default function Card({ card, index = 0 }: CardProps) {
  const colorClass = isRedSuit(card.suit) ? 'card--red' : 'card--black';
  const symbol = suitSymbol(card.suit);

  return (
    <motion.div
      className={`card ${colorClass}`}
      initial={{ opacity: 0, y: -50, rotateY: 180 }}
      animate={{ opacity: 1, y: 0, rotateY: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <div className={`card__inner ${!card.faceUp ? 'card__inner--flipped' : ''}`}>
        <div className="card__face">
          <div className="card__corner card__corner--top">
            <span className="card__rank">{card.rank}</span>
            <span className="card__suit">{symbol}</span>
          </div>
          <span className="card__center-suit">{symbol}</span>
          <div className="card__corner card__corner--bottom">
            <span className="card__rank">{card.rank}</span>
            <span className="card__suit">{symbol}</span>
          </div>
        </div>
        <div className="card__back">
          <div className="card__back-pattern" />
        </div>
      </div>
    </motion.div>
  );
}
