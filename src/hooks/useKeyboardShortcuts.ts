import { useEffect } from 'react';
import type { Action } from '@/engine/types.js';

const KEY_MAP: Record<string, Action> = {
  h: 'hit',
  s: 'stand',
  d: 'double',
  p: 'split',
  r: 'surrender',
};

export function useKeyboardShortcuts(
  availableActions: Action[],
  onAction: (action: Action) => void,
  enabled: boolean
) {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      // Don't capture when typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const action = KEY_MAP[e.key.toLowerCase()];
      if (action && availableActions.includes(action)) {
        e.preventDefault();
        onAction(action);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [availableActions, onAction, enabled]);
}
