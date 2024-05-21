import { TYPE } from './keys';
import PawnList from './PawnList';

class Cell extends PawnList {
  constructor(x, y) {
    super();
    this.id = Math.random();
    this.x = x;
    this.y = y;
    this.isInteractive = true;
  }

  /**
   * Add a pawn into the Cell.
   * @param {Pawn} pawn - The pawn to add
   * @param {Boolean} forceAdd - Force the pawn to be added whatever it is
   * @returns
   */
  add(pawn) {
    if (this.isInteractive && pawn.type !== TYPE.ROBOT && pawn.type !== TYPE.SWITCHER) {
      this.isInteractive = false;
    }
    super.add(pawn);
  }

  isEmpty({ typesToIgnore = [] } = {}) {
    return this.pawns.filter((pawn) => typesToIgnore.filter((type) => pawn.type === type).length === 0).length === 0;
  }
}

export default Cell;