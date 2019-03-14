/**
 * @author jeremboo https://jeremieboulay.fr
 *
 * GPUSimulation, based on :
 *   - GPUComputationRenderer by yomboprime : https://threejs.org/examples/js/GPUComputationRenderer.js
 *   - Demo for THREE.FBOHelper by thespite : https://www.clicktorelease.com/code/THREE.FBOHelper/#512
 *   - FBO particles article by nicoptere   : http://barradeau.com/blog/?p=621
 *
 * The GPUSimulation build a Simulation of RGBA float textures that hold 4 floats for each compute element (texel)
 * Each simulation has a fragment shader that defines the computation made to obtain the texture.
 * The simulation has actually two fbo (render targets) per simulatioin, to make ping-pong.
 *
 *
 * Basic use:
 * -------------
 *
 * // In each frame...
 * gpuCompute.update();
 *
 * // Update texture uniforms in your visualization materials with the gpu renderer output
 * myMaterial.uniforms.myTexture.value = positionFBO.output.texture;
 *
 * // ... Do your rendering
 *
 *
 * Another utilities functions:
 * -------------
 *
 * - initHelper(w, h); - Enable the FBOHelper to show the textures computed
 * - createDataTexture(); - create a DataTexture() directly usable
 * - createSimulationShaderMaterial(simFragmentShader); - create a Material for the simulation
 *
 */
import {
  Scene, Mesh, OrthographicCamera, NearestFilter, RGBAFormat, FloatType,
  WebGLRenderTarget, BufferGeometry, BufferAttribute, DataTexture,
  ClampToEdgeWrapping, ShaderMaterial,
} from 'three';

import FBOHelper from 'three.fbo-helper';

/**
 * *********
 * CONST
 * *********
 */

/* Default fragment shader for the begining */
const DEFAULT_SIMULATION_FRAGMENT_SHADER = `
uniform sampler2D texture;
varying vec2 vUv;

void main() {
  gl_FragColor = texture2D( texture, vUv );
}
`;

