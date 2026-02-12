import type {
  Card, Player, HandState, GameState, GameSettings, RoundPhase,
  Action, RoundResult, ShoeState,
} from './types.js';
import { Shoe } from './shoe.js';
import { getHandTotal, isBlackjack, isBusted, getAvailableActions, createEmptyHand } from './hand.js';
import { getBasicStrategyAction } from './basicStrategy.js';
import { resolveHand, resolveInsurance } from './payoutCalculator.js';

const AI_NAMES = ['Alice', 'Bob', 'Carlos', 'Diana', 'Eve', 'Frank', 'Grace', 'Hank', 'Ivy'];

export class GameEngine {
  private shoe: Shoe;
  private settings: GameSettings;
  private players: Player[] = [];
  private dealerHand: HandState = createEmptyHand();
  private phase: RoundPhase = 'betting';
  private activePlayerIndex = -1;
  private roundResults: RoundResult[] = [];
  private roundNumber = 0;
  private _reshuffled = false;

  constructor(settings: GameSettings) {
    this.settings = settings;
    this.shoe = new Shoe(settings.numberOfDecks, settings.penetration);
    this.initPlayers();
  }

  private initPlayers(): void {
    this.players = [];

    const totalPlayers = this.settings.numberOfAIPlayers + 1; // AI + human
    const humanSeatIndex = Math.min(this.settings.humanSeatPosition, totalPlayers - 1);
    let aiNameIndex = 0;

    for (let i = 0; i < totalPlayers; i++) {
      if (i === humanSeatIndex) {
        this.players.push({
          name: 'You',
          seatIndex: i,
          bankroll: this.settings.startingBankroll,
          hands: [createEmptyHand()],
          isHuman: true,
          isActive: true,
          currentHandIndex: 0,
        });
      } else {
        this.players.push({
          name: AI_NAMES[aiNameIndex % AI_NAMES.length],
          seatIndex: i,
          bankroll: this.settings.startingBankroll,
          hands: [createEmptyHand()],
          isHuman: false,
          isActive: true,
          currentHandIndex: 0,
        });
        aiNameIndex++;
      }
    }
  }

  getState(): GameState {
    return {
      players: this.players.map(p => ({ ...p, hands: p.hands.map(h => ({ ...h, cards: [...h.cards] })) })),
      dealerHand: { ...this.dealerHand, cards: [...this.dealerHand.cards] },
      phase: this.phase,
      activePlayerIndex: this.activePlayerIndex,
      shoeState: this.shoe.getState(),
      roundResults: [...this.roundResults],
      roundNumber: this.roundNumber,
    };
  }

  consumeReshuffle(): boolean {
    const was = this._reshuffled;
    this._reshuffled = false;
    return was;
  }

  getShoeState(): ShoeState {
    return this.shoe.getState();
  }

  getPhase(): RoundPhase {
    return this.phase;
  }

  // Phase: Betting
  placeBet(playerIndex: number, amount: number): boolean {
    if (this.phase !== 'betting') return false;
    const player = this.players[playerIndex];
    if (!player || amount < this.settings.minimumBet || amount > this.settings.maximumBet) return false;
    if (amount > player.bankroll) return false;

    player.hands = [createEmptyHand(amount)];
    return true;
  }

  placeAIBets(): void {
    for (let i = 0; i < this.players.length; i++) {
      const player = this.players[i];
      if (!player.isHuman && player.isActive) {
        const bet = Math.min(this.settings.minimumBet, player.bankroll);
        if (bet >= this.settings.minimumBet) {
          this.placeBet(i, bet);
        } else {
          player.isActive = false;
        }
      }
    }
  }

  // Phase: Dealing
  deal(): void {
    if (this.phase !== 'betting') return;

    // Check reshuffle
    if (this.shoe.needsReshuffle()) {
      this.shoe.shuffle();
      this._reshuffled = true;
    }

    this.phase = 'dealing';
    this.roundNumber++;
    this.roundResults = [];

    // Deal 2 cards to each active player and dealer
    for (let round = 0; round < 2; round++) {
      for (const player of this.players) {
        if (!player.isActive || player.hands[0].bet === 0) continue;
        const card = this.shoe.deal();
        card.faceUp = true;
        player.hands[0].cards.push(card);
      }
      // Dealer card: first face up, second face down
      const dealerCard = this.shoe.deal();
      dealerCard.faceUp = round === 0;
      this.dealerHand.cards.push(dealerCard);
    }

    // Check for insurance prompt
    const dealerUpcard = this.dealerHand.cards[0];
    if (dealerUpcard.rank === 'A' && this.settings.allowInsurance) {
      this.phase = 'insurance_prompt';
    } else {
      this.startPlayerTurns();
    }
  }

