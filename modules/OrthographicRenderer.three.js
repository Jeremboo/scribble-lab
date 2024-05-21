import { Scene, OrthographicCamera } from 'three';
import Renderer from './Renderer.three';

// NOTE 2021-11-02 jeremboo: Put to 2 if you want to have the best quality
const PIXEL_RATIO_MAX = 1.6; // 1.6 is normaly enought

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
    // TODO 2024-05-21 jeremboo:
  }
}