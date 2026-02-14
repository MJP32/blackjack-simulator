import type { GameSettings, Action, EVHistoryEntry, Card, HandState, HandResult } from './types.js';
import { GameEngine } from './gameEngine.js';
import { getBasicStrategyAction } from './basicStrategy.js';
import { calculatePlayerAdvantage } from './countingSystem.js';
import { getHandTotal, isSoft } from './hand.js';
import { cardValue } from './card.js';

// --- Types ---

export type PlayStrategy = 'basic' | 'hilo' | 'ko' | 'hiopt1' | 'hiopt2' | 'omega2' | 'zen' | 'wonging' | 'mimic' | 'never_bust';
export type BetSystem = 'flat' | 'spread' | 'kelly' | 'martingale' | 'paroli' | 'one_three_two_six' | 'oscars_grind' | 'fibonacci' | 'dalembert' | 'labouchere';

// --- Counting system definitions ---
// Hi-Lo and wonging use the engine's built-in Hi-Lo count.
// All other counting systems are tracked in parallel by the simulator.

interface CountingSystemDef {
  values: Record<string, number>;
  balanced: boolean;
}

const COUNTING_SYSTEMS: Partial<Record<PlayStrategy, CountingSystemDef>> = {
  ko: {
    // 7 counts as +1 (unbalanced — no true count conversion needed)
    values: { '2': 1, '3': 1, '4': 1, '5': 1, '6': 1, '7': 1, '8': 0, '9': 0, '10': -1, 'J': -1, 'Q': -1, 'K': -1, 'A': -1 },
    balanced: false,
  },
  hiopt1: {
    // 2 and A are neutral; more accurate but needs ace side count
    values: { '2': 0, '3': 1, '4': 1, '5': 1, '6': 1, '7': 0, '8': 0, '9': 0, '10': -1, 'J': -1, 'Q': -1, 'K': -1, 'A': 0 },
    balanced: true,
  },
  hiopt2: {
    // Multi-level: 4,5 → +2, 10s → −2; aces tracked separately
    values: { '2': 1, '3': 1, '4': 2, '5': 2, '6': 1, '7': 1, '8': 0, '9': 0, '10': -2, 'J': -2, 'Q': -2, 'K': -2, 'A': 0 },
    balanced: true,
  },
  omega2: {
    // Multi-level with 9 → −1; one of the most accurate
    values: { '2': 1, '3': 1, '4': 2, '5': 2, '6': 2, '7': 1, '8': 0, '9': -1, '10': -2, 'J': -2, 'Q': -2, 'K': -2, 'A': 0 },
    balanced: true,
  },
  zen: {
    // Multi-level: A → −1, balanced; good all-around accuracy
    values: { '2': 1, '3': 1, '4': 2, '5': 2, '6': 2, '7': 1, '8': 0, '9': 0, '10': -2, 'J': -2, 'Q': -2, 'K': -2, 'A': -1 },
    balanced: true,
  },
};

// Maps true count thresholds to unit multipliers
export interface BetSpread {
  [tc: number]: number;
}

export const BET_SPREAD_PRESETS: Record<string, { label: string; spread: BetSpread }> = {
  conservative: { label: '1-4', spread: { 1: 1, 2: 2, 3: 3, 4: 4, 5: 4 } },
  moderate:     { label: '1-8', spread: { 1: 1, 2: 2, 3: 4, 4: 6, 5: 8 } },
  aggressive:   { label: '1-12', spread: { 1: 1, 2: 2, 3: 4, 4: 8, 5: 12 } },
  wong:         { label: '1-16', spread: { 1: 1, 2: 4, 3: 8, 4: 12, 5: 16 } },
};

export const DEFAULT_BET_SPREAD: BetSpread = BET_SPREAD_PRESETS.aggressive.spread;

export function resolveBetFromSpread(trueCount: number, betUnit: number, spread: BetSpread, bankroll: number, maxBet: number): number {
  const keys = Object.keys(spread).map(Number).sort((a, b) => a - b);
  let units = 1;
  for (const key of keys) {
    if (trueCount >= key) {
      units = spread[key];
    }
  }
  return Math.min(units * betUnit, bankroll, maxBet);
}

