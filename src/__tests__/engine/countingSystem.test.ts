import { calculatePlayerAdvantage, getRecommendedBet } from '@/engine/countingSystem';
import { hiLoValue } from '@/engine/card';
import type { Card } from '@/engine/types';

function makeCard(rank: string): Card {
  return { rank: rank as Card['rank'], suit: 'spades', faceUp: true };
}

describe('Hi-Lo Values', () => {
  it('should assign +1 to low cards (2-6)', () => {
    expect(hiLoValue(makeCard('2'))).toBe(1);
    expect(hiLoValue(makeCard('3'))).toBe(1);
    expect(hiLoValue(makeCard('4'))).toBe(1);
    expect(hiLoValue(makeCard('5'))).toBe(1);
    expect(hiLoValue(makeCard('6'))).toBe(1);
  });

  it('should assign 0 to neutral cards (7-9)', () => {
    expect(hiLoValue(makeCard('7'))).toBe(0);
    expect(hiLoValue(makeCard('8'))).toBe(0);
    expect(hiLoValue(makeCard('9'))).toBe(0);
  });

  it('should assign -1 to high cards (10, J, Q, K, A)', () => {
    expect(hiLoValue(makeCard('10'))).toBe(-1);
    expect(hiLoValue(makeCard('J'))).toBe(-1);
    expect(hiLoValue(makeCard('Q'))).toBe(-1);
    expect(hiLoValue(makeCard('K'))).toBe(-1);
    expect(hiLoValue(makeCard('A'))).toBe(-1);
  });
});

describe('calculatePlayerAdvantage', () => {
  it('should return -0.5% at true count 0', () => {
    expect(calculatePlayerAdvantage(0)).toBeCloseTo(-0.005);
  });

  it('should return 0% at true count 1', () => {
    expect(calculatePlayerAdvantage(1)).toBeCloseTo(0);
  });

  it('should return +0.5% at true count 2', () => {
    expect(calculatePlayerAdvantage(2)).toBeCloseTo(0.005);
  });

  it('should return +2% at true count 5', () => {
    expect(calculatePlayerAdvantage(5)).toBeCloseTo(0.02);
  });

  it('should return negative advantage at negative counts', () => {
    expect(calculatePlayerAdvantage(-3)).toBeLessThan(0);
  });
});

describe('getRecommendedBet', () => {
  const minBet = 5;
  const bankroll = 1000;

  it('should recommend 1 unit at TC <= 1', () => {
    expect(getRecommendedBet(0, minBet, bankroll).units).toBe(1);
    expect(getRecommendedBet(1, minBet, bankroll).units).toBe(1);
    expect(getRecommendedBet(-2, minBet, bankroll).units).toBe(1);
  });

  it('should recommend 2 units at TC 2', () => {
    const rec = getRecommendedBet(2, minBet, bankroll);
    expect(rec.units).toBe(2);
    expect(rec.amount).toBe(10);
  });

  it('should recommend 4 units at TC 3', () => {
    const rec = getRecommendedBet(3, minBet, bankroll);
    expect(rec.units).toBe(4);
    expect(rec.amount).toBe(20);
  });

  it('should recommend 8 units at TC 4', () => {
    const rec = getRecommendedBet(4, minBet, bankroll);
    expect(rec.units).toBe(8);
    expect(rec.amount).toBe(40);
  });

  it('should recommend 12 units at TC 5+', () => {
    const rec = getRecommendedBet(5, minBet, bankroll);
    expect(rec.units).toBe(12);
    expect(rec.amount).toBe(60);

    const rec7 = getRecommendedBet(7, minBet, bankroll);
    expect(rec7.units).toBe(12);
  });

  it('should cap bet at bankroll', () => {
    const rec = getRecommendedBet(5, 100, 50);
    expect(rec.amount).toBe(50);
  });

  it('should include advantage in recommendation', () => {
    const rec = getRecommendedBet(3, minBet, bankroll);
    expect(rec.advantage).toBeCloseTo(0.01);
  });
});
