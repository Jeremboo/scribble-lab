import { Group, Vector3 } from "three";
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

  /** World-space Y of the path cell surface at absolute row y. */
  getPathWorldY(y) {
    return this.getElevation(this.pathX, Math.floor(y)) * 0.5 - CELL_HEIGHT / 2 + CELL_ELEVATION;
  }

  maybeSpawnLoot(cell) {
    // Skip the first few path cells so the start stays clear
    if (!cell.isPath || cell.y < 3) return;
    if (Math.random() > props.lootChance) return;

    const loot = new BoardLoot(cell);
    cell.loot = loot;
    this.loots.push(loot);
    this.group.add(loot.mesh);
  }

  collectLootAt(x, y) {
    const cell = this.grid.getCell(x, y);
    if (!cell || !cell.loot || cell.loot.collected) return null;
    const loot = cell.loot;
    if (!loot.collect()) return null;
    this.loots = this.loots.filter((item) => item !== loot);
    return loot;
  }

  initCell(x, y) {
    const elevation = this.getElevation(x, y) * 0.5;
    const position = new Vector3(x, elevation, y);
    const isPath = this.pathX === x;
    const cell = new BoardCell(position, isPath);
    if (isPath) {
      this.maybeSpawnLoot(cell);
    }
    this.group.add(cell.mesh);
    return cell;
  }

  regenerateNoise() {
    this.parse((cell) => {
      if (!cell || !cell.setElevation) return;
      const newElevation = this.getElevation(cell.x, cell.y) * 0.5;
      cell.setElevation(newElevation);
    });
  }

  update(time = 0) {
    this.loots.forEach((loot) => loot.update(time));
  }

  moveTo(move = 1) {
    this.pathY += move;
    this.regenerateNoise();
  }

  addRowAhead() {
    const y = this.grid.column;
    this.grid.grid[y] = [];
    for (let x = 0; x < props.boardWidth; x++) {
      const cell = this.initCell(x, y);
      cell.animateIn();
      this.grid.grid[y][x] = cell;
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
      this.addRowAhead();
    }
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
      this.addRowAhead();
    }
    for (let i = 0; i < removeCount; i++) {
      this.removeRowBehind();
    }
  }
}