// --- Progression state for betting systems ---

export interface ProgressionState {
  currentMultiplier: number;
  consecutiveWins: number;
  sequenceStep: number;       // 1-3-2-6 (0–3)
  seriesProfit: number;       // Oscar's grind running P&L in units
  currentUnits: number;       // Oscar's grind / D'Alembert current bet in units
  lastResult: 'win' | 'loss' | 'push' | null;
  fibIndex: number;           // Fibonacci sequence position
  labouchereSeq: number[];    // Labouchere cancellation sequence
}

function createProgressionState(): ProgressionState {
  return {
    currentMultiplier: 1,
    consecutiveWins: 0,
    sequenceStep: 0,
    seriesProfit: 0,
    currentUnits: 1,
    lastResult: null,
    fibIndex: 0,
    labouchereSeq: [1, 2, 3, 4],
  };
}

// --- Config & Results ---

export interface SimulationConfig {
  playStrategy: PlayStrategy;
  betSystem: BetSystem;
  betAmount: number;
  numberOfHands: number;
  betSpread: BetSpread;
  wongThreshold: number;       // TC >= this to play (wonging)
  kellyFraction: number;       // 0.25 / 0.5 / 1.0
  settings: GameSettings;
}

export interface SimulationResults {
  wins: number;
  losses: number;
  pushes: number;
  blackjacks: number;
  surrenders: number;
  handsPlayed: number;
  roundsPlayed: number;
  roundsWatched: number;       // wonging: rounds sat out
  netProfit: number;
  peakBankroll: number;
  lowBankroll: number;
  finalBankroll: number;
  bankrollHistory: EVHistoryEntry[];
  totalWagered: number;
  houseEdge: number;
  avgBet: number;
}

export interface SimulationProgress {
  handsCompleted: number;
  totalHands: number;
  currentBankroll: number;
}

export interface SimulationState {
  engine: GameEngine;
  config: SimulationConfig;
  results: SimulationResults;
  progress: SimulationProgress;
  progression: ProgressionState;
  done: boolean;
  playerIndex: number;
  sampleInterval: number;
  customRunningCount: number;   // parallel count for non-Hi-Lo systems
  prevCardsRemaining: number;   // reshuffle detection
}

// --- Illustrious 18 + Fab 4 deviations ---

interface Deviation {
  table: 'hard' | 'soft' | 'pairs';
  playerTotal: number;
  isSoft: boolean;
  isPair: boolean;
  pairRank: string | null;
  dealerUpcard: string;
  threshold: number;
  direction: 'gte' | 'lte';
  action: Action;
}

function getDealerKey(card: Card): string {
  if (['J', 'Q', 'K'].includes(card.rank)) return '10';
  return card.rank;
}

