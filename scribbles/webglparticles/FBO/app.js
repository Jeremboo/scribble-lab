import {
  WebGLRenderer, Scene, PerspectiveCamera, Color,
  ShaderMaterial, BufferGeometry, BufferAttribute, Points,
} from 'three';
import { GUI } from 'dat.gui/build/dat.gui';

import GPUSimulation from 'GPUSimulation';

import particleVert from './shaders/particle.v.glsl';
import particleFrag from './shaders/particle.f.glsl';

import positionFrag from './shaders/position.f.glsl';

/**/ /* ---- CORE ---- */
/**/ const mainColor = '#070707';
/**/ const secondaryColor = '#C9F0FF';
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
};

const gui = new GUI();
const guiAmplitude = gui.add(props, 'AMPL', 0.01, 1);
const guiComplexity = gui.add(props, 'COMPLEXITY', 0, 0.02);
const guiZoom = gui.add(props, 'ZOOM', 0, 1000);
gui.add(props, 'SPEED', 0, 0.05);
gui.add(props, 'ROTATION', 0, 0.02);

/**
 **********
 * FBO
 **********
 */
const gpuSim = new GPUSimulation(TEXTURE_WIDTH, TEXTURE_HEIGHT, webgl.renderer);
gpuSim.initHelper(windowWidth, windowHeight);

/**
 * DATA TEXTURE
 */
let i;
const dataPosition = gpuSim.createDataTexture();
const textureLength = dataPosition.image.data.length;

// Create random position on a circle
for (i = 0; i < textureLength; i += 4) {
  const radius = (10 - Math.pow(Math.random(), 3)) * 10;
  const azimuth = Math.random() * Math.PI;
  const inclination = Math.random() * Math.PI * 2;
  dataPosition.image.data[i] = radius * Math.sin(azimuth) * Math.cos(inclination);
  dataPosition.image.data[i + 1] = radius * Math.sin(azimuth) * Math.sin(inclination);
  dataPosition.image.data[i + 2] = radius * Math.cos(azimuth);
  dataPosition.image.data[i + 3] = 1;
}

// Create a simulation and set uniforms for the simulation
const positionFBO = gpuSim.createSimulation('positions', positionFrag, dataPosition, {
  uniforms: {
    timer: { type: 'f', value: 0 },
    amplitude: { type: 'f', value: props.AMPL },
    complexity: { type: 'f', value: props.COMPLEXITY },
  },
});

/**
 **********
 * PARTICLE
 **********
 */
const l = TEXTURE_WIDTH * TEXTURE_HEIGHT;
const vertices = new Float32Array(l * 3);
for (i = 0; i < l; i++) {
  const i3 = i * 3;
  vertices[i3] = (i % TEXTURE_WIDTH) / TEXTURE_HEIGHT;
  vertices[i3 + 1] = (i / TEXTURE_WIDTH) / TEXTURE_HEIGHT;
}
const particleGeom = new BufferGeometry();
particleGeom.addAttribute('position', new BufferAttribute(vertices, 3));
const particleMaterial = new ShaderMaterial({
  uniforms: {
    positions: { type: 't', value: positionFBO.output.texture },
    pointSize: { type: 'f', value: 1 },
  },
  vertexShader: particleVert,
  fragmentShader: particleFrag,
});

/** *********
* ADD TO THE SCENE
*/
const particles = new Points(particleGeom, particleMaterial);
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

  // update all simulations with the textures computed
  // gpuSim.update();
  // update only one simulation always with the initialDataTexture.
  gpuSim.updateSimulation(positionFBO, positionFBO.initialDataTexture);
  gpuSim.helper.update();
};

// HELPER 2
guiAmplitude.onChange(() => {
  positionFBO.material.uniforms.amplitude.value = props.AMPL;
});
guiComplexity.onChange(() => {
  positionFBO.material.uniforms.complexity.value = props.COMPLEXITY;
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
