import props from '../props';
import RunStats from '../RunStats';
import GridModel from './GridModel';
import PawnModel from './PawnModel';
import CardsController from './CardsController';
import {
  planSectionLoots,
  lootFlagsForRows,
  planSectionForbidden,
  forbiddenFlagsForRows,
} from './deckRules';
import { getNextSectionTriggerY, getSectionStride } from './section';
import { GameEvents } from './events';

/** Why the run ended. */
export const EndReason = {
  EMPTY_HAND: 'emptyHand',
  FORBIDDEN: 'forbidden',
};

/**
 * Framework-agnostic gameplay controller.
 * Commands in, typed events out. No Three / DOM / gsap.
 */
export default class GameController {
  /**
   * @param {object} [options]
   * @param {number} [options.startPawnY=3]
   */
  constructor({ startPawnY = 3 } = {}) {
    this.startPawnY = startPawnY | 0;
    this.grid = new GridModel();
    this.pawn = new PawnModel({ x: this.grid.pathX, y: this.startPawnY });
    this.cards = new CardsController();
    this.stats = new RunStats();
    /** @type {Map<number, { isRescue: boolean, rewardValue: number }>} */
    this.loots = new Map();
    /** @type {Set<number>} absolute path rows that kill on landing */
    this.forbidden = new Set();
    /** @type {'idle' | 'playing' | 'gameOver'} */
    this.phase = 'idle';
    /** @type {typeof EndReason[keyof typeof EndReason] | null} */
    this.endReason = null;
    /** @type {{ score: number, best: number, previousBest: number, isNewBest: boolean } | null} */
    this.lastBest = null;
    /** @type {Map<string, Set<Function>>} */
    this._listeners = new Map();
  }

