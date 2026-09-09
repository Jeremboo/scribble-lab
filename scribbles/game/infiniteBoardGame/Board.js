import { Group, Vector3 } from "three";
import Stage from "../_modules/Stage";
import BoardCell from "./BoardCell";
import BoardLoot from "./BoardLoot";
import { boardNoise, getHillElevation } from "./boardNoise";
import props from "./props";

const CELL_HEIGHT = 5;
const CELL_ELEVATION = 0.25;
const LOOT_EFFECTS = [
  // 'outline',
  // 'neutral',
  'pawn',
  'path',
  'bg',
];

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
    this.nextLootEffectIndex = 0;
    this.currentColors = {
      bg: props.bgColors[0],
      outline: props.outlineColors[0],
      neutral: props.neutralColors[0],
      path: props.pathColors[0],
      pawn: props.pawnColors[0],
    };
    this.lastLootColors = {
      bg: null,
      outline: null,
      neutral: null,
      path: null,
      pawn: null,
    };
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

  pickLootEffect() {
    const effect = LOOT_EFFECTS[this.nextLootEffectIndex % LOOT_EFFECTS.length];
    this.nextLootEffectIndex += 1;
    return effect;
  }

  pickLootColor(effect) {
    const paletteMap = {
      bg: props.bgColors,
      outline: props.outlineColors,
      neutral: props.neutralColors,
      path: props.pathColors,
      pawn: props.pawnColors,
    };
    const palette = paletteMap[effect];
    const current = this.currentColors[effect];
    const previous = this.lastLootColors[effect];

    let pool = palette.filter((color) => color !== current && color !== previous);
    if (!pool.length) {
      pool = palette.filter((color) => color !== current);
    }
    if (!pool.length) {
      pool = palette;
    }

    const color = pool[Math.floor(Math.random() * pool.length)];
    this.lastLootColors[effect] = color;
    return color;
  }

  setAppliedColor(effect, color) {
    this.currentColors[effect] = color;
  }

  maybeSpawnLoot(cell) {
    // Skip the first few path cells so the start stays clear
    if (!cell.isPath || cell.y < 3) return;
    if (Math.random() > props.lootChance) return;

    const effect = this.pickLootEffect();
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

  changeColorNeutral(newColor, duration) {
    let applied = false;
    this.parse((cell) => {
      if (applied || !cell || cell.isPath) return;
      cell.changeColorNeutral(newColor, duration);
      applied = true;
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
        this.pathCells = this.pathCells.filter((pathCell) => pathCell !== cell);
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
