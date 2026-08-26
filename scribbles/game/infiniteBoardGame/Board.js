import { Group, Vector3 } from "three";
import Stage from "../_modules/Stage";
import BoardCell from "./BoardCell";
import { boardNoise } from "./boardNoise";
import props from "./props";

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
    this.init(row, column, this.initCell);
  }

  getElevation(x, y) {
    const noiseElevation = Math.abs(boardNoise.perlin2((props.noiseX + x) * props.noiseScaleX, (props.noiseY + y + this.pathY) * props.noiseScaleY)) * props.noiseAmpl;
    const pathElevation = props.noisePathElevation - Math.abs(x - this.pathX) * props.noisePathElevation;
    const starterElevation = 0.25 + Math.min(1, y / 3);
    return Math.max(0,(noiseElevation + pathElevation) * starterElevation);
  }

  initCell(x, y) {
    const elevation = this.getElevation(x, y) * 0.5;
    const position = new Vector3(x, elevation, y);
    const isPath = this.pathX === x;
    const cell = new BoardCell(position, isPath);
    if (isPath) {
      this.pathCells.push(cell);
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
      const newElevation = this.getElevation(cell.x, cell.y);
      cell.setElevation(newElevation);
    });
  }

  update() {
    this.parse((cell) => {
      if (!cell || !cell.update) return;
      cell.update();
    })
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
