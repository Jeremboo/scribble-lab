import {BoxBufferGeometry, MeshToonMaterial, Vector3 } from "three";
import Cell from "../_modules/Cell";
import props from './props';
import OutlinableMesh from "../../../modules/Three/OutlinePass/OutlinableMesh";

const PATH_MATERIAL = new MeshToonMaterial({ color: props.pathColor})
const NEUTRAL_MATERIAL = new MeshToonMaterial({ color: props.mainColor})

const HEIGHT = 5;
const ELEVATION = 0.25;

export default class BoardCell extends Cell {
  constructor(position, isPath) {
    super(position.x, position.z);

    this.isPath = isPath;
    this.mesh = new OutlinableMesh(new BoxBufferGeometry(1, HEIGHT, 1), isPath ? PATH_MATERIAL : NEUTRAL_MATERIAL)
    this.targetedPosition = new Vector3(
      -props.boardWidth * 0.5 + position.x,
      this.computeY(position.y),
      -props.boardHeight * 0.5 + position.z,
    );
    this.mesh.position.copy(this.targetedPosition);

    this.update = this.update.bind(this);
  }

  computeY(y) {
    return y - HEIGHT / 2 + ELEVATION;
  }

  setElevation(newElevation) {
    this.targetedPosition.y = this.computeY(newElevation);
    this.pawns.forEach((pawn) => {
      pawn.setElevation(this.targetedPosition.y);
    });
  }

  update() {
    this.mesh.position.add(this.targetedPosition.clone().sub(this.mesh.position).multiplyScalar(props.velocity));
  }
}