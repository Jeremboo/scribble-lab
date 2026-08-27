import Ground, {
  GROUND_TILE_SIZE,
  GROUND_SPAWN_PADDING,
  GROUND_CULL_MARGIN,
} from './Ground';
import props from './props';

/**
 * Tiled grounds with fixed noise coordinates.
 * Spawns the next tile early (board + spawn padding);
 * removes tiles only after they are well behind the camera.
 */
export default class Grounds {
  constructor(parent) {
    this.parent = parent;
    this.tiles = new Map();
    this.pathY = 0;
    this.ensureTile(0);
  }

  ensureTile(index) {
    if (this.tiles.has(index)) return this.tiles.get(index);

    const tileZ = index * GROUND_TILE_SIZE;
    const ground = new Ground(tileZ);
    ground.setPathY(this.pathY);
    this.parent.add(ground.mesh);
    this.tiles.set(index, ground);
    return ground;
  }

  setPathY(y) {
    this.pathY = y;
    this.tiles.forEach((ground) => ground.setPathY(y));
  }

  syncFromProps() {
    this.tiles.forEach((ground) => ground.syncFromProps());
  }

  /**
   * @param {number} scrollZ - scrollGroup.position.z (negative as the board advances)
   */
  update(scrollZ) {
    const focusZ = -scrollZ;
    const frontZ = focusZ + props.boardHeight + GROUND_SPAWN_PADDING;
    const backZ = focusZ - GROUND_CULL_MARGIN;

    const minIndex = Math.floor((backZ + GROUND_TILE_SIZE * 0.5) / GROUND_TILE_SIZE);
    const maxIndex = Math.floor((frontZ + GROUND_TILE_SIZE * 0.5) / GROUND_TILE_SIZE);

    for (let i = Math.max(0, minIndex); i <= maxIndex; i++) {
      this.ensureTile(i);
    }

    for (const [index, ground] of [...this.tiles]) {
      const tileFront = index * GROUND_TILE_SIZE + GROUND_TILE_SIZE * 0.5;
      if (tileFront < backZ) {
        this.parent.remove(ground.mesh);
        ground.dispose();
        this.tiles.delete(index);
      }
    }
  }
}
