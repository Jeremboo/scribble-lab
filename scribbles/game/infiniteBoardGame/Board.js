import { Group, Vector3 } from "three";
import gsap from "gsap";
import Stage from "../_modules/Stage";
import BoardCell from "./BoardCell";
import BoardLoot from "./BoardLoot";
import { boardNoise, getHillElevation } from "./boardNoise";
import props from "./props";

const CELL_HEIGHT = 5;
const CELL_ELEVATION = 0.25;

export default class Board extends Stage {
  constructor(row, column) {
    super();

    this.group = new Group();

    this.pathX = Math.floor(row / 2);
    this.pathY = 0;
    this.startY = 0;

    this.regenerateNoise = this.regenerateNoise.bind(this);
    this.initCell = this.initCell.bind(this);

    this.loots = [];
    /** @type {Set<BoardCell>} cells still owned by this board (incl. mid-exit). */
    this.liveCells = new Set();
    this.init(row, column, this.initCell);
  }

  getElevation(x, y) {
    const noiseElevation = Math.abs(boardNoise.perlin2((props.noiseX + x) * props.noiseScaleX, (props.noiseY + y + this.pathY) * props.noiseScaleY)) * props.noiseAmpl;
    const pathElevation = props.noisePathElevation - Math.abs(x - this.pathX) * props.noisePathElevation;
    const starterElevation = 0.25 + Math.min(1, y / 3);
    const hillElevation = getHillElevation(x, y, this.pathY);
    return (noiseElevation + pathElevation) * starterElevation + hillElevation;
  }

  /** Hill elevation contribution at path column (matches mesh * 0.5 scale). */
  getPathHillY(y) {
    return getHillElevation(this.pathX, y, this.pathY) * 0.5;
  }

  /** World-space Y of a cell surface at grid (x, y). */
  getCellWorldY(x, y) {
    return this.getElevation(x, Math.floor(y)) * 0.5 - CELL_HEIGHT / 2 + CELL_ELEVATION;
  }

  /** World-space Y of the path cell surface at absolute row y. */
  getPathWorldY(y) {
    return this.getCellWorldY(this.pathX, y);
  }

  /**
   * Average cell-surface world Y over [fromY, toYExclusive) × full board width.
   * Used to keep the camera vertically centered on the visible board mass.
   */
  getAverageWorldY(fromY, toYExclusive = fromY + props.boardHeight) {
    const y0 = Math.floor(fromY);
    const y1 = Math.max(y0 + 1, Math.floor(toYExclusive));
    const width = this.grid.row || props.boardWidth;
    let sum = 0;
    let count = 0;
    for (let y = y0; y < y1; y++) {
      for (let x = 0; x < width; x++) {
        sum += this.getCellWorldY(x, y);
        count += 1;
      }
    }
    return count > 0 ? sum / count : 0;
  }

  /**
   * Spawn loot on any path cells that already exist for the given plan.
   * @param {Map<number, object>|Record<string, object>|Array<[number, object]>} plan
   */
  spawnLootsAtYs(plan) {
    if (!plan) return;
    const entries = plan instanceof Map
      ? plan
      : Array.isArray(plan)
        ? plan
        : Object.keys(plan).map((k) => [Number(k), plan[k]]);
    const log = !!props.debugLoot;
    const spawned = [];
    const skipped = [];
    for (const [y, meta] of entries) {
      const cell = this.getCell(this.pathX, y);
      if (!cell) {
        skipped.push({ y, reason: 'row not built yet (will spawn on addRowAhead)', meta });
        continue;
      }
      if (cell.loot) {
        skipped.push({ y, reason: 'cell already has loot', meta });
        continue;
      }
      const loot = this.spawnLoot(cell, meta);
      if (loot) {
        spawned.push({
          y,
          kind: meta.isRescue ? 'RESCUE' : 'extra',
          reward: `+${meta.rewardValue}`,
        });
      }
    }
    if (log && (spawned.length || skipped.length)) {
      console.log('[loot spawn]', { spawned, deferredOrSkipped: skipped });
    }
  }

  /**
   * @param {import('./BoardCell').default} cell
   * @param {{ isRescue?: boolean, rewardValue?: number }} [meta]
   */
  spawnLoot(cell, meta = {}) {
    if (!cell || !cell.isPath || cell.loot) return null;
    const loot = new BoardLoot(cell, meta);
    cell.loot = loot;
    this.loots.push(loot);
    this.group.add(loot.mesh);
    return loot;
  }

  collectLootAt(x, y) {
    const cell = this.grid.getCell(x, y);
    if (!cell || !cell.loot || cell.loot.collected) return null;
    const loot = cell.loot;
    if (!loot.collect()) return null;
    this.loots = this.loots.filter((item) => item !== loot);
    return loot;
  }

