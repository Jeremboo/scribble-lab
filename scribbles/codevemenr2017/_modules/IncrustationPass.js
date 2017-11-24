import { ShaderMaterial, Color } from 'three';
import { Pass } from 'postprocessing/';

const incrustationShader = {
  uniforms: {
    tDiffuse: { value: null },
    tIncrustation: { value: null },
    incrustationColor: { value: new Color('#00ff00') },
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
    "uniform sampler2D tIncrustation;",
    "uniform vec3 incrustationColor;",

    "varying vec2 vUv;",

    "void main() {",
      "vec4 currentScreen = texture2D(tDiffuse, vUv);",
      "vec4 incrustation = texture2D(tIncrustation, vUv);",
      "if (currentScreen.xyz == incrustationColor) {",
        "currentScreen = incrustation;",
      "}",
      "gl_FragColor = currentScreen;",
    "}"
  ].join( "\n" )
}

export default class IncrustationPass extends Pass {
  constructor(texture) {
    super();

    // { color = 0x00ff00, image = false } = {}

    this.name = 'IncrustationPass';
    this.needsSwap = true;
    this.material = new ShaderMaterial(incrustationShader);
    this.material.uniforms.tIncrustation.value = texture;
    this.quad.material = this.material;
  }

  render(renderer, readBuffer, writeBuffer) {
    this.material.uniforms.tDiffuse.value = readBuffer.texture;
    renderer.render(this.scene, this.camera, this.renderToScreen ? null : writeBuffer);
  }
}
