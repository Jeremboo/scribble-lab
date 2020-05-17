import Program from './Program';
import { createTexture, createTextureFromUrl } from './utils.webgl';

/**
 * FULL SCREEN SHADER:
 *
 * https://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html
 * https://webglfundamentals.org/webgl/lessons/webgl-shaders-and-glsl.html
 * https://medium.com/@luruke/simple-postprocessing-in-three-js-91936ecadfb7
 * https://stackoverflow.com/questions/55197347/webgl-full-screen-quad-or-triangle-for-invoking-fragment-shader-for-every-pixel
 *
 */
export default class FullScreenShader extends Program {
  constructor(context, vert, frag) {
    super(context, vert, frag);

    if (!(this.gl instanceof WebGLRenderingContext)) {
      console.error('ERROR: The context is not a webgl context !');
      return;
    }

    this.resize(this.canvas.width, this.canvas.height);

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

    this.resize = this.resize.bind(this);
    this.render = this.render.bind(this);

    this.resize(this.canvas.width, this.canvas.height);

     // Tell to gl we want to use this program
     this.gl.useProgram(this.program);
  }

  // Resize the canvas to match in fullscreen
  resize(width, height) {
    const realToCSSPixels = window.devicePixelRatio;

    // Lookup the size the browser is displaying the canvas in CSS pixels
    // and compute a size needed to make our drawingbuffer match it in
    // device pixels.
    const displayWidth  = Math.floor(width * realToCSSPixels);
    const displayHeight = Math.floor(height * realToCSSPixels);

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
}

