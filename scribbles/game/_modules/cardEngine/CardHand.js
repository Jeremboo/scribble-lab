import Card from './Card';
import {
  computeHandLayout,
  getDefaultLayoutConfig,
  hitTestCard,
} from './HandLayout';

/**
 * @typedef {import('./Card').CardData} CardData
 *
 * @typedef {object} CardVisualState
 * @property {{ x: number, y: number }} position
 * @property {number} rotation
 * @property {number} scale
 * @property {number} zIndex
 * @property {number} opacity
 * @property {'idle' | 'hover' | 'dragging' | 'returning'} state
 * @property {string} id
 * @property {CardData} data
 *
 * @typedef {object} CardRenderer
 * @property {(card: CardData) => void} createCard
 * @property {(cardId: string) => void} removeCard
 * @property {(cardId: string, state: CardVisualState) => void} updateCard
 * @property {(targets: object[]) => void} [updateDropTargets]
 * @property {(info: { activeTargetId: string | null, canDrop: boolean }) => void} [updateDropHighlight]
 *
 * @typedef {object} DropTargetLike
 * @property {(point: { x: number, y: number }) => boolean} containsPoint
 * @property {(card: Card) => boolean} canAccept
 * @property {(card: Card) => void} [onEnter]
 * @property {(card: Card) => void} [onLeave]
 * @property {(card: Card) => void} [onDrop]
 * @property {string} [id]
 */

/**
 * Renderer-agnostic card hand engine.
 *
 * Logical coordinates: origin at viewport center, +y up, units = viewport height.
 * Feed pointer positions already converted into this space.
 */
export default class CardHand {
  /**
   * @param {object} [options]
   * @param {CardRenderer | null} [options.renderer]
   * @param {Partial<import('./HandLayout').HandLayoutConfig>} [options.layout]
   * @param {number} [options.lerpSpeed] visual follow speed (higher = snappier)
   * @param {(card: Card, target: DropTargetLike) => void} [options.onCardPlayed]
   * @param {(card: Card) => void} [options.onCardReturned]
   */
  constructor({
    renderer = null,
    layout = {},
    lerpSpeed = 18,
    onCardPlayed,
    onCardReturned,
  } = {}) {
    /** @type {Card[]} */
    this.cards = [];
    /** @type {DropTargetLike[]} */
    this.dropTargets = [];
    /** @type {CardRenderer | null} */
    this.renderer = renderer;

    this.layoutConfig = { ...getDefaultLayoutConfig(), ...layout };
    this.lerpSpeed = lerpSpeed;

    this.pointer = { x: 0, y: 0, down: false };
    this.hoverCardId = null;
    this.draggingCardId = null;
    this.activeDropTarget = null;
    this.canDropOnActive = false;

    this.onCardPlayed = onCardPlayed || null;
    this.onCardReturned = onCardReturned || null;

    // Viewport aspect (width / height) in logical units where height === 1
    this.aspect = 1;
  }

  /**
   * @param {CardRenderer | null} renderer
   */
  setRenderer(renderer) {
    this.renderer = renderer;
    if (!renderer) return;
    for (const card of this.cards) {
      renderer.createCard(card.data);
      renderer.updateCard(card.id, card.getCardState());
    }
    this._syncDropTargetsToRenderer();
  }

  /**
   * @param {number} widthPx
   * @param {number} heightPx
   */
  setViewport(widthPx, heightPx) {
    this.aspect = heightPx > 0 ? widthPx / heightPx : 1;
    this._syncDropTargetsToRenderer();
  }

  /**
   * Merge layout overrides and recompute idle/hover targets.
   * @param {Partial<import('./HandLayout').HandLayoutConfig>} [layout]
   */
  setLayout(layout = {}) {
    Object.assign(this.layoutConfig, layout);
    this._relayout();
  }

  /** Push current card + drop-target state to the renderer. */
  syncRenderer() {
    if (!this.renderer) return;
    for (const card of this.cards) {
      this.renderer.updateCard(card.id, card.getCardState());
    }
    this._syncDropTargetsToRenderer();
    this._syncDropHighlight();
  }

