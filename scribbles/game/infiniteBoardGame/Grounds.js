import Ground, {
  GROUND_TILE_SIZE,
  GROUND_TILE_BOARD_HEIGHTS,
} from './Ground';

const MAX_TILES = 2;

/**
 * Tiled grounds with fixed noise coordinates.
 */
export default class Grounds {
  constructor(parent) {
    this.parent = parent;
    this.tiles = new Map();
    this.nextIndex = 0;
    this.pathY = 0;
    this.currentBgColor = null;
    this.rounds = GROUND_TILE_BOARD_HEIGHTS / 2; // start at the middle
    this.addTile(); // add the first tile
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
    const index = this.nextIndex++;
    const tileZ = index * GROUND_TILE_SIZE;
    const ground = new Ground(tileZ);
    ground.setPathY(this.pathY);
    if (this.currentBgColor) {
      ground.setBgColor(this.currentBgColor, 0);
    }
    this.parent.add(ground.mesh);
    this.tiles.set(index, ground);

    if (this.tiles.size > MAX_TILES) {
      const oldest = Math.min(...this.tiles.keys());
      const removed = this.tiles.get(oldest);
      this.parent.remove(removed.mesh);
      removed.dispose();
      this.tiles.delete(oldest);
    }

    return ground;
  }

  setPathY(y) {
    this.pathY = y;
    this.tiles.forEach((ground) => ground.setPathY(y));
  }

  syncFromProps() {
    this.tiles.forEach((ground) => ground.syncFromProps());
  }

  setBgColor(color, duration = 1) {
    this.currentBgColor = color;
    this.tiles.forEach((ground) => ground.setBgColor(color, duration));
  }
}
