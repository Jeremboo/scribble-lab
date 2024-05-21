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
    this.pawns = this.pawns.filter((_pawn) => _pawn.id !== pawn.id);
  }

  parse(callback) {
    this.pawns.forEach(callback);
  }

  getFromType(type) {
    return this.pawns.filter((pawn) => pawn.type === type);
  }
}

export default PawnList;