/* Default vertex shader for each Simulation Shader Material */
const DEFAULT_SIMULATION_VERTEX_SHADER = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4( position, 1.0 );
}
`;

/* Default uniform to each FBO texture */
const DEFAULT_UNIFORM = { texture: { type: 't', value: null } };


/**
 * *********
 * GPU SIMULATION
 * *********
 * GPU Compuration to texture rendering
 */
export default class GPUSimulation {
  /**
   * Create a GPUSimulation to render a plane where is mapped a computed texture
   * @param {number} width - the size of each textures
   * @param {number} height - the size of each textures
   * @param {object} renderer - The webgl renderer
   */
  constructor(width, height, renderer) {
    if (!renderer.extensions.get('OES_texture_float')) {
      return 'No OES_texture_float support for float textures.';
    }

    if (renderer.capabilities.maxVertexTextures === 0) {
      return 'No support for vertex shader textures.';
    }

    this.width = width;
    this.height = height;
    this.renderer = renderer;
    this.simulations = [];
    this.currentFboTextureIdx = 0;
    this.helper = false;

    // Scene and camera
    this.scene = new Scene();
    this.orthoCamera = new OrthographicCamera(-1, 1, 1, -1, 1 / Math.pow(2, 53), 1);

    // Mesh to show each simulation texture
    const geom = new BufferGeometry(); // or new PlaneBufferGeometry( 2, 2 );
    geom.addAttribute('position', new BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
    geom.addAttribute('uv', new BufferAttribute(new Float32Array([0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0]), 2));
    const material = this.createSimulationShaderMaterial(
      DEFAULT_SIMULATION_FRAGMENT_SHADER,
      DEFAULT_UNIFORM
    );
    this.mesh = new Mesh(geom, material);
    this.scene.add(this.mesh);
  }


  /**
   * *********
   * CREATE
   * *********
   */

  /**
   * Create a simulation computed by the renderer to update a FBO texture
   * @param {String} name - the name of the simulation
   * @param {String} simFragmentShader - the shader used to compute
   * @param {DataTexture} initialDataTexture - the initial value of the texture
   * @param {Object} props -
   *   @param {Number} width - width for the WegGLRenderer. By default the same as the class.
   *   @param {Number} height - height for the WegGLRenderer. By default the same as the class.
   *   @param {Object} uniforms - uniforms for the shader material built
   *   @param {...} ... - another params for the WebGLRenderTarget class
   *
   * @return {Object} Simulation -
   */
  // TODO create a simulation who update only with the initial dataTexture
  createSimulation(name, simFragmentShader, initialDataTexture, {
    width = this.width,
    height = this.height,
    uniforms = {},
    wrapS = ClampToEdgeWrapping,
    wrapT = ClampToEdgeWrapping,
    minFilter = NearestFilter,
    magFilter = NearestFilter,
    format = RGBAFormat, // RGBFormat
    type = FloatType, // ( /(iPad|iPhone|iPod)/g.test( navigator.userAgent ) ) ? HalfFloatType : FloatType,
   } = {}) {
    /* FBO to capture the texture render */
    console.log(width, height)
    const fbo = new WebGLRenderTarget(width, height, {
      wrapS,
      wrapT,
      minFilter,
      magFilter,
      format, // Could be RGBFormat
      type, // important as we need precise coordinates (not ints)
      // stencilBuffer: false,
      // depthBuffer: false,
    });
    // fbo.texture.generateMipmaps = false;
    const fboClone = fbo.clone();

    // Set the first render with the inital values
    this.renderTexture(initialDataTexture, fbo);
    this.renderTexture(initialDataTexture, fboClone);


    /* MATERIAL to compute the new texture */
    const material = this.createSimulationShaderMaterial(
      simFragmentShader,
      Object.assign(uniforms, DEFAULT_UNIFORM),
    );

    /* SIMULATION - TODO could be a class */
    const simulation = {
      name,
      material,
      initialDataTexture,
      // two fbo (render targets) per simulatioin, to make ping-pong.
      fbos: [fbo, fboClone],
      output: fbo,
    };

    // save the new simulation
    this.simulations.push(simulation);
    if (this.helper) {
      // this.helper.attach(simulation.output, name);
      this.helper.attach(simulation.fbos[0], name);
      this.helper.attach(simulation.fbos[1], name + "1");
    }

    return simulation;
  }

  /**
   * Create a DataTexture directly usable
   * @param {object} props - params of DataTexture setted by default
   *   @param {...} ...
   *
   * @returns {DataTexture}
   */
  createDataTexture({
    format = RGBAFormat, type = FloatType, width = this.width, height = this.height,
  } = {}) {
    const dt = new DataTexture(new Float32Array(width * height * 4), width, height, format, type);
    dt.minFilter = NearestFilter;
    dt.magFilter = NearestFilter;
    dt.needsUpdate = true;
    return dt;
  }

  /**
   * Create a Simulation Shader Material to compute the texture.
   * Vertex shader is added by default because it is just a texture render
   * @param {String} simFragmentShader the shader to compute the texture
   * @param {Object} uniforms optionnal uniforms
   * @returns {ShaderMaterial}
   */
  createSimulationShaderMaterial(simFragmentShader, uniforms) {
    const material = new ShaderMaterial({
      uniforms,
      vertexShader: DEFAULT_SIMULATION_VERTEX_SHADER,
      fragmentShader: simFragmentShader,
    });
    return material;
  }


  /**
   * *********
   * LOOP
   * *********
   */

  /**
   * Update each simulations
   */
  update() {
    // Update the current index to switch between fbos input/output
    this.currentFboTextureIdx = 1 - this.currentFboTextureIdx;

    let i;
    const length = this.simulations.length;
    for (i = 0; i < length; i++) {
      this.updateSimulation(this.simulations[i]);
    }

    if (this.helper) this.helper.update();
  }

  /**
   * Compute a simulation. Could be called alone to update only one simulation
   * with a different input.
   * EX: gpuSim.updateSimulation(sim, sim.initialDataTexture);
   * WARNING: if the input is not referenced, you must manually update the
   * currentFboTextureIdx : this.currentFboTextureIdx = 1 - this.currentFboTextureIdx;
   * @param {Simulation} simulation - simulation build by the GPUSim
   * @param {WebGLRenderTarget} {DataTexture} input
   */
  updateSimulation(simulation, input = simulation.output) {
    // set the current simulation material
    this.mesh.material = simulation.material;
    // compute
    this.renderTexture(
      input.texture,
      simulation.fbos[this.currentFboTextureIdx]
    );
    // save the render to the output
    simulation.output = simulation.fbos[this.currentFboTextureIdx];
  }


  /**
   * Compute the input texture and save the
   * result in the output.
   * @param {WebGLRenderTarget} {DataTexture} input
   * @param {WebGLRenderTarget} output
   */
  renderTexture(input, output) {
    const currentRenderTarget = this.renderer.getRenderTarget();

    this.mesh.material.uniforms.texture.value = input;

    this.renderer.setRenderTarget(output);
    this.renderer.render(this.scene, this.orthoCamera);

    this.renderer.setRenderTarget( currentRenderTarget );
  }


  /**
   * *********
   * HELPER
   * *********
   */

  /**
   * Enable the FBO Helper
   * Must be called before any createSimulation() call.
   * @param {number} width for the size of the canvas
   * @param {number} height for the size of the canvas
   */
  initHelper(w, h) {
    this.helper = new FBOHelper(this.renderer);
    this.helper.setSize(w, h);
  }
}
