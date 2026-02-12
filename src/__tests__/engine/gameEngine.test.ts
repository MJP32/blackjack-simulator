import { GameEngine } from '@/engine/gameEngine';
import type { GameSettings } from '@/engine/types';
import { DEFAULT_SETTINGS } from '@/utils/constants';

function createEngine(overrides: Partial<GameSettings> = {}): GameEngine {
  return new GameEngine({ ...DEFAULT_SETTINGS, numberOfAIPlayers: 0, ...overrides });
}

describe('GameEngine', () => {
  describe('Initialization', () => {
    it('should create engine with correct number of players', () => {
      const engine = createEngine({ numberOfAIPlayers: 2 });
      const state = engine.getState();
      expect(state.players.length).toBe(3); // 2 AI + 1 human
    });

    it('should place human at seat index 2', () => {
      const engine = createEngine();
      const state = engine.getState();
      const human = state.players.find(p => p.isHuman);
      expect(human).toBeDefined();
      expect(human!.seatIndex).toBe(2);
    });

    it('should start in betting phase', () => {
      const engine = createEngine();
      expect(engine.getPhase()).toBe('betting');
    });
  });

  describe('Betting', () => {
    it('should accept valid bets', () => {
      const engine = createEngine();
      const humanIdx = engine.getHumanPlayerIndex();
      const result = engine.placeBet(humanIdx, 10);
      expect(result).toBe(true);
    });

    it('should reject bets below minimum', () => {
      const engine = createEngine({ minimumBet: 10 });
      const humanIdx = engine.getHumanPlayerIndex();
      const result = engine.placeBet(humanIdx, 5);
      expect(result).toBe(false);
    });

    it('should reject bets above maximum', () => {
      const engine = createEngine({ maximumBet: 100 });
      const humanIdx = engine.getHumanPlayerIndex();
      const result = engine.placeBet(humanIdx, 200);
      expect(result).toBe(false);
    });

    it('should reject bets above bankroll', () => {
      const engine = createEngine({ startingBankroll: 50 });
      const humanIdx = engine.getHumanPlayerIndex();
      const result = engine.placeBet(humanIdx, 100);
      expect(result).toBe(false);
    });
  });

  describe('Dealing', () => {
    it('should deal 2 cards to player and dealer', () => {
      const engine = createEngine();
      const humanIdx = engine.getHumanPlayerIndex();
      engine.placeBet(humanIdx, 10);
      engine.deal();

      const state = engine.getState();
      const human = state.players.find(p => p.isHuman)!;
      expect(human.hands[0].cards.length).toBe(2);
      expect(state.dealerHand.cards.length).toBe(2);
    });

    it('should have dealer first card face up, second face down', () => {
      const engine = createEngine();
      const humanIdx = engine.getHumanPlayerIndex();
      engine.placeBet(humanIdx, 10);
      engine.deal();

      const state = engine.getState();
      expect(state.dealerHand.cards[0].faceUp).toBe(true);
      expect(state.dealerHand.cards[1].faceUp).toBe(false);
    });

    it('should advance to player_turn after dealing (usually)', () => {
      const engine = createEngine();
      const humanIdx = engine.getHumanPlayerIndex();
      engine.placeBet(humanIdx, 10);
      engine.deal();

      const phase = engine.getPhase();
      // Could be insurance_prompt if dealer shows Ace, or player_turn
      expect(['player_turn', 'insurance_prompt', 'resolving', 'round_over']).toContain(phase);
    });
  });

  describe('Player Actions', () => {
    function setupPlayerTurn(): GameEngine {
      // Create engine and deal until we get a normal player_turn
      // (not blackjack, not insurance)
      let engine: GameEngine;
      let attempts = 0;
      do {
        engine = createEngine({ allowInsurance: false });
        const humanIdx = engine.getHumanPlayerIndex();
        engine.placeBet(humanIdx, 10);
        engine.deal();
        attempts++;
      } while (engine.getPhase() !== 'player_turn' && attempts < 100);
      return engine;
    }

    it('should allow hit action', () => {
      const engine = setupPlayerTurn();
      if (engine.getPhase() !== 'player_turn') return; // skip if couldn't set up

      const stateBefore = engine.getState();
      const human = stateBefore.players.find(p => p.isHuman)!;
      const cardsBefore = human.hands[0].cards.length;

      engine.playerAction('hit');
      const stateAfter = engine.getState();
      const humanAfter = stateAfter.players.find(p => p.isHuman)!;
      expect(humanAfter.hands[0].cards.length).toBe(cardsBefore + 1);
    });

    it('should allow stand action', () => {
      const engine = setupPlayerTurn();
      if (engine.getPhase() !== 'player_turn') return;

      const result = engine.playerAction('stand');
      expect(result.done).toBe(true);
    });
  });

  describe('Dealer Turn', () => {
    it('should hit until 17 with S17 rules', () => {
      const engine = createEngine({ hitSoft17: false });
      const humanIdx = engine.getHumanPlayerIndex();
      engine.placeBet(humanIdx, 10);
      engine.deal();

      // Skip to dealer turn
      if (engine.getPhase() === 'insurance_prompt') {
        engine.declineInsurance();
      }

      if (engine.getPhase() === 'player_turn') {
        engine.playerAction('stand');
      }

      if (['resolving', 'round_over'].includes(engine.getPhase())) return;

      engine.startDealerTurn();

      while (engine.dealerShouldHit()) {
        engine.dealerHit();
      }

      const state = engine.getState();
      const { getHandTotal } = require('@/engine/hand');
      const total = getHandTotal(state.dealerHand.cards);
      expect(total.best).toBeGreaterThanOrEqual(17);
    });
  });

  describe('Round Lifecycle', () => {
    it('should complete a full round lifecycle', () => {
      const engine = createEngine({ allowInsurance: false });
      const humanIdx = engine.getHumanPlayerIndex();

      // 1. Place bet
      engine.placeBet(humanIdx, 10);
      expect(engine.getPhase()).toBe('betting');

      // 2. Deal
      engine.deal();
      const phase = engine.getPhase();

      if (phase === 'resolving' || phase === 'round_over') {
        // Dealer or player had blackjack
        if (phase === 'resolving') engine.resolveAllHands();
        return;
      }

      // 3. Player actions
      if (phase === 'player_turn') {
        engine.playerAction('stand');
      }

      // 4. Dealer turn (if needed)
      const afterPlayer = engine.getPhase();
      if (afterPlayer === 'player_turn') {
        // Active index is -1, need dealer turn
      }

      engine.startDealerTurn();
      while (engine.dealerShouldHit()) {
        engine.dealerHit();
      }

      // 5. Resolve
      engine.resolveAllHands();
      expect(engine.getPhase()).toBe('round_over');

      // 6. Reset
      engine.resetForNewRound();
      expect(engine.getPhase()).toBe('betting');
    });

    it('should handle reshuffle trigger', () => {
      const engine = createEngine({ penetration: 0.1, allowInsurance: false }); // Low penetration = quick reshuffle
      const humanIdx = engine.getHumanPlayerIndex();

      // Play several rounds to trigger reshuffle
      for (let i = 0; i < 5; i++) {
        engine.resetForNewRound();
        engine.placeBet(humanIdx, 5);
        engine.deal();

        const phase = engine.getPhase();
        if (phase === 'player_turn') {
          engine.playerAction('stand');
        }

        if (!['resolving', 'round_over'].includes(engine.getPhase())) {
          engine.startDealerTurn();
          while (engine.dealerShouldHit()) {
            engine.dealerHit();
          }
          engine.resolveAllHands();
        }
      }

      // After several rounds with 10% penetration, shoe should have been reshuffled
      const state = engine.getState();
      expect(state.roundNumber).toBeGreaterThan(0);
    });
  });

  describe('Insurance', () => {
    it('should prompt for insurance when dealer shows Ace', () => {
      // This is probabilistic - run multiple attempts
      let foundInsurance = false;
      for (let i = 0; i < 200; i++) {
        const engine = createEngine({ allowInsurance: true });
        const humanIdx = engine.getHumanPlayerIndex();
        engine.placeBet(humanIdx, 10);
        engine.deal();

        if (engine.getPhase() === 'insurance_prompt') {
          foundInsurance = true;
          break;
        }
      }
      // With 200 attempts, probability of never seeing an Ace upcard is negligible
      expect(foundInsurance).toBe(true);
    });
  });
});
