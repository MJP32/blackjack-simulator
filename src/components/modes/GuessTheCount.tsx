import { useState } from 'react';
import { useGameStore } from '@/stores/gameStore.js';
import { useSettingsStore } from '@/stores/settingsStore.js';
import { useStatsStore } from '@/stores/statsStore.js';
import Modal from '@/components/shared/Modal.js';
import Button from '@/components/shared/Button.js';

export default function GuessTheCount() {
  const guessTheCount = useSettingsStore(s => s.guessTheCount);
  const phase = useGameStore(s => s.phase);
  const shoeState = useGameStore(s => s.shoeState);
  const nextRound = useGameStore(s => s.nextRound);
  const recordCountGuess = useStatsStore(s => s.recordCountGuess);
  const countGuesses = useStatsStore(s => s.countGuesses);

  const [guess, setGuess] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ actual: number; correct: boolean } | null>(null);

  if (!guessTheCount || phase !== 'round_over') return null;

  const actualCount = shoeState.countInfo.runningCount;

  function handleSubmit() {
    const guessedValue = parseInt(guess);
    if (isNaN(guessedValue)) return;

    const correct = guessedValue === actualCount;
    recordCountGuess({ actual: actualCount, guessed: guessedValue, correct });
    setResult({ actual: actualCount, correct });
    setSubmitted(true);
  }

  function handleContinue() {
    setGuess('');
    setSubmitted(false);
    setResult(null);
    nextRound();
  }

  const recentGuesses = countGuesses.slice(-10);
  const accuracy = recentGuesses.length > 0
    ? recentGuesses.filter(g => g.correct).length / recentGuesses.length
    : 0;

  return (
    <Modal
      isOpen
      title="What's the Running Count?"
      actions={
        submitted ? (
          <Button variant="gold" onClick={handleContinue}>Next Hand</Button>
        ) : (
          <Button variant="primary" onClick={handleSubmit} disabled={guess === ''}>
            Submit
          </Button>
        )
      }
    >
      <div className="guess-count">
        {!submitted ? (
          <input
            className="guess-count__input"
            type="number"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            autoFocus
            placeholder="0"
          />
        ) : result && (
          <>
            <div className={result.correct ? 'guess-count__result guess-count__result--correct' : 'guess-count__result guess-count__result--wrong'}>
              {result.correct ? 'Correct!' : `Wrong — the count is ${result.actual}`}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Recent accuracy: {Math.round(accuracy * 100)}% ({recentGuesses.filter(g => g.correct).length}/{recentGuesses.length})
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
