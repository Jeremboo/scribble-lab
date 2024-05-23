import { OrthographicCamera } from 'three';
import Renderer from './Renderer.three';

export default class OrthographicRenderer extends Renderer {
  constructor(rendererProps) {
    const zoom = rendererProps.zoom || 1;
    const camera = new OrthographicCamera(
      1 / -2 * zoom,
      1 / 2 * zoom,
      1 / 2 * zoom,
      1 / -2 * zoom,
      1, 1000);
    super({ ...rendererProps, camera });
    this.zoom = zoom;
  }

  setZoom(zoom) {
    this.camera.left = 1 / -2 * zoom;
    this.camera.right = 1 / 2 * zoom;
    this.camera.top = 1 / 2 * zoom;
    this.camera.bottom = 1 / -2 * zoom;
    this.camera.updateProjectionMatrix();
  }
}