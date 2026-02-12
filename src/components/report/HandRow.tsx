import { useState } from 'react';
import type { HandRecord } from '@/engine/types.js';
import { cardLabel } from '@/engine/card.js';
import { formatCurrency, formatTrueCount } from '@/utils/formatters.js';
import { getDecisionSummary } from '@/engine/strategyReasoning.js';
import DecisionRow from './DecisionRow.js';

interface HandRowProps {
  hand: HandRecord;
}

const RESULT_LABELS: Record<string, string> = {
  blackjack: 'BJ',
  win: 'Win',
  loss: 'Loss',
  push: 'Push',
  surrender: 'Surr',
};

export default function HandRow({ hand }: HandRowProps) {
  const [expanded, setExpanded] = useState(false);
  const wrongDecisions = hand.decisions.filter(d => !d.isCorrect);
  const hasErrors = wrongDecisions.length > 0;
  const resultLabel = RESULT_LABELS[hand.result] ?? hand.result;

  const playerCardsStr = hand.finalPlayerCards.map(c => cardLabel(c)).join(' ');
  const dealerCardsStr = hand.dealerFullHand.map(c => cardLabel(c)).join(' ');

  const betDiff = hand.bet - hand.recommendedBet;
  const betAnalysis = betDiff === 0
    ? 'Bet matches recommendation'
    : betDiff > 0
      ? `Bet ${formatCurrency(Math.abs(betDiff))} over recommended ${formatCurrency(hand.recommendedBet)}`
      : `Bet ${formatCurrency(Math.abs(betDiff))} under recommended ${formatCurrency(hand.recommendedBet)}`;

  return (
    <div className={`hand-row ${hasErrors ? 'hand-row--has-errors' : ''}`}>
      <div className="hand-row__summary" onClick={() => setExpanded(!expanded)}>
        <div className="hand-row__top-line">
          <span className="hand-row__number">#{hand.handNumber}</span>
          <span className="hand-row__cards">{playerCardsStr}</span>
          <span className="hand-row__vs">vs</span>
          <span className="hand-row__cards">{dealerCardsStr}</span>
          <span className={`hand-row__result hand-row__result--${hand.result}`}>
            {resultLabel}
          </span>
        </div>
        <div className="hand-row__bottom-line">
          <span className="hand-row__bet">{formatCurrency(hand.bet)}</span>
          <span className={`hand-row__payout ${hand.payout >= 0 ? 'hand-row__payout--positive' : 'hand-row__payout--negative'}`}>
            {hand.payout >= 0 ? '+' : ''}{formatCurrency(hand.payout)}
          </span>
          <span className="hand-row__tc">TC: {formatTrueCount(hand.trueCountAtDeal)}</span>
          <span className="hand-row__expand">{expanded ? '\u25B2' : '\u25BC'}</span>
        </div>
      </div>

      {hasErrors && (
        <div className="hand-row__errors">
          {wrongDecisions.map((d, i) => (
            <span key={i} className="hand-row__error-tag">
              {'\u2717'} {getDecisionSummary(d)}
            </span>
          ))}
        </div>
      )}

      {expanded && (
        <div className="hand-row__details">
          <div className="hand-row__bet-analysis">{betAnalysis}</div>
          {hand.decisions.length > 0 ? (
            hand.decisions.map((d, i) => (
              <DecisionRow key={i} decision={d} index={i} />
            ))
          ) : (
            <div className="hand-row__no-decisions">No player decisions (blackjack or dealer blackjack)</div>
          )}
        </div>
      )}
    </div>
  );
}
