import {
  BufferAttribute,
  Mesh,
} from 'three';
import surfaceFinder, {
  DEDICATED_SURFACE_IDS,
} from './surfaceFinder';


export default class OutlinableMesh extends Mesh {
  constructor(geometry, material, forcedSurfaceId) {
    super(geometry, material);
    const surfaceIdArray = surfaceFinder.getSurfaceIdAttribute(this)
    geometry.setAttribute('surfaceId', new BufferAttribute(surfaceIdArray, 1))
  }
}