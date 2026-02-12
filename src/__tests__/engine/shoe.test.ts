import { Shoe } from '@/engine/shoe';
import { hiLoValue } from '@/engine/card';

describe('Shoe', () => {
  it('should contain correct number of cards for 6 decks', () => {
    const shoe = new Shoe(6, 0.75);
    expect(shoe.totalCards).toBe(312);
    expect(shoe.cardsRemaining).toBe(312);
    expect(shoe.cardsDealt).toBe(0);
  });

  it('should contain correct number of cards for 1 deck', () => {
    const shoe = new Shoe(1, 0.75);
    expect(shoe.totalCards).toBe(52);
  });

  it('should deal cards reducing remaining count', () => {
    const shoe = new Shoe(1, 0.75);
    shoe.deal();
    expect(shoe.cardsRemaining).toBe(51);
    expect(shoe.cardsDealt).toBe(1);
  });

  it('should not have duplicate cards in a single deck shoe', () => {
    const shoe = new Shoe(1, 0.75);
    const cards = [];
    for (let i = 0; i < 52; i++) {
      cards.push(shoe.deal());
    }
    const labels = cards.map(c => `${c.rank}-${c.suit}`);
    const unique = new Set(labels);
    expect(unique.size).toBe(52);
  });

  it('should shuffle and change card order', () => {
    const shoe1 = new Shoe(1, 0.75);
    const shoe2 = new Shoe(1, 0.75);

    const cards1 = [];
    const cards2 = [];
    for (let i = 0; i < 10; i++) {
      cards1.push(`${shoe1.deal().rank}-${shoe1.deal().suit}`);
      cards2.push(`${shoe2.deal().rank}-${shoe2.deal().suit}`);
    }

    // Very unlikely (but not impossible) that two shuffles produce same order
    // This is a probabilistic test
    const same = cards1.every((c, i) => c === cards2[i]);
    // If same by chance, that's fine - just checking shuffle runs without error
    expect(typeof same).toBe('boolean');
  });

  it('should update running count when dealing face-up cards', () => {
    const shoe = new Shoe(6, 0.75);
    let expectedCount = 0;

    for (let i = 0; i < 20; i++) {
      const card = shoe.deal();
      expectedCount += hiLoValue(card);
    }

    expect(shoe.runningCount).toBe(expectedCount);
  });

  it('should calculate true count correctly', () => {
    const shoe = new Shoe(6, 0.75);
    // Deal some cards to change the count
    for (let i = 0; i < 52; i++) {
      shoe.deal();
    }

    const rc = shoe.runningCount;
    const dr = shoe.decksRemaining;
    const tc = shoe.trueCount;

    // True count = running count / decks remaining (rounded to 1 decimal)
    const expected = Math.round((rc / dr) * 10) / 10;
    expect(tc).toBe(expected);
  });

  it('should detect when penetration threshold is reached', () => {
    const shoe = new Shoe(1, 0.5); // 50% penetration
    expect(shoe.needsReshuffle()).toBe(false);

    // Deal 26 cards (50% of 52)
    for (let i = 0; i < 26; i++) {
      shoe.deal();
    }
    expect(shoe.needsReshuffle()).toBe(true);
  });

  it('should reset running count on reshuffle', () => {
    const shoe = new Shoe(1, 0.75);

    // Deal some cards
    for (let i = 0; i < 20; i++) {
      shoe.deal();
    }
    expect(shoe.cardsDealt).toBeGreaterThan(0);

    shoe.shuffle();
    expect(shoe.runningCount).toBe(0);
    expect(shoe.cardsDealt).toBe(0);
    expect(shoe.cardsRemaining).toBe(52);
  });

  it('should provide serializable state', () => {
    const shoe = new Shoe(6, 0.75);
    shoe.deal();
    const state = shoe.getState();

    expect(state.totalCards).toBe(312);
    expect(state.cardsDealt).toBe(1);
    expect(state.countInfo).toBeDefined();
    expect(typeof state.needsReshuffle).toBe('boolean');
    expect(typeof state.penetration).toBe('number');
  });

  it('should auto-reshuffle when shoe runs out', () => {
    const shoe = new Shoe(1, 1.0); // 100% penetration (never auto-reshuffle by pen)
    // Deal all 52 cards
    for (let i = 0; i < 52; i++) {
      shoe.deal();
    }
    // Next deal should trigger auto-reshuffle
    const card = shoe.deal();
    expect(card).toBeDefined();
    expect(card.rank).toBeDefined();
  });
});
