import { useState, useEffect } from 'react';
import { BET_INCREMENTS } from '@/utils/constants.js';
import { formatCurrency } from '@/utils/formatters.js';
import Button from '@/components/shared/Button.js';

interface BetControlsProps {
  bankroll: number;
  minimumBet: number;
  maximumBet: number;
  onPlaceBet: (amount: number) => void;
  onDeal: () => void;
}

export default function BetControls({ bankroll, minimumBet, maximumBet, onPlaceBet, onDeal }: BetControlsProps) {
  const [currentBet, setCurrentBet] = useState(minimumBet);

  function addChip(amount: number) {
    const newBet = Math.min(currentBet + amount, maximumBet, bankroll);
    setCurrentBet(newBet);
  }

  function clearBet() {
    setCurrentBet(0);
  }

  // Keyboard shortcuts: 1-6 for chips, C for clear
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key.toLowerCase();
      if (key === 'c') {
        e.preventDefault();
        clearBet();
        return;
      }

      const chipIndex = parseInt(e.key) - 1;
      if (chipIndex >= 0 && chipIndex < BET_INCREMENTS.length) {
        const amount = BET_INCREMENTS[chipIndex];
        if (currentBet + amount <= bankroll && currentBet < maximumBet) {
          e.preventDefault();
          addChip(amount);
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentBet, bankroll, maximumBet]);

  function handleDeal() {
    if (currentBet >= minimumBet) {
      onPlaceBet(currentBet);
      onDeal();
    }
  }

  return (
    <div className="bet-controls">
      <div className="bet-controls__chips">
        {BET_INCREMENTS.map((amount, i) => (
          <button
            key={amount}
            className={`chip chip--${amount}`}
            onClick={() => addChip(amount)}
            disabled={currentBet + amount > bankroll || currentBet >= maximumBet}
            title={`$${amount} (${i + 1})`}
          >
            ${amount}
            <span className="chip__kbd">{i + 1}</span>
          </button>
        ))}
      </div>
      <div className="bet-controls__total">
        Bet: {formatCurrency(currentBet)}
      </div>
      <div className="bet-controls__actions">
        <Button variant="secondary" size="small" onClick={clearBet}>
          Clear <span className="kbd">C</span>
        </Button>
        <Button
          variant="gold"
          onClick={handleDeal}
          disabled={currentBet < minimumBet}
        >
          Deal <span className="kbd">Enter</span>
        </Button>
      </div>
    </div>
  );
}