const DEVIATIONS: Deviation[] = [
  { table: 'hard', playerTotal: 16, isSoft: false, isPair: false, pairRank: null, dealerUpcard: '10', threshold: 0,  direction: 'gte', action: 'stand' },
  { table: 'hard', playerTotal: 15, isSoft: false, isPair: false, pairRank: null, dealerUpcard: '10', threshold: 4,  direction: 'gte', action: 'stand' },
  { table: 'hard', playerTotal: 10, isSoft: false, isPair: false, pairRank: null, dealerUpcard: '10', threshold: 4,  direction: 'gte', action: 'double' },
  { table: 'hard', playerTotal: 10, isSoft: false, isPair: false, pairRank: null, dealerUpcard: 'A',  threshold: 4,  direction: 'gte', action: 'double' },
  { table: 'hard', playerTotal: 12, isSoft: false, isPair: false, pairRank: null, dealerUpcard: '3',  threshold: 2,  direction: 'gte', action: 'stand' },
  { table: 'hard', playerTotal: 12, isSoft: false, isPair: false, pairRank: null, dealerUpcard: '2',  threshold: 3,  direction: 'gte', action: 'stand' },
  { table: 'hard', playerTotal: 11, isSoft: false, isPair: false, pairRank: null, dealerUpcard: 'A',  threshold: 1,  direction: 'gte', action: 'double' },
  { table: 'hard', playerTotal: 9,  isSoft: false, isPair: false, pairRank: null, dealerUpcard: '2',  threshold: 1,  direction: 'gte', action: 'double' },
  { table: 'hard', playerTotal: 9,  isSoft: false, isPair: false, pairRank: null, dealerUpcard: '7',  threshold: 3,  direction: 'gte', action: 'double' },
  { table: 'hard', playerTotal: 16, isSoft: false, isPair: false, pairRank: null, dealerUpcard: '9',  threshold: 5,  direction: 'gte', action: 'stand' },
  { table: 'hard', playerTotal: 13, isSoft: false, isPair: false, pairRank: null, dealerUpcard: '2',  threshold: -1, direction: 'lte', action: 'hit' },
  { table: 'hard', playerTotal: 12, isSoft: false, isPair: false, pairRank: null, dealerUpcard: '4',  threshold: 0,  direction: 'lte', action: 'hit' },
  { table: 'hard', playerTotal: 12, isSoft: false, isPair: false, pairRank: null, dealerUpcard: '5',  threshold: -2, direction: 'lte', action: 'hit' },
  { table: 'hard', playerTotal: 12, isSoft: false, isPair: false, pairRank: null, dealerUpcard: '6',  threshold: -1, direction: 'lte', action: 'hit' },
  { table: 'hard', playerTotal: 13, isSoft: false, isPair: false, pairRank: null, dealerUpcard: '3',  threshold: -2, direction: 'lte', action: 'hit' },
  { table: 'pairs', playerTotal: 20, isSoft: false, isPair: true,  pairRank: '10', dealerUpcard: '5',  threshold: 5,  direction: 'gte', action: 'split' },
  { table: 'pairs', playerTotal: 20, isSoft: false, isPair: true,  pairRank: '10', dealerUpcard: '6',  threshold: 4,  direction: 'gte', action: 'split' },
  { table: 'hard', playerTotal: 15, isSoft: false, isPair: false, pairRank: null, dealerUpcard: '10', threshold: 0,  direction: 'gte', action: 'surrender' },
  { table: 'hard', playerTotal: 14, isSoft: false, isPair: false, pairRank: null, dealerUpcard: '10', threshold: 3,  direction: 'gte', action: 'surrender' },
  { table: 'hard', playerTotal: 15, isSoft: false, isPair: false, pairRank: null, dealerUpcard: '9',  threshold: 2,  direction: 'gte', action: 'surrender' },
  { table: 'hard', playerTotal: 15, isSoft: false, isPair: false, pairRank: null, dealerUpcard: 'A',  threshold: 1,  direction: 'gte', action: 'surrender' },
];

function getDeviationAction(
  hand: HandState,
  dealerUpcard: Card,
  trueCount: number,
  availableActions: Action[],
): Action | null {
  const cards = hand.cards;
  const total = getHandTotal(cards);
  const soft = isSoft(cards);
  const dealerKey = getDealerKey(dealerUpcard);

  let isPair = false;
  let pairRank: string | null = null;
  if (cards.length === 2) {
    const v1 = cardValue(cards[0])[0];
    const v2 = cardValue(cards[1])[0];
    if (v1 === v2) {
      isPair = true;
      pairRank = v1 === 10 ? '10' : cards[0].rank;
    }
  }

  let bestDev: Deviation | null = null;
  for (const dev of DEVIATIONS) {
    if (dev.dealerUpcard !== dealerKey) continue;
    if (dev.playerTotal !== total.best) continue;
    if (dev.isPair) {
      if (!isPair || dev.pairRank !== pairRank) continue;
    } else {
      if (dev.isSoft !== soft) continue;
    }
    const active = dev.direction === 'gte' ? trueCount >= dev.threshold : trueCount <= dev.threshold;
    if (!active) continue;
    if (!bestDev) bestDev = dev;
    else if (dev.action === 'surrender') bestDev = dev;
  }

  if (!bestDev) return null;
  if (availableActions.includes(bestDev.action)) return bestDev.action;
  if (bestDev.action === 'surrender') return availableActions.includes('hit') ? 'hit' : null;
  if (bestDev.action === 'double') return availableActions.includes('hit') ? 'hit' : null;
  return null;
}

// --- Strategy helpers ---

