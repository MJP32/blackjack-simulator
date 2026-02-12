import { useState, useCallback } from 'react';
import { useStatsStore } from '@/stores/statsStore.js';

export function useCountTrainer() {
  const [showGuess, setShowGuess] = useState(false);
  const [lastGuess, setLastGuess] = useState<{ actual: number; guessed: number; correct: boolean } | null>(null);
  const recordCountGuess = useStatsStore(s => s.recordCountGuess);

  const promptGuess = useCallback(() => {
    setShowGuess(true);
    setLastGuess(null);
  }, []);

  const submitGuess = useCallback((guessed: number, actual: number) => {
    const correct = guessed === actual;
    const entry = { actual, guessed, correct };
    recordCountGuess(entry);
    setLastGuess(entry);
    setShowGuess(false);
    return correct;
  }, [recordCountGuess]);

  const dismissGuess = useCallback(() => {
    setShowGuess(false);
    setLastGuess(null);
  }, []);

  return {
    showGuess,
    lastGuess,
    promptGuess,
    submitGuess,
    dismissGuess,
  };
}
