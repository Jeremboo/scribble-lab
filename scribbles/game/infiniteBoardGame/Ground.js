import { PlaneBufferGeometry } from 'three';
import gsap from 'gsap';
import OutlinableMesh from '../../../modules/Three/OutlinePass/OutlinableMesh';
import GroundPlaneMaterial from './GroundPlaneMaterial';
import GroundSurfaceMaterial from './GroundSurfaceMaterial';
import props from './props';

const SEGMENTS = 128;

export const GROUND_TILE_BOARD_HEIGHTS = 6;
export const GROUND_TILE_SIZE = props.boardHeight * GROUND_TILE_BOARD_HEIGHTS;

let sharedGeometry = null;

/** @type {{ material: GroundPlaneMaterial, customSurfaceMaterial: GroundSurfaceMaterial }[]} */
const materialPool = [];

function getSharedGeometry(size) {
  if (!sharedGeometry) {
    sharedGeometry = new PlaneBufferGeometry(size, size, SEGMENTS, SEGMENTS);
  }
  return sharedGeometry;
}

function acquireMaterials(tileZ) {
  const pooled = materialPool.pop();
  if (pooled) {
    gsap.killTweensOf(pooled.material._bgColorTween);
    pooled.material.uniforms.uTileZ.value = tileZ;
    pooled.material.syncFromProps();
    return pooled;
  }
  const material = new GroundPlaneMaterial(tileZ);
  return {
    material,
    customSurfaceMaterial: new GroundSurfaceMaterial(material.uniforms),
  };
}

function releaseMaterials(material, customSurfaceMaterial) {
  // Keep compiled ShaderMaterials alive across tile eviction (three@0.116).
  gsap.killTweensOf(material._bgColorTween);
  materialPool.push({ material, customSurfaceMaterial });
}

export default class Ground {
  /**
   * @param {number} tileZ - scroll-space Z of the tile center (also baked into noise)
   * @param {number} [size]
   */
  constructor(tileZ = 0, size = GROUND_TILE_SIZE) {
    this.tileZ = tileZ;
    this.size = size;

    const mats = acquireMaterials(tileZ);
    this.material = mats.material;
    this.mesh = new OutlinableMesh(getSharedGeometry(size), this.material);
    this.mesh.rotation.x = -Math.PI * 0.5;
    this.mesh.position.set(0, -0.25, tileZ);
    this.mesh.receiveShadow = true;

    // OutlinePass surface pass must displace the same way as the visible material
    this.mesh.customSurfaceMaterial = mats.customSurfaceMaterial;
  }

  syncFromProps() {
    this.material.syncFromProps();
  }

  setPathY(y) {
    this.material.setPathY(y);
  }

  setBgColor(color, duration) {
    this.material.setBgColor(color, duration);
  }

  dispose() {
    this.mesh.disposeSurfaceIds();
    releaseMaterials(this.material, this.mesh.customSurfaceMaterial);
    this.mesh.customSurfaceMaterial = null;
  }
}
