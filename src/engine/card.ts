import type { Card, Suit, Rank } from './types.js';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, faceUp: true });
    }
  }
  return deck;
}

export function cardValue(card: Card): number[] {
  if (card.rank === 'A') return [11, 1];
  if (['K', 'Q', 'J', '10'].includes(card.rank)) return [10];
  return [parseInt(card.rank)];
}

export function hiLoValue(card: Card): number {
  const rank = card.rank;
  if (['2', '3', '4', '5', '6'].includes(rank)) return 1;
  if (['7', '8', '9'].includes(rank)) return 0;
  return -1; // 10, J, Q, K, A
}

export function cardLabel(card: Card): string {
  return `${card.rank}${suitSymbol(card.suit)}`;
}

export function suitSymbol(suit: Suit): string {
  switch (suit) {
    case 'hearts': return '♥';
    case 'diamonds': return '♦';
    case 'clubs': return '♣';
    case 'spades': return '♠';
  }
}

export function isRedSuit(suit: Suit): boolean {
  return suit === 'hearts' || suit === 'diamonds';
}

export { SUITS, RANKS };
