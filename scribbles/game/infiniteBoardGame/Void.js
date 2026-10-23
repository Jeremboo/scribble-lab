import gsap from 'gsap';
import VoidTile from './VoidTile';
import VoidField from './VoidField';
import { parseCellKey } from './game/deckRules';
import { GROUND_TILE_SIZE, GROUND_TILE_BOARD_HEIGHTS } from './Ground';
import props from './props';

const MAX_TILES = 2;
/** Front sits behind the board until a cell dies. */
const FRONT_IDLE = -20;
const FRONT_CREEP = 1.4;

/**
 * Tiled void. Same scroll and terrain as Grounds.
 * Dead cells mound up. The terrain-eating wake creeps forward to the leading dead cell.
 */
export default class Void {
  constructor(parent) {
    this.parent = parent;
    this.field = new VoidField();
    this.frontUniform = { value: FRONT_IDLE };
    this.leadY = null;
    this._frontGen = 0;
    this._frontTween = null;
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
    const tile = new VoidTile(tileZ, this.field, this.frontUniform);
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
    let lead = -Infinity;
    if (dead) {
      for (const key of dead) {
        const { y } = parseCellKey(key);
        if (y > lead) lead = y;
      }
    }
    if (lead === -Infinity) return;
    this.leadY = lead;
    // Keep a stretch of board in front of the eaten ground.
    this._creepFront(lead - props.voidFrontOffset);
  }

  /** Reapply the front after the offset changes, including pulling it back. */
  setFrontOffset() {
    if (this.leadY == null) return;
    if (this._frontTween) this._frontTween.kill();
    this._frontGen += 1;
    this._frontTween = null;
    this.frontUniform.value = this.leadY - props.voidFrontOffset;
  }

  /**
   * Ease the eaten front forward. It never tracks the pawn, and it does not retreat.
   * @param {number} target
   */
  _creepFront(target) {
    if (target <= this.frontUniform.value + 0.05) return;
    if (this._frontTween) this._frontTween.kill();
    const gen = this._frontGen;
    const state = { y: this.frontUniform.value };
    this._frontTween = gsap.to(state, {
      y: target,
      duration: FRONT_CREEP,
      ease: 'power1.inOut',
      onUpdate: () => {
        if (gen !== this._frontGen) return;
        this.frontUniform.value = state.y;
      },
    });
  }

  clearDead() {
    this._frontGen += 1;
    if (this._frontTween) this._frontTween.kill();
    this._frontTween = null;
    this.leadY = null;
    this.frontUniform.value = FRONT_IDLE;
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
