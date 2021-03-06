import {
  WebGLRenderer, Scene, PerspectiveCamera, Color, ShaderMaterial
} from 'three';
import { GUI } from 'dat.gui';

import GPUSimulation from '../../../modules/GPUSimulation';
import Particles from '../_modules/Particles';

import { getRandomFloat } from '../../../utils';

import { particleVert, particleFrag, positionFrag } from './shaders.glsl';

/**/ /* ---- CORE ---- */
/**/ const bgColor = false // 'rgb(0, 0, 0)';
/**/ let windowWidth = window.innerWidth;
/**/ let windowHeight = window.innerHeight;
/**/ class Webgl {
/**/   constructor(w, h) {
/**/     this.meshCount = 0;
/**/     this.meshListeners = [];
/**/     this.renderer = new WebGLRenderer({ antialias: true });
/**/     this.renderer.setPixelRatio(window.devicePixelRatio);
/**/     if (bgColor) this.renderer.setClearColor(new Color(bgColor));
/**/     this.scene = new Scene();
/**/     this.camera = new PerspectiveCamera(50, w / h, 1, 1000);
/**/     this.camera.position.set(0, 0, 500);
/**/     this.dom = this.renderer.domElement;
/**/     this.update = this.update.bind(this);
/**/     this.resize = this.resize.bind(this);
/**/     this.resize(w, h); // set render size
/**/     this.onUpdate = f => f;
/**/   }
/**/   add(mesh) {
/**/     this.scene.add(mesh);
/**/     if (!mesh.update) return;
/**/     this.meshListeners.push(mesh.update);
/**/     this.meshCount++;
/**/   }
/**/   update() {
/**/     let i = this.meshCount;
/**/     while (--i >= 0) {
/**/       this.meshListeners[i].apply(this, null);
/**/     }
/**/     this.renderer.render(this.scene, this.camera);
/**/     this.onUpdate();
/**/   }
/**/   resize(w, h) {
/**/     this.camera.aspect = w / h;
/**/     this.camera.updateProjectionMatrix();
/**/     this.renderer.setSize(w, h);
/**/   }
/**/ }
/**/ const webgl = new Webgl(windowWidth, windowHeight);
/**/ document.body.appendChild(webgl.dom);
/**/
/**/
/* ---- CREATING ZONE ---- */

/**
 * DOCS
 *
 * FBO: http://barradeau.com/blog/?p=621
 */

/**
 * CURL NOISE:
 * - https://codepen.io/megalowe13/pen/KpvOrN/
 * - http://szymonkaliski.github.io/pex-exp-curl-noise/
 * - http://www.miaumiau.cat/2011/08/curl-noise-volume-shadow-particles/
 */


 /**
 **********
 * PROPS
 **********
 */

const TEXTURE_SIZE = 512;
const TEXTURE_HEIGHT = TEXTURE_SIZE;
const TEXTURE_WIDTH = TEXTURE_SIZE;

const props = {
  SIZE: 100,
  AMPL: 0.3,
  COMPLEXITY: 0.015,
  SPEED: 0.007,
  ROTATION: 0.002,
  ZOOM: 500,
  TO_SQUARE: 0,
};

const gui = new GUI();
const guiAmplitude = gui.add(props, 'AMPL', 0.01, 1);
const guiComplexity = gui.add(props, 'COMPLEXITY', 0, 0.02);
const guiZoom = gui.add(props, 'ZOOM', 0, 1000);
gui.add(props, 'SPEED', 0, 0.05);
gui.add(props, 'ROTATION', 0, 0.02);
const guiShape = gui.add(props, 'TO_SQUARE', 0, 1);

/**
 **********
 * FBO
 **********
 */
const gpuSim = new GPUSimulation(webgl.renderer, { width: TEXTURE_WIDTH, height: TEXTURE_HEIGHT });
gpuSim.initHelper(windowWidth, windowHeight);

/**
 * DATA TEXTURE
 */
let i;
const dataSpherePosition = gpuSim.createDataTexture();
const textureLength = dataSpherePosition.image.data.length;

// Create random position on a sphere
for (i = 0; i < textureLength; i += 4) {
  const azimuth = Math.random() * Math.PI;
  const inclination = Math.random() * Math.PI * 2;
  dataSpherePosition.image.data[i] = props.SIZE * Math.sin(azimuth) * Math.cos(inclination);
  dataSpherePosition.image.data[i + 1] = props.SIZE * Math.sin(azimuth) * Math.sin(inclination);
  dataSpherePosition.image.data[i + 2] = props.SIZE * Math.cos(azimuth);
  dataSpherePosition.image.data[i + 3] = 1;
}

// Create a second set of position on a square
const dataSquarePosition = gpuSim.createDataTexture();
for (i = 0; i < textureLength; i += 4) {
  dataSquarePosition.image.data[i] = getRandomFloat(-props.SIZE, props.SIZE);
  dataSquarePosition.image.data[i + 1] = getRandomFloat(-props.SIZE, props.SIZE);
  dataSquarePosition.image.data[i + 2] = getRandomFloat(-props.SIZE, props.SIZE);
  dataSquarePosition.image.data[i + 3] = 1;
}

// Create a simulation and set uniforms for the simulation
const positionFBO = gpuSim.createSimulation('positions', positionFrag, dataSpherePosition, {
  uniforms: {
    timer: { type: 'f', value: 0 },
    amplitude: { type: 'f', value: props.AMPL },
    complexity: { type: 'f', value: props.COMPLEXITY },
    toSquare: { type: 'f', value: props.TO_SQUARE },
    squareTexture: { type: 't', value: dataSquarePosition },
  },
});

/**
 **********
 * PARTICLE
 **********
 */
 // Create a particle Material
const particleMaterial = new ShaderMaterial({
  uniforms: {
    positions: { type: 't', value: positionFBO.output.texture },
    pointSize: { type: 'f', value: 1 },
  },
  vertexShader: particleVert,
  fragmentShader: particleFrag,
});

// Create a system of particle
const particles = new Particles(TEXTURE_WIDTH, TEXTURE_HEIGHT, particleMaterial);

// Add to the scene
webgl.add(particles);


/**
 **********
 * UPDATE
 **********
 */

let timer = 0;
webgl.onUpdate = () => {
  particles.rotation.x += props.ROTATION;
  particles.rotation.y += props.ROTATION;

  timer += props.SPEED;
  positionFBO.material.uniforms.timer.value = timer;

  // update only one simulation always with the initialDataTexture.
  gpuSim.updateSimulation(positionFBO);
  gpuSim.helper.update();
};

// HELPER 2
guiAmplitude.onChange(() => {
  positionFBO.material.uniforms.amplitude.value = props.AMPL;
});
guiComplexity.onChange(() => {
  positionFBO.material.uniforms.complexity.value = props.COMPLEXITY;
});
guiShape.onChange(() => {
  positionFBO.material.uniforms.toSquare.value = props.TO_SQUARE;
});
guiZoom.onChange(() => {
  webgl.camera.position.z = props.ZOOM;
});

/* ---- CREATING ZONE END ---- */
/**/
/**/
/**/ /* ---- ON RESIZE ---- */
/**/ function onResize() {
/**/   windowWidth = window.innerWidth;
/**/   windowHeight = window.innerHeight;
/**/   webgl.resize(windowWidth, windowHeight);
/**/ }
/**/ window.addEventListener('resize', onResize);
/**/ window.addEventListener('orientationchange', onResize);
/**/ /* ---- LOOP ---- */
/**/ function _loop() {
/**/ 	webgl.update();
/**/ 	requestAnimationFrame(_loop);
/**/ }
/**/ _loop();
