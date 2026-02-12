import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameMode, SpeedSetting } from '@/engine/types.js';
import { MODE_DEFAULTS } from '@/utils/constants.js';

interface SettingsState {
  // Game rules
  numberOfDecks: number;
  penetration: number;
  hitSoft17: boolean;
  allowInsurance: boolean;
  allowSurrender: boolean;
  allowDoubleAfterSplit: boolean;
  minimumBet: number;
  maximumBet: number;
  startingBankroll: number;
  numberOfAIPlayers: number;
  humanSeatPosition: number;

  // Mode
  mode: GameMode;
  tutorialStep: number;
  speed: SpeedSetting;

  // Features
  guessTheCount: boolean;
  showTutorial: boolean;

  // Visibility (derived from mode but overridable)
  showCount: boolean;
  showBetAdvice: boolean;
  showBasicStrategyHint: boolean;

  // Actions
  setMode: (mode: GameMode) => void;
  setTutorialStep: (step: number) => void;
  setGuessTheCount: (v: boolean) => void;
  setShowTutorial: (v: boolean) => void;
  setSpeed: (speed: SpeedSetting) => void;
  setNumberOfDecks: (n: number) => void;
  setPenetration: (p: number) => void;
  setHitSoft17: (v: boolean) => void;
  setAllowInsurance: (v: boolean) => void;
  setAllowSurrender: (v: boolean) => void;
  setAllowDoubleAfterSplit: (v: boolean) => void;
  setMinimumBet: (v: number) => void;
  setMaximumBet: (v: number) => void;
  setStartingBankroll: (v: number) => void;
  setNumberOfAIPlayers: (v: number) => void;
  setHumanSeatPosition: (v: number) => void;
  toggleShowCount: () => void;
  toggleShowBetAdvice: () => void;
  toggleShowBasicStrategyHint: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      numberOfDecks: 6,
      penetration: 0.75,
      hitSoft17: true,
      allowInsurance: true,
      allowSurrender: true,
      allowDoubleAfterSplit: true,
      minimumBet: 5,
      maximumBet: 250,
      startingBankroll: 1000,
      numberOfAIPlayers: 6,
      humanSeatPosition: 3,

      mode: 'training',
      tutorialStep: 0,
      speed: 'normal',

      guessTheCount: false,
      showTutorial: false,

      showCount: true,
      showBetAdvice: true,
      showBasicStrategyHint: true,

      setMode: (mode) => set({
        mode,
        ...MODE_DEFAULTS[mode],
      }),
      setTutorialStep: (tutorialStep) => set({ tutorialStep }),
      setGuessTheCount: (guessTheCount) => set({ guessTheCount }),
      setShowTutorial: (showTutorial) => set({ showTutorial }),
      setSpeed: (speed) => set({ speed }),
      setNumberOfDecks: (numberOfDecks) => set({ numberOfDecks }),
      setPenetration: (penetration) => set({ penetration }),
      setHitSoft17: (hitSoft17) => set({ hitSoft17 }),
      setAllowInsurance: (allowInsurance) => set({ allowInsurance }),
      setAllowSurrender: (allowSurrender) => set({ allowSurrender }),
      setAllowDoubleAfterSplit: (allowDoubleAfterSplit) => set({ allowDoubleAfterSplit }),
      setMinimumBet: (minimumBet) => set({ minimumBet }),
      setMaximumBet: (maximumBet) => set({ maximumBet }),
      setStartingBankroll: (startingBankroll) => set({ startingBankroll }),
      setNumberOfAIPlayers: (numberOfAIPlayers) => set({ numberOfAIPlayers }),
      setHumanSeatPosition: (humanSeatPosition) => set({ humanSeatPosition }),
      toggleShowCount: () => set((s) => ({ showCount: !s.showCount })),
      toggleShowBetAdvice: () => set((s) => ({ showBetAdvice: !s.showBetAdvice })),
      toggleShowBasicStrategyHint: () => set((s) => ({ showBasicStrategyHint: !s.showBasicStrategyHint })),
    }),
    { name: 'blackjack-settings' }
  )
);
