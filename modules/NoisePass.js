import {
  ShaderMaterial
} from 'three';
import {
  Pass
} from 'postprocessing';

import fragmentShader from './shaders/noise.f.glsl';
import vertexShader from './shaders/noise.v.glsl';

export default class NoisePass extends Pass {
  constructor({
    range = 0.6,
    blackLayer = 1,
  }) {
    super();

    this.t = 0;

    this.name = 'NoisePass';
    this.needsSwap = true;
    this.material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        tDiffuse: {
          type: 't',
          value: null,
        },
        timer: {
          type: 'f',
          value: this.t,
        },
        blackLayer: {
          type: 'f',
          value: blackLayer,
        },
        range: {
          type: 'f',
          value: range,
        },
      },
    });
    this.quad.material = this.material;
  }

  render(renderer, readBuffer, writeBuffer) {
    this.t += 0.01;
    this.material.uniforms.timer.value = this.t;
    this.material.uniforms.tDiffuse.value = readBuffer.texture;
    renderer.render(this.scene, this.camera, this.renderToScreen ? null : writeBuffer);
  }
}