  // Phase: Insurance
  placeInsurance(playerIndex: number): boolean {
    if (this.phase !== 'insurance_prompt') return false;
    const player = this.players[playerIndex];
    if (!player) return false;

    const hand = player.hands[0];
    const insuranceBet = hand.bet / 2;
    if (insuranceBet > player.bankroll - hand.bet) return false;

    hand.isInsured = true;
    hand.insuranceBet = insuranceBet;
    return true;
  }

  declineInsurance(): void {
    // Just move on
    this.startPlayerTurns();
  }

  resolveInsuranceAndContinue(): void {
    this.startPlayerTurns();
  }

  private startPlayerTurns(): void {
    // Check for dealer blackjack first
    if (isBlackjack(this.dealerHand.cards)) {
      // Reveal hole card
      this.dealerHand.cards[1].faceUp = true;
      this.shoe.updateCountForReveal(this.dealerHand.cards[1]);
      this.phase = 'resolving';
      this.resolveAllHands();
      return;
    }

    this.phase = 'player_turn';
    this.activePlayerIndex = this.findNextActivePlayer(-1);

    if (this.activePlayerIndex === -1) {
      this.startDealerTurn();
    }
  }

  private findNextActivePlayer(fromIndex: number): number {
    for (let i = fromIndex + 1; i < this.players.length; i++) {
      const player = this.players[i];
      if (player.isActive && player.hands[0].bet > 0) {
        // Skip if player has blackjack
        if (!isBlackjack(player.hands[0].cards)) {
          return i;
        }
      }
    }
    return -1;
  }

  // Phase: Player Turn
  getAvailableActionsForCurrentPlayer(): Action[] {
    if (this.phase !== 'player_turn' || this.activePlayerIndex === -1) return [];

    const player = this.players[this.activePlayerIndex];
    const hand = player.hands[player.currentHandIndex];
    const isSplitHand = player.hands.length > 1;

    return getAvailableActions(
      hand,
      player.bankroll - this.getTotalBets(player),
      this.settings.allowSurrender,
      this.settings.allowDoubleAfterSplit,
      isSplitHand
    );
  }

  private getTotalBets(player: Player): number {
    return player.hands.reduce((sum, h) => sum + h.bet + (h.isDoubled ? h.bet : 0), 0);
  }

  getBasicStrategyHint(): Action | null {
    if (this.phase !== 'player_turn' || this.activePlayerIndex === -1) return null;

    const player = this.players[this.activePlayerIndex];
    const hand = player.hands[player.currentHandIndex];
    const dealerUpcard = this.dealerHand.cards[0];
    const available = this.getAvailableActionsForCurrentPlayer();

    return getBasicStrategyAction(hand, dealerUpcard, available);
  }

  playerAction(action: Action): { done: boolean; nextPlayer: boolean } {
    if (this.phase !== 'player_turn' || this.activePlayerIndex === -1) {
      return { done: true, nextPlayer: false };
    }

    const player = this.players[this.activePlayerIndex];
    const hand = player.hands[player.currentHandIndex];

    switch (action) {
      case 'hit':
        this.dealCardToHand(hand);
        if (isBusted(hand.cards) || getHandTotal(hand.cards).best === 21) {
          return this.advanceHand(player);
        }
        return { done: false, nextPlayer: false };

      case 'stand':
        return this.advanceHand(player);

      case 'double':
        hand.isDoubled = true;
        hand.bet *= 2;
        this.dealCardToHand(hand);
        return this.advanceHand(player);

      case 'split':
        return this.handleSplit(player);

      case 'surrender':
        hand.isSurrendered = true;
        return this.advanceHand(player);

      default:
        return { done: false, nextPlayer: false };
    }
  }

  private dealCardToHand(hand: HandState): void {
    const card = this.shoe.deal();
    card.faceUp = true;
    hand.cards.push(card);
  }

  private handleSplit(player: Player): { done: boolean; nextPlayer: boolean } {
    const hand = player.hands[player.currentHandIndex];
    const secondCard = hand.cards.pop()!;

    // Create new hand with second card
    const newHand = createEmptyHand(hand.bet);
    newHand.cards.push(secondCard);

    // Deal one card to each hand
    this.dealCardToHand(hand);
    this.dealCardToHand(newHand);

    player.hands.splice(player.currentHandIndex + 1, 0, newHand);

    // If splitting aces, only one card each, then move on
    if (hand.cards[0].rank === 'A') {
      return this.advanceHand(player);
    }

    // Check if first hand is done (21 or bust)
    if (isBusted(hand.cards) || getHandTotal(hand.cards).best === 21) {
      return this.advanceHand(player);
    }

    return { done: false, nextPlayer: false };
  }

