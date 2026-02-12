import type { Player } from '@/engine/types.js';
import { formatCurrency } from '@/utils/formatters.js';
import Hand from '@/components/cards/Hand.js';

interface PlayerSeatProps {
  player: Player;
  isActive: boolean;
}

export default function PlayerSeat({ player, isActive }: PlayerSeatProps) {
  const seatClass = [
    'player-seat',
    isActive ? 'player-seat--active' : '',
    player.isHuman ? 'player-seat--human' : '',
  ].filter(Boolean).join(' ');

  const nameClass = player.isHuman
    ? 'player-seat__name player-seat__name--human'
    : 'player-seat__name';

  return (
    <div className={seatClass}>
      <span className={nameClass}>{player.name}</span>
      {player.hands.map((hand, i) => (
        <div key={i}>
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
      ))}
      <span className="player-seat__bankroll">{formatCurrency(player.bankroll)}</span>
    </div>
  );
}