const USES_COUNTING: Set<PlayStrategy> = new Set(['hilo', 'ko', 'hiopt1', 'hiopt2', 'omega2', 'zen', 'wonging']);
const ONE_THREE_TWO_SIX = [1, 3, 2, 6];
const FIBONACCI = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144];

function getSimTrueCount(
  playStrategy: PlayStrategy,
  engine: GameEngine,
  customRunningCount: number,
): number {
  const system = COUNTING_SYSTEMS[playStrategy];
  if (!system) {
    // hilo, wonging, and non-counting strategies use engine's built-in Hi-Lo
    return engine.getShoeState().countInfo.trueCount;
  }
  if (!system.balanced) {
    // KO: running count used directly (no true count conversion)
    return customRunningCount;
  }
  const decksRemaining = engine.getShoeState().countInfo.cardsRemaining / 52;
  return decksRemaining > 0.25 ? customRunningCount / decksRemaining : 0;
}

function tallyCustomCount(engine: GameEngine, values: Record<string, number>): number {
  const state = engine.getState();
  let count = 0;
  for (const player of state.players) {
    for (const hand of player.hands) {
      for (const card of hand.cards) {
        count += values[card.rank] ?? 0;
      }
    }
  }
  for (const card of state.dealerHand.cards) {
    count += values[card.rank] ?? 0;
  }
  return count;
}

function calculateSimBet(
  config: SimulationConfig,
  progression: ProgressionState,
  trueCount: number,
  bankroll: number,
): number {
  const { betSystem, betAmount, betSpread, settings } = config;
  let bet: number;

  switch (betSystem) {
    case 'flat':
      bet = betAmount;
      break;

    case 'spread':
      bet = resolveBetFromSpread(trueCount, betAmount, betSpread, bankroll, settings.maximumBet);
      break;

    case 'kelly': {
      const advantage = calculatePlayerAdvantage(trueCount);
      if (advantage <= 0) {
        bet = betAmount; // min bet when no edge
      } else {
        // Kelly: bet = bankroll * edge * fraction
        bet = Math.round(bankroll * advantage * config.kellyFraction);
        bet = Math.max(bet, betAmount); // floor at base bet
      }
      break;
    }

    case 'martingale':
      bet = betAmount * progression.currentMultiplier;
      break;

    case 'paroli':
      bet = betAmount * progression.currentMultiplier;
      break;

    case 'one_three_two_six':
      bet = betAmount * ONE_THREE_TWO_SIX[progression.sequenceStep];
      break;

    case 'oscars_grind':
      bet = betAmount * progression.currentUnits;
      break;

    case 'fibonacci':
      bet = betAmount * FIBONACCI[Math.min(progression.fibIndex, FIBONACCI.length - 1)];
      break;

    case 'dalembert':
      bet = betAmount * progression.currentUnits;
      break;

    case 'labouchere': {
      const seq = progression.labouchereSeq;
      if (seq.length === 0) {
        bet = betAmount;
      } else if (seq.length === 1) {
        bet = betAmount * seq[0];
      } else {
        bet = betAmount * (seq[0] + seq[seq.length - 1]);
      }
      break;
    }

    default:
      bet = betAmount;
  }

  return Math.max(Math.min(bet, bankroll, settings.maximumBet), settings.minimumBet);
}

