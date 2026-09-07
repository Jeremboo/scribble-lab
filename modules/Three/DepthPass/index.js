import {
  DepthTexture,
  NearestFilter,
  UnsignedIntType,
  WebGLRenderTarget,
} from 'three';
import { Pass } from 'postprocessing';

/**
 * Renders the scene into a DepthTexture without touching the color chain
 * (`needsSwap = false`). Share via `getDepthTexture()` / `setDepthTexture`
 * on any number of later passes (fog, DOF, AO, …).
 *
 * Kept separate from beauty targets on purpose: attaching a DepthTexture to
 * the lit color RT regresses supersampled edge quality on three@0.116.
 */
export default class DepthPass extends Pass {
  constructor(scene, camera) {
    super('DepthPass', scene, camera);

    this.needsSwap = false;

    this.depthTexture = new DepthTexture(1, 1, UnsignedIntType);
    this.renderTarget = new WebGLRenderTarget(1, 1, {
      depthTexture: this.depthTexture,
      depthBuffer: true,
      stencilBuffer: false,
    });
    this.renderTarget.texture.minFilter = NearestFilter;
    this.renderTarget.texture.magFilter = NearestFilter;
  }

  getDepthTexture() {
    return this.depthTexture;
  }

  setSize(width, height) {
    this.renderTarget.setSize(
      Math.max(1, Math.round(width)),
      Math.max(1, Math.round(height)),
    );
  }

  dispose() {
    this.renderTarget.dispose();
    this.depthTexture.dispose();
  }

  render(renderer) {
    renderer.setRenderTarget(this.renderTarget);
    renderer.clear();
    renderer.render(this.scene, this.camera);
  }
}
