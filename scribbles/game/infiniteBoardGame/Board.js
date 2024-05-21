import { Group, Vector3 } from "three";
import Grid from "../_modules/Grid";
import BoardCell from "./BoardCell";
import { Noise } from 'noisejs';
import props from "./props";

const noise = new Noise();


// TODO 2024-05-21 jeremboo: Split engine to renderer
export default class Board extends Grid {
    constructor(x, y) {
    super();
    this.group = new Group();

    this.pathX = Math.floor(x / 2);

    this.regenerateNoise = this.regenerateNoise.bind(this);
    this.initCell = this.initCell.bind(this);

    this.init(x, y, this.initCell)
  }


  getElevation(x, y) {
    const noiseElevation = Math.abs(noise.perlin2(props.noiseX + x * props.noiseScaleX, props.noiseY + y * props.noiseScaleY)) * props.noiseAmpl;
    const pathElevation = props.noisePathElevation - Math.abs(x - this.pathX) * props.noisePathElevation;
    const starterElevation = 0.25 + Math.min(1, y / 3);
    return Math.max(0,(noiseElevation + pathElevation) * starterElevation);
  }

  initCell(x, y) {
    const elevation = this.getElevation(x, y);
    const position = new Vector3(x, elevation, y);
    const isPath = this.pathX === x;
    const cell = new BoardCell(position, isPath);
    this.group.add(cell.mesh);
    return cell;
  }


  regenerateNoise() {
    this.parse((cell) => {
      const newElevation = this.getElevation(cell.x, cell.y);
      cell.regenerateElevation(newElevation);
    });
  }

  update() {
    // this.group.rotation.y += 0.01;
  }
}