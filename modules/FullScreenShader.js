import { createProgramFromScript, createTexture, createTextureFromUrl } from 'utils.webgl';
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
  constructor(canvas, vert, frag, { responsive = true, preserveDrawingBuffer = false } = {}) {
    this.canvas = canvas;
    this.gl = this.canvas.getContext('webgl', { preserveDrawingBuffer });

    if (!this.gl) {
      console.error('ERROR: Webgl not supported !');
      return;
    }

    this.resize();

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
    this.resize = this.resize.bind(this);

    // Init the canvas size to fullscreen
    if (responsive) window.addEventListener('resize', this.resize);
  }

  // Resize the canvas to match in fullscreen
  resize() {
    const realToCSSPixels = window.devicePixelRatio;

    console.log('realToCSSPixels', realToCSSPixels);

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

    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  /**
   * * *******************
   * * UNIFORMS
   * * *******************
   */
  getUniformLocation(name) {
    return this.gl.getUniformLocation(this.program, name);
  }

  // float
  uniformFloat(name, f) {
    return this.setUniformFloat(this.getUniformLocation(name), f);
  }
  setUniformFloat(uniformLoc, f) {
    this.gl.uniform1f(uniformLoc, f);
    return uniformLoc;
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
  uniformTexture(name, textureId) {
    return this.setUniformTexture(this.getUniformLocation(name), textureId);
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

  /**
   * * *******************
   * * TEXTURE
   * * *******************
   */
  createTexture(data, props) {
    return createTexture(this.gl, data, props);
  }

  createTextureFromUrl(url, props) {
    return createTextureFromUrl(this.gl, url, props);
  }

  createRenderTarget(textureProps) {
    const texture = createTexture(this.gl, undefined, textureProps);

    // Create and bind the framebuffer
    const frameBuffer = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, frameBuffer);

    // attach the texture as the first color attachment
    const attachmentPoint = this.gl.COLOR_ATTACHMENT0;
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, attachmentPoint, this.gl.TEXTURE_2D, texture, 0);

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

    return { frameBuffer, texture };
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

  renderRenderTarget(frameBuffer, texture, size) {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fb);

    // render cube with our 3x2 texture
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

    // Tell WebGL how to convert from clip space to pixels
    this.gl.viewport(0, 0, targetTextureWidth, targetTextureHeight);

    // Clear the attachment(s).
    this.gl.clearColor(0, 0, 1, 1);   // clear to blue
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }

  /**
   * * *******************
   * * LOOP
   * * *******************
   */

  start(callback) {
    if (!this.isUpdated) {
      this.isUpdated = true;
      this.updateCallback = callback;
      this.update();
    }
  }

  stop() {
    this.isUpdated = false;
  }

  update() {
    if (this.updateCallback) this.updateCallback();
    this.render();
    if (this.isUpdated) requestAnimationFrame(this.update);
  }
}