  /**
   * Mark path cells as forbidden when those rows already exist.
   * @param {Iterable<number>|Set<number>|Array<number>} ys
   */
  markForbiddenAtYs(ys) {
    if (!ys) return;
    const list = ys instanceof Set ? ys : ys;
    for (const y of list) {
      const cell = this.getCell(this.pathX, y);
      if (cell) cell.setForbidden(true);
    }
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {{ loot?: false | true | { isRescue?: boolean, rewardValue?: number }, forbidden?: boolean }} [options]
   */
  initCell(x, y, { loot = false, forbidden = false } = {}) {
    const elevation = this.getElevation(x, y) * 0.5;
    const position = new Vector3(x, elevation, y);
    const isPath = this.pathX === x;
    const cell = new BoardCell(position, isPath, {
      forbidden: isPath && !!forbidden,
    });
    if (isPath && loot) {
      this.spawnLoot(cell, loot === true ? {} : loot);
    }
    this.group.add(cell.mesh);
    this.liveCells.add(cell);
    return cell;
  }

  regenerateNoise() {
    this.parse((cell) => {
      if (!cell || !cell.setElevation) return;
      const newElevation = this.getElevation(cell.x, cell.y) * 0.5;
      cell.setElevation(newElevation);
    });
  }

  /**
   * Tear down every cell/loot and rebuild a board segment in place.
   * @param {number} [row]
   * @param {number} [column]
   * @param {number} [startY=0] absolute row where the new segment begins
   *   (keeps world/camera offset on restart instead of snapping to origin).
   */
  reset(row = props.boardWidth, column = props.boardHeight, startY = 0) {
    for (const cell of [...this.liveCells]) {
      if (!cell || !cell.mesh) continue;
      gsap.killTweensOf(cell.mesh.position);
      if (cell.loot) {
        gsap.killTweensOf(cell.loot);
        if (cell.loot.mesh) gsap.killTweensOf(cell.loot.mesh.position);
      }
      if (cell.mesh.parent) this.group.remove(cell.mesh);
      cell.dispose();
    }
    this.liveCells.clear();
    this.loots = [];

    const originY = Math.max(0, startY | 0);
    this.startY = originY;
    // Keep pathY when resuming mid-run so noise stays continuous with grounds.
    if (originY === 0) this.pathY = 0;

    this.grid.grid = [];
    this.grid.row = row;
    this.grid.column = originY + column;
    for (let y = originY; y < originY + column; y++) {
      this.grid.grid[y] = [];
      for (let x = 0; x < row; x++) {
        this.grid.grid[y][x] = this.initCell(x, y);
      }
    }
  }

  update(time = 0) {
    this.loots.forEach((loot) => loot.update(time));
  }

  moveTo(move = 1) {
    this.pathY += move;
    this.regenerateNoise();
  }

  /**
   * Append one row at the front of the board.
   * @param {boolean | { isRescue?: boolean, rewardValue?: number }} [loot=false]
   * @param {boolean} [forbidden=false]
   */
  addRowAhead(loot = false, forbidden = false) {
    const y = this.grid.column;
    this.grid.grid[y] = [];
    for (let x = 0; x < props.boardWidth; x++) {
      const cell = this.initCell(x, y, {
        loot: x === this.pathX ? loot : false,
        forbidden: x === this.pathX && !!forbidden,
      });
      cell.animateIn();
      this.grid.grid[y][x] = cell;
    }
    if (props.debugLoot && loot) {
      const meta = loot === true ? {} : loot;
      console.log(
        `[loot row] addRowAhead y=${y}`,
        meta.isRescue ? 'RESCUE' : 'extra',
        meta.rewardValue != null ? `+${meta.rewardValue}` : meta,
      );
    }
    this.grid.column = y + 1;
  }

  removeRowBehind() {
    const row = this.grid.grid[this.startY];
    if (row) {
      row.forEach((cell) => {
        if (!cell || !cell.mesh) return;
        cell.animateOut(() => {
          if (cell.loot) {
            this.loots = this.loots.filter((loot) => loot !== cell.loot);
          }
          this.group.remove(cell.mesh);
          this.liveCells.delete(cell);
          cell.dispose();
        });
      });
      delete this.grid.grid[this.startY];
    }
    this.startY += 1;
  }

  /** Ensure a full row exists at absolute y (for the pawn to land on). */
  ensureRow(y) {
    while (this.grid.column <= y) {
      this.addRowAhead(false);
    }
  }

  /**
   * Drop rows at the front until column === targetColumn.
   * Used to keep visible length at boardHeight after overshoot ensureRow.
   */
  trimRowsFrom(targetColumn) {
    while (this.grid.column > targetColumn) {
      const y = this.grid.column - 1;
      const row = this.grid.grid[y];
      if (row) {
        row.forEach((cell) => {
          if (!cell || !cell.mesh) return;
          if (cell.loot) {
            this.loots = this.loots.filter((loot) => loot !== cell.loot);
          }
          this.group.remove(cell.mesh);
          this.liveCells.delete(cell);
          cell.dispose();
        });
        delete this.grid.grid[y];
      }
      this.grid.column = y;
    }
  }

  get visibleRowCount() {
    return this.grid.column - this.startY;
  }

  /** Fade chevrons on rows before yExclusive (passed section markers). */
  fadeAdvanceIconsBelow(yExclusive, duration = 0.8) {
    this.parse((cell) => {
      if (cell && cell.icon && cell.y < yExclusive) {
        cell.fadeAdvanceIcon(duration);
      }
    });
  }

  /** Retint advance chevrons after a palette theme change. */
  applyThemeIcons() {
    this.liveCells.forEach((cell) => {
      if (cell && cell.applyThemeIcon) cell.applyThemeIcon();
    });
  }

  /**
   * Path landing for move previews when the row is not built yet.
   * Returns a lightweight stand-in (no mesh / no grid mutation).
   */
  getPathPreviewTarget(x, y) {
    const existing = this.getCell(x, y);
    if (existing) return existing;
    const elevation = this.getElevation(x, y) * 0.5;
    return {
      targetedPosition: new Vector3(
        -props.boardWidth * 0.5 + x,
        elevation - CELL_HEIGHT / 2 + CELL_ELEVATION,
        -props.boardHeight * 0.5 + y,
      ),
    };
  }

  /**
   * Create rows ahead and optionally drop rows behind.
   * @param {number} steps - rows to create ahead
   * @param {number} removeCount - rows to remove behind (defaults to steps)
   */
  advance(steps = 1, removeCount = steps) {
    for (let i = 0; i < steps; i++) {
      this.addRowAhead(false);
    }
    for (let i = 0; i < removeCount; i++) {
      this.removeRowBehind();
    }
  }
}
