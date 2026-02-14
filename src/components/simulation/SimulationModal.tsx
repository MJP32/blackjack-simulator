import { useState, useRef, useCallback } from 'react';
import Modal from '@/components/shared/Modal.js';
import Button from '@/components/shared/Button.js';
import SessionChart from '@/components/charts/SessionChart.js';
import { useSettingsStore } from '@/stores/settingsStore.js';
import { formatCurrency } from '@/utils/formatters.js';
import type { PlayStrategy, BetSystem, SimulationConfig, SimulationResults, SimulationProgress, BetSpread } from '@/engine/simulator.js';
import { createSimulation, runSimulationChunk, BET_SPREAD_PRESETS, DEFAULT_BET_SPREAD } from '@/engine/simulator.js';
import type { SimulationState } from '@/engine/simulator.js';

type Phase = 'config' | 'running' | 'results';

const HAND_OPTIONS = [100, 500, 1_000, 5_000, 10_000, 50_000];

interface PlayOption {
  key: PlayStrategy;
  label: string;
  desc: string;
}

interface BetOption {
  key: BetSystem;
  label: string;
  desc: string;
}

const PLAY_STRATEGIES: PlayOption[] = [
  { key: 'basic', label: 'Basic', desc: 'Perfect basic strategy, no counting' },
  { key: 'hilo', label: 'Hi-Lo', desc: 'Most popular count (2-6→+1, 10-A→−1) with Illustrious 18 deviations' },
  { key: 'ko', label: 'KO', desc: 'Knock-Out: unbalanced (7→+1), no true count conversion needed' },
  { key: 'hiopt1', label: 'Hi-Opt I', desc: '3-6→+1, 10s→−1, aces neutral — more accurate than Hi-Lo' },
  { key: 'hiopt2', label: 'Hi-Opt II', desc: 'Multi-level (4,5→+2, 10s→−2) — high accuracy, harder to use' },
  { key: 'omega2', label: 'Omega II', desc: 'Multi-level with 9→−1 — one of the most accurate systems' },
  { key: 'zen', label: 'Zen', desc: 'Multi-level (A→−1, 4-6→+2, 10s→−2) — good all-around accuracy' },
  { key: 'wonging', label: 'Wonging', desc: 'Hi-Lo back-counting, enter only when TC is favorable' },
  { key: 'mimic', label: 'Mimic Dealer', desc: 'Hit until 17, no doubles/splits/surrenders' },
  { key: 'never_bust', label: 'Never Bust', desc: 'Stand on hard 12+, never risk busting' },
];

const BET_SYSTEMS: BetOption[] = [
  { key: 'flat', label: 'Flat Bet', desc: 'Fixed bet amount every hand' },
  { key: 'spread', label: 'Bet Spread', desc: 'TC-based unit multipliers' },
  { key: 'kelly', label: 'Kelly', desc: 'Kelly Criterion bet sizing based on edge' },
  { key: 'martingale', label: 'Martingale', desc: 'Double bet after each loss' },
  { key: 'paroli', label: 'Paroli', desc: 'Double bet after each win (up to 3)' },
  { key: 'one_three_two_six', label: '1-3-2-6', desc: 'Positive progression: 1, 3, 2, 6 units' },
  { key: 'oscars_grind', label: "Oscar's Grind", desc: 'Grind +1 unit per series' },
  { key: 'fibonacci', label: 'Fibonacci', desc: 'Follow Fibonacci sequence on losses, step back 2 on wins' },
  { key: 'dalembert', label: "D'Alembert", desc: '+1 unit after loss, -1 unit after win' },
  { key: 'labouchere', label: 'Labouchere', desc: 'Cancellation system (1-2-3-4 sequence)' },
];

