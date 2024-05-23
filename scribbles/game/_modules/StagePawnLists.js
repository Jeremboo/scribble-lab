import PawnList from './PawnList';

import { TYPE } from './keys';

export default class StagePawnLists {
  constructor() {
    this.list = {
      // [TYPE.PAWN]: { classToInstance: Pawn, list: new PawnList(), type: TYPE.PAWN }
    };
  }

  addType(type, classToInstance) {
    this.list[type] = { classToInstance, list: new PawnList(), type};
  }

  isTypeExists(type) {
    return this.list[type] !== undefined;
  }

  generatePawn(pawnProps) {
    if (this.list[pawnProps.type] == undefined) {
      console.log(`ERROR: The type ${pawnProps.type} is not recorded yep. Use addType(type, classToInstance) first.`);
      return false;
    }
    return (this.list[pawnProps.type] && new this.list[pawnProps.type].classToInstance(pawnProps)) || false;
  }

  /**
   * * *******************
   * * GETTERS
   * * *******************
   */

  getList(type) {
    return this.list[type] && this.list[type].list.pawns || [];
  }

  getListLength(type) {
    return this.getList(type).length;
  }

  getPawnByIdx(type, idx) {
    return this.list[type] && this.list[type].list.pawns[idx] || false;
  }

  getAllPawns() {
    return Object.values(this.list).reduce((accumulator, { list }) => {
      accumulator.push(list.pawns.map((pawn) => pawn));
      return accumulator;
    }, []);
  }

  /**
   * * *******************
   * * ADD / REMOVE EXISTING PAWN
   * * *******************
   */

  addPawn(pawn) {
    return this.list[pawn.type] && this.list[pawn.type].list.add(pawn);
  }

  removePawn(pawn) {
    return this.list[pawn.type] && this.list[pawn.type].list.remove(pawn);
  }

  /**
   * * *******************
   * * PARSE LISTS
   * * *******************
   */

  parseFromType(type, callback) {
    if (this.list[type] != undefined) {
      this.list[type].list.parse(callback);
    }
  }

  /**
   * Remove from a list all pawn with a specific type
   * @param {TYPE} type
   * @param {func} callback
   */
  filterPawnsFromType(type, callback) {
    if (this.list[type] !== undefined) {
      this.list[type].list.pawns = this.list[type].list.pawns.filter(callback);
    }
  }
}
