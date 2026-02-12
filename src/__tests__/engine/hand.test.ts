import { getHandTotal, isBlackjack, isBusted, isSoft, canSplit, canDouble, canSurrender, getAvailableActions, createEmptyHand } from '@/engine/hand';
import type { Card, HandState } from '@/engine/types';

function makeCard(rank: string, suit: string = 'spades'): Card {
  return { rank: rank as Card['rank'], suit: suit as Card['suit'], faceUp: true };
}

function makeHand(cards: Card[], bet: number = 10): HandState {
  return { ...createEmptyHand(bet), cards };
}

describe('getHandTotal', () => {
  it('should calculate hard total for number cards', () => {
    const total = getHandTotal([makeCard('5'), makeCard('7')]);
    expect(total.hard).toBe(12);
    expect(total.soft).toBe(12);
    expect(total.best).toBe(12);
  });

  it('should calculate face cards as 10', () => {
    const total = getHandTotal([makeCard('K'), makeCard('Q')]);
    expect(total.best).toBe(20);
  });

  it('should handle Ace as 11 (soft hand)', () => {
    const total = getHandTotal([makeCard('A'), makeCard('5')]);
    expect(total.hard).toBe(6);
    expect(total.soft).toBe(16);
    expect(total.best).toBe(16);
  });

  it('should handle Ace as 1 when 11 would bust', () => {
    const total = getHandTotal([makeCard('A'), makeCard('5'), makeCard('8')]);
    expect(total.hard).toBe(14);
    expect(total.soft).toBe(14); // soft would be 24, so hard is used
    expect(total.best).toBe(14);
  });

  it('should handle two Aces', () => {
    const total = getHandTotal([makeCard('A'), makeCard('A')]);
    expect(total.hard).toBe(2);
    expect(total.soft).toBe(12); // one ace as 11
    expect(total.best).toBe(12);
  });

  it('should handle three Aces', () => {
    const total = getHandTotal([makeCard('A'), makeCard('A'), makeCard('A')]);
    expect(total.hard).toBe(3);
    expect(total.soft).toBe(13);
    expect(total.best).toBe(13);
  });

  it('should handle 21 exactly', () => {
    const total = getHandTotal([makeCard('10'), makeCard('5'), makeCard('6')]);
    expect(total.best).toBe(21);
  });
});

describe('isBlackjack', () => {
  it('should detect Ace + King as blackjack', () => {
    expect(isBlackjack([makeCard('A'), makeCard('K')])).toBe(true);
  });

  it('should detect Ace + 10 as blackjack', () => {
    expect(isBlackjack([makeCard('A'), makeCard('10')])).toBe(true);
  });

  it('should detect Ace + Queen as blackjack', () => {
    expect(isBlackjack([makeCard('A'), makeCard('Q')])).toBe(true);
  });

  it('should not detect A+5+5 as blackjack (3 cards)', () => {
    expect(isBlackjack([makeCard('A'), makeCard('5'), makeCard('5')])).toBe(false);
  });

  it('should not detect 10+10 as blackjack', () => {
    expect(isBlackjack([makeCard('10'), makeCard('J')])).toBe(false);
  });

  it('should not detect 9+2 as blackjack', () => {
    expect(isBlackjack([makeCard('9'), makeCard('2')])).toBe(false);
  });
});

describe('isBusted', () => {
  it('should detect bust at 22', () => {
    expect(isBusted([makeCard('10'), makeCard('6'), makeCard('7')])).toBe(true);
  });

  it('should not detect bust at 21', () => {
    expect(isBusted([makeCard('10'), makeCard('5'), makeCard('6')])).toBe(false);
  });

  it('should not detect bust with soft ace', () => {
    expect(isBusted([makeCard('A'), makeCard('10')])).toBe(false);
  });
});

