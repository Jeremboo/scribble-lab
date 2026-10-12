import props from '../props';
import { getSectionStride, getSectionTriggerOffset, getNextSectionTriggerY } from './section';

/**
 * Logical sliding board window (no meshes).
 */
export default class GridModel {
  /**
   * @param {number} [width]
   * @param {number} [height]
   * @param {number} [startY]
   */
  constructor(
    width = props.boardWidth,
    height = props.boardHeight,
    startY = 0,
  ) {
    this.reset(width, height, startY);
  }

  /**
   * @param {number} [width]
   * @param {number} [height]
   * @param {number} [startY]
   */
  reset(width = props.boardWidth, height = props.boardHeight, startY = 0) {
    this.width = Math.max(1, width | 0);
    this.height = Math.max(1, height | 0);
    this.pathX = Math.floor(this.width / 2);
    this.startY = Math.max(0, startY | 0);
    this.column = this.startY + this.height;
    this.pathY = this.startY === 0 ? 0 : this.pathY | 0;
  }

  get sectionTriggerOffset() {
    return getSectionTriggerOffset();
  }

  get sectionStride() {
    return getSectionStride();
  }

  /** Absolute row that triggers the next section advance. */
  nextSectionTriggerY(fromY = this.startY) {
    return getNextSectionTriggerY(fromY);
  }

  /**
   * Whether the pawn at `pawnY` has reached the current section trigger,
   * accounting for in-flight visual advances still pending in the view.
   * @param {number} pawnY
   * @param {number} [pendingAdvance=0]
   */
  shouldAdvanceSection(pawnY, pendingAdvance = 0) {
    return pawnY >= this.startY + (pendingAdvance | 0) + this.sectionTriggerOffset;
  }

  /**
   * Apply a logical section scroll. Updates startY / column.
   * @param {number} steps
   * @param {number} pawnY
   * @returns {{ steps: number, targetStartY: number, targetEndY: number, rowsToAdd: number, fromColumn: number }}
   */
  applySectionAdvance(steps, pawnY) {
    const stride = Math.max(0, steps | 0);
    const fromColumn = this.column;
    const targetStartY = this.startY + stride;
    const targetEndY = Math.max(
      targetStartY + this.height,
      (pawnY | 0) + 1,
    );
    const rowsToAdd = Math.max(0, targetEndY - fromColumn);
    this.startY = targetStartY;
    this.column = targetEndY;
    return {
      steps: stride,
      targetStartY,
      targetEndY,
      rowsToAdd,
      fromColumn,
    };
  }

  snapshot() {
    return {
      pathX: this.pathX,
      startY: this.startY,
      column: this.column,
      height: this.height,
      width: this.width,
      sectionTriggerY: this.nextSectionTriggerY(this.startY),
      sectionTriggerOffset: this.sectionTriggerOffset,
      sectionStride: this.sectionStride,
    };
  }
}
