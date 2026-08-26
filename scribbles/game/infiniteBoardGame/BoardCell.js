import {
  BoxBufferGeometry,
  MeshToonMaterial,
  Vector3,
  DataTexture,
  RGBFormat,
  NearestFilter,
} from "three";
import Cell from "../_modules/Cell";
import props from './props';
import OutlinableMesh from "../../../modules/Three/OutlinePass/OutlinableMesh";
import gsap from "gsap";

function createToonGradient() {
  const data = new Uint8Array([
    70, 70, 70,
    140, 140, 140,
    255, 255, 255,
  ]);
  const texture = new DataTexture(data, 3, 1, RGBFormat);
  texture.minFilter = NearestFilter;
  texture.magFilter = NearestFilter;
  texture.needsUpdate = true;
  return texture;
}

const toonGradient = createToonGradient();

const PATH_MATERIAL = new MeshToonMaterial({
  color: props.pathColors[0],
  gradientMap: toonGradient,
})
const NEUTRAL_MATERIAL = new MeshToonMaterial({
  color: props.neutralColor,
  gradientMap: toonGradient,
})

const HEIGHT = 5;
const ELEVATION = 0.25;

export default class BoardCell extends Cell {
  constructor(position, isPath) {
    super(position.x, position.z);

    this.isPath = isPath;
    this.mesh = new OutlinableMesh(new BoxBufferGeometry(1, HEIGHT, 1), isPath ? PATH_MATERIAL : NEUTRAL_MATERIAL)
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
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

  changeColorPath(color, duration = 0.25) {
    const _props = { color: '#' + PATH_MATERIAL.color.getHexString() }
    gsap.to(_props, { color, duration, onUpdate: () => {
      PATH_MATERIAL.color.set(_props.color)
    } })
  }

  update() {
    this.mesh.position.add(this.targetedPosition.clone().sub(this.mesh.position).multiplyScalar(props.velocity));
  }

  dispose() {
    this.mesh.geometry.dispose();
  }
}
