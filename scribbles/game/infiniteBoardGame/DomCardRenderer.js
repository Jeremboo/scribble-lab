/**
 * DOM implementation of the CardRenderer contract.
 * Converts CardHand logical space → CSS pixels and owns pointer → engine bridging.
 *
 * Logical space: origin at viewport center, +y up, units = viewport height.
 */

export default class DomCardRenderer {
  /**
   * @param {object} options
   * @param {HTMLElement} options.root
   * @param {import('../../_modules/cardEngine/CardHand').default} options.hand
   * @param {(card: import('../../_modules/cardEngine/Card').CardData) => string} [options.renderLabel]
   */
  constructor({ root, hand, renderLabel }) {
    this.root = root;
    this.hand = hand;
    this.renderLabel = renderLabel || ((card) => String(card.value));

    /** @type {Map<string, HTMLElement>} */
    this.elements = new Map();
    /** @type {Map<string, HTMLElement>} */
    this.targetElements = new Map();

    this.viewportWidth = window.innerWidth;
    this.viewportHeight = window.innerHeight;
    /** @type {Element | null} */
    this._captureEl = null;

    /**
     * Velocity-based 3D tilt while dragging (Hearthstone / jackrugile CodePen style).
     * @type {{ cardId: string | null, prevX: number, prevY: number, rx: number, ry: number }}
     */
    this._dragTilt = {
      cardId: null,
      prevX: 0,
      prevY: 0,
      rx: 0,
      ry: 0,
    };

    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
    this._onPointerCancel = this._onPointerCancel.bind(this);
    this._onResize = this._onResize.bind(this);

    this.root.classList.add('card-hand-root');
    this.cardsLayer = document.createElement('div');
    this.cardsLayer.className = 'card-hand-cards';
    this.targetsLayer = document.createElement('div');
    this.targetsLayer.className = 'card-hand-targets';
    this.root.appendChild(this.targetsLayer);
    this.root.appendChild(this.cardsLayer);

    this.root.addEventListener('pointerdown', this._onPointerDown);
    window.addEventListener('pointermove', this._onPointerMove);
    window.addEventListener('pointerup', this._onPointerUp);
    window.addEventListener('pointercancel', this._onPointerCancel);
    window.addEventListener('resize', this._onResize);

    this._onResize();
    this.hand.setRenderer(this);
  }

  dispose() {
    this.root.removeEventListener('pointerdown', this._onPointerDown);
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
    window.removeEventListener('pointercancel', this._onPointerCancel);
    window.removeEventListener('resize', this._onResize);
    this.elements.clear();
    this.targetElements.clear();
    this.root.innerHTML = '';
    this.hand.setRenderer(null);
  }

  // ── CardRenderer interface ─────────────────────────────

  /**
   * @param {import('../../_modules/cardEngine/Card').CardData} card
   */
  createCard(card) {
    if (this.elements.has(card.id)) return;

    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'game-card';
    el.dataset.cardId = card.id;
    el.setAttribute('aria-label', `Card ${card.type} ${card.value}`);

    const value = document.createElement('span');
    value.className = 'game-card__value';
    value.textContent = this.renderLabel(card);

    const type = document.createElement('span');
    type.className = 'game-card__type';
    type.textContent = card.type;

    el.appendChild(value);
    el.appendChild(type);
    el.addEventListener('click', (e) => e.stopPropagation());
    this._applyCardSize(el);
    this.cardsLayer.appendChild(el);
    this.elements.set(card.id, el);
  }

  /**
   * @param {string} cardId
   */
  removeCard(cardId) {
    const el = this.elements.get(cardId);
    if (!el) return;
    el.remove();
    this.elements.delete(cardId);
    if (this._dragTilt.cardId === cardId) {
      this._dragTilt.cardId = null;
      this._dragTilt.rx = 0;
      this._dragTilt.ry = 0;
    }
  }

  /**
   * @param {string} cardId
   * @param {import('../../_modules/cardEngine/CardHand').CardVisualState} state
   */
  updateCard(cardId, state) {
    const el = this.elements.get(cardId);
    if (!el) return;

    const { x, y } = this.logicalToCss(state.position.x, state.position.y);
    const deg = (state.rotation * 180) / Math.PI;
    const { rx, ry } = this._updateDragTilt(cardId, state.state, x, y);

    const tilt =
      Math.abs(rx) > 0.01 || Math.abs(ry) > 0.01
        ? ` perspective(400px) rotateY(${ry.toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg)`
        : '';

    el.style.transform =
      `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${deg}deg) scale(${state.scale})${tilt}`;
    el.style.zIndex = String(Math.round(state.zIndex));
    el.style.opacity = String(state.opacity);
    el.dataset.state = state.state;
    el.classList.toggle('is-hover', state.state === 'hover');
    el.classList.toggle('is-dragging', state.state === 'dragging');
  }

