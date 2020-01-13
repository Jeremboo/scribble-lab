import { createProgramFromScript } from 'utils.webgl';
import { hexToRgb } from 'utils';

/**
 * FULL SCREEN SHADER:
 *
 * https://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html
 * https://webglfundamentals.org/webgl/lessons/webgl-shaders-and-glsl.html
 * https://medium.com/@luruke/simple-postprocessing-in-three-js-91936ecadfb7
 * https://stackoverflow.com/questions/55197347/webgl-full-screen-quad-or-triangle-for-invoking-fragment-shader-for-every-pixel
 *
 */
export default class FullScreenShader {
  constructor(canvas, vert, frag) {
    this.canvas = canvas;
    this.gl = this.canvas.getContext('webgl');

    if (!this.gl) {
      console.error('ERROR: Webgl not supported !');
      return;
    }

    // Init the canvas size to fullscreen
    this.resize();
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    // INIT PROGRAM
    // Create the shaders and link them into a program
    this.program = createProgramFromScript(this.gl, vert, frag);
    // Tell to gl we want to use this program
    this.gl.useProgram(this.program);


    // Rendering
    // Turn the attribute on
    const positionAttributeLocation = this.gl.getAttribLocation(this.program, 'position');
    this.gl.enableVertexAttribArray(positionAttributeLocation);

    // Set usefull uniforms
    this.uniform2f('u_resolution', this.canvas.width, this.canvas.height);

    // Bind the position buffer.
    const positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);

    // Create the full screen triangle
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([ -1, -1, -1, 3, 3, -1]), this.gl.STATIC_DRAW);

    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    // ..., size, type, normalize, stride, offset
    this.gl.vertexAttribPointer(positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);

    this.update = this.update.bind(this);
  }

  // Resize the canvas to match in fullscreen
  resize() {
    const realToCSSPixels = window.devicePixelRatio;

    // Lookup the size the browser is displaying the canvas in CSS pixels
    // and compute a size needed to make our drawingbuffer match it in
    // device pixels.
    const displayWidth  = Math.floor(window.innerWidth * realToCSSPixels);
    const displayHeight = Math.floor(window.innerHeight * realToCSSPixels);

    // Check if the canvas is not the same size.
    if (this.canvas.width  !== displayWidth ||
        this.canvas.height !== displayHeight) {

      // Make the canvas the same size
      this.canvas.width  = displayWidth;
      this.canvas.height = displayHeight;
    }
  }

  /**
   * * *******************
   * * UNIFORMS
   * * *******************
   */
  getUniformLocation(name) {
    return this.gl.getUniformLocation(this.program, name);
  }

  // vec2
  uniform2f(name, x, y) {
    return this.setUniform2f(this.getUniformLocation(name), x, y);
  }
  setUniform2f(uniformLoc, x, y) {
    this.gl.uniform2f(uniformLoc, x, y);
    return uniformLoc;
  }
  // vec3
  uniform3f(name, x, y, z) {
    return this.setUniform3f(this.getUniformLocation(name), x, y, z);
  }
  setUniform3f(uniformLoc, x, y, z) {
    this.gl.uniform3f(uniformLoc, x, y, z);
    return uniformLoc;
  }
  // vec4
  uniform4f(name, x, y, z, w) {
    return this.setUniform4f(this.getUniformLocation(name), x, y, z, w);
  }
  setUniform3f(uniformLoc, x, y, z, w) {
    this.gl.uniform3f(uniformLoc, x, y, z, w);
    return uniformLoc;
  }
  // sampler2D
  uniformTexture(name, texture) {
    return this.setUniformTexture(this.getUniformLocation(name), texture);
  }
  setUniformTexture(uniformLoc, texture) {
    this.gl.uniform1i(uniformLoc, texture);
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

  /**
   * * *******************
   * * RENDER
   * * *******************
   */
  render() {
    // primitiveType, offset, count
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
  }

  /**
   * * *******************
   * * LOOP
   * * *******************
   */

  start() {
    if (!this.isUpdated) {
      this.isUpdated = true;
      this.update();
    }
  }

  stop() {
    this.isUpdated = false;
  }

  update() {
    this.render();
    if (this.isUpdated) requestAnimationFrame(this.update);
  }
}

