import type { Card, ShoeState, CountInfo } from './types.js';
import { createDeck, hiLoValue } from './card.js';

export class Shoe {
  private cards: Card[] = [];
  private dealtCards: Card[] = [];
  private _runningCount = 0;
  private _numberOfDecks: number;
  private _penetration: number;

  constructor(numberOfDecks: number, penetration: number) {
    this._numberOfDecks = numberOfDecks;
    this._penetration = penetration;
    this.shuffle();
  }

  shuffle(): void {
    this.cards = [];
    for (let i = 0; i < this._numberOfDecks; i++) {
      this.cards.push(...createDeck());
    }
    // Fisher-Yates shuffle
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
    this.dealtCards = [];
    this._runningCount = 0;
  }

  deal(): Card {
    if (this.cards.length === 0) {
      this.shuffle();
    }
    const card = this.cards.pop()!;
    this.dealtCards.push(card);
    if (card.faceUp) {
      this._runningCount += hiLoValue(card);
    }
    return card;
  }

  updateCountForReveal(card: Card): void {
    this._runningCount += hiLoValue(card);
  }

  get runningCount(): number {
    return this._runningCount;
  }

  get decksRemaining(): number {
    return Math.max(this.cards.length / 52, 0.5);
  }

  get trueCount(): number {
    return Math.round((this._runningCount / this.decksRemaining) * 10) / 10;
  }

  get cardsDealt(): number {
    return this.dealtCards.length;
  }

  get cardsRemaining(): number {
    return this.cards.length;
  }

  get totalCards(): number {
    return this._numberOfDecks * 52;
  }

  needsReshuffle(): boolean {
    const penetrationReached = this.dealtCards.length / this.totalCards;
    return penetrationReached >= this._penetration;
  }

  getCountInfo(): CountInfo {
    return {
      runningCount: this._runningCount,
      trueCount: this.trueCount,
      cardsDealt: this.dealtCards.length,
      cardsRemaining: this.cards.length,
      decksRemaining: Math.round(this.decksRemaining * 10) / 10,
    };
  }

  getState(): ShoeState {
    const penetrationReached = this.totalCards > 0 ? this.dealtCards.length / this.totalCards : 0;
    return {
      totalCards: this.totalCards,
      cardsDealt: this.dealtCards.length,
      penetration: Math.round(penetrationReached * 100) / 100,
      needsReshuffle: this.needsReshuffle(),
      countInfo: this.getCountInfo(),
    };
  }
}
