import { useEffect, useState } from 'react';
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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
        <Header onToggleMobileSidebar={() => setMobileSidebarOpen(o => !o)} />
        <GameTable />
      </div>
      {showSidebar && (
        <>
          {mobileSidebarOpen && (
            <div className="sidebar-overlay" onClick={() => setMobileSidebarOpen(false)} />
          )}
          <Sidebar className={mobileSidebarOpen ? 'sidebar--mobile-open' : ''} />
        </>
      )}
      <TutorialOverlay />
      <GuessTheCount />
    </div>
  );
}
