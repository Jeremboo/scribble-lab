/**
 * Logical pawn on the path grid (no mesh).
 */
export default class PawnModel {
  /**
   * @param {{ x?: number, y?: number }} [opts]
   */
  constructor({ x = 0, y = 0 } = {}) {
    this.x = x | 0;
    this.y = y | 0;
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  set(x, y) {
    this.x = x | 0;
    this.y = y | 0;
  }

  /**
   * Step along the path. Clamps backward motion at `minY`.
   * @param {number} dir - +1 or -1 per step
   * @param {number} [minY=0]
   * @returns {boolean} whether the pawn actually moved
   */
  step(dir, minY = 0) {
    const d = dir > 0 ? 1 : dir < 0 ? -1 : 0;
    if (d === 0) return false;
    if (d < 0 && this.y <= minY) return false;
    this.y += d;
    return true;
  }

  /**
   * Apply multiple steps.
   * @param {number} steps
   * @param {number} [minY=0]
   * @returns {{ fromY: number, toY: number, stepsApplied: number, direction: number }}
   */
  advance(steps, minY = 0) {
    const fromY = this.y;
    const dir = steps > 0 ? 1 : steps < 0 ? -1 : 0;
    const count = Math.abs(steps | 0);
    let applied = 0;
    for (let i = 0; i < count; i++) {
      if (!this.step(dir, minY)) break;
      applied += 1;
    }
    return {
      fromY,
      toY: this.y,
      stepsApplied: applied,
      direction: dir,
    };
  }

  snapshot() {
    return { x: this.x, y: this.y };
  }
}
