import { PlaneBufferGeometry } from 'three';
import OutlinableMesh from '../../../modules/Three/OutlinePass/OutlinableMesh';
import surfaceFinder from '../../../modules/Three/OutlinePass/surfaceFinder';
import VoidPlaneMaterial from './VoidPlaneMaterial';
import VoidSurfaceMaterial from './VoidSurfaceMaterial';
import { GROUND_TILE_SIZE } from './Ground';

const SEGMENTS = 160;

/** One surface id for every void tile, so mounds don't outline against each other. */
const VOID_SURFACE_ID = surfaceFinder.allocate();

let sharedGeometry = null;

/** @type {{ material: VoidPlaneMaterial, customSurfaceMaterial: VoidSurfaceMaterial }[]} */
const materialPool = [];

function getSharedGeometry() {
  if (!sharedGeometry) {
    sharedGeometry = new PlaneBufferGeometry(
      GROUND_TILE_SIZE,
      GROUND_TILE_SIZE,
      SEGMENTS,
      SEGMENTS,
    );
  }
  return sharedGeometry;
}

function acquireMaterials(tileZ, field, frontUniform) {
  const pooled = materialPool.pop();
  if (pooled) {
    pooled.material.uniforms.uTileZ.value = tileZ;
    pooled.material.uniforms.uDead.value = field.texture;
    pooled.material.uniforms.uFrontY = frontUniform;
    pooled.customSurfaceMaterial.uniforms.uFrontY = frontUniform;
    pooled.material.syncFromProps();
    return pooled;
  }
  const material = new VoidPlaneMaterial(tileZ, field, frontUniform);
  return {
    material,
    customSurfaceMaterial: new VoidSurfaceMaterial(material.uniforms),
  };
}

function releaseMaterials(material, customSurfaceMaterial) {
  materialPool.push({ material, customSurfaceMaterial });
}

export default class VoidTile {
  /**
   * @param {number} tileZ
   * @param {import('./VoidField').default} field
   * @param {{ value: number }} frontUniform
   */
  constructor(tileZ, field, frontUniform) {
    this.tileZ = tileZ;
    const mats = acquireMaterials(tileZ, field, frontUniform);
    this.material = mats.material;
    this.mesh = new OutlinableMesh(getSharedGeometry(), this.material, VOID_SURFACE_ID);
    this.mesh.rotation.x = -Math.PI * 0.5;
    this.mesh.position.set(0, -0.25, tileZ);
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = false;
    this.mesh.renderOrder = 2;
    this.mesh.customSurfaceMaterial = mats.customSurfaceMaterial;
  }

  syncFromProps() {
    this.material.syncFromProps();
  }

  setPathY(y) {
    this.material.setPathY(y);
  }

  dispose() {
    this.mesh.disposeSurfaceIds();
    releaseMaterials(this.material, this.mesh.customSurfaceMaterial);
    this.mesh.customSurfaceMaterial = null;
  }
}