  private advanceHand(player: Player): { done: boolean; nextPlayer: boolean } {
    // Check if there are more hands for this player (splits)
    if (player.currentHandIndex < player.hands.length - 1) {
      player.currentHandIndex++;
      const nextHand = player.hands[player.currentHandIndex];
      if (isBusted(nextHand.cards) || getHandTotal(nextHand.cards).best === 21) {
        return this.advanceHand(player);
      }
      return { done: false, nextPlayer: false };
    }

    // Move to next player
    player.currentHandIndex = 0;
    this.activePlayerIndex = this.findNextActivePlayer(this.activePlayerIndex);

    if (this.activePlayerIndex === -1) {
      return { done: true, nextPlayer: true };
    }

    return { done: false, nextPlayer: true };
  }

  // AI plays their turn
  playAITurn(): Action | null {
    if (this.phase !== 'player_turn' || this.activePlayerIndex === -1) return null;

    const player = this.players[this.activePlayerIndex];
    if (player.isHuman) return null;

    const hand = player.hands[player.currentHandIndex];
    const dealerUpcard = this.dealerHand.cards[0];
    const available = this.getAvailableActionsForCurrentPlayer();

    const action = getBasicStrategyAction(hand, dealerUpcard, available);
    this.playerAction(action);
    return action;
  }

  isCurrentPlayerHuman(): boolean {
    if (this.activePlayerIndex === -1) return false;
    return this.players[this.activePlayerIndex].isHuman;
  }

  // Phase: Dealer Turn
  startDealerTurn(): void {
    this.phase = 'dealer_turn';

    // Reveal hole card
    if (this.dealerHand.cards.length > 1 && !this.dealerHand.cards[1].faceUp) {
      this.dealerHand.cards[1].faceUp = true;
      this.shoe.updateCountForReveal(this.dealerHand.cards[1]);
    }
  }

  dealerShouldHit(): boolean {
    const total = getHandTotal(this.dealerHand.cards);
    if (this.settings.hitSoft17) {
      // Hit on soft 17
      if (total.best < 17) return true;
      if (total.best === 17 && total.soft !== total.hard && total.soft <= 21) return true;
      return false;
    }
    return total.best < 17;
  }

  dealerHit(): Card {
    const card = this.shoe.deal();
    card.faceUp = true;
    this.dealerHand.cards.push(card);
    return card;
  }

  // Check if all player hands are busted (dealer doesn't need to play)
  allPlayersBusted(): boolean {
    for (const player of this.players) {
      if (!player.isActive || player.hands[0].bet === 0) continue;
      for (const hand of player.hands) {
        if (!isBusted(hand.cards) && !hand.isSurrendered) {
          return false;
        }
      }
    }
    return true;
  }

  // Phase: Resolving
  resolveAllHands(): void {
    this.phase = 'resolving';
    this.roundResults = [];

    for (let pi = 0; pi < this.players.length; pi++) {
      const player = this.players[pi];
      if (!player.isActive || player.hands[0].bet === 0) continue;

      for (let hi = 0; hi < player.hands.length; hi++) {
        const hand = player.hands[hi];
        const { result, payout } = resolveHand(hand, this.dealerHand, this.settings);

        hand.result = result;
        hand.payout = payout;
        player.bankroll += payout;

        // Resolve insurance
        if (hand.isInsured) {
          const insurancePayout = resolveInsurance(this.dealerHand, hand.insuranceBet);
          player.bankroll += insurancePayout;
        }

        this.roundResults.push({
          playerName: player.name,
          seatIndex: player.seatIndex,
          handIndex: hi,
          bet: hand.bet,
          result,
          payout,
        });
      }

      // Deactivate player if bankroll too low
      if (player.bankroll < this.settings.minimumBet) {
        player.isActive = false;
      }
    }

    this.phase = 'round_over';
  }

  // Start new round
  resetForNewRound(): void {
    this.phase = 'betting';
    this.activePlayerIndex = -1;
    this.dealerHand = createEmptyHand();
    this.roundResults = [];

    for (const player of this.players) {
      player.hands = [createEmptyHand()];
      player.currentHandIndex = 0;
    }
  }

  getDealerUpcard(): Card | null {
    if (this.dealerHand.cards.length > 0) {
      return this.dealerHand.cards[0];
    }
    return null;
  }

  getHumanPlayerIndex(): number {
    return this.players.findIndex(p => p.isHuman);
  }

  updateSettings(settings: GameSettings): void {
    this.settings = settings;
  }
}
