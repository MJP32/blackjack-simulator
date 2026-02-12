import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SessionStats, EVHistoryEntry, CountGuessEntry, HandResult, DecisionRecord, HandRecord, ShoeRecord } from '@/engine/types.js';
import { buildShoeRecord } from '@/utils/grading.js';

interface StatsState extends SessionStats {
  evHistory: EVHistoryEntry[];
  countGuesses: CountGuessEntry[];
  shoeRecords: ShoeRecord[];
  currentShoeHands: HandRecord[];
  currentShoeNumber: number;
  currentHandDecisions: DecisionRecord[];
  currentShoeStartBankroll: number;

  recordHandResult: (result: HandResult, payout: number) => void;
  recordEVEntry: (entry: EVHistoryEntry) => void;
  recordCountGuess: (entry: CountGuessEntry) => void;
  recordStrategyDecision: (correct: boolean) => void;
  updateBankrollExtremes: (bankroll: number) => void;
  recordDecision: (d: DecisionRecord) => void;
  finalizeHand: (data: Omit<HandRecord, 'decisions'>, handIndex: number) => void;
  startNewShoe: (bankroll: number) => void;
  finalizeCurrentShoe: (bankroll: number) => void;
  resetSession: () => void;
}

const initialStats: SessionStats = {
  handsPlayed: 0,
  handsWon: 0,
  handsLost: 0,
  handsPushed: 0,
  blackjacks: 0,
  netProfit: 0,
  peakBankroll: 1000,
  lowestBankroll: 1000,
  correctStrategyDecisions: 0,
  totalStrategyDecisions: 0,
};

export const useStatsStore = create<StatsState>()(
  persist(
    (set, get) => ({
      ...initialStats,
      evHistory: [],
      countGuesses: [],
      shoeRecords: [],
      currentShoeHands: [],
      currentShoeNumber: 1,
      currentHandDecisions: [],
      currentShoeStartBankroll: 1000,

      recordHandResult: (result, payout) => set((s) => ({
        handsPlayed: s.handsPlayed + 1,
        handsWon: s.handsWon + (result === 'win' || result === 'blackjack' ? 1 : 0),
        handsLost: s.handsLost + (result === 'loss' || result === 'surrender' ? 1 : 0),
        handsPushed: s.handsPushed + (result === 'push' ? 1 : 0),
        blackjacks: s.blackjacks + (result === 'blackjack' ? 1 : 0),
        netProfit: s.netProfit + payout,
      })),

      recordEVEntry: (entry) => set((s) => ({
        evHistory: [...s.evHistory, entry],
      })),

      recordCountGuess: (entry) => set((s) => ({
        countGuesses: [...s.countGuesses, entry],
      })),

      recordStrategyDecision: (correct) => set((s) => ({
        correctStrategyDecisions: s.correctStrategyDecisions + (correct ? 1 : 0),
        totalStrategyDecisions: s.totalStrategyDecisions + 1,
      })),

      updateBankrollExtremes: (bankroll) => set((s) => ({
        peakBankroll: Math.max(s.peakBankroll, bankroll),
        lowestBankroll: Math.min(s.lowestBankroll, bankroll),
      })),

      recordDecision: (d) => set((s) => ({
        currentHandDecisions: [...s.currentHandDecisions, d],
        correctStrategyDecisions: s.correctStrategyDecisions + (d.isCorrect ? 1 : 0),
        totalStrategyDecisions: s.totalStrategyDecisions + 1,
      })),

      finalizeHand: (data, handIndex) => {
        const s = get();
        const decisions = s.currentHandDecisions.filter(d => d.handIndex === handIndex);
        const handRecord: HandRecord = { ...data, decisions };
        set({
          currentShoeHands: [...s.currentShoeHands, handRecord],
        });
      },

      startNewShoe: (bankroll) => {
        const s = get();
        if (s.currentShoeHands.length > 0) {
          const shoe = buildShoeRecord(s.currentShoeNumber, s.currentShoeHands, s.currentShoeStartBankroll, bankroll);
          set({
            shoeRecords: [...s.shoeRecords, shoe],
            currentShoeHands: [],
            currentShoeNumber: s.currentShoeNumber + 1,
            currentHandDecisions: [],
            currentShoeStartBankroll: bankroll,
          });
        } else {
          set({
            currentShoeStartBankroll: bankroll,
            currentHandDecisions: [],
          });
        }
      },

      finalizeCurrentShoe: (bankroll) => {
        const s = get();
        if (s.currentShoeHands.length > 0) {
          const shoe = buildShoeRecord(s.currentShoeNumber, s.currentShoeHands, s.currentShoeStartBankroll, bankroll);
          set({
            shoeRecords: [...s.shoeRecords, shoe],
            currentShoeHands: [],
            currentShoeNumber: s.currentShoeNumber + 1,
            currentHandDecisions: [],
            currentShoeStartBankroll: bankroll,
          });
        }
      },

      resetSession: () => set({
        ...initialStats,
        evHistory: [],
        countGuesses: [],
        shoeRecords: [],
        currentShoeHands: [],
        currentShoeNumber: 1,
        currentHandDecisions: [],
        currentShoeStartBankroll: 1000,
      }),
    }),
    {
      name: 'blackjack-stats',
      version: 2,
      migrate: (persisted: unknown) => {
        return {
          ...(persisted as Record<string, unknown>),
          shoeRecords: [],
          currentShoeHands: [],
          currentShoeNumber: 1,
          currentHandDecisions: [],
          currentShoeStartBankroll: 1000,
        };
      },
    }
  )
);
