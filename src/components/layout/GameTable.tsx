import { useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore.js';
import { useSettingsStore } from '@/stores/settingsStore.js';
import { useGameActions } from '@/hooks/useGameActions.js';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts.js';
import { getDecisionReasoning } from '@/engine/strategyReasoning.js';
import { TUTORIAL_STEPS } from '@/utils/constants.js';
import DealerArea from '@/components/players/DealerArea.js';
import PlayerSeat from '@/components/players/PlayerSeat.js';
import HumanPlayer from '@/components/players/HumanPlayer.js';
import BetControls from '@/components/betting/BetControls.js';
import BankrollDisplay from '@/components/betting/BankrollDisplay.js';
import Button from '@/components/shared/Button.js';
import { formatCurrency } from '@/utils/formatters.js';
import type { Action } from '@/engine/types.js';

export default function GameTable() {
  const { players, dealerHand, phase, activePlayerIndex, isAnimating, engine, decisionFeedback } = useGameStore();
  const { placeBet, nextRound, handleInsurance, setDecisionFeedback } = useGameStore();
  const settings = useSettingsStore();
  const { startNewRound, handlePlayerAction, finishRound } = useGameActions();

  // Auto-dismiss decision feedback (shorter for correct, longer for wrong)
  useEffect(() => {
    if (!decisionFeedback) return;
    const ms = decisionFeedback.isCorrect ? 2000 : 5000;
    const timer = setTimeout(() => setDecisionFeedback(null), ms);
    return () => clearTimeout(timer);
  }, [decisionFeedback, setDecisionFeedback]);

  const showTutorial = useSettingsStore(s => s.showTutorial);
  const tutorialStep = useSettingsStore(s => s.tutorialStep);
  const tutorialHighlight = showTutorial ? TUTORIAL_STEPS[tutorialStep]?.highlight ?? null : null;

  const humanPlayer = players.find(p => p.isHuman);
  const humanIndex = players.findIndex(p => p.isHuman);
  const isHumanTurn = phase === 'player_turn' && activePlayerIndex === humanIndex && !isAnimating;

  const availableActions: Action[] = isHumanTurn && engine
    ? engine.getAvailableActionsForCurrentPlayer()
    : [];

  const strategyHint: Action | null = isHumanTurn && engine
    ? engine.getBasicStrategyHint()
    : null;

  const onPlayerAction = useCallback(async (action: Action) => {
    if (!isHumanTurn) return;
    await handlePlayerAction(action);
  }, [isHumanTurn, handlePlayerAction]);

  useKeyboardShortcuts(availableActions, onPlayerAction, isHumanTurn);

  // Global keyboard shortcuts for non-action phases
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key.toLowerCase();

      // Dismiss decision feedback toast
      if (decisionFeedback && key === 'escape') {
        e.preventDefault();
        setDecisionFeedback(null);
        return;
      }

      // Betting phase: Enter/Space to deal
      if (phase === 'betting' && (key === 'enter' || key === ' ')) {
        e.preventDefault();
        handleDeal();
        return;
      }

      // Round over: Enter/Space/N to go to next hand
      if (phase === 'round_over' && (key === 'enter' || key === ' ' || key === 'n')) {
        e.preventDefault();
        nextRound();
        return;
      }

      // Insurance prompt: Y to accept, N to decline
      if (phase === 'insurance_prompt') {
        if (key === 'y') {
          e.preventDefault();
          handleInsurance(true);
        } else if (key === 'n') {
          e.preventDefault();
          handleInsurance(false);
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, decisionFeedback]);

  // Auto-advance: when phase becomes player_turn and current player is AI, play AI turns
  useEffect(() => {
    if (phase === 'player_turn' && !isAnimating && engine && !engine.isCurrentPlayerHuman()) {
      const advanceAI = async () => {
        const { playAITurns } = useGameStore.getState();
        await playAITurns(settings.speed);

        // Check if we need dealer turn
        const state = useGameStore.getState();
        if (state.activePlayerIndex === -1 && state.phase === 'player_turn') {
          await finishRound();
        }
      };
      advanceAI();
    }
  }, [phase, activePlayerIndex, isAnimating]);

  // Auto-advance: after human plays last action and all done
  useEffect(() => {
    if (phase === 'player_turn' && !isAnimating && activePlayerIndex === -1) {
      finishRound();
    }
  }, [phase, activePlayerIndex, isAnimating]);

  function handleDeal() {
    startNewRound();
  }

  function handlePlaceBetAndDeal(amount: number) {
    placeBet(amount);
  }

  // Compute arc positions: seats spread along a semi-circle
  // Arc center is where the dealer sits (top-center), seats fan out below
  const totalSeats = players.length;
  function getSeatPosition(index: number, total: number): { left: string; top: string } {
    // Arc from ~200° to ~340° (semi-circle below dealer)
    // 0=far left, last=far right, middle=bottom center
    const startAngle = 200;
    const endAngle = 340;
    const angle = total === 1
      ? (startAngle + endAngle) / 2
      : startAngle + (endAngle - startAngle) * (index / (total - 1));

    const rad = (angle * Math.PI) / 180;
    // Elliptical arc: wider than tall
    const radiusX = 42; // % of container width
    const radiusY = 36; // % of container height
    const centerX = 50; // % from left
    const centerY = 18; // % from top (dealer position)

    const left = centerX + radiusX * Math.cos(rad);
    const top = centerY - radiusY * Math.sin(rad);

    return { left: `${left}%`, top: `${top}%` };
  }

  return (
    <div className={`table-area ${tutorialHighlight === 'dealer-area' || tutorialHighlight === 'table-seats' ? 'table-area--tutorial-active' : ''}`}>
      <div className={tutorialHighlight === 'dealer-area' ? 'table-area__highlight' : ''}>
        <DealerArea hand={dealerHand} />
      </div>

      <div className={`seats-area ${tutorialHighlight === 'table-seats' ? 'table-area__highlight table-area__highlight--seats' : ''}`}>
        {players.map((player, i) => {
          const pos = getSeatPosition(i, totalSeats);
          return (
            <div
              key={player.seatIndex}
              className="player-seat-wrapper"
              style={{
                left: pos.left,
                top: player.isHuman ? `calc(${pos.top} + 40px)` : pos.top,
              }}
            >
              <PlayerSeat
                player={player}
                isActive={phase === 'player_turn' && activePlayerIndex === i}
              />
            </div>
          );
        })}
      </div>

      {/* Human controls - fixed at bottom center */}
      {humanPlayer && (
        <div className="player-controls">
          <BankrollDisplay
            bankroll={humanPlayer.bankroll}
            startingBankroll={settings.startingBankroll}
          />

          {phase === 'betting' && (
            <div className={tutorialHighlight === 'bet-controls' ? 'player-controls__highlight' : ''}>
              <BetControls
                bankroll={humanPlayer.bankroll}
                minimumBet={settings.minimumBet}
                maximumBet={settings.maximumBet}
                onPlaceBet={handlePlaceBetAndDeal}
                onDeal={handleDeal}
              />
            </div>
          )}

          {isHumanTurn && (
            <div className={tutorialHighlight === 'action-buttons' ? 'player-controls__highlight' : ''}>
              <HumanPlayer
                availableActions={availableActions}
                strategyHint={strategyHint}
                onAction={onPlayerAction}
              />
            </div>
          )}

          {phase === 'round_over' && (
            <Button variant="gold" onClick={nextRound}>
              Next Hand <span className="kbd">Enter</span>
            </Button>
          )}
        </div>
      )}

      {/* Insurance prompt - bottom bar so cards stay visible */}
      <AnimatePresence>
        {phase === 'insurance_prompt' && (
          <motion.div
            className="insurance-bar"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.25 }}
          >
            <span className="insurance-bar__text">
              Dealer shows an Ace — take insurance?
              {humanPlayer && (
                <span className="insurance-bar__cost">
                  {' '}(costs {formatCurrency(humanPlayer.hands[0].bet / 2)})
                </span>
              )}
            </span>
            <div className="insurance-bar__actions">
              <Button variant="secondary" onClick={() => handleInsurance(false)}>
                No <span className="kbd">N</span>
              </Button>
              <Button variant="primary" onClick={() => handleInsurance(true)}>
                Yes <span className="kbd">Y</span>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Training mode: decision feedback toast */}
      <AnimatePresence>
        {decisionFeedback && (
          <motion.div
            key={decisionFeedback.isCorrect ? 'correct' : 'incorrect'}
            className={`decision-toast ${decisionFeedback.isCorrect ? 'decision-toast--correct' : 'decision-toast--incorrect'}`}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            onClick={() => setDecisionFeedback(null)}
          >
            <div className="decision-toast__icon">
              {decisionFeedback.isCorrect ? '\u2713' : '\u2717'}
            </div>
            <div className="decision-toast__content">
              <div className="decision-toast__verdict">
                {decisionFeedback.isCorrect ? 'Correct!' : 'Wrong!'}
              </div>
              <div className="decision-toast__text">
                {getDecisionReasoning(decisionFeedback)}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
