import { PlaneBufferGeometry } from 'three';
import OutlinableMesh from '../../../modules/Three/OutlinePass/OutlinableMesh';
import GroundPlaneMaterial from './GroundPlaneMaterial';
import GroundSurfaceMaterial from './GroundSurfaceMaterial';
import props from './props';

const SEGMENTS = 128 * 2;

export default class Ground {
  constructor() {
    const size = props.boardHeight * 5;
    this.material = new GroundPlaneMaterial();
    this.mesh = new OutlinableMesh(
      new PlaneBufferGeometry(size, size, SEGMENTS, SEGMENTS),
      this.material
    );
    this.mesh.rotation.x = -Math.PI * 0.5;
    this.mesh.position.y = 0;
    this.mesh.receiveShadow = true;

    // OutlinePass surface pass must displace the same way as the visible material
    this.mesh.customSurfaceMaterial = new GroundSurfaceMaterial(this.material.uniforms);
  }

  syncFromProps() {
    this.material.syncFromProps();
  }

  setScrollZ(z) {
    this.material.setScrollZ(z);
  }

  setPathY(y) {
    this.material.setPathY(y);
  }
}
