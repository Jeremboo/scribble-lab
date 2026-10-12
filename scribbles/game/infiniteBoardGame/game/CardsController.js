import props from '../props';
import { cardRatio, pickWeightedMoveValue } from './deckRules';

/**
 * Deck + hand (framework-agnostic).
 */
export default class CardsController {
  constructor() {
    /** @type {Array<{ id: string, value: number, type: string, ratio?: number, isRescue?: boolean }>} */
    this.deck = [];
    /** @type {Array<{ id: string, value: number, type: string, ratio?: number, isRescue?: boolean }>} */
    this.hand = [];
    this.nextCardId = 1;
  }

  reset() {
    this.deck = [];
    this.hand = [];
    this.nextCardId = 1;
  }

  /**
   * @template T
   * @param {T[]} cards
   * @returns {T[]}
   */
  shuffle(cards) {
    const next = cards.slice();
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = next[i];
      next[i] = next[j];
      next[j] = tmp;
    }
    return next;
  }

  /** Pick any configured move value (including negatives), weighted by `ratio`. */
  pickDeckMoveValue() {
    const picked = pickWeightedMoveValue({ includeNegative: true });
    return picked != null ? picked : 1 + Math.floor(Math.random() * 6);
  }

  /**
   * @param {number} [value]
   * @param {object} [extra]
   */
  makeMoveCard(value = this.pickDeckMoveValue(), extra = {}) {
    return {
      id: `c${this.nextCardId++}`,
      value,
      type: 'move',
      ...extra,
    };
  }

  buildWeightedDeck() {
    const bag = [];
    for (const card of props.deckCards) {
      if (!card) continue;
      const copies = Math.max(1, Math.round(cardRatio(card)));
      for (let i = 0; i < copies; i++) {
        bag.push({
          id: `c${this.nextCardId++}`,
          value: card.value,
          type: card.type,
          ratio: card.ratio,
        });
      }
    }
    return this.shuffle(bag);
  }

  refillDeck() {
    this.deck = this.buildWeightedDeck();
  }

  /**
   * @param {number} count
   * @returns {Array<object>}
   */
  takeDeckCards(count) {
    const taken = [];
    const n = Math.max(0, count | 0);
    for (let i = 0; i < n; i++) {
      if (!this.deck.length) this.refillDeck();
      taken.push(this.deck.length ? this.deck.shift() : this.makeMoveCard());
    }
    return taken;
  }

  /**
   * @param {object[]} cards
   */
  addToHand(cards) {
    if (!cards || !cards.length) return;
    for (let i = 0; i < cards.length; i++) {
      this.hand.push(cards[i]);
    }
  }

  /**
   * @param {object[]} cards
   */
  setHand(cards) {
    this.hand = cards ? cards.slice() : [];
  }

  /**
   * @param {string} cardId
   * @returns {object | null}
   */
  removeFromHand(cardId) {
    const idx = this.hand.findIndex((c) => c && c.id === cardId);
    if (idx < 0) return null;
    const [card] = this.hand.splice(idx, 1);
    return card;
  }

  /**
   * @param {string} cardId
   * @returns {object | null}
   */
  getHandCard(cardId) {
    return this.hand.find((c) => c && c.id === cardId) || null;
  }

  snapshot() {
    return {
      hand: this.hand.map((c) => ({ ...c })),
      deckCount: this.deck.length,
    };
  }
}
