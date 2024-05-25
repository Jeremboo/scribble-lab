import { Group, Vector3 } from "three";
import Stage from "../_modules/Stage";
import BoardCell from "./BoardCell";
import { Noise } from 'noisejs';
import props from "./props";

const noise = new Noise();

export default class Board extends Stage {
    constructor(row, column) {
    super();

    this.group = new Group();

    this.pathX = Math.floor(row / 2);
    this.pathY = 0;

    this.regenerateNoise = this.regenerateNoise.bind(this);
    this.initCell = this.initCell.bind(this);

    this.pathCells = [];
    this.init(row, column, this.initCell);
  }

  getElevation(x, y) {
    const noiseElevation = Math.abs(noise.perlin2((props.noiseX + x) * props.noiseScaleX, (props.noiseY + y + this.pathY) * props.noiseScaleY)) * props.noiseAmpl;
    const pathElevation = props.noisePathElevation - Math.abs(x - this.pathX) * props.noisePathElevation;
    const starterElevation = 0.25 + Math.min(1, y / 3);
    return Math.max(0,(noiseElevation + pathElevation) * starterElevation);
  }

  initCell(x, y) {
    // const elevation = 0;
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

  changeColorPath(newColor) {
    this.pathCells.forEach((cell) => {
      cell.changeColorPath(newColor);
    });
  }

  regenerateNoise() {
    this.parse((cell) => {
      const newElevation = this.getElevation(cell.x, cell.y);
      cell.setElevation(newElevation);
    });
  }

  update() {
    this.parse((cell) => {
      cell.update();
    })
  }

  moveTo(move = 1) {
    this.pathY += move;
    this.regenerateNoise();
  }
}