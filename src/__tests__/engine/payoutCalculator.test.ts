import { resolveHand, resolveInsurance } from '@/engine/payoutCalculator';
import type { Card, HandState, GameSettings } from '@/engine/types';
import { createEmptyHand } from '@/engine/hand';
import { DEFAULT_SETTINGS } from '@/utils/constants';

function makeCard(rank: string, suit: string = 'spades'): Card {
  return { rank: rank as Card['rank'], suit: suit as Card['suit'], faceUp: true };
}

function makeHand(cards: Card[], bet: number = 10, opts: Partial<HandState> = {}): HandState {
  return { ...createEmptyHand(bet), cards, ...opts };
}

const settings: GameSettings = { ...DEFAULT_SETTINGS };

describe('resolveHand', () => {
  it('should pay 3:2 for blackjack', () => {
    const player = makeHand([makeCard('A'), makeCard('K')], 10);
    const dealer = makeHand([makeCard('7'), makeCard('10')]);
    const { result, payout } = resolveHand(player, dealer, settings);
    expect(result).toBe('blackjack');
    expect(payout).toBe(15); // 1.5x
  });

  it('should pay 1:1 for normal win', () => {
    const player = makeHand([makeCard('10'), makeCard('9')], 10); // 19
    const dealer = makeHand([makeCard('10'), makeCard('7')]); // 17
    const { result, payout } = resolveHand(player, dealer, settings);
    expect(result).toBe('win');
    expect(payout).toBe(10);
  });

  it('should return 0 for push', () => {
    const player = makeHand([makeCard('10'), makeCard('8')], 10); // 18
    const dealer = makeHand([makeCard('10'), makeCard('8')]); // 18
    const { result, payout } = resolveHand(player, dealer, settings);
    expect(result).toBe('push');
    expect(payout).toBe(0);
  });

  it('should lose bet on loss', () => {
    const player = makeHand([makeCard('10'), makeCard('6')], 10); // 16
    const dealer = makeHand([makeCard('10'), makeCard('8')]); // 18
    const { result, payout } = resolveHand(player, dealer, settings);
    expect(result).toBe('loss');
    expect(payout).toBe(-10);
  });

  it('should lose half bet on surrender', () => {
    const player = makeHand([makeCard('10'), makeCard('6')], 10, { isSurrendered: true });
    const dealer = makeHand([makeCard('10'), makeCard('8')]);
    const { result, payout } = resolveHand(player, dealer, settings);
    expect(result).toBe('surrender');
    expect(payout).toBe(-5);
  });

  it('should win when dealer busts', () => {
    const player = makeHand([makeCard('10'), makeCard('8')], 10); // 18
    const dealer = makeHand([makeCard('10'), makeCard('6'), makeCard('10')]); // 26 bust
    const { result, payout } = resolveHand(player, dealer, settings);
    expect(result).toBe('win');
    expect(payout).toBe(10);
  });

  it('should lose when player busts regardless of dealer', () => {
    const player = makeHand([makeCard('10'), makeCard('6'), makeCard('10')], 10); // 26 bust
    const dealer = makeHand([makeCard('10'), makeCard('6'), makeCard('10')]); // 26 bust
    const { result, payout } = resolveHand(player, dealer, settings);
    expect(result).toBe('loss');
    expect(payout).toBe(-10);
  });

  it('should push when both have blackjack', () => {
    const player = makeHand([makeCard('A'), makeCard('K')], 10);
    const dealer = makeHand([makeCard('A'), makeCard('Q')]);
    const { result, payout } = resolveHand(player, dealer, settings);
    expect(result).toBe('push');
    expect(payout).toBe(0);
  });

  it('should lose to dealer blackjack', () => {
    const player = makeHand([makeCard('10'), makeCard('9')], 10); // 19
    const dealer = makeHand([makeCard('A'), makeCard('K')]); // BJ
    const { result, payout } = resolveHand(player, dealer, settings);
    expect(result).toBe('loss');
    expect(payout).toBe(-10);
  });

  it('should handle doubled bet', () => {
    const player = makeHand([makeCard('5'), makeCard('6'), makeCard('10')], 20); // doubled to 20 bet, total 21
    const dealer = makeHand([makeCard('10'), makeCard('8')]); // 18
    const { result, payout } = resolveHand(player, dealer, settings);
    expect(result).toBe('win');
    expect(payout).toBe(20);
  });
});

describe('resolveInsurance', () => {
  it('should pay 2:1 when dealer has blackjack', () => {
    const dealer = makeHand([makeCard('A'), makeCard('K')]);
    const payout = resolveInsurance(dealer, 5);
    expect(payout).toBe(10);
  });

  it('should lose insurance when dealer does not have blackjack', () => {
    const dealer = makeHand([makeCard('A'), makeCard('7')]);
    const payout = resolveInsurance(dealer, 5);
    expect(payout).toBe(-5);
  });
});
