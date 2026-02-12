import type { GameSettings, GameMode, SpeedSetting } from '@/engine/types.js';

export const DEFAULT_SETTINGS: GameSettings = {
  numberOfDecks: 6,
  penetration: 0.75,
  hitSoft17: true,
  allowInsurance: true,
  allowSurrender: true,
  allowDoubleAfterSplit: true,
  blackjackPayout: 1.5,
  minimumBet: 5,
  maximumBet: 250,
  startingBankroll: 1000,
  numberOfAIPlayers: 6,
  humanSeatPosition: 3,
  speed: 'normal',
};

export const BET_INCREMENTS = [5, 10, 25, 50, 100, 250];

export const SPEED_DELAYS: Record<SpeedSetting, number> = {
  slow: 1500,
  normal: 800,
  fast: 300,
  instant: 0,
};

export const MODE_DEFAULTS: Record<GameMode, { showCount: boolean; showBetAdvice: boolean; showBasicStrategyHint: boolean }> = {
  training: { showCount: true, showBetAdvice: true, showBasicStrategyHint: true },
  casino_realism: { showCount: false, showBetAdvice: false, showBasicStrategyHint: false },
};

export interface TutorialStep {
  title: string;
  description: string;
  highlight?: string; // sidebar section to highlight
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'Welcome to Card Counting',
    description: 'Learn the Hi-Lo counting system. Cards 2-6 are +1, 7-9 are 0, and 10-A are -1. Track the running count as cards are dealt.',
    highlight: 'dealer-area',
  },
  {
    title: 'Running Count Practice',
    description: 'Watch each card dealt and update your running count. The count starts at 0 and changes with each card revealed.',
    highlight: 'dealer-area',
  },
  {
    title: 'True Count',
    description: 'The true count divides the running count by the number of decks remaining. This gives a more accurate picture of the advantage.',
    highlight: 'table-seats',
  },
  {
    title: 'Bet Sizing',
    description: 'When the true count is positive, you have an advantage. Increase your bet proportionally: TC+2 = 2 units, TC+3 = 4 units, TC+4 = 8 units.',
    highlight: 'table-seats',
  },
  {
    title: 'Placing Your Bet',
    description: 'Click chip buttons to build your bet, then press Deal. The chips range from $5 to $250. Use Clear to start over. Your bankroll is shown above the controls.',
    highlight: 'bet-controls',
  },
  {
    title: 'Action Buttons',
    description: 'During your turn, choose Hit, Stand, Double, Split, or Surrender. In Training mode, the correct basic strategy play is highlighted with a glow. Keyboard shortcuts are shown on each button (H, S, D, P, R).',
    highlight: 'action-buttons',
  },
  {
    title: 'Sidebar: Card Count',
    description: 'The Card Count panel on the right shows the Running Count, True Count, and Decks Remaining. Green means the count favors you, red favors the dealer. Use these to guide your bet sizing.',
    highlight: 'card-count',
  },
  {
    title: 'Sidebar: Shoe Progress',
    description: 'The Shoe Progress bar shows how far through the shoe you are. The count becomes more reliable as more cards are dealt. When penetration is high, a reshuffle is coming.',
    highlight: 'shoe-progress',
  },
  {
    title: 'Sidebar: Bet Advice',
    description: 'The Bet Advice panel shows the recommended bet based on the true count and your bankroll. It also shows your current player advantage as a percentage.',
    highlight: 'bet-advice',
  },
  {
    title: 'Sidebar: Session Stats',
    description: 'Session Stats tracks your hands played, win/loss record, net profit, and strategy accuracy. The Bankroll History chart plots your bankroll over time so you can see trends.',
    highlight: 'session-stats',
  },
  {
    title: 'Full Practice',
    description: 'Now put it all together! Play hands, count cards, and adjust your bets. Use basic strategy for optimal play. Check the Report for a detailed breakdown of your session.',
  },
];