function updateProgression(
  progression: ProgressionState,
  betSystem: BetSystem,
  result: HandResult,
): void {
  const won = result === 'win' || result === 'blackjack';
  const lost = result === 'loss' || result === 'surrender';

  switch (betSystem) {
    case 'martingale':
      if (lost) {
        progression.currentMultiplier *= 2;
      } else {
        progression.currentMultiplier = 1;
      }
      break;

    case 'paroli':
      if (won) {
        progression.consecutiveWins++;
        progression.currentMultiplier *= 2;
        if (progression.consecutiveWins >= 3) {
          progression.consecutiveWins = 0;
          progression.currentMultiplier = 1;
        }
      } else {
        progression.consecutiveWins = 0;
        progression.currentMultiplier = 1;
      }
      break;

    case 'one_three_two_six':
      if (won) {
        progression.sequenceStep++;
        if (progression.sequenceStep > 3) {
          progression.sequenceStep = 0;
        }
      } else {
        progression.sequenceStep = 0;
      }
      break;

    case 'oscars_grind':
      if (won) {
        progression.seriesProfit += progression.currentUnits;
        if (progression.seriesProfit >= 1) {
          // Series complete — won 1 unit, reset
          progression.seriesProfit = 0;
          progression.currentUnits = 1;
        } else {
          // Increase bet by 1 unit, but cap so we don't overshoot +1 profit
          const needed = 1 - progression.seriesProfit;
          progression.currentUnits = Math.min(progression.currentUnits + 1, needed);
        }
      } else if (lost) {
        progression.seriesProfit -= progression.currentUnits;
        // Keep same bet size on loss
      }
      // Push: no change
      break;

    case 'fibonacci':
      if (lost) {
        progression.fibIndex = Math.min(progression.fibIndex + 1, FIBONACCI.length - 1);
      } else if (won) {
        progression.fibIndex = Math.max(progression.fibIndex - 2, 0);
      }
      break;

    case 'dalembert':
      if (lost) {
        progression.currentUnits++;
      } else if (won) {
        progression.currentUnits = Math.max(1, progression.currentUnits - 1);
      }
      break;

    case 'labouchere': {
      const seq = progression.labouchereSeq;
      if (won) {
        if (seq.length > 1) {
          seq.shift();
          seq.pop();
        } else {
          seq.length = 0;
        }
        // Series complete — reset
        if (seq.length === 0) {
          progression.labouchereSeq = [1, 2, 3, 4];
        }
      } else if (lost) {
        const bet = seq.length <= 1 ? (seq[0] ?? 1) : seq[0] + seq[seq.length - 1];
        seq.push(bet);
      }
      break;
    }
  }

  progression.lastResult = won ? 'win' : lost ? 'loss' : 'push';
}

// --- Simulation engine ---

const CHUNK_SIZE = 500;
const WONG_AI_PLAYERS = 5;

export function createSimulation(config: SimulationConfig): SimulationState {
  const isWonging = config.playStrategy === 'wonging';

  const simSettings: GameSettings = {
    ...config.settings,
    numberOfAIPlayers: isWonging ? WONG_AI_PLAYERS : 0,
    humanSeatPosition: 0,
  };

  const engine = new GameEngine(simSettings);
  const startingBankroll = config.settings.startingBankroll;
  const sampleInterval = config.numberOfHands <= 1000 ? 1 : Math.floor(config.numberOfHands / 1000);

  return {
    engine,
    config,
    results: {
      wins: 0,
      losses: 0,
      pushes: 0,
      blackjacks: 0,
      surrenders: 0,
      handsPlayed: 0,
      roundsPlayed: 0,
      roundsWatched: 0,
      netProfit: 0,
      peakBankroll: startingBankroll,
      lowBankroll: startingBankroll,
      finalBankroll: startingBankroll,
      bankrollHistory: [{ handNumber: 0, bankroll: startingBankroll, trueCount: 0, bet: 0 }],
      totalWagered: 0,
      houseEdge: 0,
      avgBet: 0,
    },
    progress: {
      handsCompleted: 0,
      totalHands: config.numberOfHands,
      currentBankroll: startingBankroll,
    },
    progression: createProgressionState(),
    done: false,
    playerIndex: 0,
    sampleInterval,
    customRunningCount: 0,
    prevCardsRemaining: engine.getShoeState().countInfo.cardsRemaining,
  };
}

