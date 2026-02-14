import { useState } from 'react';
import { useSettingsStore } from '@/stores/settingsStore.js';
import { useGameStore } from '@/stores/gameStore.js';
import type { GameMode, SpeedSetting } from '@/engine/types.js';
import CasinoRealismHUD from '@/components/modes/CasinoRealismHUD.js';
import PostSessionReport from '@/components/modes/PostSessionReport.js';
import Modal from '@/components/shared/Modal.js';
import Toggle from '@/components/shared/Toggle.js';
import Button from '@/components/shared/Button.js';
import StrategyChart from '@/components/rules/StrategyChart.js';
import SimulationModal from '@/components/simulation/SimulationModal.js';

const MODES: { key: GameMode; label: string }[] = [
  { key: 'training', label: 'Training' },
  { key: 'casino_realism', label: 'Casino' },
];

const SPEEDS: { key: SpeedSetting; label: string }[] = [
  { key: 'slow', label: 'Slow' },
  { key: 'normal', label: 'Normal' },
  { key: 'fast', label: 'Fast' },
  { key: 'instant', label: 'Instant' },
];

export default function Header() {
  const mode = useSettingsStore(s => s.mode);
  const setMode = useSettingsStore(s => s.setMode);
  const speed = useSettingsStore(s => s.speed);
  const setSpeed = useSettingsStore(s => s.setSpeed);
  const settings = useSettingsStore();
  const initGame = useGameStore(s => s.initGame);
  const [showReport, setShowReport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showStrategy, setShowStrategy] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);

  // Local settings state for the modal
  const [localPlayers, setLocalPlayers] = useState(settings.numberOfAIPlayers + 1);
  const [localDecks, setLocalDecks] = useState(settings.numberOfDecks);
  const [localH17, setLocalH17] = useState(settings.hitSoft17);
  const [localSurrender, setLocalSurrender] = useState(settings.allowSurrender);
  const [localInsurance, setLocalInsurance] = useState(settings.allowInsurance);
  const [localDAS, setLocalDAS] = useState(settings.allowDoubleAfterSplit);
  const [localSeatPosition, setLocalSeatPosition] = useState(settings.humanSeatPosition);

  function openSettings() {
    setLocalPlayers(settings.numberOfAIPlayers + 1);
    setLocalDecks(settings.numberOfDecks);
    setLocalH17(settings.hitSoft17);
    setLocalSurrender(settings.allowSurrender);
    setLocalInsurance(settings.allowInsurance);
    setLocalDAS(settings.allowDoubleAfterSplit);
    setLocalSeatPosition(settings.humanSeatPosition);
    setShowSettings(true);
  }

  // Clamp seat position when player count changes
  const clampedSeat = Math.min(localSeatPosition, localPlayers - 1);

  function applySettings() {
    settings.setNumberOfAIPlayers(localPlayers - 1);
    settings.setNumberOfDecks(localDecks);
    settings.setHitSoft17(localH17);
    settings.setAllowSurrender(localSurrender);
    settings.setAllowInsurance(localInsurance);
    settings.setAllowDoubleAfterSplit(localDAS);
    settings.setHumanSeatPosition(clampedSeat);
    setShowSettings(false);

    // Reinitialize game with new settings
    initGame({
      numberOfDecks: localDecks,
      penetration: settings.penetration,
      hitSoft17: localH17,
      allowInsurance: localInsurance,
      allowSurrender: localSurrender,
      allowDoubleAfterSplit: localDAS,
      minimumBet: settings.minimumBet,
      maximumBet: settings.maximumBet,
      startingBankroll: settings.startingBankroll,
      numberOfAIPlayers: localPlayers - 1,
      humanSeatPosition: clampedSeat,
      speed: settings.speed,
    });
  }

  return (
    <>
      <header className="header">
        <span className="header__title">Blackjack Card Trainer</span>

        <div className="header__controls">
          <div className="mode-selector">
            {MODES.map(m => (
              <button
                key={m.key}
                className={`mode-selector__btn ${mode === m.key ? 'mode-selector__btn--active' : ''}`}
                onClick={() => setMode(m.key)}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="speed-selector">
            {SPEEDS.map(s => (
              <button
                key={s.key}
                className={`speed-selector__btn ${speed === s.key ? 'speed-selector__btn--active' : ''}`}
                onClick={() => setSpeed(s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>

          <CasinoRealismHUD />

          <Button variant="secondary" size="small" onClick={() => setShowRules(true)}>
            Rules
          </Button>
          <Button variant="secondary" size="small" onClick={openSettings}>
            Settings
          </Button>
          <Button variant="secondary" size="small" onClick={() => setShowReport(true)}>
            Report
          </Button>
          <Button variant="secondary" size="small" onClick={() => setShowSimulation(true)}>
            Simulate
          </Button>
        </div>
      </header>

      <PostSessionReport isOpen={showReport} onClose={() => setShowReport(false)} />

      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Game Settings"
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowSettings(false)}>Cancel</Button>
            <Button variant="gold" onClick={applySettings}>Apply & New Game</Button>
          </>
        }
      >
        <div className="settings-grid">
          <div className="settings-field">
            <label className="settings-field__label">Players (1–10)</label>
            <input
              className="settings-field__input"
              type="range"
              min={1}
              max={10}
              value={localPlayers}
              onChange={e => setLocalPlayers(Number(e.target.value))}
            />
            <span style={{ fontSize: '14px', fontWeight: 700, textAlign: 'center' }}>
              {localPlayers} player{localPlayers !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="settings-field">
            <label className="settings-field__label">Your Seat</label>
            <div className="seat-picker">
              {Array.from({ length: localPlayers }, (_, i) => (
                <button
                  key={i}
                  className={`seat-picker__btn ${clampedSeat === i ? 'seat-picker__btn--active' : ''}`}
                  onClick={() => setLocalSeatPosition(i)}
                  title={`Seat ${i + 1}`}
                >
                  {clampedSeat === i ? 'You' : i + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-field">
            <label className="settings-field__label">Number of Decks</label>
            <select
              className="settings-field__input"
              value={localDecks}
              onChange={e => setLocalDecks(Number(e.target.value))}
            >
              {[1, 2, 4, 6, 8].map(n => (
                <option key={n} value={n}>{n} deck{n !== 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>

          <Toggle label="Hit Soft 17" checked={localH17} onChange={setLocalH17} />
          <Toggle label="Allow Surrender" checked={localSurrender} onChange={setLocalSurrender} />
          <Toggle label="Allow Insurance" checked={localInsurance} onChange={setLocalInsurance} />
          <Toggle label="Double After Split" checked={localDAS} onChange={setLocalDAS} />
          <Toggle label="Guess the Count" checked={settings.guessTheCount} onChange={settings.setGuessTheCount} />
          <Toggle label="Show Tutorial" checked={settings.showTutorial} onChange={settings.setShowTutorial} />
        </div>
      </Modal>
      <Modal
        isOpen={showRules}
        onClose={() => { setShowRules(false); setShowStrategy(false); }}
        title={showStrategy ? 'Optimal Strategy' : 'Blackjack Rules'}
        className={showStrategy ? 'modal--wide' : ''}
        actions={
          showStrategy
            ? <Button variant="secondary" onClick={() => setShowStrategy(false)}>Back to Rules</Button>
            : <Button variant="gold" onClick={() => { setShowRules(false); setShowStrategy(false); }}>Got It</Button>
        }
      >
        {showStrategy ? (
          <StrategyChart />
        ) : (
          <div className="rules-content">
            <section className="rules-section">
              <h3 className="rules-section__title">Objective</h3>
              <p>Beat the dealer by getting a hand value closer to 21 without going over. Face cards (J, Q, K) are worth 10, Aces are worth 1 or 11, and all other cards are face value.</p>
            </section>

            <section className="rules-section">
              <h3 className="rules-section__title">Blackjack</h3>
              <p>An Ace + a 10-value card on the initial deal is a "Blackjack" and pays 3:2 (1.5x your bet), unless the dealer also has Blackjack, which is a push (tie).</p>
            </section>

            <section className="rules-section">
              <h3 className="rules-section__title">Actions</h3>
              <ul className="rules-list">
                <li><strong>Hit</strong> — Take another card.</li>
                <li><strong>Stand</strong> — Keep your current hand.</li>
                <li><strong>Double Down</strong> — Double your bet and receive exactly one more card.</li>
                <li><strong>Split</strong> — If you have two cards of the same value, split them into two separate hands with equal bets.</li>
                <li><strong>Surrender</strong> — Forfeit half your bet and end the hand immediately.</li>
              </ul>
            </section>

            <section className="rules-section">
              <h3 className="rules-section__title">Dealer Rules</h3>
              <p>The dealer must hit on 16 or less. With "Hit Soft 17" enabled (default), the dealer also hits on a soft 17 (Ace + 6). The dealer stands on hard 17 or higher.</p>
            </section>

            <section className="rules-section">
              <h3 className="rules-section__title">Insurance</h3>
              <p>When the dealer's face-up card is an Ace, you may take insurance — a side bet of half your original bet that pays 2:1 if the dealer has Blackjack. Basic strategy says always decline insurance.</p>
            </section>

            <section className="rules-section">
              <h3 className="rules-section__title">Card Counting (Hi-Lo)</h3>
              <p>Assign each card a value: <strong>2–6 = +1</strong>, <strong>7–9 = 0</strong>, <strong>10–A = −1</strong>. The running count is the sum of all counted cards. Divide by decks remaining to get the <strong>true count</strong>, which guides bet sizing — bet more when the count is high (deck favors the player).</p>
            </section>

            <section className="rules-section">
              <h3 className="rules-section__title">Play Strategies</h3>
              <ul className="rules-list">
                <li><strong>Basic Strategy</strong> — Mathematically optimal play for every hand based on your total vs. the dealer's upcard. No card counting involved. Reduces the house edge to about 0.5%.</li>
                <li><strong>Hi-Lo</strong> — The most popular counting system. Cards 2-6 are +1, 7-9 are 0, 10-A are -1. Uses the true count (running count / decks remaining) plus the Illustrious 18 deviations to adjust play decisions at key count thresholds.</li>
                <li><strong>KO (Knock-Out)</strong> — An unbalanced system where 7 also counts as +1. Because the count doesn't start and end at zero, you use the running count directly without converting to true count. Simpler to learn than Hi-Lo.</li>
                <li><strong>Hi-Opt I</strong> — Cards 3-6 are +1, 10s are -1, aces and 2s are neutral. More accurate than Hi-Lo for playing decisions but requires a separate ace side count for insurance and betting.</li>
                <li><strong>Hi-Opt II</strong> — A multi-level system: 4,5 count as +2, 2,3,6,7 as +1, 10s as -2. Higher accuracy but significantly harder to use in practice.</li>
                <li><strong>Omega II</strong> — Multi-level with 9 counting as -1, 4-6 as +2, and 10s as -2. One of the most accurate systems available, best suited for serious players.</li>
                <li><strong>Zen Count</strong> — Multi-level balanced system: aces are -1, 4-6 are +2, 2-3,7 are +1, 10s are -2. Good balance of accuracy and usability.</li>
                <li><strong>Wonging</strong> — Named after Stanford Wong. Back-count the shoe from behind and only sit down to play when the true count is favorable. Sit back out when it drops. Eliminates negative-count hands entirely.</li>
                <li><strong>Mimic Dealer</strong> — Play exactly like the dealer: hit until 17+, no doubling, splitting, or surrendering. This is a losing strategy used as a baseline comparison.</li>
                <li><strong>Never Bust</strong> — Stand on any hard 12 or higher to avoid busting. Extremely conservative and a significant losing strategy, but useful to see how fear of busting affects results.</li>
              </ul>
            </section>

            <section className="rules-section">
              <h3 className="rules-section__title">Betting Strategies</h3>
              <ul className="rules-list">
                <li><strong>Flat Bet</strong> — Bet the same amount every hand. Simple and low-variance. The baseline for comparing other systems.</li>
                <li><strong>Bet Spread</strong> — Scale your bet with the true count using preset multipliers (e.g., 1-4, 1-8, 1-12). This is how card counters exploit a positive count by betting more when the deck favors the player.</li>
                <li><strong>Kelly Criterion</strong> — Bet a fraction of your bankroll proportional to your edge. Mathematically optimal for long-term growth but can be volatile at full Kelly. Quarter or half Kelly is more practical.</li>
                <li><strong>Martingale</strong> — Double your bet after every loss, reset after a win. Recovers losses quickly in theory, but can hit table limits or bankroll limits fast during losing streaks.</li>
                <li><strong>Paroli</strong> — Double your bet after a win, up to 3 consecutive wins, then reset. A positive progression that tries to capitalize on winning streaks while limiting downside.</li>
                <li><strong>1-3-2-6</strong> — Bet 1, 3, 2, then 6 units on consecutive wins. If you lose at any step, restart at 1. Designed to capture streaks while protecting profits from the first two wins.</li>
                <li><strong>Oscar's Grind</strong> — Increase your bet by one unit after a win. After a loss, keep the same bet. Goal is to win exactly one unit per series, then reset. Very low variance.</li>
                <li><strong>Fibonacci</strong> — Follow the Fibonacci sequence (1, 1, 2, 3, 5, 8, 13...) on losses. After a win, step back two positions. More gradual than Martingale but still a negative progression.</li>
                <li><strong>D'Alembert</strong> — Add one unit after a loss, subtract one after a win. A gentle negative progression that assumes wins and losses will eventually balance out.</li>
                <li><strong>Labouchere</strong> — Start with a number sequence (1-2-3-4). Bet the sum of the first and last numbers. Cross them off on a win; add the lost bet to the end on a loss. Complete when all numbers are crossed off.</li>
              </ul>
            </section>

            <div className="rules-section" style={{ textAlign: 'center', paddingTop: '8px' }}>
              <Button variant="gold" onClick={() => setShowStrategy(true)}>
                Optimal Strategy Chart
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <SimulationModal isOpen={showSimulation} onClose={() => setShowSimulation(false)} />
    </>
  );
}
