import { ShaderMaterial } from 'three';
import { Pass } from 'postprocessing';

const colorMatrixShader = {
  uniforms: {
    "tDiffuse": {value: null},
    "uMatrix": {value: []},
    "uMultiplier": {value: []}
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
    "uniform mat4 uMatrix;",
    "uniform vec4 uMultiplier;",

    "varying vec2 vUv;",

    "void main() {",
      "vec4 color = texture2D(tDiffuse, vUv);",
      "mat4 colMat = mat4(",
        "color.r, 0, 0, 0,",
        "0, color.g, 0, 0,",
        "0, 0, color.b, 0,",
        "0, 0, 0, color.a",
      ");",
      "mat4 product = colMat * uMatrix;",
      "color.r = product[0].x + product[0].y + product[0].z + product[0].w + uMultiplier.x;",
      "color.g = product[1].x + product[1].y + product[1].z + product[1].w + uMultiplier.y;",
      "color.b = product[2].x + product[2].y + product[2].z + product[2].w + uMultiplier.z;",
      "color.a = product[3].x + product[3].y + product[3].z + product[3].w + uMultiplier.w;",
      "gl_FragColor = color;",
    "}"
  ].join( "\n" )
};

export default class ColorMatrixPass extends Pass {

  constructor() {

    super();

    this.name = "ColorMatrixPass";
    this.needsSwap = true;
    this.material = new ShaderMaterial(colorMatrixShader);
    this.quad.material = this.material;
  }

  render(renderer, readBuffer, writeBuffer) {
    // this.material.uniforms.tDiffuse.value = readBuffer.texture;
    renderer.render(this.scene, this.camera, this.renderToScreen ? null : writeBuffer);
  }
}