export function runSimulationChunk(state: SimulationState): SimulationState {
  const { engine, config, results, playerIndex, sampleInterval, progression } = state;
  const isWonging = config.playStrategy === 'wonging';
  const customSystem = COUNTING_SYSTEMS[config.playStrategy] ?? null;
  const handsThisChunk = Math.min(CHUNK_SIZE, config.numberOfHands - results.roundsPlayed);

  for (let i = 0; i < handsThisChunk; i++) {
    const gameState = engine.getState();
    const player = gameState.players[playerIndex];

    // Check if bankrupt
    if (player.bankroll < config.settings.minimumBet) {
      state.done = true;
      break;
    }

    // Reshuffle detection for custom counting systems
    if (customSystem) {
      const remaining = engine.getShoeState().countInfo.cardsRemaining;
      if (remaining > state.prevCardsRemaining) {
        state.customRunningCount = 0;
      }
    }

    const tc = getSimTrueCount(config.playStrategy, engine, state.customRunningCount);

    // Wonging: sit out when TC < threshold
    if (isWonging && tc < config.wongThreshold) {
      // Play a round with AI only to advance the shoe
      engine.placeAIBets();
      engine.deal();

      if (engine.getPhase() === 'insurance_prompt') {
        engine.resolveInsuranceAndContinue();
      }

      if (engine.getPhase() !== 'round_over' && engine.getPhase() !== 'resolving') {
        playAllPlayerTurns(engine, config, playerIndex, false, state.customRunningCount);
        if (engine.getPhase() === 'player_turn' || engine.getPhase() === 'dealer_turn') {
          if (!engine.allPlayersBusted()) {
            engine.startDealerTurn();
            while (engine.dealerShouldHit()) engine.dealerHit();
          } else {
            engine.startDealerTurn();
          }
        }
        engine.resolveAllHands();
      }

      if (customSystem) {
        state.customRunningCount += tallyCustomCount(engine, customSystem.values);
        state.prevCardsRemaining = engine.getShoeState().countInfo.cardsRemaining;
      }
      results.roundsWatched++;
      results.roundsPlayed++;
      sampleBankroll(engine, results, playerIndex, sampleInterval);
      engine.resetForNewRound();
      continue;
    }

    // 1. Determine bet
    const betAmount = calculateSimBet(config, progression, tc, player.bankroll);

    // 2. Place bets & deal
    engine.placeBet(playerIndex, betAmount);
    if (isWonging) engine.placeAIBets();
    engine.deal();

    results.totalWagered += betAmount;

    // 3. Insurance
    if (engine.getPhase() === 'insurance_prompt') {
      if (USES_COUNTING.has(config.playStrategy)) {
        const insTc = getSimTrueCount(config.playStrategy, engine, state.customRunningCount);
        if (insTc >= 3) {
          engine.placeInsurance(playerIndex);
        }
      }
      engine.resolveInsuranceAndContinue();
    }

    // 4. Check if round is already over (dealer BJ)
    if (engine.getPhase() === 'round_over' || engine.getPhase() === 'resolving') {
      const roundResult = tallyRoundResults(engine, results, playerIndex);
      if (roundResult) updateProgression(progression, config.betSystem, roundResult);
      if (customSystem) {
        state.customRunningCount += tallyCustomCount(engine, customSystem.values);
        state.prevCardsRemaining = engine.getShoeState().countInfo.cardsRemaining;
      }
      results.roundsPlayed++;
      sampleBankroll(engine, results, playerIndex, sampleInterval);
      engine.resetForNewRound();
      continue;
    }

    // 5. Play hand(s) — handles both human and AI turns
    if (engine.getPhase() === 'player_turn') {
      playAllPlayerTurns(engine, config, playerIndex, true, state.customRunningCount);
    }

    // 6. Dealer turn
    if (engine.getPhase() === 'player_turn' || engine.getPhase() === 'dealer_turn') {
      if (!engine.allPlayersBusted()) {
        engine.startDealerTurn();
        while (engine.dealerShouldHit()) engine.dealerHit();
      } else {
        engine.startDealerTurn();
      }
    }

    // 7. Resolve
    engine.resolveAllHands();

    // 8. Tally & update progression + custom count
    const roundResult = tallyRoundResults(engine, results, playerIndex);
    if (roundResult) updateProgression(progression, config.betSystem, roundResult);
    if (customSystem) {
      state.customRunningCount += tallyCustomCount(engine, customSystem.values);
      state.prevCardsRemaining = engine.getShoeState().countInfo.cardsRemaining;
    }
    results.roundsPlayed++;
    sampleBankroll(engine, results, playerIndex, sampleInterval);

    // 9. Reset
    engine.resetForNewRound();
  }

  // Update final stats
  const finalState = engine.getState();
  const finalBankroll = finalState.players[playerIndex].bankroll;
  results.finalBankroll = finalBankroll;
  results.netProfit = finalBankroll - config.settings.startingBankroll;
  results.houseEdge = results.totalWagered > 0 ? -results.netProfit / results.totalWagered : 0;
  results.avgBet = results.handsPlayed > 0 ? results.totalWagered / results.handsPlayed : 0;

  state.progress = {
    handsCompleted: results.roundsPlayed,
    totalHands: config.numberOfHands,
    currentBankroll: finalBankroll,
  };

  if (results.roundsPlayed >= config.numberOfHands) {
    state.done = true;
  }

  return state;
}

