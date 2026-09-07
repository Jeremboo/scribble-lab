import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Mesh,
  OrthographicCamera,
  ShaderMaterial,
} from 'three';
import { Pass } from 'postprocessing';
import gsap from 'gsap';

import vertexShader from './vert.glsl';
import fragmentShader from './frag.glsl';

class FullscreenTriangleGeometry extends BufferGeometry {
  constructor() {
    super();
    this.setAttribute(
      'position',
      new Float32BufferAttribute([-1, 3, 0, -1, -1, 0, 3, -1, 0], 3),
    );
    this.setAttribute('uv', new Float32BufferAttribute([0, 2, 0, 0, 2, 0], 2));
  }
}

const _geometry = new FullscreenTriangleGeometry();
const _camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

class FullScreenQuad {
  constructor(material) {
    this._mesh = new Mesh(_geometry, material);
  }

  dispose() {}

  render(renderer) {
    renderer.render(this._mesh, _camera);
  }
}

/**
 * Dual-color atmospheric fog as a post-process pass.
 * Color A (near) → Color B (far), blended by camera distance.
 * Depth comes from a shared source (typically DepthPass) via setDepthTexture().
 */
export function getAtmosphereFogColors(terrainColor, lift = 0.12) {
  const far = new Color(terrainColor);
  const near = far.clone().lerp(new Color('#ffffff'), lift);
  return {
    near: '#' + near.getHexString(),
    far: '#' + far.getHexString(),
  };
}

export default class AtmosphereFogPass extends Pass {
  /**
   * @param {import('three').Camera} camera
   * @param {object} [props]
   */
  constructor(camera, props = {}) {
    super('AtmosphereFogPass');

    this.camera = camera;
    this.depthTexture = null;

    const atmosphere =
      (props.terrainColors && props.terrainColors[0]) ||
      props.fogFarColor ||
      props.fogColorFar ||
      '#1A1210';
    const { near, far } = getAtmosphereFogColors(
      atmosphere,
      props.atmosphereFogLift != null ? props.atmosphereFogLift : 0.12,
    );

    this.material = new ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        depthBuffer: { value: null },
        cameraNear: { value: camera.near },
        cameraFar: { value: camera.far },
        fogColorNear: { value: new Color(near) },
        fogColorFar: { value: new Color(far) },
        fogNear: { value: props.fogNear != null ? props.fogNear : 45 },
        fogFar: { value: props.fogFar != null ? props.fogFar : 130 },
      },
      vertexShader,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
    });

    this.fsQuad = new FullScreenQuad(this.material);
  }

  dispose() {
    this.material.dispose();
    this.fsQuad.dispose();
  }

  /** Share a DepthTexture from DepthPass (or any other producer). */
  setDepthTexture(depthTexture) {
    this.depthTexture = depthTexture;
    this.material.uniforms.depthBuffer.value = depthTexture;
  }

  setAtmosphere(nearColor, farColor, duration = 0) {
    const near = this.material.uniforms.fogColorNear.value;
    const far = this.material.uniforms.fogColorFar.value;
    gsap.killTweensOf(near);
    gsap.killTweensOf(far);

    if (duration <= 0) {
      if (nearColor != null) near.set(nearColor);
      if (farColor != null) far.set(farColor);
      return;
    }

    if (nearColor != null) {
      const targetNear = new Color(nearColor);
      gsap.to(near, {
        r: targetNear.r,
        g: targetNear.g,
        b: targetNear.b,
        duration,
      });
    }
    if (farColor != null) {
      const targetFar = new Color(farColor);
      gsap.to(far, {
        r: targetFar.r,
        g: targetFar.g,
        b: targetFar.b,
        duration,
      });
    }
  }

  setFogRange(near, far) {
    this.material.uniforms.fogNear.value = near;
    this.material.uniforms.fogFar.value = far;
  }

  getFogColorFar() {
    return this.material.uniforms.fogColorFar.value;
  }

  syncCameraUniforms() {
    const camera = this.camera;
    const uniforms = this.material.uniforms;
    uniforms.cameraNear.value = camera.near;
    uniforms.cameraFar.value = camera.far;
    uniforms.depthBuffer.value = this.depthTexture;
  }

  render(renderer, inputBuffer, outputBuffer) {
    this.syncCameraUniforms();
    this.material.uniforms.tDiffuse.value = inputBuffer.texture;

    if (this.renderToScreen) {
      renderer.setRenderTarget(null);
    } else {
      renderer.setRenderTarget(outputBuffer);
    }
    this.fsQuad.render(renderer);
  }
}
