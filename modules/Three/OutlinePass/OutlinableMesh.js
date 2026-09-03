import {
  BufferAttribute,
  Mesh,
} from 'three';
import surfaceFinder from './surfaceFinder';


export default class OutlinableMesh extends Mesh {
  constructor(geometry, material, forcedSurfaceId) {
    super(geometry, material);
    if (!geometry.getAttribute('surfaceId')) {
      const surfaceIdArray = surfaceFinder.getSurfaceIdAttribute(this, forcedSurfaceId)
      geometry.setAttribute('surfaceId', new BufferAttribute(surfaceIdArray, 1))
    }
    surfaceFinder.retain(geometry)
  }

  disposeSurfaceIds() {
    surfaceFinder.release(this.geometry)
  }
}