function playAllPlayerTurns(
  engine: GameEngine,
  config: SimulationConfig,
  humanIndex: number,
  humanIsPlaying: boolean,
  _customRunningCount: number,
): void {
  let safety = 0;
  while (engine.getPhase() === 'player_turn' && safety < 500) {
    safety++;

    if (engine.isCurrentPlayerHuman()) {
      if (!humanIsPlaying) return; // wonging sit-out — skip human

      const available = engine.getAvailableActionsForCurrentPlayer();
      if (available.length === 0) break;

      const state = engine.getState();
      const player = state.players[humanIndex];
      const hand = player.hands[player.currentHandIndex];
      const dealerUpcard = state.dealerHand.cards[0];

      let action: Action;
      switch (config.playStrategy) {
        case 'mimic': {
          const total = getHandTotal(hand.cards);
          const soft = isSoft(hand.cards);
          if (total.best < 17 || (total.best === 17 && soft && config.settings.hitSoft17)) {
            action = 'hit';
          } else {
            action = 'stand';
          }
          break;
        }
        case 'never_bust': {
          const total = getHandTotal(hand.cards);
          const soft = isSoft(hand.cards);
          if (!soft && total.best >= 12) {
            action = 'stand';
          } else {
            action = getBasicStrategyAction(hand, dealerUpcard, available);
          }
          break;
        }
        case 'hilo':
        case 'wonging': {
          // Hi-Lo: use engine's built-in count + Illustrious 18 deviations
          const tc = engine.getShoeState().countInfo.trueCount;
          const devAction = getDeviationAction(hand, dealerUpcard, tc, available);
          action = devAction ?? getBasicStrategyAction(hand, dealerUpcard, available);
          break;
        }
        case 'ko':
        case 'hiopt1':
        case 'hiopt2':
        case 'omega2':
        case 'zen':
          // Other counting systems: basic strategy (deviations are Hi-Lo-calibrated)
          action = getBasicStrategyAction(hand, dealerUpcard, available);
          break;
        default: // 'basic'
          action = getBasicStrategyAction(hand, dealerUpcard, available);
      }

      const result = engine.playerAction(action);
      if (result.done) break;
    } else {
      // AI turn
      const action = engine.playAITurn();
      if (action === null) break;
    }
  }
}

function tallyRoundResults(engine: GameEngine, results: SimulationResults, playerIndex: number): HandResult | null {
  const state = engine.getState();
  let firstResult: HandResult | null = null;

  for (const rr of state.roundResults) {
    if (rr.seatIndex !== playerIndex) continue;
    results.handsPlayed++;
    if (!firstResult) firstResult = rr.result;

    switch (rr.result) {
      case 'blackjack':
        results.wins++;
        results.blackjacks++;
        break;
      case 'win':
        results.wins++;
        break;
      case 'loss':
        results.losses++;
        break;
      case 'push':
        results.pushes++;
        break;
      case 'surrender':
        results.surrenders++;
        results.losses++;
        break;
    }
  }

  return firstResult;
}

function sampleBankroll(engine: GameEngine, results: SimulationResults, playerIndex: number, sampleInterval: number): void {
  const state = engine.getState();
  const bankroll = state.players[playerIndex].bankroll;

  results.peakBankroll = Math.max(results.peakBankroll, bankroll);
  results.lowBankroll = Math.min(results.lowBankroll, bankroll);

  if (results.roundsPlayed % sampleInterval === 0 || results.roundsPlayed <= 1) {
    const tc = state.shoeState.countInfo.trueCount;
    results.bankrollHistory.push({
      handNumber: results.roundsPlayed,
      bankroll,
      trueCount: tc,
      bet: 0,
    });
  }
}
