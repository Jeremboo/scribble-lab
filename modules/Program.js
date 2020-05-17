import { hexToRgb } from './utils';
import { createProgramFromScript, createAttribute } from "./utils.webgl";


export const getContext = (canvas, { preserveDrawingBuffer = false }) => {
  const context = canvas.getContext('webgl', { preserveDrawingBuffer })
  if (!context) {
    console.error('ERROR: Webgl not supported !');
  }
  return context;
}

/**
 * FULL SCREEN SHADER:
 *
 * https://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html
 * https://webglfundamentals.org/webgl/lessons/webgl-shaders-and-glsl.html
 * https://medium.com/@luruke/simple-postprocessing-in-three-js-91936ecadfb7
 * https://stackoverflow.com/questions/55197347/webgl-full-screen-quad-or-triangle-for-invoking-fragment-shader-for-every-pixel
 *
 */
// TODO 2020-05-16 jeremboo: Improve the uniform usage
export default class Program {
  constructor(context, vert, frag) {
    this.gl = context;
    this.canvas = this.gl.canvas;
    this.program = createProgramFromScript(this.gl, vert, frag);

    this.gl.useProgram(this.program);
  }

  /**
   * * *******************
   * * ATTRIBUTES
   * * *******************
   */

   createAttribute(name, data, size, options) {
     createAttribute(this.gl, this.program, name, data, size, options);
   }

  /**
   * * *******************
   * * UNIFORMS
   * * *******************
   */
  getUniform(uniformLocation) {
    return this.gl.getUniform(this.program, uniformLocation);
  }

  _getUniformLocation(name) {
    return this.gl.getUniformLocation(this.program, name);
  }
  // float
  uniformFloat(name, f) {
    return this.setUniformFloat(this._getUniformLocation(name), f);
  }
  setUniformFloat(uniformLoc, f) {
    this.gl.uniform1f(uniformLoc, f);
    return uniformLoc;
  }
  // vec2
  uniform2f(name, x, y) {
    return this.setUniform2f(this._getUniformLocation(name), x, y);
  }
  setUniform2f(uniformLoc, x, y) {
    this.gl.uniform2f(uniformLoc, x, y);
    return uniformLoc;
  }
  // vec3
  uniform3f(name, x, y, z) {
    return this.setUniform3f(this._getUniformLocation(name), x, y, z);
  }
  setUniform3f(uniformLoc, x, y, z) {
    this.gl.uniform3f(uniformLoc, x, y, z);
    return uniformLoc;
  }
  // vec4
  uniform4f(name, x, y, z, w) {
    return this.setUniform4f(this._getUniformLocation(name), x, y, z, w);
  }
  setUniform3f(uniformLoc, x, y, z, w) {
    this.gl.uniform3f(uniformLoc, x, y, z, w);
    return uniformLoc;
  }
  // sampler2D
  uniformTexture(name, textureId) {
    return this.setUniformTexture(this._getUniformLocation(name), textureId);
  }
  setUniformTexture(uniformLoc, textureId) {
    this.gl.uniform1i(uniformLoc, textureId);
    return uniformLoc;
  }
  // Color
  uniformColor(name, hex) {
    const { r, g, b } = hexToRgb(hex);
    return this.uniform3f(name, r / 255, g / 255, b / 255);
  }
  setUniformColor(uniformLoc, hex) {
    const { r, g, b } = hexToRgb(hex);
    return this.gl.uniform3f(uniformLoc, r / 255, g / 255, b / 255);
  }
}