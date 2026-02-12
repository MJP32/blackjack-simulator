import { create } from 'zustand';
import type { GameState, GameSettings, Action, SpeedSetting, DecisionRecord } from '@/engine/types.js';
import { GameEngine } from '@/engine/gameEngine.js';
import { DEFAULT_SETTINGS, SPEED_DELAYS } from '@/utils/constants.js';
import { createEmptyHand } from '@/engine/hand.js';

interface GameStore extends GameState {
  engine: GameEngine | null;
  isAnimating: boolean;
  decisionFeedback: DecisionRecord | null;

  initGame: (settings?: Partial<GameSettings>) => void;
  startRound: () => void;
  placeBet: (amount: number) => void;
  playerAction: (action: Action) => void;
  playAITurns: (speed: SpeedSetting) => Promise<void>;
  playDealerTurn: (speed: SpeedSetting) => Promise<void>;
  resolveRound: () => void;
  nextRound: () => void;
  handleInsurance: (accept: boolean) => void;
  syncState: () => void;
  setDecisionFeedback: (d: DecisionRecord | null) => void;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const emptyGameState: GameState = {
  players: [],
  dealerHand: createEmptyHand(),
  phase: 'betting',
  activePlayerIndex: -1,
  shoeState: {
    totalCards: 312,
    cardsDealt: 0,
    penetration: 0,
    needsReshuffle: false,
    countInfo: {
      runningCount: 0,
      trueCount: 0,
      cardsDealt: 0,
      cardsRemaining: 312,
      decksRemaining: 6,
    },
  },
  roundResults: [],
  roundNumber: 0,
};

export const useGameStore = create<GameStore>()((set, get) => ({
  ...emptyGameState,
  engine: null,
  isAnimating: false,
  decisionFeedback: null,

  initGame: (overrides = {}) => {
    const settings: GameSettings = { ...DEFAULT_SETTINGS, ...overrides };
    const engine = new GameEngine(settings);
    set({ engine, ...engine.getState() });
  },

  syncState: () => {
    const { engine } = get();
    if (engine) {
      set(engine.getState());
    }
  },

  placeBet: (amount) => {
    const { engine } = get();
    if (!engine) return;
    const humanIdx = engine.getHumanPlayerIndex();
    engine.placeBet(humanIdx, amount);
    set(engine.getState());
  },

  startRound: () => {
    const { engine } = get();
    if (!engine) return;
    engine.placeAIBets();
    engine.deal();
    set(engine.getState());
  },

  handleInsurance: (accept) => {
    const { engine } = get();
    if (!engine) return;

    if (accept) {
      const humanIdx = engine.getHumanPlayerIndex();
      engine.placeInsurance(humanIdx);
    }
    engine.resolveInsuranceAndContinue();
    set(engine.getState());
  },

  playerAction: (action) => {
    const { engine } = get();
    if (!engine) return;

    const result = engine.playerAction(action);
    set(engine.getState());

    if (result.done) {
      // All players done - auto-trigger dealer turn is handled by the component
    }
  },

  playAITurns: async (speed) => {
    const { engine } = get();
    if (!engine) return;

    set({ isAnimating: true });
    const delayMs = SPEED_DELAYS[speed];

    while (engine.getPhase() === 'player_turn') {
      if (engine.isCurrentPlayerHuman()) {
        break;
      }

      const action = engine.playAITurn();
      if (!action) break;

      set(engine.getState());

      if (delayMs > 0) {
        await delay(delayMs);
      }
    }

    set({ ...engine.getState(), isAnimating: false });
  },

  playDealerTurn: async (speed) => {
    const { engine } = get();
    if (!engine) return;

    set({ isAnimating: true });
    const delayMs = SPEED_DELAYS[speed];

    engine.startDealerTurn();
    set(engine.getState());

    if (delayMs > 0) await delay(delayMs);

    if (!engine.allPlayersBusted()) {
      while (engine.dealerShouldHit()) {
        engine.dealerHit();
        set(engine.getState());

        if (delayMs > 0) await delay(delayMs);
      }
    }

    engine.resolveAllHands();
    set({ ...engine.getState(), isAnimating: false });
  },

  resolveRound: () => {
    const { engine } = get();
    if (!engine) return;
    engine.resolveAllHands();
    set(engine.getState());
  },

  nextRound: () => {
    const { engine } = get();
    if (!engine) return;
    engine.resetForNewRound();
    set(engine.getState());
  },

  setDecisionFeedback: (d) => set({ decisionFeedback: d }),
}));
