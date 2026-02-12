import { useGameStore } from '@/stores/gameStore.js';
import { useSettingsStore } from '@/stores/settingsStore.js';
import { useStatsStore } from '@/stores/statsStore.js';
import { TUTORIAL_STEPS } from '@/utils/constants.js';
import CountPanel from '@/components/counting/CountPanel.js';
import ShoeProgress from '@/components/counting/ShoeProgress.js';
import BetAdvice from '@/components/counting/BetAdvice.js';
import EVChart from '@/components/charts/EVChart.js';
import { formatCurrency, formatPercent } from '@/utils/formatters.js';

export default function Sidebar() {
  const shoeState = useGameStore(s => s.shoeState);
  const players = useGameStore(s => s.players);
  const showCount = useSettingsStore(s => s.showCount);
  const guessTheCount = useSettingsStore(s => s.guessTheCount);
  const showBetAdvice = useSettingsStore(s => s.showBetAdvice);
  const minimumBet = useSettingsStore(s => s.minimumBet);
  const showTutorial = useSettingsStore(s => s.showTutorial);
  const tutorialStep = useSettingsStore(s => s.tutorialStep);
  const stats = useStatsStore();

  const humanPlayer = players.find(p => p.isHuman);
  const bankroll = humanPlayer?.bankroll ?? 1000;

  const tutorialHighlight = showTutorial ? TUTORIAL_STEPS[tutorialStep]?.highlight ?? null : null;

  function hlClass(sectionId: string): string {
    if (!tutorialHighlight) return '';
    return tutorialHighlight === sectionId ? 'sidebar__section--highlight' : 'sidebar__section--dim';
  }

  return (
    <div className={`sidebar ${tutorialHighlight ? 'sidebar--tutorial-active' : ''}`}>
      {showCount && !guessTheCount && <CountPanel countInfo={shoeState.countInfo} highlight={hlClass('card-count')} />}
      <ShoeProgress shoeState={shoeState} highlight={hlClass('shoe-progress')} />
      {showBetAdvice && (
        <BetAdvice
          countInfo={shoeState.countInfo}
          minimumBet={minimumBet}
          bankroll={bankroll}
          highlight={hlClass('bet-advice')}
        />
      )}

      <div className={`sidebar__section ${hlClass('session-stats')}`}>
        <div className="sidebar__title">Session Stats</div>
        <div className="count-panel">
          <div className="count-panel__row">
            <span className="count-panel__label">Hands Played</span>
            <span className="count-panel__value count-panel__value--neutral">{stats.handsPlayed}</span>
          </div>
          <div className="count-panel__row">
            <span className="count-panel__label">Won / Lost</span>
            <span className="count-panel__value count-panel__value--neutral">
              {stats.handsWon} / {stats.handsLost}
            </span>
          </div>
          <div className="count-panel__row">
            <span className="count-panel__label">Net Profit</span>
            <span className={stats.netProfit >= 0
              ? 'count-panel__value count-panel__value--positive'
              : 'count-panel__value count-panel__value--negative'}>
              {stats.netProfit >= 0 ? '+' : ''}{formatCurrency(stats.netProfit)}
            </span>
          </div>
          {stats.totalStrategyDecisions > 0 && (
            <div className="count-panel__row">
              <span className="count-panel__label">Strategy Accuracy</span>
              <span className="count-panel__value count-panel__value--neutral">
                {formatPercent(stats.correctStrategyDecisions / stats.totalStrategyDecisions)}
              </span>
            </div>
          )}
        </div>
      </div>

      {stats.evHistory.length > 0 && (
        <div className={`sidebar__section ${hlClass('session-stats')}`}>
          <div className="sidebar__title">Bankroll History</div>
          <EVChart data={stats.evHistory} />
        </div>
      )}
    </div>
  );
}