const KELLY_OPTIONS = [
  { value: 0.25, label: 'Quarter Kelly' },
  { value: 0.5, label: 'Half Kelly' },
  { value: 1.0, label: 'Full Kelly' },
];

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SimulationModal({ isOpen, onClose }: SimulationModalProps) {
  const settings = useSettingsStore();

  // Config state
  const [playStrategy, setPlayStrategy] = useState<PlayStrategy>('basic');
  const [betSystem, setBetSystem] = useState<BetSystem>('flat');
  const [betAmount, setBetAmount] = useState(settings.minimumBet);
  const [numberOfHands, setNumberOfHands] = useState(1000);
  const [betSpread, setBetSpread] = useState<BetSpread>({ ...DEFAULT_BET_SPREAD });
  const [spreadPreset, setSpreadPreset] = useState<string>('aggressive');
  const [wongThreshold, setWongThreshold] = useState(2);
  const [kellyFraction, setKellyFraction] = useState(0.5);

  // Simulation state
  const [phase, setPhase] = useState<Phase>('config');
  const [progress, setProgress] = useState<SimulationProgress | null>(null);
  const [results, setResults] = useState<SimulationResults | null>(null);
  const simRef = useRef<SimulationState | null>(null);
  const cancelRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    cancelRef.current = true;
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    simRef.current = null;
  }, []);

  const runNextChunk = useCallback(() => {
    if (cancelRef.current || !simRef.current) return;

    const state = runSimulationChunk(simRef.current);
    simRef.current = state;

    setProgress({ ...state.progress });

    if (state.done) {
      setResults({ ...state.results });
      setPhase('results');
      return;
    }

    timerRef.current = setTimeout(runNextChunk, 0);
  }, []);

  function startSimulation() {
    const config: SimulationConfig = {
      playStrategy,
      betSystem,
      betAmount: Math.max(betAmount, settings.minimumBet),
      numberOfHands,
      betSpread: { ...betSpread },
      wongThreshold,
      kellyFraction,
      settings: {
        numberOfDecks: settings.numberOfDecks,
        penetration: settings.penetration,
        hitSoft17: settings.hitSoft17,
        allowInsurance: settings.allowInsurance,
        allowSurrender: settings.allowSurrender,
        allowDoubleAfterSplit: settings.allowDoubleAfterSplit,
        blackjackPayout: 1.5,
        minimumBet: settings.minimumBet,
        maximumBet: settings.maximumBet,
        startingBankroll: settings.startingBankroll,
        numberOfAIPlayers: 0,
        humanSeatPosition: 0,
        speed: 'instant',
      },
    };

    cancelRef.current = false;
    const state = createSimulation(config);
    simRef.current = state;

    setProgress({ ...state.progress });
    setPhase('running');

    timerRef.current = setTimeout(runNextChunk, 0);
  }

  function handleCancel() {
    cleanup();
    setPhase('config');
  }

  function handleClose() {
    cleanup();
    setPhase('config');
    onClose();
  }

  function handleRunAgain() {
    cleanup();
    setResults(null);
    setProgress(null);
    startSimulation();
  }

  function handleGoBack() {
    cleanup();
    setResults(null);
    setProgress(null);
    setPhase('config');
  }

  const pct = progress ? Math.round((progress.handsCompleted / progress.totalHands) * 100) : 0;

  function getBetLabel(): string {
    if (betSystem === 'flat') return 'Bet Amount';
    if (betSystem === 'kelly') return 'Minimum Bet';
    if (betSystem === 'spread') return 'Base Bet Unit';
    return 'Base Bet';
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={phase === 'running' ? undefined : handleClose}
      title={phase === 'results' ? 'Simulation Results' : 'Run Simulation'}
      className="modal--wide"
      actions={
        phase === 'config' ? (
          <>
            <Button variant="secondary" onClick={handleClose}>Cancel</Button>
            <Button variant="gold" onClick={startSimulation}>Run Simulation</Button>
          </>
        ) : phase === 'running' ? (
          <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={handleGoBack}>Go Back</Button>
            <Button variant="gold" onClick={handleRunAgain}>Run Again</Button>
          </>
        )
      }
    >
      {phase === 'config' && (
        <div className="sim-config">
          {/* Play strategy selection */}
          <div className="settings-field">
            <label className="settings-field__label">Play Strategy</label>
            <div className="sim-strategy-selector">
              {PLAY_STRATEGIES.map(opt => (
                <button
                  key={opt.key}
                  className={`sim-strategy-selector__btn ${playStrategy === opt.key ? 'sim-strategy-selector__btn--active' : ''}`}
                  onClick={() => setPlayStrategy(opt.key)}
                  title={opt.desc}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bet system selection */}
          <div className="settings-field">
            <label className="settings-field__label">Bet Sizing</label>
            <div className="sim-strategy-selector">
              {BET_SYSTEMS.map(opt => (
                <button
                  key={opt.key}
                  className={`sim-strategy-selector__btn ${betSystem === opt.key ? 'sim-strategy-selector__btn--active' : ''}`}
                  onClick={() => setBetSystem(opt.key)}
                  title={opt.desc}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bet amount */}
          <div className="settings-field">
            <label className="settings-field__label">{getBetLabel()}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--gold)', fontWeight: 700 }}>$</span>
              <input
                className="settings-field__input"
                type="number"
                min={settings.minimumBet}
                max={settings.maximumBet}
                value={betAmount}
                onChange={e => setBetAmount(Number(e.target.value))}
                style={{ width: '100px' }}
              />
            </div>
          </div>

          {/* Bet spread — only for spread bet system */}
          {betSystem === 'spread' && (
            <div className="settings-field">
              <label className="settings-field__label">Bet Spread</label>
              <div className="sim-spread-presets">
                {Object.entries(BET_SPREAD_PRESETS).map(([key, { label }]) => (
                  <button
                    key={key}
                    className={`sim-spread-presets__btn ${spreadPreset === key ? 'sim-spread-presets__btn--active' : ''}`}
                    onClick={() => {
                      setSpreadPreset(key);
                      setBetSpread({ ...BET_SPREAD_PRESETS[key].spread });
                    }}
                  >
                    {label}
                  </button>
                ))}
                <button
                  className={`sim-spread-presets__btn ${spreadPreset === 'custom' ? 'sim-spread-presets__btn--active' : ''}`}
                  onClick={() => setSpreadPreset('custom')}
                >
                  Custom
                </button>
              </div>
              <div className="sim-spread-grid">
                {[
                  { tc: 1, label: 'TC \u2264 1' },
                  { tc: 2, label: 'TC 2' },
                  { tc: 3, label: 'TC 3' },
                  { tc: 4, label: 'TC 4' },
                  { tc: 5, label: 'TC 5+' },
                ].map(({ tc, label }) => (
                  <div key={tc} className="sim-spread-grid__cell">
                    <span className="sim-spread-grid__label">{label}</span>
                    <div className="sim-spread-grid__input-wrap">
                      <input
                        className="sim-spread-grid__input"
                        type="number"
                        min={1}
                        max={50}
                        value={betSpread[tc] ?? 1}
                        onChange={e => {
                          const val = Math.max(1, Number(e.target.value) || 1);
                          setBetSpread(prev => ({ ...prev, [tc]: val }));
                          setSpreadPreset('custom');
                        }}
                      />
                      <span className="sim-spread-grid__unit">u</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="sim-spread-preview">
                Bets: {[1, 2, 3, 4, 5].map(tc => `${formatCurrency((betSpread[tc] ?? 1) * betAmount)}`).join(' / ')}
              </div>
            </div>
          )}

          {/* Wonging threshold */}
          {playStrategy === 'wonging' && (
            <div className="settings-field">
              <label className="settings-field__label">Enter Table at TC &ge;</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  className="settings-field__input"
                  type="number"
                  min={-2}
                  max={5}
                  value={wongThreshold}
                  onChange={e => setWongThreshold(Number(e.target.value))}
                  style={{ width: '70px' }}
                />
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Sit out when TC &lt; {wongThreshold}
                </span>
              </div>
            </div>
          )}

          {/* Kelly fraction */}
          {betSystem === 'kelly' && (
            <div className="settings-field">
              <label className="settings-field__label">Kelly Fraction</label>
              <div className="sim-strategy-selector">
                {KELLY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    className={`sim-strategy-selector__btn ${kellyFraction === opt.value ? 'sim-strategy-selector__btn--active' : ''}`}
                    onClick={() => setKellyFraction(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Number of hands */}
          <div className="settings-field">
            <label className="settings-field__label">Number of Hands</label>
            <select
              className="settings-field__input"
              value={numberOfHands}
              onChange={e => setNumberOfHands(Number(e.target.value))}
            >
              {HAND_OPTIONS.map(n => (
                <option key={n} value={n}>{n.toLocaleString()}</option>
              ))}
            </select>
          </div>

          <div className="sim-config__rules-note">
            Uses current table rules: {settings.numberOfDecks} decks, {settings.hitSoft17 ? 'H17' : 'S17'},
            {settings.allowSurrender ? ' surrender' : ' no surrender'},
            {settings.allowDoubleAfterSplit ? ' DAS' : ' no DAS'}
          </div>
        </div>
      )}

      {phase === 'running' && progress && (
        <div className="sim-running">
          <div className="sim-progress">
            <div className="sim-progress__bar">
              <div className="sim-progress__fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="sim-progress__text">
              {progress.handsCompleted.toLocaleString()} / {progress.totalHands.toLocaleString()} hands ({pct}%)
            </div>
          </div>
          <div className="sim-running__bankroll">
            Current Bankroll: {formatCurrency(progress.currentBankroll)}
          </div>
        </div>
      )}

      {phase === 'results' && results && (
        <div className="sim-results">
          <div className="sim-results__grid">
            <div className="sim-results__stat">
              <div className="sim-results__stat-value">{results.wins.toLocaleString()}</div>
              <div className="sim-results__stat-label">Wins ({results.handsPlayed > 0 ? ((results.wins / results.handsPlayed) * 100).toFixed(1) : 0}%)</div>
            </div>
            <div className="sim-results__stat">
              <div className="sim-results__stat-value">{results.losses.toLocaleString()}</div>
              <div className="sim-results__stat-label">Losses ({results.handsPlayed > 0 ? ((results.losses / results.handsPlayed) * 100).toFixed(1) : 0}%)</div>
            </div>
            <div className="sim-results__stat">
              <div className="sim-results__stat-value">{results.pushes.toLocaleString()}</div>
              <div className="sim-results__stat-label">Pushes ({results.handsPlayed > 0 ? ((results.pushes / results.handsPlayed) * 100).toFixed(1) : 0}%)</div>
            </div>
            <div className="sim-results__stat">
              <div className="sim-results__stat-value">{results.blackjacks.toLocaleString()}</div>
              <div className="sim-results__stat-label">Blackjacks ({results.handsPlayed > 0 ? ((results.blackjacks / results.handsPlayed) * 100).toFixed(1) : 0}%)</div>
            </div>
          </div>

          <div className="sim-results__summary">
            <div className="sim-results__row">
              <span>Net Profit</span>
              <span className={results.netProfit >= 0 ? 'sim-results__profit--positive' : 'sim-results__profit--negative'}>
                {results.netProfit >= 0 ? '+' : ''}{formatCurrency(results.netProfit)}
              </span>
            </div>
            <div className="sim-results__row">
              <span>House Edge</span>
              <span>{(results.houseEdge * 100).toFixed(2)}%</span>
            </div>
            <div className="sim-results__row">
              <span>Peak Bankroll</span>
              <span>{formatCurrency(results.peakBankroll)}</span>
            </div>
            <div className="sim-results__row">
              <span>Lowest Bankroll</span>
              <span>{formatCurrency(results.lowBankroll)}</span>
            </div>
            <div className="sim-results__row">
              <span>Average Bet</span>
              <span>{formatCurrency(Math.round(results.avgBet))}</span>
            </div>
            <div className="sim-results__row">
              <span>Total Wagered</span>
              <span>{formatCurrency(results.totalWagered)}</span>
            </div>
            <div className="sim-results__row">
              <span>Hands Played</span>
              <span>{results.handsPlayed.toLocaleString()}</span>
            </div>
            {results.roundsWatched > 0 && (
              <div className="sim-results__row">
                <span>Rounds Watched</span>
                <span>{results.roundsWatched.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="sim-results__chart">
            <SessionChart data={results.bankrollHistory} />
          </div>
        </div>
      )}
    </Modal>
  );
}
