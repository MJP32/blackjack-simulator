import {
  resolveBetFromSpread,
  BET_SPREAD_PRESETS,
  DEFAULT_BET_SPREAD,
  createSimulation,
  runSimulationChunk,
  type SimulationConfig,
  type BetSpread,
  type PlayStrategy,
  type BetSystem,
} from '@/engine/simulator';
import { DEFAULT_SETTINGS } from '@/utils/constants';
import type { GameSettings } from '@/engine/types';

const BASE_SETTINGS: GameSettings = {
  ...DEFAULT_SETTINGS,
  numberOfAIPlayers: 0,
  humanSeatPosition: 0,
};

function makeConfig(overrides: Partial<SimulationConfig> = {}): SimulationConfig {
  return {
    playStrategy: 'basic',
    betSystem: 'flat',
    betAmount: 10,
    numberOfHands: 50,
    betSpread: DEFAULT_BET_SPREAD,
    wongThreshold: 2,
    kellyFraction: 0.5,
    settings: BASE_SETTINGS,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// resolveBetFromSpread
// ---------------------------------------------------------------------------
describe('resolveBetFromSpread', () => {
  const spread: BetSpread = { 1: 1, 2: 2, 3: 4, 5: 8 };

  it('returns base unit when TC is below all keys', () => {
    expect(resolveBetFromSpread(0, 10, spread, 10000, 500)).toBe(10);
  });

  it('matches exact key thresholds', () => {
    expect(resolveBetFromSpread(1, 10, spread, 10000, 500)).toBe(10);
    expect(resolveBetFromSpread(2, 10, spread, 10000, 500)).toBe(20);
    expect(resolveBetFromSpread(3, 10, spread, 10000, 500)).toBe(40);
    expect(resolveBetFromSpread(5, 10, spread, 10000, 500)).toBe(80);
  });

  it('uses highest applicable key when TC is between keys', () => {
    // TC=4 is between keys 3 (units=4) and 5 (units=8)
    expect(resolveBetFromSpread(4, 10, spread, 10000, 500)).toBe(40);
  });

  it('uses highest key when TC exceeds all keys', () => {
    expect(resolveBetFromSpread(10, 10, spread, 10000, 500)).toBe(80);
  });

  it('caps at bankroll', () => {
    expect(resolveBetFromSpread(5, 10, spread, 30, 500)).toBe(30);
  });

  it('caps at maxBet', () => {
    expect(resolveBetFromSpread(5, 10, spread, 10000, 50)).toBe(50);
  });

  it('caps at min of bankroll and maxBet', () => {
    expect(resolveBetFromSpread(5, 10, spread, 40, 50)).toBe(40);
    expect(resolveBetFromSpread(5, 10, spread, 100, 50)).toBe(50);
  });

  it('works with negative true counts', () => {
    // No key <= -2, so falls back to units=1
    expect(resolveBetFromSpread(-2, 10, spread, 10000, 500)).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// BET_SPREAD_PRESETS
// ---------------------------------------------------------------------------
describe('BET_SPREAD_PRESETS', () => {
  it('has expected preset names', () => {
    expect(Object.keys(BET_SPREAD_PRESETS)).toEqual(
      expect.arrayContaining(['conservative', 'moderate', 'aggressive', 'wong'])
    );
  });

  it('each preset has a label and spread object', () => {
    for (const [, preset] of Object.entries(BET_SPREAD_PRESETS)) {
      expect(typeof preset.label).toBe('string');
      expect(typeof preset.spread).toBe('object');
      const keys = Object.keys(preset.spread).map(Number);
      expect(keys.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// createSimulation
// ---------------------------------------------------------------------------
describe('createSimulation', () => {
  it('initialises results to zero', () => {
    const sim = createSimulation(makeConfig());
    const r = sim.results;
    expect(r.wins).toBe(0);
    expect(r.losses).toBe(0);
    expect(r.pushes).toBe(0);
    expect(r.blackjacks).toBe(0);
    expect(r.handsPlayed).toBe(0);
    expect(r.roundsPlayed).toBe(0);
    expect(r.netProfit).toBe(0);
    expect(r.totalWagered).toBe(0);
  });

  it('sets starting bankroll in results and progress', () => {
    const sim = createSimulation(makeConfig());
    expect(sim.results.finalBankroll).toBe(BASE_SETTINGS.startingBankroll);
    expect(sim.results.peakBankroll).toBe(BASE_SETTINGS.startingBankroll);
    expect(sim.results.lowBankroll).toBe(BASE_SETTINGS.startingBankroll);
    expect(sim.progress.currentBankroll).toBe(BASE_SETTINGS.startingBankroll);
  });

  it('creates initial bankroll history entry', () => {
    const sim = createSimulation(makeConfig());
    expect(sim.results.bankrollHistory.length).toBe(1);
    expect(sim.results.bankrollHistory[0]).toEqual({
      handNumber: 0,
      bankroll: BASE_SETTINGS.startingBankroll,
      trueCount: 0,
      bet: 0,
    });
  });

  it('is not done initially', () => {
    const sim = createSimulation(makeConfig());
    expect(sim.done).toBe(false);
  });

  it('sets player index to 0 with 0 AI players', () => {
    const sim = createSimulation(makeConfig());
    expect(sim.playerIndex).toBe(0);
  });

  it('adds AI players for wonging strategy', () => {
    const sim = createSimulation(makeConfig({ playStrategy: 'wonging' }));
    const state = sim.engine.getState();
    // wonging creates 5 AI players + 1 human = 6 total
    expect(state.players.length).toBe(6);
  });

  it('has 1 player for non-wonging strategies', () => {
    const sim = createSimulation(makeConfig({ playStrategy: 'basic' }));
    const state = sim.engine.getState();
    expect(state.players.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// runSimulationChunk – basic strategy, flat bet
// ---------------------------------------------------------------------------
describe('runSimulationChunk', () => {
  it('plays through all hands with basic/flat', () => {
    const config = makeConfig({ numberOfHands: 20 });
    let sim = createSimulation(config);

    while (!sim.done) {
      sim = runSimulationChunk(sim);
    }

    expect(sim.done).toBe(true);
    expect(sim.results.roundsPlayed).toBeGreaterThanOrEqual(20);
    expect(sim.results.handsPlayed).toBeGreaterThan(0);
    expect(sim.results.wins + sim.results.losses + sim.results.pushes).toBe(sim.results.handsPlayed);
  });

  it('updates bankroll correctly (profit = final - starting)', () => {
    const config = makeConfig({ numberOfHands: 30 });
    let sim = createSimulation(config);

    while (!sim.done) {
      sim = runSimulationChunk(sim);
    }

    const expectedProfit = sim.results.finalBankroll - BASE_SETTINGS.startingBankroll;
    expect(sim.results.netProfit).toBe(expectedProfit);
  });

  it('tracks peak and low bankroll', () => {
    const config = makeConfig({ numberOfHands: 50 });
    let sim = createSimulation(config);

    while (!sim.done) {
      sim = runSimulationChunk(sim);
    }

    expect(sim.results.peakBankroll).toBeGreaterThanOrEqual(sim.results.lowBankroll);
    expect(sim.results.peakBankroll).toBeGreaterThanOrEqual(sim.results.finalBankroll);
    expect(sim.results.lowBankroll).toBeLessThanOrEqual(sim.results.finalBankroll);
  });

  it('totalWagered is sum of all bets placed', () => {
    const config = makeConfig({ numberOfHands: 10, betAmount: 10 });
    let sim = createSimulation(config);

    while (!sim.done) {
      sim = runSimulationChunk(sim);
    }

    // With flat betting at 10, totalWagered = handsPlayed * 10
    expect(sim.results.totalWagered).toBe(sim.results.handsPlayed * 10);
  });

  it('computes houseEdge as -netProfit / totalWagered', () => {
    const config = makeConfig({ numberOfHands: 20 });
    let sim = createSimulation(config);

    while (!sim.done) {
      sim = runSimulationChunk(sim);
    }

    if (sim.results.totalWagered > 0) {
      const expected = -sim.results.netProfit / sim.results.totalWagered;
      expect(sim.results.houseEdge).toBeCloseTo(expected, 10);
    }
  });

  it('populates bankroll history', () => {
    const config = makeConfig({ numberOfHands: 30 });
    let sim = createSimulation(config);

    while (!sim.done) {
      sim = runSimulationChunk(sim);
    }

    // Should have the initial entry plus at least some samples
    expect(sim.results.bankrollHistory.length).toBeGreaterThan(1);
    // First entry is the seed
    expect(sim.results.bankrollHistory[0].handNumber).toBe(0);
  });

  it('stops early if bankrupt', () => {
    const config = makeConfig({
      numberOfHands: 10000,
      betAmount: 500,
      settings: { ...BASE_SETTINGS, startingBankroll: 500, minimumBet: 500, maximumBet: 1000 },
    });
    let sim = createSimulation(config);

    while (!sim.done) {
      sim = runSimulationChunk(sim);
    }

    // Player likely went bust before 10000 hands
    expect(sim.done).toBe(true);
    expect(sim.results.finalBankroll).toBeLessThanOrEqual(config.settings.startingBankroll);
  });
});

// ---------------------------------------------------------------------------
// runSimulationChunk – different play strategies
// ---------------------------------------------------------------------------
describe('runSimulationChunk – play strategies', () => {
  const strategies: PlayStrategy[] = ['basic', 'hilo', 'ko', 'hiopt1', 'hiopt2', 'omega2', 'zen', 'mimic', 'never_bust'];

  for (const strategy of strategies) {
    it(`completes simulation with ${strategy} strategy`, () => {
      const config = makeConfig({ playStrategy: strategy, numberOfHands: 15 });
      let sim = createSimulation(config);

      while (!sim.done) {
        sim = runSimulationChunk(sim);
      }

      expect(sim.done).toBe(true);
      expect(sim.results.handsPlayed).toBeGreaterThan(0);
    });
  }

  it('completes simulation with wonging strategy', () => {
    const config = makeConfig({ playStrategy: 'wonging', numberOfHands: 15 });
    let sim = createSimulation(config);

    while (!sim.done) {
      sim = runSimulationChunk(sim);
    }

    expect(sim.done).toBe(true);
    expect(sim.results.roundsPlayed).toBe(15);
    // Wonging may watch rounds without playing
    expect(sim.results.roundsPlayed).toBeGreaterThanOrEqual(
      sim.results.handsPlayed + sim.results.roundsWatched - sim.results.roundsWatched // just ensures non-negative
    );
  });
});

// ---------------------------------------------------------------------------
// runSimulationChunk – different bet systems
// ---------------------------------------------------------------------------
describe('runSimulationChunk – bet systems', () => {
  const betSystems: BetSystem[] = [
    'flat', 'spread', 'kelly', 'martingale', 'paroli',
    'one_three_two_six', 'oscars_grind', 'fibonacci', 'dalembert', 'labouchere',
  ];

  for (const betSystem of betSystems) {
    it(`completes simulation with ${betSystem} bet system`, () => {
      const config = makeConfig({ betSystem, numberOfHands: 20 });
      let sim = createSimulation(config);

      while (!sim.done) {
        sim = runSimulationChunk(sim);
      }

      expect(sim.done).toBe(true);
      expect(sim.results.handsPlayed).toBeGreaterThan(0);
    });
  }
});

// ---------------------------------------------------------------------------
// runSimulationChunk – spread betting uses count
// ---------------------------------------------------------------------------
describe('runSimulationChunk – spread betting', () => {
  it('uses spread-based bets with hilo strategy', () => {
    const config = makeConfig({
      playStrategy: 'hilo',
      betSystem: 'spread',
      betAmount: 10,
      numberOfHands: 50,
      betSpread: BET_SPREAD_PRESETS.aggressive.spread,
    });
    let sim = createSimulation(config);

    while (!sim.done) {
      sim = runSimulationChunk(sim);
    }

    // avgBet may differ from flat 10 because spread varies with count
    expect(sim.results.avgBet).toBeGreaterThan(0);
    expect(sim.results.totalWagered).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// runSimulationChunk – progress tracking
// ---------------------------------------------------------------------------
describe('runSimulationChunk – progress', () => {
  it('updates progress after each chunk', () => {
    const config = makeConfig({ numberOfHands: 100 });
    let sim = createSimulation(config);

    // Run one chunk
    sim = runSimulationChunk(sim);

    expect(sim.progress.handsCompleted).toBeGreaterThan(0);
    expect(sim.progress.totalHands).toBe(100);
    expect(typeof sim.progress.currentBankroll).toBe('number');
  });
});
