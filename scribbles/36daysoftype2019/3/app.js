import {
  WebGLRenderer, Scene, PerspectiveCamera,
  Mesh, Color, FlatShading,
  InstancedBufferGeometry, InstancedBufferAttribute,
  UniformsUtils, UniformsLib, ShaderMaterial,
  AmbientLight, Object3D,
  DirectionalLight, TextBufferGeometry, FontLoader,
} from 'three';

import CameraMouseControl from 'CameraMouseControl';
import GPUSimulation from 'GPUSimulation';

import fragInstanced from './shaders/particle.f.glsl';
import vertInstanced from './shaders/particle.v.glsl';
import shaderSimulationPosition from './shaders/position.f.glsl';

import { getRandomAttribute } from 'utils';


/**
* * *******************
* * PROPS
* * *******************
*/

const COLORS = ['#F29D60', '#F14982', '#5D34FB', '#D72FF7', '#EF2890'];
const WIREFRAME = false;
const SPACE = 40;

/**
 * * *******************
 * * CORE
 * * *******************
 */
let windowWidth = window.innerWidth;
let windowHeight = window.innerHeight;
class Webgl {
  constructor(w, h) {
    this.meshCount = 0;
    this.meshListeners = [];
    this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(1.6, window.devicePixelRatio) || 1);
    this.renderer.setClearColor(new Color('#010101'));
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(50, w / h, 1, 1000);
    this.camera.position.set(0, 0, 100);
    this.dom = this.renderer.domElement;
    this.update = this.update.bind(this);
    this.resize = this.resize.bind(this);
    this.resize(w, h); // set render size
  }
  add(mesh) {
    this.scene.add(mesh);
    if (!mesh.update) return;
    this.meshListeners.push(mesh.update);
    this.meshCount++;
  }
  update() {
    let i = this.meshCount;
    while (--i >= 0) {
      this.meshListeners[i].apply(this, null);
    }
    this.renderer.render(this.scene, this.camera);
  }
  resize(w, h) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}
const webgl = new Webgl(windowWidth, windowHeight);
document.body.appendChild(webgl.dom);

/**
 * * *******************
 * * CREATING ZONE
 * * *******************
 */

import fontFile from 'Glence Black_Regular';
import { getRandomFloat } from '../../../modules/utils';

const fontLoader = new FontLoader();
const font = fontLoader.parse(fontFile);


/**
 * * *******************
 * * GRID OBJECT
 * * *******************
 */
class ParticleObject extends Object3D {
  constructor() {
    super();

    this.w = 80;
    this.h = 80;
    this.instanceCount = this.w * this.h;

    // Create the FBO simulation
    this.simulation = new GPUSimulation(webgl.renderer, { width : this.w, height : this.h });
    this.positionFBO = this.createFBOPosition();

    // Create the main mesh
    const material = this.createMaterial();
    const geometry = this.createInstanciedGeometry();

    this.mesh = new Mesh(geometry, material);
    this.add(this.mesh);

    // BIND
    this.update = this.update.bind(this);
  }

  /**
   * * *******************
   * * FBO Simulation
   */
  createFBOPosition() {
    // Create the data
    const dataPosition = this.simulation.createDataTexture();
    const textureArraySize = this.instanceCount * 4;

    for (let i = 0; i < textureArraySize; i += 4) {
      // V1 ----------------------------------------------------------------------------------------
      dataPosition.image.data[i] = getRandomFloat(-SPACE * 0.7, SPACE * 0.7);
      dataPosition.image.data[i + 1] = getRandomFloat(-SPACE * 5, SPACE * 0.5);
      dataPosition.image.data[i + 2] = getRandomFloat(-SPACE * 0.7, SPACE * 0.7);
      // V2 ----------------------------------------------------------------------------------------
      // const v = getrandomPosWithinASphere(getRandomFloat(-SPACE, SPACE));
      // dataPosition.image.data[i] = v.x;
      // dataPosition.image.data[i + 1] = v.y;
      // dataPosition.image.data[i + 2] = v.z;

      // Rotation speed
      dataPosition.image.data[i + 3] = getRandomFloat(-0.03, 0.03);
    }

    // Create the FBO simulation
    return this.simulation.createSimulation(
      'texturePosition', shaderSimulationPosition, dataPosition, {
        uniforms: {},
      },
    );
  }

