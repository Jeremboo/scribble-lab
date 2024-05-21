import { TYPE, DIRECTION, COLOR } from '../../../data/keys';

class Pawn {
  constructor({ x, y, direction, type = TYPE.CELL, delay = 1, color = COLOR.BLUE } = {}) {
    this.id = Math.random(); // TODO 2021-06-26 jeremboo: use something better
    this.x = x;
    this.y = y;
    this.type = type;
    this.color = color;

    this.directionX = 0;
    this.directionY = 0;

    this.delay = delay;
    this.increment = 0;
    this.willUpdate = false;
    this.isAlive = true;

    this.direction = null;
    if (direction !== undefined) {
      this.setDirection(direction);
    }
  }

  setDirection(direction) {
    if (this.direction === direction) return;

    this.direction = direction;
    // Definie where will be the pop cell
    this.directionX = 0;
    this.directionY = 0;
    switch (direction) {
      case DIRECTION.LEFT:
        this.directionX = -1;
        break;
      case DIRECTION.RIGHT:
        this.directionX = 1;
        break;
      case DIRECTION.TOP:
        this.directionY = -1;
        break;
      case DIRECTION.BOTTOM:
      default:
        this.directionY = 1;
        break;
    }
  }

  /**
   * * *******************
   * * INCREMENTATION UPDATE
   * * *******************
   */

  update() {
    this.increment = (this.increment + 1) % this.delay;
    this.willUpdate = this.increment === this.delay - 1;
    if (this.willUpdate) {
      this._update();
    }
    return this.willUpdate;
  }

  _update() {}

  /**
   * * *******************
   * * PAWN UPDATE
   * * *******************
   */

  /**
   * Called when a pawn from the same cell is added.
   * By default, kill all new pawns coming
   * @param {Pawn} pawn
   */
  applyRulesOnPawnAdded(pawn) {
    pawn.isAlive = false;
  }

  /**
   * Called when a pawn from the same cell is removed.
   * By default, do nothing
   * @param {Pawn} pawn
   */
  applyRulesOnPawnRemoved(pawn) {}
}

export default Pawn;