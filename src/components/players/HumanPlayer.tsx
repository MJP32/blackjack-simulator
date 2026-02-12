import type { Action } from '@/engine/types.js';
import { useGameStore } from '@/stores/gameStore.js';
import { useSettingsStore } from '@/stores/settingsStore.js';
import Button from '@/components/shared/Button.js';

interface HumanPlayerProps {
  availableActions: Action[];
  strategyHint: Action | null;
  onAction: (action: Action) => void;
}

const ACTION_LABELS: Record<Action, string> = {
  hit: 'Hit',
  stand: 'Stand',
  double: 'Double',
  split: 'Split',
  surrender: 'Surrender',
  insurance: 'Insurance',
};

const ACTION_KEYS: Record<Action, string> = {
  hit: 'H',
  stand: 'S',
  double: 'D',
  split: 'P',
  surrender: 'R',
  insurance: 'I',
};

export default function HumanPlayer({ availableActions, strategyHint, onAction }: HumanPlayerProps) {
  const phase = useGameStore(s => s.phase);
  const showHint = useSettingsStore(s => s.showBasicStrategyHint);

  if (phase !== 'player_turn' || availableActions.length === 0) return null;

  return (
    <div className="action-buttons">
      {availableActions.map((action) => (
        <Button
          key={action}
          variant={action === 'hit' ? 'primary' :
                   action === 'stand' ? 'success' :
                   action === 'double' ? 'gold' :
                   action === 'surrender' ? 'danger' : 'secondary'}
          hint={showHint && action === strategyHint}
          onClick={() => onAction(action)}
        >
          {ACTION_LABELS[action]}
          <span className="kbd">{ACTION_KEYS[action]}</span>
        </Button>
      ))}
    </div>
  );
}
