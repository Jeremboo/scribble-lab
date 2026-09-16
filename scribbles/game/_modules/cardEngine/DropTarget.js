/**
 * Drop target contract (duck-typed). Implement these methods on any object:
 *
 * containsPoint(point: { x: number, y: number }): boolean
 * canAccept(card: Card): boolean
 * getLabel?(card: Card | null): string
 * onEnter?(card: Card): void
 * onLeave?(card: Card): void
 * onDrop?(card: Card): void
 * getBounds?(): { handSize: number, debug?: boolean }
 *
 * Coordinates are always in CardHand logical space
 * (origin at viewport center, +y up, height === 1).
 */

/**
 * Full-viewport play zone minus the hand strip at the bottom.
 *
 * CSS layout equivalent:
 *   top: 0; left: 0; bottom: handSize; width: 100%; height: calc(100% - handSize)
 *
 * Invisible in gameplay; optional red border when `debug` is true.
 * Gameplay rules stay outside via canAccept / onDrop callbacks.
 */
export class DropTarget {
  /**
   * @param {object} options
   * @param {string} [options.id]
   * @param {number} [options.handSize] Fraction of viewport height reserved for the hand (bottom inset)
   * @param {boolean} [options.debug] Show a red outline for layout debugging
   * @param {string | ((card: import('./Card').default) => string)} [options.label]
   * @param {(card: import('./Card').default) => boolean} [options.canAccept]
   * @param {(card: import('./Card').default) => void} [options.onEnter]
   * @param {(card: import('./Card').default) => void} [options.onLeave]
   * @param {(card: import('./Card').default) => void} [options.onDrop]
   */
  constructor({
    id = 'drop-target',
    handSize = 0.28,
    debug = false,
    label = 'Play',
    canAccept = () => true,
    onEnter,
    onLeave,
    onDrop,
  }) {
    this.id = id;
    this.handSize = handSize;
    this.debug = debug;
    this._label = label;
    this._canAccept = canAccept;
    this.onEnter = onEnter;
    this.onLeave = onLeave;
    this.onDrop = onDrop;
  }

  /**
   * @param {{ x: number, y: number }} point
   */
  containsPoint(point) {
    const minY = -0.5 + this.handSize;
    return point.y >= minY && point.y <= 0.5;
  }

  /**
   * @param {import('./Card').default} card
   */
  canAccept(card) {
    return this._canAccept(card);
  }

  /**
   * Resolve the visible label for the current drag (or idle fallback).
   * @param {import('./Card').default | null} [card]
   */
  getLabel(card = null) {
    if (typeof this._label === 'function') {
      return card ? this._label(card) : '';
    }
    return this._label;
  }

  /**
   * Layout hint for renderers (CSS inset above the hand).
   */
  getBounds() {
    return {
      handSize: this.handSize,
      debug: this.debug,
    };
  }
}

/** @deprecated Use DropTarget */
export const RectDropTarget = DropTarget;
