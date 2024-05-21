import { WebGLRenderer, Scene, PerspectiveCamera } from 'three';

// NOTE 2021-11-02 jeremboo: Put to 2 if you want to have the best quality
const PIXEL_RATIO_MAX = 1.6; // 1.6 is normaly enought

export default class Renderer extends WebGLRenderer {
  constructor(rendererProps) {
    super(rendererProps);

    this.width = 0;
    this.height = 0;

    this.count = 0;
    this.listeners = [];

    this.changePixelRatio();

    this.scene = new Scene();
    this.camera = rendererProps.camera || new PerspectiveCamera(50, this.aspectRatio, 1, 1000);
    this.camera.position.set(0, 0, 10);

    this.resize = this.resize.bind(this);
    this.update = this.update.bind(this);
  }

  changePixelRatio(pixelRatio = window.devicePixelRatio) {
    this.pixelRatio = Math.min(PIXEL_RATIO_MAX, pixelRatio) || 1
    this.setPixelRatio(this.pixelRatio);
  }

  /**
   * * *******************
   * * RESIZE
   * * *******************
   */
  resize({ pixelRatio, viewportWidth, viewportHeight }) {
    this.width = viewportWidth;
    this.height = viewportHeight;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    // Set the pixelRatio
    this.changePixelRatio(pixelRatio);

    // Set the sizes
    this.setSize(this.width, this.height, false);
  }

  /**
   * * *******************
   * * ADD / REMOVE
   * * *******************
   */

  add(mesh) {
    this.scene.add(mesh);
    this.addUpdate(mesh);
  }

  addUpdate(object) {
    if (!object.update) return;
    this.listeners.push(object.update);
    this.count++;
  }

  remove(mesh) {
    console.warn('TODO: Renderer.remove');
  }

  /**
   * * *******************
   * * UPDATE
   * * *******************
   */
  update(props) {
   let i = this.count;
   while (--i >= 0) {
      this.listeners[i](props)
    }
    this.render(this.scene, this.camera);
  }

  dispose() {
    console.warn('TODO');
  }
}