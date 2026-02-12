import { getBasicStrategyAction } from '@/engine/basicStrategy';
import type { Card, Action, HandState } from '@/engine/types';
import { createEmptyHand } from '@/engine/hand';

function makeCard(rank: string, suit: string = 'spades'): Card {
  return { rank: rank as Card['rank'], suit: suit as Card['suit'], faceUp: true };
}

function makeHand(cards: Card[], bet: number = 10): HandState {
  return { ...createEmptyHand(bet), cards };
}

const ALL_ACTIONS: Action[] = ['hit', 'stand', 'double', 'split', 'surrender'];
const NO_SPLIT: Action[] = ['hit', 'stand', 'double', 'surrender'];
const HIT_STAND: Action[] = ['hit', 'stand'];

describe('Basic Strategy - Hard Totals', () => {
  it('Hard 16 vs 10: should hit (or surrender)', () => {
    const hand = makeHand([makeCard('10'), makeCard('6')]);
    const result = getBasicStrategyAction(hand, makeCard('10'), ALL_ACTIONS);
    expect(result).toBe('surrender'); // Rh -> surrender available
  });

  it('Hard 16 vs 10: should hit when surrender not available', () => {
    const hand = makeHand([makeCard('10'), makeCard('6')]);
    const result = getBasicStrategyAction(hand, makeCard('10'), ['hit', 'stand', 'double']);
    expect(result).toBe('hit');
  });

  it('Hard 11 vs 6: should double', () => {
    const hand = makeHand([makeCard('5'), makeCard('6')]);
    const result = getBasicStrategyAction(hand, makeCard('6'), ALL_ACTIONS);
    expect(result).toBe('double');
  });

  it('Hard 11 vs Ace: should double (H17 specific)', () => {
    const hand = makeHand([makeCard('5'), makeCard('6')]);
    const result = getBasicStrategyAction(hand, makeCard('A'), ALL_ACTIONS);
    expect(result).toBe('double');
  });

  it('Hard 11 vs Ace: should hit if can\'t double', () => {
    const hand = makeHand([makeCard('5'), makeCard('6')]);
    const result = getBasicStrategyAction(hand, makeCard('A'), HIT_STAND);
    expect(result).toBe('hit');
  });

  it('Hard 12 vs 2: should hit', () => {
    const hand = makeHand([makeCard('10'), makeCard('2')]);
    const result = getBasicStrategyAction(hand, makeCard('2'), NO_SPLIT);
    expect(result).toBe('hit');
  });

  it('Hard 12 vs 3: should hit', () => {
    const hand = makeHand([makeCard('10'), makeCard('2')]);
    const result = getBasicStrategyAction(hand, makeCard('3'), NO_SPLIT);
    expect(result).toBe('hit');
  });

  it('Hard 12 vs 4: should stand', () => {
    const hand = makeHand([makeCard('10'), makeCard('2')]);
    const result = getBasicStrategyAction(hand, makeCard('4'), NO_SPLIT);
    expect(result).toBe('stand');
  });

  it('Hard 12 vs 5: should stand', () => {
    const hand = makeHand([makeCard('10'), makeCard('2')]);
    const result = getBasicStrategyAction(hand, makeCard('5'), NO_SPLIT);
    expect(result).toBe('stand');
  });

  it('Hard 12 vs 6: should stand', () => {
    const hand = makeHand([makeCard('10'), makeCard('2')]);
    const result = getBasicStrategyAction(hand, makeCard('6'), NO_SPLIT);
    expect(result).toBe('stand');
  });

  it('Hard 17 vs 10: should stand', () => {
    const hand = makeHand([makeCard('10'), makeCard('7')]);
    const result = getBasicStrategyAction(hand, makeCard('10'), NO_SPLIT);
    expect(result).toBe('stand');
  });

  it('Hard 8 vs 6: should hit', () => {
    const hand = makeHand([makeCard('5'), makeCard('3')]);
    const result = getBasicStrategyAction(hand, makeCard('6'), NO_SPLIT);
    expect(result).toBe('hit');
  });

  it('Hard 10 vs 9: should double', () => {
    const hand = makeHand([makeCard('4'), makeCard('6')]);
    const result = getBasicStrategyAction(hand, makeCard('9'), ALL_ACTIONS);
    expect(result).toBe('double');
  });

  it('Hard 15 vs 10: should surrender (or hit)', () => {
    const hand = makeHand([makeCard('10'), makeCard('5')]);
    const result = getBasicStrategyAction(hand, makeCard('10'), ALL_ACTIONS);
    expect(result).toBe('surrender');
  });
});

