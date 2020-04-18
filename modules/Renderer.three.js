import { WebGLRenderer, Scene, PerspectiveCamera } from 'three';

export default class Renderer extends WebGLRenderer {
  constructor(rendererProps) {
    super(rendererProps);

    this.width = 0;
    this.height = 0;

    this.meshCount = 0;
    this.meshListeners = [];

    this.setPixelRatio(Math.min(1.6, window.devicePixelRatio) || 1);

    this.scene = new Scene();
    this.camera = new PerspectiveCamera(50, this.aspectRatio, 1, 1000);
    this.camera.position.set(0, 0, 10);

    this.resize = this.resize.bind(this);
    this.update = this.update.bind(this);
  }

  /**
   * * *******************
   * * RESIZE
   * * *******************
   */
  resize(width, height) {
    this.width = width;
    this.height = height;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

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
    if (!mesh.update) return;
    this.meshListeners.push(mesh.update);
    this.meshCount++;
  }

  remove(mesh) {
    console.warn('TODO: Renderer.remove');
  }

  /**
   * * *******************
   * * UPDATE
   * * *******************
   */
  update() {
   let i = this.meshCount;
   while (--i >= 0) {
      this.meshListeners[i].apply(this, null);
    }
    this.render(this.scene, this.camera);
  }

  dispose() {
    console.warn('TODO');
  }
}