  /**
   * * *******************
   * * Instance Mesh Methods
   */
  createMaterial() {
    const uniforms = UniformsUtils.merge([
      UniformsLib.common,
      UniformsLib.lights,
      {
        positions : { value: this.positionFBO.output.texture },
      },
    ]);

    return new ShaderMaterial({
      uniforms,
      vertexShader: vertInstanced,
      fragmentShader: fragInstanced,
      lights: true,
      wireframe : WIREFRAME,
      flatShading: FlatShading,
    });
  }

  createInstanciedGeometry() {

    const geometry = new TextBufferGeometry( '3', {
      font,
      size: 2.5,
      height: 0.7,
      curveSegments: 12,
      // bevelEnabled: true,
      bevelThickness: 10,
      bevelSize: 8,
      bevelSegments: 10
    } );

    // Create custom FBO UV to have the good coordinate into the shader
    const fboUv = new InstancedBufferAttribute(
      new Float32Array(this.instanceCount * 2), 2,
    );
    const colors = new InstancedBufferAttribute(
      new Float32Array(this.instanceCount * 3), 3
    );
    for (let i = 0; i < this.instanceCount; i++) {
      const x = (i % this.w) / this.h;
      const y = (Math.floor((i / this.h)) / this.h);
      fboUv.setXY(i, x, y);

      const c = new Color(getRandomAttribute(COLORS));
      colors.setXYZ(i, c.r, c.g, c.b);
    }

    // Instance of the geometry + properties
    const instanciedGeometry = new InstancedBufferGeometry();
    instanciedGeometry.addAttribute('position', geometry.attributes.position);
    instanciedGeometry.addAttribute('fboUv', fboUv);
    instanciedGeometry.addAttribute('color', colors);

    return instanciedGeometry;
  }

  /**
   * * *******************
   * * Update
   */
  update() {
    // FBO update
    this.simulation.updateAll();
    // this.simulation.helper.update();
    // this.positionFBO.material.uniforms.perlinTime.value += WAVE_SPEED;

    // Instancied mesh update with the FBO
    this.mesh.material.uniforms.positions.value = this.positionFBO.output.texture;
  }
}

/**
 * * *******************
 * * SCENE
 * * *******************
 */

// LIGHTS
const ambiantLight = new AmbientLight(0xffffff, 0.8);
webgl.scene.add(ambiantLight);

const directionalLight = new DirectionalLight(0xffffff, 0.3);
directionalLight.position.set(10, -4, 10);
webgl.scene.add(directionalLight);

// CAMERA CONTROLLER
const cameraControl = new CameraMouseControl(webgl.camera, { mouseMove : [-100, -100], velocity: [0.1, 0.1]});


/**
 * * *******************
 * * START
 * * *******************
 */

const particles = new ParticleObject();
webgl.add(particles);

document.body.addEventListener('click', () => {
  particles.mesh.material.wireframe = !particles.mesh.material.wireframe;
});

/**
 * * *******************
 * * UPDATE
 * * *******************
 */
const update = () => {
  // Camera update
  cameraControl.update();

  particles.mesh.rotation.y += 0.002;
  webgl.update();
};

/**
 * * *******************
 * * RESIZE && LOOP
 * * *******************
 */
function onResize() {
  windowWidth = window.innerWidth;
  windowHeight = window.innerHeight;
  webgl.resize(windowWidth, windowHeight);
}
window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', onResize);
// LOOP
function loop() {
  update();
  requestAnimationFrame(loop);
}
loop();