  /**
   * Convert CSS client coords → logical hand space.
   * Provided as a helper for input adapters; engine itself never reads the DOM.
   * @param {number} clientX
   * @param {number} clientY
   * @param {number} viewportWidth
   * @param {number} viewportHeight
   */
  clientToLogical(clientX, clientY, viewportWidth, viewportHeight) {
    const x = ((clientX / viewportWidth) - 0.5) * this.aspect;
    const y = -((clientY / viewportHeight) - 0.5);
    return { x, y };
  }

  // ── Cards ──────────────────────────────────────────────

  /**
   * @param {CardData} data
   * @param {{ animate?: boolean }} [opts]
   */
  addCard(data, { animate = true } = {}) {
    if (this.cards.some((c) => c.id === data.id)) {
      console.warn(`[CardHand] card already exists: ${data.id}`);
      return null;
    }
    const card = new Card(data);
    this.cards.push(card);
    this._relayout();
    if (!animate) card.snapVisualToTarget();

    if (this.renderer) {
      this.renderer.createCard(data);
      this.renderer.updateCard(card.id, card.getCardState());
    }
    return card;
  }

  /**
   * @param {string} cardId
   */
  removeCard(cardId) {
    const index = this.cards.findIndex((c) => c.id === cardId);
    if (index < 0) return null;

    const [card] = this.cards.splice(index, 1);
    if (this.hoverCardId === cardId) this.hoverCardId = null;
    if (this.draggingCardId === cardId) this.draggingCardId = null;

    if (this.renderer) this.renderer.removeCard(cardId);
    this._relayout();
    return card;
  }

  /**
   * @param {CardData[]} dataList
   */
  setCards(dataList) {
    while (this.cards.length) {
      const id = this.cards[0].id;
      this.removeCard(id);
    }
    for (const data of dataList) {
      this.addCard(data, { animate: false });
    }
  }

  /**
   * @param {string} cardId
   */
  getCard(cardId) {
    return this.cards.find((c) => c.id === cardId) || null;
  }

  /**
   * @param {string} cardId
   * @returns {CardVisualState | null}
   */
  getCardState(cardId) {
    const card = this.getCard(cardId);
    return card ? card.getCardState() : null;
  }

  getAllCardStates() {
    return this.cards.map((c) => c.getCardState());
  }

  // ── Drop targets ───────────────────────────────────────

  /**
   * @param {DropTargetLike} target
   */
  addDropTarget(target) {
    this.dropTargets.push(target);
    this._syncDropTargetsToRenderer();
  }

  /**
   * @param {DropTargetLike | string} targetOrId
   */
  removeDropTarget(targetOrId) {
    const id = typeof targetOrId === 'string' ? targetOrId : targetOrId.id;
    this.dropTargets = this.dropTargets.filter((t) => t !== targetOrId && t.id !== id);
    if (this.activeDropTarget && (this.activeDropTarget === targetOrId || this.activeDropTarget.id === id)) {
      this.activeDropTarget = null;
      this.canDropOnActive = false;
    }
    this._syncDropTargetsToRenderer();
  }

  // ── Pointer API (logical coordinates) ──────────────────

