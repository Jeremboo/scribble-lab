import {
  ShaderMaterial
} from 'three';
import {
  Pass
} from 'postprocessing';

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
      vertexShader: `
        varying vec2 vUv;

        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float timer;
        uniform float blackLayer;
        uniform float range;

        varying vec2 vUv;

        // 2D Random
        float random (in vec2 st) {
            return fract(sin(dot(
              st.xy,
              vec2(12.9898,78.233))) * 43758.5453123
            );
        }

        void main() {
          vec4 color = texture2D(tDiffuse, vUv);
          float rand = max(random(vUv * timer), range);
          gl_FragColor = vec4(color.xyz * rand * blackLayer, color.a);
        }
      `,
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
