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
  add(pawn,  {
    forceAdd = false,
    clearCell = false,
    typesToIgnore = [],
  } = {}) {

    if (clearCell) {
      killAll();
    }

    const initialX = pawn.x;
    const initialY = pawn.y;

    // Update the pawn based on the other pawns already into the cell
    if (!forceAdd) {
      pawn.applyRulesFromCellLanded(this);
      if (!pawn.isAlive) return false;

      !this.isEmpty({ typesToIgnore })

      // Test the pawn into the cell
      this.pawns.forEach((_pawn) => {
        if (pawn.isAlive && typesToIgnore == undefined || typesToIgnore[_pawn.type] == undefined) {
          _pawn.applyRulesOnPawnAdded(pawn);
        }
      });
      if (!pawn.isAlive) return false;

      // If the pawn position is now different, add it from a different position
      if (initialX !== pawn.x || initialY !== pawn.y) {
        return this.addPawn(pawn);
      }
    }

    super.add(pawn);
    pawn.isInCell = true;
    return true;
  }

  remove(pawn) {
    if (!pawn.isInCell) return;
    if (!super.remove(pawn)) {
      console.log(`ERROR: The pawn ${pawn.type} not found`);
      return false;
    }

    pawn.applyRulesFromCellLeaved(this);
    this.pawns.forEach((_pawn) => {
      _pawn.applyRulesOnPawnRemoved(pawn);
    });
    return true;
  }

  isEmpty({ typesToIgnore = [] } = {}) {
    return this.pawns.filter((pawn) => typesToIgnore.filter((type) => pawn.type === type).length === 0).length === 0;
  }

  killAll() {
    pawns.forEach((_pawn) => {
      _pawn.kill();
    });
  }
}

export default Cell;