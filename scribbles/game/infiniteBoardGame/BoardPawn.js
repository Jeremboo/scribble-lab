import { CylinderBufferGeometry, MeshToonMaterial, Vector3 } from "three";
import Pawn from '../_modules/Pawn';
import OutlinableMesh from '../../../modules/Three/OutlinePass/OutlinableMesh';
import props from './props';

const PROPS = {
  radius: 0.25,
  height: 0.8,
  velocity: 0.91,
  jumpVelocity: 0.999
}

export default class BoardPawn extends Pawn {
  constructor(pawnProps) {
    super(pawnProps);
    this.mesh = new OutlinableMesh(new CylinderBufferGeometry(PROPS.radius, PROPS.radius, PROPS.height), new MeshToonMaterial({ color: "#7DB8AB" }));
    this.targetedPosition = new Vector3();
    this.currentPosition = new Vector3();
    this.ampl = 0;
    this.velocity = PROPS.velocity;
    this.dynamicAmpl = true;
    this.direction = 1;
  }

  moveTo(move = 1) {
    this.direction = move > 0 ? 1 : -1;
    this.y += move;
  }

  computeY(y) {
    return y + 2.08 + PROPS.height;
  }

  applyRulesOnPawnAdded() {}

  applyRulesFromCellLanded(cell) {
    this.targetedPosition.copy(cell.mesh.position);
    this.targetedPosition.y = this.computeY(this.targetedPosition.y);
  }

  applyRulesFromCellLeaved(cell) {}

  setElevation(y) {
    this.targetedPosition.y = this.computeY(y)
  }

  jump(to = 0.7) {
    const id = setInterval(() => {
      this.ampl += 0.07;
      this.velocity = PROPS.jumpVelocity;
      if (this.ampl > to) {
        clearInterval(id);
        this.velocity = PROPS.velocity
      }
    }, 10)
  }


  update() {
    const force = this.targetedPosition.clone().sub(this.currentPosition);
    this.currentPosition.add(force.multiplyScalar(props.velocity));
    this.mesh.position.copy(this.currentPosition);

    if (this.dynamicAmpl) {
      this.ampl += force.length();
    }
    this.mesh.position.y += Math.max(0, this.ampl);
    this.mesh.rotation.x = Math.max(-Math.PI * 0.15, Math.min(Math.PI * 0.25, this.ampl * 0.4 * this.direction));
    this.ampl *= this.velocity;
  }
}