  /**
   * Derive rotateX/rotateY from card travel between frames, then ease toward that target.
   * Same approach as https://codepen.io/jackrugile/pen/zqJdXM
   * @param {string} cardId
   * @param {string} interaction
   * @param {number} x css px
   * @param {number} y css px
   */
  _updateDragTilt(cardId, interaction, x, y) {
    const tilt = this._dragTilt;

    if (interaction === 'dragging') {
      if (tilt.cardId !== cardId) {
        tilt.cardId = cardId;
        tilt.prevX = x;
        tilt.prevY = y;
        tilt.rx = 0;
        tilt.ry = 0;
        return { rx: 0, ry: 0 };
      }

      let targetRx = (tilt.prevY - y - tilt.rx) * 1.5;
      let targetRy = (x - tilt.prevX - tilt.ry) * 1.5;
      targetRx = Math.max(-45, Math.min(45, targetRx));
      targetRy = Math.max(-45, Math.min(45, targetRy));

      tilt.rx += targetRx * 0.1;
      tilt.ry += targetRy * 0.1;
      tilt.prevX = x;
      tilt.prevY = y;
      return { rx: tilt.rx, ry: tilt.ry };
    }

    // Decay residual tilt after release (same formula with zero travel).
    if (tilt.cardId !== cardId) {
      return { rx: 0, ry: 0 };
    }

    tilt.rx += (-tilt.rx) * 0.3;
    tilt.ry += (-tilt.ry) * 0.3;
    tilt.prevX = x;
    tilt.prevY = y;

    if (Math.abs(tilt.rx) < 0.05 && Math.abs(tilt.ry) < 0.05) {
      tilt.cardId = null;
      tilt.rx = 0;
      tilt.ry = 0;
    }

    return { rx: tilt.rx, ry: tilt.ry };
  }

  /**
   * @param {Array<{ id: string, bounds: { handSize: number, debug?: boolean } | null }>} targets
   */
  updateDropTargets(targets) {
    const seen = new Set();

    for (const target of targets) {
      if (!target.bounds) continue;
      seen.add(target.id);

      let el = this.targetElements.get(target.id);
      if (!el) {
        el = document.createElement('div');
        el.className = 'card-drop-target';
        el.dataset.targetId = target.id;
        this.targetsLayer.appendChild(el);
        this.targetElements.set(target.id, el);
      }

      const handSize = Math.max(0, Math.min(1, target.bounds.handSize ?? 0));
      const handSizePct = `${handSize * 100}%`;
      el.style.top = '0';
      el.style.left = '0';
      el.style.right = '0';
      el.style.bottom = handSizePct;
      el.style.width = '100%';
      el.style.height = `calc(100% - ${handSizePct})`;
      el.classList.toggle('is-debug', !!target.bounds.debug);
    }

    for (const [id, el] of this.targetElements) {
      if (!seen.has(id)) {
        el.remove();
        this.targetElements.delete(id);
      }
    }
  }

  /**
   * Drop targets stay invisible; highlight state is engine-only.
   * @param {{ activeTargetId: string | null, canDrop: boolean }} _info
   */
  updateDropHighlight(_info) {
    // Intentionally no visual feedback — zone is invisible except in debug mode.
  }

  // ── Coordinate conversion ──────────────────────────────

  /**
   * @param {number} lx
   * @param {number} ly
   */
  logicalToCss(lx, ly) {
    const h = this.viewportHeight;
    const w = this.viewportWidth;
    const aspect = h > 0 ? w / h : 1;
    return {
      x: (lx / aspect + 0.5) * w,
      y: (-ly + 0.5) * h,
    };
  }

  /**
   * @param {PointerEvent} event
   */
  _eventToLogical(event) {
    return this.hand.clientToLogical(
      event.clientX,
      event.clientY,
      this.viewportWidth,
      this.viewportHeight,
    );
  }

  // ── Pointer bridge ─────────────────────────────────────

  /** @param {PointerEvent} event */
  _onPointerDown(event) {
    if (event.button !== undefined && event.button !== 0) return;
    const cardEl = event.target instanceof Element
      ? event.target.closest('.game-card')
      : null;
    const preferredCardId = cardEl ? cardEl.dataset.cardId : null;
    const { x, y } = this._eventToLogical(event);
    const handled = this.hand.pointerDown(x, y, { preferredCardId });
    if (handled) {
      event.preventDefault();
      event.stopPropagation();
      const captureEl = cardEl || (event.target instanceof Element ? event.target : this.root);
      try {
        captureEl.setPointerCapture(event.pointerId);
        this._captureEl = captureEl;
      } catch (_) {
        this._captureEl = null;
      }
    }
  }

  /** @param {PointerEvent} event */
  _onPointerMove(event) {
    const { x, y } = this._eventToLogical(event);
    this.hand.pointerMove(x, y);
  }

  /** @param {PointerEvent} event */
  _onPointerUp(event) {
    const { x, y } = this._eventToLogical(event);
    this.hand.pointerUp(x, y);
    this._releaseCapture(event.pointerId);
  }

  /** @param {PointerEvent} event */
  _onPointerCancel(event) {
    this.hand.pointerCancel();
    this._releaseCapture(event.pointerId);
  }

  /** @param {number} pointerId */
  _releaseCapture(pointerId) {
    if (!this._captureEl) return;
    try {
      this._captureEl.releasePointerCapture(pointerId);
    } catch (_) {
      /* already released */
    }
    this._captureEl = null;
  }

  _onResize() {
    this.viewportWidth = window.innerWidth;
    this.viewportHeight = window.innerHeight;
    this.hand.setViewport(this.viewportWidth, this.viewportHeight);
    this.refreshCardSizes();
    this.hand.syncRenderer();
  }

  refreshCardSizes() {
    for (const el of this.elements.values()) {
      this._applyCardSize(el);
    }
  }

  /** @param {HTMLElement} el */
  _applyCardSize(el) {
    const { cardWidth, cardHeight } = this.hand.layoutConfig;
    el.style.width = `${cardWidth * this.viewportHeight}px`;
    el.style.height = `${cardHeight * this.viewportHeight}px`;
  }
}
