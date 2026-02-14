import type { Player } from '@/engine/types.js';
import { formatCurrency } from '@/utils/formatters.js';
import Hand from '@/components/cards/Hand.js';

// Each player gets a unique skin/hair/shirt color combo
const PLAYER_COLORS: Record<string, { skin: string; hair: string; shirt: string }> = {
  Alice:  { skin: '#f5d0a9', hair: '#c0392b', shirt: '#e74c3c' },
  Bob:    { skin: '#d4a574', hair: '#2c3e50', shirt: '#2980b9' },
  Carlos: { skin: '#c68642', hair: '#1a1a1a', shirt: '#27ae60' },
  Diana:  { skin: '#f0c8a0', hair: '#f39c12', shirt: '#8e44ad' },
  Eve:    { skin: '#fde0c8', hair: '#f1c40f', shirt: '#e91e63' },
  Frank:  { skin: '#d4a574', hair: '#bdc3c7', shirt: '#7f8c8d' },
  Grace:  { skin: '#c68642', hair: '#2c3e50', shirt: '#d35400' },
  Hank:   { skin: '#f5d0a9', hair: '#8b4513', shirt: '#16a085' },
  Ivy:    { skin: '#fde0c8', hair: '#1a1a1a', shirt: '#9b59b6' },
};

const HUMAN_COLORS = { skin: '#f5d0a9', hair: '#f39c12', shirt: '#daa520' };

function AvatarBust({ skin, hair, shirt, size = 28 }: { skin: string; hair: string; shirt: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className="player-seat__avatar">
      {/* Shoulders */}
      <ellipse cx="20" cy="38" rx="16" ry="8" fill={shirt} />
      {/* Neck */}
      <rect x="16" y="24" width="8" height="6" rx="2" fill={skin} />
      {/* Head */}
      <ellipse cx="20" cy="18" rx="9" ry="10" fill={skin} />
      {/* Hair */}
      <ellipse cx="20" cy="12" rx="9.5" ry="6" fill={hair} />
      {/* Eyes */}
      <circle cx="16" cy="19" r="1.2" fill="#2c3e50" />
      <circle cx="24" cy="19" r="1.2" fill="#2c3e50" />
      {/* Mouth */}
      <path d="M17 23 Q20 25.5 23 23" stroke="#2c3e50" strokeWidth="0.8" fill="none" />
    </svg>
  );
}

interface PlayerSeatProps {
  player: Player;
  isActive: boolean;
}

export default function PlayerSeat({ player, isActive }: PlayerSeatProps) {
  const colors = player.isHuman ? HUMAN_COLORS : (PLAYER_COLORS[player.name] ?? HUMAN_COLORS);
  const isSplit = player.hands.length > 1;

  const seatClass = [
    'player-seat',
    isActive ? 'player-seat--active' : '',
    player.isHuman ? 'player-seat--human' : 'player-seat--ai',
  ].filter(Boolean).join(' ');

  const nameClass = player.isHuman
    ? 'player-seat__name player-seat__name--human'
    : 'player-seat__name';

  return (
    <div className={seatClass}>
      <span className={nameClass}>
        <AvatarBust skin={colors.skin} hair={colors.hair} shirt={colors.shirt} />
        {player.name}
        {player.isHuman && <span className="player-seat__you-badge">You</span>}
      </span>
      <div className={isSplit ? 'player-seat__hands player-seat__hands--split' : 'player-seat__hands'}>
        {player.hands.map((hand, i) => {
          const isActiveHand = isActive && i === player.currentHandIndex;
          return (
            <div
              key={i}
              className={`player-seat__hand-slot ${isActiveHand ? 'player-seat__hand-slot--active' : ''} ${isSplit ? 'player-seat__hand-slot--split' : ''}`}
            >
              {isSplit && (
                <span className="player-seat__hand-label">
                  Hand {i + 1}{hand.isDoubled ? ' (2x)' : ''} — {formatCurrency(hand.bet)}
                </span>
              )}
              <Hand hand={hand} />
              {hand.result && hand.result !== 'pending' && (
                <div className={`player-seat__result player-seat__result--${hand.result}`}>
                  {hand.result === 'blackjack' ? 'BLACKJACK!' :
                   hand.result === 'win' ? 'WIN' :
                   hand.result === 'loss' ? 'LOSS' :
                   hand.result === 'push' ? 'PUSH' : 'SURRENDER'}
                  {hand.payout !== undefined && hand.payout !== 0 && (
                    <> ({hand.payout > 0 ? '+' : ''}{formatCurrency(hand.payout)})</>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <span className="player-seat__bankroll">{formatCurrency(player.bankroll)}</span>
    </div>
  );
}
