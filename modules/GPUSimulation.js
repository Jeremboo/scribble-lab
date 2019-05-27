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
 * - createSimulationShaderMaterial(simFragmentShader, { uniforms }); - create a Material for the simulation
 * - defineTextureSize(nbrOfParticle); - Return the texture optimal texture size to use.
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

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  gl_FragColor = texture2D( texture, uv );
}
`;

/* Default vertex shader for each Simulation Shader Material */
const DEFAULT_SIMULATION_VERTEX_SHADER = `
void main() {
  gl_Position = vec4( position, 1.0 );
}
`;

/* Default uniform to each FBO texture */
const DEFAULT_UNIFORM = { texture: { value: null } };


/**
 * *********
 * GPU SIMULATION
 * *********
 * GPU Compuration to texture rendering
 */
export default class GPUSimulation {
  /**
   * Define which multiple of two can be used to match with the nbr of particule.
   * @param {number} nbrOfParticle - The total number of particle we need
   * @param {number} textureSize - The texture size tested. Start at 16
   */
  static defineTextureSize(nbrOfParticle, textureSize = 16) {
    if (textureSize > 2048) {
      console.warn('GPUSimulation.defineTextureSize : The texture will be taller than 2048px');
    }
    return (textureSize * textureSize < nbrOfParticle) ?
      GPUSimulation.defineTextureSize(nbrOfParticle, textureSize * 2) :
      textureSize
    ;
  }

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

    // Create a default material
    const material = this.createSimulationShaderMaterial(DEFAULT_SIMULATION_FRAGMENT_SHADER);
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
   * @param {string} name - the name of the simulation
   * @param {string} simFragmentShader - the shader used to compute
   * @param {DataTexture} initialDataTexture - the initial value of the texture
   * @param {object} props -
   * @param {number} props.width - width for the WegGLRenderer. By default the same as the class.
   * @param {number} props.height - height for the WegGLRenderer. By default the same as the class.
   * @param {object} props.uniforms - uniforms for the shader material built
   * @param {...} ... - another params for the WebGLRenderTarget class
   *
   * @return {object} Simulation -
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
      { width, height, uniforms }
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
   * @param {string} simFragmentShader - The required fragment shader
   * @param {object} props properties
   * @param {number} props.width - A specific simulation resolution width
   * @param {number} props.height - A specific simulation resolution height
   * @param {object} props.uniforms - The shader uniforms
   * @param {string} props.vertexShader - The vertext shader (you don't need to overwrite it)
   * @returns {ShaderMaterial}
   */
  createSimulationShaderMaterial(fragmentShader, {
    width = this.width,
    height = this.height,
    uniforms = {},
    vertexShader = DEFAULT_SIMULATION_VERTEX_SHADER,
  } = {}) {
    if (uniforms.texture) {
      console.error('ERROR.createSimulationShaderMaterial : the uniform named texture is protected');
      return;
    }
    const material = new ShaderMaterial({
      defines : {
        resolution: `vec2(${width.toFixed(1)}, ${height.toFixed(1)})`
      },
      uniforms : Object.assign(uniforms, DEFAULT_UNIFORM),
      vertexShader,
      fragmentShader,
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
