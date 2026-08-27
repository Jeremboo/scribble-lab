import { PlaneBufferGeometry } from 'three';
import OutlinableMesh from '../../../modules/Three/OutlinePass/OutlinableMesh';
import GroundPlaneMaterial from './GroundPlaneMaterial';
import GroundSurfaceMaterial from './GroundSurfaceMaterial';
import props from './props';

const SEGMENTS = 128 * 2;

export const GROUND_TILE_SIZE = props.boardHeight * 5;
/** How far ahead of the board to keep a tile ready. */
export const GROUND_SPAWN_PADDING = GROUND_TILE_SIZE * 0.5;
/** Cull tiles once their front edge is this far behind the camera focus. */
export const GROUND_CULL_MARGIN = GROUND_TILE_SIZE * 0.5;

let sharedGeometry = null;

function getSharedGeometry(size) {
  if (!sharedGeometry) {
    sharedGeometry = new PlaneBufferGeometry(size, size, SEGMENTS, SEGMENTS);
  }
  return sharedGeometry;
}

export default class Ground {
  /**
   * @param {number} tileZ - scroll-space Z of the tile center (also baked into noise)
   * @param {number} [size]
   */
  constructor(tileZ = 0, size = GROUND_TILE_SIZE) {
    this.tileZ = tileZ;
    this.size = size;

    this.material = new GroundPlaneMaterial(tileZ);
    this.mesh = new OutlinableMesh(getSharedGeometry(size), this.material);
    this.mesh.rotation.x = -Math.PI * 0.5;
    this.mesh.position.set(0, -0.25, tileZ);
    this.mesh.receiveShadow = true;

    // OutlinePass surface pass must displace the same way as the visible material
    this.mesh.customSurfaceMaterial = new GroundSurfaceMaterial(this.material.uniforms);
  }

  syncFromProps() {
    this.material.syncFromProps();
  }

  setPathY(y) {
    this.material.setPathY(y);
  }

  dispose() {
    this.material.dispose();
    if (this.mesh.customSurfaceMaterial) {
      this.mesh.customSurfaceMaterial.dispose();
    }
  }
}