  /**
   * @param {string} event
   * @param {(payload: object) => void} handler
   */
  on(event, handler) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }

  /**
   * @param {string} event
   * @param {(payload: object) => void} handler
   */
  off(event, handler) {
    const set = this._listeners.get(event);
    if (set) set.delete(handler);
  }

  /**
   * @param {string} event
   * @param {object} [payload]
   */
  emit(event, payload = {}) {
    const set = this._listeners.get(event);
    if (!set || !set.size) return;
    const full = { ...payload, snapshot: payload.snapshot || this.getSnapshot() };
    for (const handler of set) {
      handler(full);
    }
  }

  getSnapshot() {
    const cardsSnap = this.cards.snapshot();
    return {
      phase: this.phase,
      endReason: this.endReason,
      pawn: this.pawn.snapshot(),
      grid: this.grid.snapshot(),
      hand: cardsSnap.hand,
      deckCount: cardsSnap.deckCount,
      loots: Array.from(this.loots.entries()).map(([y, meta]) => ({
        y,
        isRescue: !!meta.isRescue,
        rewardValue: meta.rewardValue,
      })),
      forbidden: Array.from(this.forbidden).sort((a, b) => a - b),
      stats: this.stats.snapshot(),
      lastBest: this.lastBest,
    };
  }

  /**
   * Landing row for a move card preview (clamped at startY).
   * @param {{ type?: string, value?: number } | null} card
   */
  getMoveLanding(card) {
    if (!card || card.type !== 'move') return null;
    const steps = card.value | 0;
    if (steps === 0) return null;
    return {
      fromY: this.pawn.y,
      toY: Math.max(this.grid.startY, this.pawn.y + steps),
      steps,
      x: this.pawn.x,
    };
  }

  /**
   * @param {{ resumeY?: number, pathX?: number }} [opts]
   */
  startRun({ resumeY, pathX } = {}) {
    const originY = resumeY != null ? Math.max(0, resumeY | 0) : this.startPawnY;
    const px = pathX != null ? pathX | 0 : this.grid.pathX;

    this.phase = 'playing';
    this.lastBest = null;
    this.endReason = null;
    this.loots.clear();
    this.forbidden.clear();
    this.grid.reset(props.boardWidth, props.boardHeight, resumeY != null ? originY : 0);
    if (pathX != null) this.grid.pathX = px;
    this.pawn.set(this.grid.pathX, originY);
    this.cards.reset();
    this.cards.refillDeck();

    const opening = this.cards.takeDeckCards(props.startingHandSize);
    this.cards.setHand(opening);

    const lootPlan = this._planAndStoreLoots(opening, this.pawn.y);
    const forbiddenPlan = this._planAndStoreForbidden(this.pawn.y, lootPlan);
    this.stats.start(this.pawn.y);
    this.stats.markTurnReady();

    const snapshot = this.getSnapshot();
    this.emit(GameEvents.RUN_STARTED, {
      opening,
      lootPlan: this._planToObject(lootPlan),
      forbiddenPlan: Array.from(forbiddenPlan),
      snapshot,
    });
    this.emit(GameEvents.HAND_CHANGED, {
      hand: opening.slice(),
      added: opening.slice(),
      reason: 'opening',
      snapshot,
    });
    this.emit(GameEvents.TURN_READY, { snapshot });
    this.emit(GameEvents.STATS_CHANGED, { snapshot });
    return snapshot;
  }

  /**
   * @param {{ resumeY?: number, pathX?: number }} [opts]
   */
  restartRun(opts = {}) {
    return this.startRun(opts);
  }

  /**
   * Play a card (by id or card data). Resolves the turn synchronously.
   * @param {string | { id: string, type?: string, value?: number }} cardOrId
   */
  playCard(cardOrId) {
    if (this.phase !== 'playing') return null;

    const id = typeof cardOrId === 'string' ? cardOrId : cardOrId && cardOrId.id;
    let card = id != null ? this.cards.removeFromHand(id) : null;
    if (!card && cardOrId && typeof cardOrId === 'object') {
      // CardHand may have already removed it from the view hand.
      card = { ...cardOrId };
      this.cards.removeFromHand(card.id);
    }
    if (!card) return null;

    this.stats.recordCardPlayed(card);

    const steps = card.type === 'move' ? (card.value | 0) : 1;
    /** @type {object} */
    const result = {
      card,
      steps,
      move: null,
      section: null,
      loot: null,
      cardsGranted: [],
      hitForbidden: false,
      gameOver: false,
    };

    if (steps !== 0) {
      const moveResult = this._advancePawn(steps);
      result.move = moveResult.move;
      result.section = moveResult.section;
      result.loot = moveResult.loot;
      result.cardsGranted = moveResult.cardsGranted;
      result.hitForbidden = !!moveResult.hitForbidden;
    }

    const snapshot = this.getSnapshot();
    this.emit(GameEvents.CARD_PLAYED, { ...result, snapshot });
    this.emit(GameEvents.STATS_CHANGED, { snapshot });

    if (result.hitForbidden) {
      this._triggerGameOver(EndReason.FORBIDDEN);
      result.gameOver = true;
    } else if (this.cards.hand.length === 0) {
      this._triggerGameOver(EndReason.EMPTY_HAND);
      result.gameOver = true;
    } else {
      this.stats.markTurnReady();
      this.emit(GameEvents.TURN_READY, { snapshot: this.getSnapshot() });
    }

    return result;
  }

  /**
   * @param {number} steps
   */
  _advancePawn(steps) {
    const move = this.pawn.advance(steps, this.grid.startY);
    this.stats.updatePosition(this.pawn.y);

    let section = null;
    /** @type {object[]} */
    let cardsGranted = [];
    let loot = null;
    const hitForbidden = this.forbidden.has(this.pawn.y);

    if (!hitForbidden) {
      if (move.direction > 0 && this.grid.shouldAdvanceSection(this.pawn.y, 0)) {
        section = this._advanceSection();
        if (section && section.sectionCards) {
          cardsGranted = cardsGranted.concat(section.sectionCards);
        }
      }

      loot = this._collectLootAt(this.pawn.x, this.pawn.y);
      if (loot) {
        const lootCards = this._grantLootCards(loot);
        cardsGranted = cardsGranted.concat(lootCards);
      }
    }

    const snapshot = this.getSnapshot();
    this.emit(GameEvents.PAWN_MOVED, {
      move,
      section,
      loot,
      cardsGranted,
      hitForbidden,
      snapshot,
    });

    return { move, section, loot, cardsGranted, hitForbidden };
  }

  _advanceSection() {
    const steps = getSectionStride();
    this.stats.recordSection();

    const sectionCards = this.cards.takeDeckCards(props.cardDrawnPerSection);
    this.cards.addToHand(sectionCards);

    const advance = this.grid.applySectionAdvance(steps, this.pawn.y);
    const handForLoot = this.cards.hand.slice();
    const lootPlan = this._planAndStoreLoots(handForLoot, this.pawn.y);
    const forbiddenPlan = this._planAndStoreForbidden(this.pawn.y, lootPlan);
    const lootPlanFlags = lootFlagsForRows(
      advance.fromColumn,
      advance.rowsToAdd,
      lootPlan,
    );
    const forbiddenPlanFlags = forbiddenFlagsForRows(
      advance.fromColumn,
      advance.rowsToAdd,
      forbiddenPlan,
    );

    const section = {
      ...advance,
      sectionCards,
      lootPlan: this._planToObject(lootPlan),
      lootPlanFlags,
      forbiddenPlan: Array.from(forbiddenPlan),
      forbiddenPlanFlags,
    };

    const snapshot = this.getSnapshot();
    this.emit(GameEvents.SECTION_ADVANCED, { ...section, snapshot });
    if (sectionCards.length) {
      this.emit(GameEvents.HAND_CHANGED, {
        hand: this.cards.hand.slice(),
        added: sectionCards.slice(),
        reason: 'section',
        snapshot,
      });
    }
    this.emit(GameEvents.STATS_CHANGED, { snapshot });
    return section;
  }

  /**
   * @param {Array<object>|number} hand
   * @param {number} pawnY
   */
  _planAndStoreLoots(hand, pawnY) {
    const endY = getNextSectionTriggerY(pawnY);
    const plan = planSectionLoots(pawnY, endY, hand);
    for (const [y, meta] of plan) {
      this.loots.set(y, { ...meta });
    }
    return plan;
  }

  /**
   * @param {number} pawnY
   * @param {Map<number, unknown>|Set<number>} [excludeYs]
   */
  _planAndStoreForbidden(pawnY, excludeYs) {
    const endY = getNextSectionTriggerY(pawnY);
    const plan = planSectionForbidden(pawnY, endY, excludeYs);
    for (const y of plan) {
      this.forbidden.add(y);
    }
    return plan;
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  _collectLootAt(x, y) {
    if (x !== this.grid.pathX) return null;
    const meta = this.loots.get(y);
    if (!meta) return null;
    this.loots.delete(y);
    const loot = {
      x,
      y,
      isRescue: !!meta.isRescue,
      rewardValue: meta.rewardValue,
    };
    this.stats.recordLoot();
    this.emit(GameEvents.LOOT_COLLECTED, {
      loot,
      snapshot: this.getSnapshot(),
    });
    return loot;
  }

  /**
   * @param {{ rewardValue?: number|null, isRescue?: boolean }} loot
   */
  _grantLootCards(loot) {
    const drawCount = Math.max(1, props.cardDrawnPerLoot | 0);
    /** @type {object[]} */
    const cards = [];

    if (loot.rewardValue != null) {
      cards.push(this.cards.makeMoveCard(loot.rewardValue, {
        isRescue: !!loot.isRescue && props.debugLoot,
      }));
      const extras = drawCount - 1;
      if (extras > 0) cards.push(...this.cards.takeDeckCards(extras));
      if (props.debugLoot) {
        console.log(
          '[loot collect]',
          loot.isRescue ? 'RESCUE' : 'extra',
          `y=${loot.y}`,
          `→ ${cards.length} card(s)`,
          cards.map((c) => (c.value > 0 ? `+${c.value}` : String(c.value))).join(', '),
        );
      }
    } else {
      if (props.debugLoot) {
        console.log('[loot collect] no rewardValue — drawing from deck', drawCount);
      }
      cards.push(...this.cards.takeDeckCards(drawCount));
    }

    this.cards.addToHand(cards);
    if (cards.length) {
      this.emit(GameEvents.HAND_CHANGED, {
        hand: this.cards.hand.slice(),
        added: cards.slice(),
        reason: 'loot',
        snapshot: this.getSnapshot(),
      });
    }
    return cards;
  }

  /**
   * @param {typeof EndReason[keyof typeof EndReason]} [reason=EndReason.EMPTY_HAND]
   */
  _triggerGameOver(reason = EndReason.EMPTY_HAND) {
    if (this.phase === 'gameOver') return;
    this.phase = 'gameOver';
    this.endReason = reason;
    this.stats.updatePosition(this.pawn.y);
    this.stats.stop();
    this.lastBest = this.stats.commitBestScore();
    const snapshot = this.getSnapshot();
    this.emit(GameEvents.GAME_OVER, {
      lastBest: this.lastBest,
      endReason: this.endReason,
      snapshot,
    });
    this.emit(GameEvents.STATS_CHANGED, { snapshot });
  }

  /**
   * @param {Map<number, object>} plan
   */
  _planToObject(plan) {
    /** @type {Record<string, object>} */
    const out = {};
    if (!plan) return out;
    plan.forEach((meta, y) => {
      out[String(y)] = { ...meta };
    });
    return out;
  }

  /**
   * @param {Record<string, object>|Map<number, object>} plan
   * @returns {Map<number, object>}
   */
  static planFromObject(plan) {
    const map = new Map();
    if (!plan) return map;
    if (plan instanceof Map) return plan;
    for (const key of Object.keys(plan)) {
      map.set(Number(key), plan[key]);
    }
    return map;
  }
}
