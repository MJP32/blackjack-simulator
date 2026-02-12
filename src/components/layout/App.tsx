import { useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore.js';
import { useSettingsStore } from '@/stores/settingsStore.js';
import Header from './Header.js';
import GameTable from './GameTable.js';
import Sidebar from './Sidebar.js';
import TutorialOverlay from '@/components/modes/TutorialOverlay.js';
import GuessTheCount from '@/components/modes/GuessTheCount.js';

export default function App() {
  const initGame = useGameStore(s => s.initGame);
  const settings = useSettingsStore();
  const mode = useSettingsStore(s => s.mode);

  useEffect(() => {
    initGame({
      numberOfDecks: settings.numberOfDecks,
      penetration: settings.penetration,
      hitSoft17: settings.hitSoft17,
      allowInsurance: settings.allowInsurance,
      allowSurrender: settings.allowSurrender,
      allowDoubleAfterSplit: settings.allowDoubleAfterSplit,
      minimumBet: settings.minimumBet,
      maximumBet: settings.maximumBet,
      startingBankroll: settings.startingBankroll,
      numberOfAIPlayers: settings.numberOfAIPlayers,
      humanSeatPosition: settings.humanSeatPosition,
      speed: settings.speed,
    });
  }, []);

  const showSidebar = mode !== 'casino_realism';

  return (
    <div className="game-layout">
      <div className="game-main">
        <Header />
        <GameTable />
      </div>
      {showSidebar && <Sidebar />}
      <TutorialOverlay />
      <GuessTheCount />
    </div>
  );
}
