import { BoxGeometry, Mesh, MeshBasicMaterial, MeshToonMaterial } from "three";
import Cell from "../_modules/Cell";
import props from './props';

const PATH_MATERIAL = new MeshToonMaterial({ color: '#B44351'})
const NEUTRAL_MATERIAL = new MeshToonMaterial({ color: '#F8D6C4'})

const HEIGHT = 5;

export default class BoardCell extends Cell {
  constructor(position, isPath) {
    super(position.x, position.z);
    position.y -= HEIGHT / 2 - 0.001;

    this.isPath = isPath;
    this.mesh = new Mesh(new BoxGeometry(1, HEIGHT, 1), isPath ? PATH_MATERIAL : NEUTRAL_MATERIAL)
    this.mesh.position.set(
      -props.boardWidth * 0.5 + position.x,
      position.y,
      -props.boardHeight * 0.5 + position.z,
    );
  }


  regenerateElevation(newElevation) {
    this.mesh.position.y = newElevation;
  }
}