  /**
   * @param {number} x
   * @param {number} y
   * @param {{ preferredCardId?: string | null }} [opts]
   */
  pointerDown(x, y, { preferredCardId = null } = {}) {
    this.pointer.x = x;
    this.pointer.y = y;

    // Prefer the card the renderer hit (e.g. DOM element under the pointer),
    // then fall back to spatial pick against visual + idle poses.
    let card = preferredCardId ? this.getCard(preferredCardId) : null;
    if (!card) card = this._pickTopCardAt(x, y, { forPress: true });

    if (!card) {
      this.pointer.down = false;
      return false;
    }

    this.pointer.down = true;
    this.hoverCardId = null;
    this.draggingCardId = card.id;
    card.interaction = 'dragging';
    card.dragOffsetX = card.visual.x - x;
    card.dragOffsetY = card.visual.y - y;
    card.target.zIndex = 1000;
    card.visual.zIndex = 1000;
    this._relayout();
    this._syncDropTargetsToRenderer();
    return true;
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  pointerMove(x, y) {
    this.pointer.x = x;
    this.pointer.y = y;

    if (this.draggingCardId) {
      const card = this.getCard(this.draggingCardId);
      if (!card) return;

      card.target.x = x + card.dragOffsetX;
      card.target.y = y + card.dragOffsetY;
      card.target.rotation = 0;
      card.target.scale = this.layoutConfig.hoverScale;
      card.target.opacity = 1;
      // Snap drag visually for responsiveness
      card.visual.x = card.target.x;
      card.visual.y = card.target.y;
      card.visual.rotation = 0;
      card.visual.scale = card.target.scale;

      this._updateActiveDropTarget(card);
      return;
    }

    if (this.pointer.down) return;

    const card = this._pickTopCardAt(x, y);
    const nextHover = card ? card.id : null;
    if (nextHover !== this.hoverCardId) {
      if (this.hoverCardId) {
        const prev = this.getCard(this.hoverCardId);
        if (prev && prev.interaction === 'hover') prev.interaction = 'idle';
      }
      this.hoverCardId = nextHover;
      if (card) card.interaction = 'hover';
      this._relayout();
    }
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  pointerUp(x, y) {
    this.pointer.x = x;
    this.pointer.y = y;
    this.pointer.down = false;

    if (!this.draggingCardId) return;

    const card = this.getCard(this.draggingCardId);
    const target = this.activeDropTarget;
    const canDrop = this.canDropOnActive;

    this.draggingCardId = null;

    if (card && target && canDrop) {
      this._clearActiveDropTarget(card);
      if (typeof target.onDrop === 'function') target.onDrop(card);
      if (this.onCardPlayed) this.onCardPlayed(card, target);
      this.removeCard(card.id);
      return;
    }

    if (card) {
      this._clearActiveDropTarget(card);
      card.interaction = 'returning';
      if (this.onCardReturned) this.onCardReturned(card);
    }

    this._relayout();
  }

  pointerCancel() {
    this.pointer.down = false;
    if (!this.draggingCardId) return;

    const card = this.getCard(this.draggingCardId);
    this.draggingCardId = null;
    if (card) {
      this._clearActiveDropTarget(card);
      card.interaction = 'returning';
      if (this.onCardReturned) this.onCardReturned(card);
    }
    this._relayout();
  }

  // ── Frame update ───────────────────────────────────────

  /**
   * @param {number} dt seconds
   */
  update(dt) {
    const t = 1 - Math.exp(-this.lerpSpeed * Math.max(0, dt));

    for (const card of this.cards) {
      if (card.interaction === 'dragging') {
        // Position already snapped in pointerMove; keep z/opacity in sync
        card.visual.zIndex = card.target.zIndex;
        card.visual.opacity = card.target.opacity;
      } else {
        card.visual.x = lerp(card.visual.x, card.target.x, t);
        card.visual.y = lerp(card.visual.y, card.target.y, t);
        card.visual.rotation = lerp(card.visual.rotation, card.target.rotation, t);
        card.visual.scale = lerp(card.visual.scale, card.target.scale, t);
        card.visual.opacity = lerp(card.visual.opacity, card.target.opacity, t);
        card.visual.zIndex = card.target.zIndex;

        if (card.interaction === 'returning') {
          const settled =
            Math.abs(card.visual.x - card.target.x) < 0.001 &&
            Math.abs(card.visual.y - card.target.y) < 0.001;
          if (settled) {
            card.interaction = this.hoverCardId === card.id ? 'hover' : 'idle';
          }
        }
      }

      if (this.renderer) {
        this.renderer.updateCard(card.id, card.getCardState());
      }
    }
  }

  // ── Internals ──────────────────────────────────────────

  _relayout() {
    const hoverIndex = this.draggingCardId
      ? -1
      : this.cards.findIndex((c) => c.id === this.hoverCardId);

    const poses = computeHandLayout(this.cards.length, hoverIndex, this.layoutConfig);

    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i];
      if (card.interaction === 'dragging') continue;

      const pose = poses[i];
      card.target.x = pose.x;
      card.target.y = pose.y;
      card.target.rotation = pose.rotation;
      card.target.scale = pose.scale;
      card.target.zIndex = pose.zIndex;
      card.target.opacity = 1;

      if (card.interaction !== 'hover' && card.interaction !== 'returning') {
        card.interaction = 'idle';
      }
    }
  }

