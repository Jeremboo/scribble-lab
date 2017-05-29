import {
  WebGLRenderer, Scene, PerspectiveCamera, Color, RGBFormat,
  FloatType, ShaderMaterial, DataTexture, Vector3,
} from 'three';

import FBOHelper from 'three.fbo-helper';

import { GUI } from 'dat.gui/build/dat.gui';

import { getRandomFloat } from 'utils';

import FBOParticle from 'FBOParticle';

import particleVert from './shaders/particle.v.glsl';
import particleFrag from './shaders/particle.f.glsl';

import defaultVert from './shaders/default.v.glsl';
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

         this.helper = new FBOHelper(this.renderer);

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
/**/     this.onUpdate();
/**/     while (--i >= 0) {
/**/       this.meshListeners[i].apply(this, null);
/**/     }
/**/     this.renderer.render(this.scene, this.camera);

         this.helper.update();

/**/   }
/**/   resize(w, h) {

         this.helper.setSize(w, h);

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

const TEXTURE_WIDTH = 256 * 1.5;
const TEXTURE_HEIGHT = 256 * 1.5;

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

/** *********
 * PARTICLE MATERIAL
 */
const particleShaderMaterial = new ShaderMaterial({
  uniforms: {
    // Will be set after the particles.update() call
    positions: { type: 't', value: null },
    pointSize: { type: 'f', value: 2 },
    lightPosition: { type: 'v3', value: new Vector3(props.SIZE, props.SIZE, props.SIZE) },
  },
  vertexShader: particleVert,
  fragmentShader: particleFrag,
});

const fboParticles = new FBOParticle(
  TEXTURE_WIDTH,
  TEXTURE_HEIGHT,
  particleShaderMaterial,
  webgl.renderer,
);

/** *********
 * PARTICLE POSITION
 * Create a DataTexture and a shader to compute each values
 */

 /**
 * DATA TEXTURE
 */

 const getRandomData = (w, h, size) => {
   let len = w * h * 3;
   const data = new Float32Array(len);
   while (len--) data[len] = getRandomFloat(-size, size);
   return data;
 };
 const positionData = getRandomData(TEXTURE_WIDTH, TEXTURE_HEIGHT, props.SIZE);
 const positions = fboParticles.createDataTexture(positionData);

 /**
 * SHADER
 */
const simulationPositionShaderMaterial = new ShaderMaterial({
  uniforms: {
    positions: { type: 't', value: positions },
    timer: { type: 'f', value: 0 },
    complexity: { type: 'f', value: props.COMPLEXITY },
    amplitude: { type: 'f', value: props.AMPL },
  },
  vertexShader: defaultVert,
  fragmentShader: positionFrag,
});

fboParticles.createSimulation('positions', simulationPositionShaderMaterial);

/** *********
 * ADD TO THE SCENE
 */
webgl.add(fboParticles);
webgl.helper.attach(fboParticles.fbo, 'Position');


/**
 **********
 * UPDATE
 **********
 */

let timer = 0;
webgl.onUpdate = () => {
  timer += props.SPEED;
  fboParticles.updateSimulationUniform('positions', 'timer', timer);
  fboParticles.rotation.x += props.ROTATION;
  fboParticles.rotation.y += props.ROTATION;
};

guiAmplitude.onChange(() => {
  fboParticles.updateSimulationUniform('positions', 'amplitude', props.AMPL);
});
guiComplexity.onChange(() => {
  fboParticles.updateSimulationUniform('positions', 'complexity', props.COMPLEXITY);
});
guiZoom.onChange(() => {
  webgl.camera.position.z = props.ZOOM;
});

/* ---- CREATING ZONE END ---- */
/**/
/**/
/**/ /* ---- ON REprops.SIZE ---- */
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
