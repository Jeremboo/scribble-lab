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

    this.pathCells = [];
    this.loots = [];
    this.currentPathColor = props.pathColors[0];
    this.currentPawnColor = props.pawnColors[0];
    this.lastPathLootColor = null;
    this.lastPawnLootColor = null;
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
    return this.getElevation(this.pathX, y) * 0.5 - CELL_HEIGHT / 2 + CELL_ELEVATION;
  }

  pickLootColor(effect) {
    const palette = effect === 'path' ? props.pathColors : props.pawnColors;
    const current = effect === 'path' ? this.currentPathColor : this.currentPawnColor;
    const previous = effect === 'path' ? this.lastPathLootColor : this.lastPawnLootColor;

    let pool = palette.filter((color) => color !== current && color !== previous);
    if (!pool.length) {
      pool = palette.filter((color) => color !== current);
    }
    if (!pool.length) {
      pool = palette;
    }

    const color = pool[Math.floor(Math.random() * pool.length)];
    if (effect === 'path') {
      this.lastPathLootColor = color;
    } else {
      this.lastPawnLootColor = color;
    }
    return color;
  }

  setAppliedColor(effect, color) {
    if (effect === 'path') {
      this.currentPathColor = color;
    } else if (effect === 'pawn') {
      this.currentPawnColor = color;
    }
  }

  maybeSpawnLoot(cell) {
    // Skip the first few path cells so the start stays clear
    if (!cell.isPath || cell.y < 3) return;
    if (Math.random() > props.lootChance) return;

    const effect = Math.random() < 0.5 ? 'path' : 'pawn';
    const color = this.pickLootColor(effect);
    const loot = new BoardLoot(cell, { effect, color });
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
      this.pathCells.push(cell);
      this.maybeSpawnLoot(cell);
    }
    this.group.add(cell.mesh);
    return cell;
  }

  changeColorPath(newColor, duration) {
    this.pathCells.forEach((cell) => {
      cell.changeColorPath(newColor, duration);
    });
  }

  regenerateNoise() {
    this.parse((cell) => {
      if (!cell || !cell.setElevation) return;
      const newElevation = this.getElevation(cell.x, cell.y) * 0.5;
      cell.setElevation(newElevation);
    });
  }

  update(time = 0) {
    this.parse((cell) => {
      if (!cell || !cell.update) return;
      cell.update();
    });
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
      // Rise into place
      cell.mesh.position.y -= 2;
      this.grid.grid[y][x] = cell;
    }
    this.grid.column = y + 1;
  }

  removeRowBehind() {
    const row = this.grid.grid[this.startY];
    if (row) {
      row.forEach((cell) => {
        if (!cell || !cell.mesh) return;
        this.pathCells = this.pathCells.filter((pathCell) => pathCell !== cell);
        if (cell.loot) {
          this.loots = this.loots.filter((loot) => loot !== cell.loot);
        }
        this.group.remove(cell.mesh);
        cell.dispose();
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
