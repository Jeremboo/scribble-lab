import { PerspectiveCamera } from 'three';
import Renderer from './Renderer.three';

export default class PerspectiveRenderer extends Renderer {
  constructor(rendererProps, fov, aspectRatio, near = 0, far = 10) {
    const camera = new PerspectiveCamera(fov, aspectRatio, near, far);
    if (rendererProps.zoom) {
      camera.zoom = rendererProps.zoom;
    }
    super({ ...rendererProps, camera });
    this.fov = fov;
  }

  setFov(fov) {
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
  }

  serAspectRatio(aspectRatio) {
    this.camera.aspect = aspectRatio;
    this.camera.updateProjectionMatrix();
  }

  setZoom(zoom) {
    this.camera.zoom = zoom;
    this.camera.updateProjectionMatrix();
  }
}
