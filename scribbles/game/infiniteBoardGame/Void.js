import VoidTile from './VoidTile';
import VoidField from './VoidField';
import { GROUND_TILE_SIZE, GROUND_TILE_BOARD_HEIGHTS } from './Ground';

const MAX_TILES = 2;

/**
 * Tiled void. Same scroll and terrain as Grounds, swelled by dead cells.
 */
export default class Void {
  constructor(parent) {
    this.parent = parent;
    this.field = new VoidField();
    this.tiles = new Map();
    this.nextIndex = 0;
    this.pathY = 0;
    this.rounds = GROUND_TILE_BOARD_HEIGHTS / 2;
    this.addTile();
  }

  /** Call once each time the board advances a round. */
  onBoardAdvance() {
    this.rounds += 1;
    while (this.rounds >= GROUND_TILE_BOARD_HEIGHTS) {
      this.rounds -= GROUND_TILE_BOARD_HEIGHTS;
      this.addTile();
    }
  }

  addTile() {
    if (this.tiles.size >= MAX_TILES) {
      const oldest = Math.min(...this.tiles.keys());
      const removed = this.tiles.get(oldest);
      this.parent.remove(removed.mesh);
      removed.dispose();
      this.tiles.delete(oldest);
    }

    const index = this.nextIndex++;
    const tileZ = index * GROUND_TILE_SIZE;
    const tile = new VoidTile(tileZ, this.field);
    tile.setPathY(this.pathY);
    this.parent.add(tile.mesh);
    this.tiles.set(index, tile);
    return tile;
  }

  /**
   * @param {Iterable<string>} dead
   */
  syncDead(dead) {
    this.field.sync(dead);
  }

  clearDead() {
    this.field.clear();
  }

  setPathY(y) {
    this.pathY = y;
    this.tiles.forEach((tile) => tile.setPathY(y));
  }

  /** Drop all tiles and rebuild the starting strip. */
  reset() {
    this.clearDead();
    this.tiles.forEach((tile) => {
      this.parent.remove(tile.mesh);
      tile.dispose();
    });
    this.tiles.clear();
    this.nextIndex = 0;
    this.rounds = GROUND_TILE_BOARD_HEIGHTS / 2;
    this.addTile();
  }

  syncFromProps() {
    this.tiles.forEach((tile) => tile.syncFromProps());
  }
}
