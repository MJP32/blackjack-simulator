import { useCallback } from 'react';
import { useGameStore } from '@/stores/gameStore.js';
import { useSettingsStore } from '@/stores/settingsStore.js';
import { useStatsStore } from '@/stores/statsStore.js';
import { getHandTotal, isSoft } from '@/engine/hand.js';
import { cardValue } from '@/engine/card.js';
import { getBasicStrategyActionCode } from '@/engine/basicStrategy.js';
import { getRecommendedBet } from '@/engine/countingSystem.js';
import type { Action, DecisionRecord } from '@/engine/types.js';

export function useGameActions() {
  const gameStore = useGameStore();
  const settings = useSettingsStore();
  const statsStore = useStatsStore();

  const startNewRound = useCallback(async () => {
    gameStore.startRound();

    // Check for reshuffle (new shoe)
    const engine = useGameStore.getState().engine;
    if (engine && engine.consumeReshuffle()) {
      const humanPlayer = useGameStore.getState().players.find(p => p.isHuman);
      if (humanPlayer) {
        statsStore.startNewShoe(humanPlayer.bankroll);
      }
    }

    // Play AI turns before human
    await gameStore.playAITurns(settings.speed);
  }, [gameStore, settings.speed, statsStore]);

  const handlePlayerAction = useCallback(async (action: Action) => {
    const engine = gameStore.engine;
    if (engine) {
      const state = useGameStore.getState();
      const humanPlayer = state.players.find(p => p.isHuman);
      const humanIndex = state.players.findIndex(p => p.isHuman);

      if (humanPlayer && state.activePlayerIndex === humanIndex) {
        const hand = humanPlayer.hands[humanPlayer.currentHandIndex];
        const dealerUpcard = state.dealerHand.cards[0];
        const correctAction = engine.getBasicStrategyHint();

        if (correctAction) {
          const strategyCode = getBasicStrategyActionCode(hand, dealerUpcard);
          const total = getHandTotal(hand.cards);
          const isSoftHand = isSoft(hand.cards);
          const isPair = hand.cards.length === 2 &&
            cardValue(hand.cards[0])[0] === cardValue(hand.cards[1])[0];

          const decision: DecisionRecord = {
            playerCards: [...hand.cards],
            handTotal: total,
            isSoftHand,
            isPair,
            dealerUpcard,
            playerAction: action,
            correctAction,
            strategyCode,
            isCorrect: action === correctAction,
            runningCount: state.shoeState.countInfo.runningCount,
            trueCount: state.shoeState.countInfo.trueCount,
            handIndex: humanPlayer.currentHandIndex,
          };

          statsStore.recordDecision(decision);

          // In training mode, show feedback popup for every decision
          if (settings.mode === 'training') {
            gameStore.setDecisionFeedback(decision);
          }
        }
      }
    }

    gameStore.playerAction(action);

    // After human action, continue AI turns
    await gameStore.playAITurns(settings.speed);

    // Check if all players are done
    const currentPhase = useGameStore.getState().phase;
    if (currentPhase === 'player_turn') {
      const currentEngine = useGameStore.getState().engine;
      if (currentEngine && !currentEngine.isCurrentPlayerHuman()) {
        await gameStore.playAITurns(settings.speed);
      }
    }

    // If player turn is complete, start dealer turn
    const updatedPhase = useGameStore.getState().phase;
    const updatedEngine = useGameStore.getState().engine;
    if (updatedPhase === 'player_turn' && updatedEngine) {
      const idx = useGameStore.getState().activePlayerIndex;
      if (idx === -1) {
        await gameStore.playDealerTurn(settings.speed);
        recordRoundResults();
      }
    }
  }, [gameStore, settings.speed, statsStore]);

  const finishRound = useCallback(async () => {
    await gameStore.playDealerTurn(settings.speed);
    recordRoundResults();
  }, [gameStore, settings.speed]);

  const recordRoundResults = useCallback(() => {
    const state = useGameStore.getState();
    const humanPlayer = state.players.find(p => p.isHuman);
    if (!humanPlayer) return;

    for (let hi = 0; hi < humanPlayer.hands.length; hi++) {
      const hand = humanPlayer.hands[hi];
      if (hand.result && hand.result !== 'pending') {
        statsStore.recordHandResult(hand.result, hand.payout ?? 0);

        const rec = getRecommendedBet(
          Math.floor(state.shoeState.countInfo.trueCount),
          settings.minimumBet,
          humanPlayer.bankroll
        );

        statsStore.finalizeHand({
          handNumber: state.roundNumber,
          initialPlayerCards: hand.cards.slice(0, 2),
          finalPlayerCards: [...hand.cards],
          dealerUpcard: state.dealerHand.cards[0],
          dealerFullHand: [...state.dealerHand.cards],
          bet: hand.bet,
          isDoubled: hand.isDoubled,
          isSplitHand: humanPlayer.hands.length > 1,
          runningCountAtDeal: state.shoeState.countInfo.runningCount,
          trueCountAtDeal: state.shoeState.countInfo.trueCount,
          recommendedBet: rec.amount,
          result: hand.result,
          payout: hand.payout ?? 0,
        }, hi);
      }
    }

    // Clear decisions buffer for next hand
    useStatsStore.setState({ currentHandDecisions: [] });

    statsStore.updateBankrollExtremes(humanPlayer.bankroll);
    statsStore.recordEVEntry({
      handNumber: state.roundNumber,
      bankroll: humanPlayer.bankroll,
      trueCount: state.shoeState.countInfo.trueCount,
      bet: humanPlayer.hands[0]?.bet ?? 0,
    });
  }, [statsStore, settings.minimumBet]);

  return {
    startNewRound,
    handlePlayerAction,
    finishRound,
    recordRoundResults,
  };
}
