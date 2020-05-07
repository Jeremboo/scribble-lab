import { ShaderMaterial } from 'three';
import { Pass } from 'postprocessing/';

const metaballShader = {
  uniforms: {
    tDiffuse: { value: null },
  },

  vertexShader: [
    "varying vec2 vUv;",

    "void main() {",
      "vUv = uv;",
      "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
    "}"
  ].join( "\n" ),

  fragmentShader: [
    "uniform sampler2D tDiffuse;",
    "varying vec2 vUv;",
    "void main() {",
      "vec4 currentScreen = texture2D(tDiffuse, vUv);",
      "gl_FragColor = vec4(currentScreen.xyz * 1.5, currentScreen.w) * max(sign(currentScreen.w - 0.8), 0.0);",
      // "gl_FragColor = currentScreen;",
    "}"
  ].join( "\n" )
}

export default class IncrustationPass extends Pass {
  constructor() {
    super();


    this.name = 'MetaballPass';
    this.needsSwap = true;
    this.material = new ShaderMaterial(metaballShader);
    this.quad.material = this.material;
  }

  render(renderer, readBuffer, writeBuffer) {
    this.material.uniforms.tDiffuse.value = readBuffer.texture;
    renderer.render(this.scene, this.camera, this.renderToScreen ? null : writeBuffer);
  }
}