  /**
   * Hover: resting slots (+ hysteresis) so raise doesn't flicker.
   * Press: prefer visual poses so a raised card stays grabbable.
   * @param {number} x
   * @param {number} y
   * @param {{ forPress?: boolean }} [opts]
   */
  _pickTopCardAt(x, y, { forPress = false } = {}) {
    const { cardWidth, cardHeight } = this.layoutConfig;
    const idlePoses = computeHandLayout(this.cards.length, -1, this.layoutConfig);

    if (!forPress && this.hoverCardId) {
      const hoverIndex = this.cards.findIndex((c) => c.id === this.hoverCardId);
      if (hoverIndex >= 0) {
        const hovered = this.cards[hoverIndex];
        const idle = idlePoses[hoverIndex];
        const visual = {
          x: hovered.visual.x,
          y: hovered.visual.y,
          rotation: hovered.visual.rotation,
          scale: hovered.visual.scale,
        };
        if (
          hitTestCard(x, y, idle, cardWidth, cardHeight) ||
          hitTestCard(x, y, visual, cardWidth, cardHeight)
        ) {
          return hovered;
        }
      }
    }

    let best = null;
    let bestZ = -Infinity;

    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i];
      if (card.interaction === 'dragging') continue;

      const idle = idlePoses[i];
      const visual = {
        x: card.visual.x,
        y: card.visual.y,
        rotation: card.visual.rotation,
        scale: card.visual.scale,
      };

      const hitIdle = hitTestCard(x, y, idle, cardWidth, cardHeight);
      const hitVisual = forPress && hitTestCard(x, y, visual, cardWidth, cardHeight);
      if (!hitIdle && !hitVisual) continue;

      const z = forPress ? Math.max(idle.zIndex, card.visual.zIndex) : idle.zIndex;
      if (z >= bestZ) {
        bestZ = z;
        best = card;
      }
    }
    return best;
  }

  /**
   * @param {Card} card
   */
  _updateActiveDropTarget(card) {
    const point = { x: this.pointer.x, y: this.pointer.y };
    let next = null;
    for (let i = this.dropTargets.length - 1; i >= 0; i--) {
      const target = this.dropTargets[i];
      if (target.containsPoint(point)) {
        next = target;
        break;
      }
    }

    if (next !== this.activeDropTarget) {
      if (this.activeDropTarget && typeof this.activeDropTarget.onLeave === 'function') {
        this.activeDropTarget.onLeave(card);
      }
      this.activeDropTarget = next;
      if (next && typeof next.onEnter === 'function') {
        next.onEnter(card);
      }
    }

    this.canDropOnActive = !!(next && next.canAccept(card));
    this._syncDropHighlight();
  }

  /**
   * @param {Card} card
   */
  _clearActiveDropTarget(card) {
    if (this.activeDropTarget && typeof this.activeDropTarget.onLeave === 'function') {
      this.activeDropTarget.onLeave(card);
    }
    this.activeDropTarget = null;
    this.canDropOnActive = false;
    this._syncDropTargetsToRenderer();
    this._syncDropHighlight();
  }

  _syncDropTargetsToRenderer() {
    if (!this.renderer || typeof this.renderer.updateDropTargets !== 'function') return;
    const dragging = this.draggingCardId ? this.getCard(this.draggingCardId) : null;
    this.renderer.updateDropTargets(
      this.dropTargets.map((t) => ({
        id: t.id || 'target',
        label: typeof t.getLabel === 'function'
          ? t.getLabel(dragging)
          : (t.label || 'Play'),
        armed: !!dragging,
        bounds: typeof t.getBounds === 'function' ? t.getBounds() : null,
      })),
    );
  }

  _syncDropHighlight() {
    if (!this.renderer || typeof this.renderer.updateDropHighlight !== 'function') return;
    this.renderer.updateDropHighlight({
      activeTargetId: this.activeDropTarget ? (this.activeDropTarget.id || null) : null,
      canDrop: this.canDropOnActive,
    });
  }
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}
