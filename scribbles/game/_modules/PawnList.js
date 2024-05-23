class PawnList {
  constructor() {
    this.pawns = [];
  }

  isEmpty() {
    return this.pawns.length === 0;
  }

  add(pawn) {
    this.pawns.push(pawn);
  }

  remove(pawn) {
    let isRemoved = false;
    this.pawns = this.pawns.filter((_pawn) => {
      const isFound = _pawn.id === pawn.id;
      if (isFound) {
        isRemoved = true;
      }
      return !isFound;
    });
    return isRemoved;
  }

  parse(callback) {
    this.pawns.forEach(callback);
  }

  getFromType(type) {
    return this.pawns.filter((pawn) => pawn.type === type);
  }
}

export default PawnList;