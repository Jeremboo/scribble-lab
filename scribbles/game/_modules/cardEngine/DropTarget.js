/**
 * Drop target contract (duck-typed). Implement these methods on any object:
 *
 * containsPoint(point: { x: number, y: number }): boolean
 * canAccept(card: Card): boolean
 * getLabel?(card: Card | null): string
 * onEnter?(card: Card): void
 * onLeave?(card: Card): void
 * onDrop?(card: Card): void
 *
 * Coordinates are always in CardHand logical space.
 */

/**
 * Simple axis-aligned rectangular drop zone in logical space.
 * Gameplay rules stay outside via canAccept / onDrop callbacks.
 */
export class RectDropTarget {
  /**
   * @param {object} options
   * @param {string} [options.id]
   * @param {number} options.x center x
   * @param {number} options.y center y
   * @param {number} options.width
   * @param {number} options.height
   * @param {string | ((card: import('./Card').default) => string)} [options.label]
   * @param {(card: import('./Card').default) => boolean} [options.canAccept]
   * @param {(card: import('./Card').default) => void} [options.onEnter]
   * @param {(card: import('./Card').default) => void} [options.onLeave]
   * @param {(card: import('./Card').default) => void} [options.onDrop]
   */
  constructor({
    id = 'drop-target',
    x,
    y,
    width,
    height,
    label = 'Play',
    canAccept = () => true,
    onEnter,
    onLeave,
    onDrop,
  }) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
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
    return (
      Math.abs(point.x - this.x) <= this.width * 0.5 &&
      Math.abs(point.y - this.y) <= this.height * 0.5
    );
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

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }
}
