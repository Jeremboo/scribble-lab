import { DIRECTION } from './keys';

const noOp = () => null;

export default class Grid {
  constructor() {
    this.row = 0;
    this.column = 1;
    this.grid = [];
  }

  init(row, column, onNewCell) {
    this.row = row;
    this.column = column;
    for (let y = 0; y < this.column; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.row; x++) {
        this.grid[y][x] = onNewCell(x, y) || true;
      }
    }
  }

  /**
   * * *******************
   * * CELL
   * * *******************
   */

  getCell(row, column) {
    return (this.isCellExists(row, column) && this.grid[column][row]) || false;
  }

  setCell(row, column, content) {
    if (this.isCellExists(row, column)) {
      this.grid[column][row] = content;
      return true;
    }
    return false;
  }

  createCell(row, column, content) {
    // Expend the existing rows length
    if (row > this.row - 1) {
      for (let y = 0; y < this.column; y++) {
        for (let x = this.row; x <= row; x++) {
          this.grid[y][x] = true;
        }
      }
      this.row = row + 1;
    }
    // Expend the columns length
    if (column > this.column - 1) {
      for (let y = this.column; y <= column; y++) {
        this.grid[y] = [];
        for (let x = 0; x < this.row; x++) {
          this.grid[y][x] = true;
        }
      }
      this.column = column + 1;
    }
    return this.setCell(row, column, content);
  }

  isCellExists(row, column) {
    return this.grid[column] && typeof this.grid[column][row] !== 'undefined';
  }

  /**
   * * *******************
   * * GETTERS
   * * *******************
   */

  getRandomColumnPosition(margin = 0) {
    return margin + Math.round(Math.random() * (this.column - 1 - margin * 2));
  }

  getRandomRowPosition(margin = 0) {
    return margin + Math.round(Math.random() * (this.row - 1 - margin * 2));
  }

  getRandomPosition(margin) {
    return { row: this.getRandomRowPosition(margin), column: this.getRandomColumnPosition(margin) };
  }

  getRandomBorderPosition() {
    let column, row;

    const isHorizontal = Math.random() > 0.5;
    if (isHorizontal) {
      column = this.getRandomColumnPosition(1);
      row = Math.random() > 0.5 ? 0 : this.column - 1;
    } else {
      column = Math.random() > 0.5 ? 0 : this.row - 1;
      row = this.getRandomRowPosition(1);
    }

    return { row, column };
  }

  // TODO 2021-09-15 jeremboo: can be global
  getNeighboringPositionFromDirection(currentX, currentY, direction) {
    let x = currentX;
    let y = currentY;
    switch (direction) {
      case DIRECTION.RIGHT:
        x += 1;
        break;
      case DIRECTION.LEFT:
        x -= 1;
        break;
      case DIRECTION.BOTTOM:
        y += 1;
        break;
      default:
        y -= 1;
        break;
    }
    return { x, y };
  }

  getRow(column) {
    return this.grid[column] || [];
  }

  getColumn(row) {
    const _row = [];
    for (let i = 0; i < this.column; i++) {
      _row.push(this.grid[i][row]);
    }
    return _row;
  }

  /**
   * * *******************
   * * UTILS
   * * *******************
   */

  parse(callback) {
    this.grid.forEach((row) => {
      row.forEach((cell) => {
        callback(cell);
      });
    });
  }

  parseCoordinates(coordinates, callback = noOp) {
    coordinates.forEach((props) => {
      callback(this.getCell(props.x, props.y), props);
    });
  }

  parseNeighbor(x, y, callback) {
    this.parseCoordinates(
      [
        { x: x + 1, y, direction: DIRECTION.RIGHT }, // right: ;
        { x: x - 1, y, direction: DIRECTION.LEFT }, // left
        { x, y: y + 1, direction: DIRECTION.TOP }, // top
        { x, y: y - 1, direction: DIRECTION.BOTTOM } // bottom
      ],
      callback
    );
  }

  parseNeighborAndCorners(x, y, callback) {
    this.parseNeighbor(x, y, callback);
    this.parseCoordinates(
      [
        { x: x - 1, y: y - 1, direction: [DIRECTION.BOTTOM, DIRECTION.LEFT] }, // bottom - left
        { x: x + 1, y: y - 1, direction: [DIRECTION.BOTTOM, DIRECTION.RIGHT] }, // bottom - right
        { x: x - 1, y: y + 1, direction: [DIRECTION.TOP, DIRECTION.LEFT] }, // top - left
        { x: x + 1, y: y + 1, direction: [DIRECTION.TOP, DIRECTION.RIGHT] } // top - right
      ],
      callback
    );
  }
}