describe('Basic Strategy - Soft Totals', () => {
  it('Soft 18 vs 9: should hit', () => {
    const hand = makeHand([makeCard('A'), makeCard('7')]);
    const result = getBasicStrategyAction(hand, makeCard('9'), NO_SPLIT);
    expect(result).toBe('hit');
  });

  it('Soft 18 vs 10: should hit', () => {
    const hand = makeHand([makeCard('A'), makeCard('7')]);
    const result = getBasicStrategyAction(hand, makeCard('10'), NO_SPLIT);
    expect(result).toBe('hit');
  });

  it('Soft 18 vs Ace: should hit', () => {
    const hand = makeHand([makeCard('A'), makeCard('7')]);
    const result = getBasicStrategyAction(hand, makeCard('A'), NO_SPLIT);
    expect(result).toBe('hit');
  });

  it('Soft 18 vs 7: should stand', () => {
    const hand = makeHand([makeCard('A'), makeCard('7')]);
    const result = getBasicStrategyAction(hand, makeCard('7'), NO_SPLIT);
    expect(result).toBe('stand');
  });

  it('Soft 18 vs 5: should double (or stand)', () => {
    const hand = makeHand([makeCard('A'), makeCard('7')]);
    const result = getBasicStrategyAction(hand, makeCard('5'), ALL_ACTIONS);
    expect(result).toBe('double');
  });

  it('Soft 18 vs 5: should stand if can\'t double', () => {
    const hand = makeHand([makeCard('A'), makeCard('7')]);
    const result = getBasicStrategyAction(hand, makeCard('5'), HIT_STAND);
    expect(result).toBe('stand');
  });

  it('Soft 17 vs 4: should double', () => {
    const hand = makeHand([makeCard('A'), makeCard('6')]);
    const result = getBasicStrategyAction(hand, makeCard('4'), ALL_ACTIONS);
    expect(result).toBe('double');
  });

  it('Soft 13 vs 5: should double', () => {
    const hand = makeHand([makeCard('A'), makeCard('2')]);
    const result = getBasicStrategyAction(hand, makeCard('5'), ALL_ACTIONS);
    expect(result).toBe('double');
  });

  it('Soft 19 vs 6: should double (or stand)', () => {
    const hand = makeHand([makeCard('A'), makeCard('8')]);
    const result = getBasicStrategyAction(hand, makeCard('6'), ALL_ACTIONS);
    expect(result).toBe('double');
  });
});

describe('Basic Strategy - Pairs', () => {
  it('Always split 8s: 8-8 vs Ace', () => {
    const hand = makeHand([makeCard('8'), makeCard('8')]);
    const result = getBasicStrategyAction(hand, makeCard('A'), ALL_ACTIONS);
    expect(result).toBe('split');
  });

  it('Always split 8s: 8-8 vs 10', () => {
    const hand = makeHand([makeCard('8'), makeCard('8')]);
    const result = getBasicStrategyAction(hand, makeCard('10'), ALL_ACTIONS);
    expect(result).toBe('split');
  });

  it('Always split Aces: A-A vs 7', () => {
    const hand = makeHand([makeCard('A'), makeCard('A')]);
    const result = getBasicStrategyAction(hand, makeCard('7'), ALL_ACTIONS);
    expect(result).toBe('split');
  });

  it('Never split 10s: 10-10 vs 5', () => {
    const hand = makeHand([makeCard('10'), makeCard('10')]);
    const result = getBasicStrategyAction(hand, makeCard('5'), ALL_ACTIONS);
    expect(result).toBe('stand');
  });

  it('Never split 10s: K-K vs 6', () => {
    const hand = makeHand([makeCard('K'), makeCard('K')]);
    const result = getBasicStrategyAction(hand, makeCard('6'), ALL_ACTIONS);
    expect(result).toBe('stand');
  });

  it('Split 9s vs 6 but not vs 7', () => {
    const hand9v6 = makeHand([makeCard('9'), makeCard('9')]);
    expect(getBasicStrategyAction(hand9v6, makeCard('6'), ALL_ACTIONS)).toBe('split');

    const hand9v7 = makeHand([makeCard('9'), makeCard('9')]);
    expect(getBasicStrategyAction(hand9v7, makeCard('7'), ALL_ACTIONS)).toBe('stand');
  });

  it('5-5 vs 9: should double (never split 5s)', () => {
    const hand = makeHand([makeCard('5'), makeCard('5')]);
    const result = getBasicStrategyAction(hand, makeCard('9'), ALL_ACTIONS);
    expect(result).toBe('double');
  });
});

describe('Basic Strategy - Fallback logic', () => {
  it('should fall back to hit when double not available', () => {
    const hand = makeHand([makeCard('5'), makeCard('6')]);
    const result = getBasicStrategyAction(hand, makeCard('5'), HIT_STAND);
    expect(result).toBe('hit');
  });

  it('should fall back to stand for Ds when double not available', () => {
    const hand = makeHand([makeCard('A'), makeCard('7')]);
    const result = getBasicStrategyAction(hand, makeCard('3'), HIT_STAND);
    expect(result).toBe('stand');
  });
});
