export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
}

export type Action = 'hit' | 'stand' | 'double' | 'split' | 'surrender' | 'insurance';

export type RoundPhase =
  | 'betting'
  | 'dealing'
  | 'insurance_prompt'
  | 'player_turn'
  | 'dealer_turn'
  | 'resolving'
  | 'round_over';

export type GameMode = 'training' | 'casino_realism';

export type SpeedSetting = 'slow' | 'normal' | 'fast' | 'instant';

export interface HandTotal {
  hard: number;
  soft: number;
  best: number;
}

export interface HandState {
  cards: Card[];
  bet: number;
  isDoubled: boolean;
  isSurrendered: boolean;
  isInsured: boolean;
  insuranceBet: number;
  result?: HandResult;
  payout?: number;
}

export type HandResult = 'blackjack' | 'win' | 'loss' | 'push' | 'surrender' | 'pending';

export interface Player {
  name: string;
  seatIndex: number;
  bankroll: number;
  hands: HandState[];
  isHuman: boolean;
  isActive: boolean;
  currentHandIndex: number;
}

export interface CountInfo {
  runningCount: number;
  trueCount: number;
  cardsDealt: number;
  cardsRemaining: number;
  decksRemaining: number;
}

export interface ShoeState {
  totalCards: number;
  cardsDealt: number;
  penetration: number;
  needsReshuffle: boolean;
  countInfo: CountInfo;
}

export interface BetRecommendation {
  units: number;
  amount: number;
  advantage: number;
}

export interface RoundResult {
  playerName: string;
  seatIndex: number;
  handIndex: number;
  bet: number;
  result: HandResult;
  payout: number;
}

export interface GameSettings {
  numberOfDecks: number;
  penetration: number;
  hitSoft17: boolean;
  allowInsurance: boolean;
  allowSurrender: boolean;
  allowDoubleAfterSplit: boolean;
  blackjackPayout: number; // 1.5 for 3:2
  minimumBet: number;
  maximumBet: number;
  startingBankroll: number;
  numberOfAIPlayers: number;
  humanSeatPosition: number; // 0-based index among all seats
  speed: SpeedSetting;
}

export interface GameState {
  players: Player[];
  dealerHand: HandState;
  phase: RoundPhase;
  activePlayerIndex: number;
  shoeState: ShoeState;
  roundResults: RoundResult[];
  roundNumber: number;
}

export interface EVHistoryEntry {
  handNumber: number;
  bankroll: number;
  trueCount: number;
  bet: number;
}

export interface CountGuessEntry {
  actual: number;
  guessed: number;
  correct: boolean;
}

export interface SessionStats {
  handsPlayed: number;
  handsWon: number;
  handsLost: number;
  handsPushed: number;
  blackjacks: number;
  netProfit: number;
  peakBankroll: number;
  lowestBankroll: number;
  correctStrategyDecisions: number;
  totalStrategyDecisions: number;
}

export interface DecisionRecord {
  playerCards: Card[];
  handTotal: HandTotal;
  isSoftHand: boolean;
  isPair: boolean;
  dealerUpcard: Card;
  playerAction: Action;
  correctAction: Action;
  strategyCode: string | null;
  isCorrect: boolean;
  runningCount: number;
  trueCount: number;
  handIndex: number;
}

export interface HandRecord {
  handNumber: number;
  initialPlayerCards: Card[];
  finalPlayerCards: Card[];
  dealerUpcard: Card;
  dealerFullHand: Card[];
  decisions: DecisionRecord[];
  bet: number;
  isDoubled: boolean;
  isSplitHand: boolean;
  runningCountAtDeal: number;
  trueCountAtDeal: number;
  recommendedBet: number;
  result: HandResult;
  payout: number;
}

export interface ShoeRecord {
  shoeNumber: number;
  hands: HandRecord[];
  correctDecisions: number;
  totalDecisions: number;
  grade: number;
  netProfit: number;
  startingBankroll: number;
  endingBankroll: number;
}
