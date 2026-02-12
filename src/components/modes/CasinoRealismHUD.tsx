import { useState, useEffect } from 'react';
import { useSettingsStore } from '@/stores/settingsStore.js';

export default function CasinoRealismHUD() {
  const mode = useSettingsStore(s => s.mode);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (mode !== 'casino_realism') return;
    setElapsed(0);
    const interval = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(interval);
  }, [mode]);

  if (mode !== 'casino_realism') return null;

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;
  const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return <span className="session-timer">{timeStr}</span>;
}
