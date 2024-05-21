class Item {
  constructor(type, capacity = 10) {
    this.type = type;
    this.avialable = 0;
    this.capacity = capacity;
  }

  add(nbrToAdd = 1) {
    this.avialable = Math.min(this.avialable + nbrToAdd, this.capacity);
  }

  addCapacity(capacity, withItem = false) {
    this.capacity += capacity;
    if (withItem) {
      this.add(capacity);
    }
  }

  remove(nbrToRemove = 1) {
    if (!this.areAvialable(nbrToRemove)) {
      return false;
    }
    this.avialable -= nbrToRemove;
    return true;
  }
  areAvialable(nbrNeeded) {
    return nbrNeeded <= this.avialable;
  }
}

export default class Inventory {
  constructor() {
    this.items = {};
  }

  addItemType(type, capacity = 0) {
    if (this.items[type] === undefined) {
      this.items[type] = new Item(type, capacity);
    }
  }

  addItemCapacity(type, capacity, withItem = false) {
    this.items[type]?.addCapacity(capacity, withItem);
  }

  /**
   * * *******************
   * * TYPE
   * * *******************
   */

  addItems(type, nbrToAdd) {
    this.items[type]?.add(nbrToAdd);
  }

  dropItems(type, nbrToRemove) {
    this.items[type]?.remove(nbrToRemove);
  }

  areItemsAvialable(type, nbrNeeded) {
    return this.items[type]?.areAvialable(nbrNeeded);
  }
}