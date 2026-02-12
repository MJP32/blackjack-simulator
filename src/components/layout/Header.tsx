import { useState } from 'react';
import { useSettingsStore } from '@/stores/settingsStore.js';
import { useGameStore } from '@/stores/gameStore.js';
import type { GameMode, SpeedSetting } from '@/engine/types.js';
import CasinoRealismHUD from '@/components/modes/CasinoRealismHUD.js';
import PostSessionReport from '@/components/modes/PostSessionReport.js';
import Modal from '@/components/shared/Modal.js';
import Toggle from '@/components/shared/Toggle.js';
import Button from '@/components/shared/Button.js';

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
        <span className="header__title">Blackjack Card Counting Trainer</span>

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

          <Button variant="secondary" size="small" onClick={openSettings}>
            Settings
          </Button>
          <Button variant="secondary" size="small" onClick={() => setShowReport(true)}>
            Report
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
    </>
  );
}