describe('isSoft', () => {
  it('should detect soft hand with Ace counted as 11', () => {
    expect(isSoft([makeCard('A'), makeCard('6')])).toBe(true);
  });

  it('should not detect soft when Ace must be 1', () => {
    expect(isSoft([makeCard('A'), makeCard('8'), makeCard('6')])).toBe(false);
  });

  it('should not detect soft for non-ace hands', () => {
    expect(isSoft([makeCard('10'), makeCard('7')])).toBe(false);
  });
});

describe('canSplit', () => {
  it('should allow split for matching values', () => {
    const hand = makeHand([makeCard('8'), makeCard('8')]);
    expect(canSplit(hand, 100)).toBe(true);
  });

  it('should allow split for matching face cards', () => {
    const hand = makeHand([makeCard('K'), makeCard('Q')]); // both value 10
    expect(canSplit(hand, 100)).toBe(true);
  });

  it('should not allow split for different values', () => {
    const hand = makeHand([makeCard('8'), makeCard('9')]);
    expect(canSplit(hand, 100)).toBe(false);
  });

  it('should not allow split if bankroll too low', () => {
    const hand = makeHand([makeCard('8'), makeCard('8')], 50);
    expect(canSplit(hand, 10)).toBe(false);
  });

  it('should not allow split with 3+ cards', () => {
    const hand = makeHand([makeCard('5'), makeCard('5'), makeCard('5')]);
    expect(canSplit(hand, 100)).toBe(false);
  });
});

describe('canDouble', () => {
  it('should allow double with 2 cards and enough bankroll', () => {
    const hand = makeHand([makeCard('5'), makeCard('6')]);
    expect(canDouble(hand, 100)).toBe(true);
  });

  it('should not allow double with 3+ cards', () => {
    const hand = makeHand([makeCard('3'), makeCard('4'), makeCard('5')]);
    expect(canDouble(hand, 100)).toBe(false);
  });

  it('should not allow double if bankroll too low', () => {
    const hand = makeHand([makeCard('5'), makeCard('6')], 50);
    expect(canDouble(hand, 10)).toBe(false);
  });
});

describe('canSurrender', () => {
  it('should allow surrender with 2 cards', () => {
    const hand = makeHand([makeCard('10'), makeCard('6')]);
    expect(canSurrender(hand)).toBe(true);
  });

  it('should not allow surrender with 3 cards', () => {
    const hand = makeHand([makeCard('10'), makeCard('3'), makeCard('3')]);
    expect(canSurrender(hand)).toBe(false);
  });
});

describe('getAvailableActions', () => {
  it('should always include hit and stand', () => {
    const hand = makeHand([makeCard('10'), makeCard('5')]);
    const actions = getAvailableActions(hand, 100, true, true, false);
    expect(actions).toContain('hit');
    expect(actions).toContain('stand');
  });

  it('should include double with 2 cards', () => {
    const hand = makeHand([makeCard('5'), makeCard('6')]);
    const actions = getAvailableActions(hand, 100, true, true, false);
    expect(actions).toContain('double');
  });

  it('should include split for pairs', () => {
    const hand = makeHand([makeCard('8'), makeCard('8')]);
    const actions = getAvailableActions(hand, 100, true, true, false);
    expect(actions).toContain('split');
  });

  it('should include surrender when allowed', () => {
    const hand = makeHand([makeCard('10'), makeCard('6')]);
    const actions = getAvailableActions(hand, 100, true, true, false);
    expect(actions).toContain('surrender');
  });

  it('should not include surrender when disallowed', () => {
    const hand = makeHand([makeCard('10'), makeCard('6')]);
    const actions = getAvailableActions(hand, 100, false, true, false);
    expect(actions).not.toContain('surrender');
  });

  it('should not include surrender for split hands', () => {
    const hand = makeHand([makeCard('10'), makeCard('6')]);
    const actions = getAvailableActions(hand, 100, true, true, true);
    expect(actions).not.toContain('surrender');
  });

  it('should not include double after split when disallowed', () => {
    const hand = makeHand([makeCard('5'), makeCard('6')]);
    const actions = getAvailableActions(hand, 100, true, false, true);
    expect(actions).not.toContain('double');
  });
});
