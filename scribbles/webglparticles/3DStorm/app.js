import {
  WebGLRenderer, Scene, PerspectiveCamera, Color,
  ShaderMaterial, AxesHelper,
} from 'three';

import { GUI } from 'dat.gui';

import { getRandomFloat } from '../../../utils';

import OrbitControls from '../../../modules/OrbitControls';
import GPUSimulation from '../../../modules/GPUSimulation';
import Particles from '../_modules/Particles';

import {
  particleFrag, particleVert,
  positionSimFrag, velocitySimFrag,
} from './shaders.glsl';

/**/ /* ---- CORE ---- */
/**/ const bgColor = 'rgb(112, 112, 112)';
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
/**/     this.camera.position.set(0, -20, 5);
/**/     this.controls = new OrbitControls(this.camera, this.renderer.domElement);
/**/     this.dom = this.renderer.domElement;
/**/     this.update = this.update.bind(this);
/**/     this.resize = this.resize.bind(this);
/**/     this.resize(w, h); // set render size
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

/* ---- SETTINGS ---- */

// Position types
const CIRCLE = 'circle';
const TWO_SOURCES = '2 sources';

// Props
const props = {
  POINT_SIZE: 1,
  INITIAL_POS: TWO_SOURCES,

  DEMISE_DISTANCE: 0.5,
  MAX_DISTANCE: 10,

  VEL_MIN: 1, // 0.1,
  VEL_MAX: 2, // 0.1,
  VEL_BRAKE_MIN: 0.8, // 0.9,
  VEL_BRAKE: 0.9, // 0.9,

  ROT_CURVE: 1, // force of rotation at the center
  ROT_DIST: 0.18, // distance of force at the center
  ROT_FORCE: 0.08, // global rotation force

  ATT_CURVE: 0.4, // To reduce the exponential force
  ATT_DIST: 1.2,
  ATT_FORCE: 0.6,
};

const TEXTURE_SIZE = 200; // 512;
const TEXTURE_HEIGHT = TEXTURE_SIZE;
const TEXTURE_WIDTH = TEXTURE_SIZE;

/* ---- GPUSimulation ---- */
const gpuSim = new GPUSimulation(webgl.renderer, TEXTURE_WIDTH, TEXTURE_HEIGHT);
gpuSim.initHelper(windowWidth, windowHeight);

// Create textures
const dataPosition = gpuSim.createDataTexture();
const dataVelocity = gpuSim.createDataTexture();
const dataProps = gpuSim.createDataTexture();

// Initialize Velocity and props
const textureArraySize = TEXTURE_WIDTH * TEXTURE_HEIGHT * 4;
for (let i = 0; i < textureArraySize; i += 4) {
  dataVelocity.image.data[i] = 0;
  dataVelocity.image.data[i + 1] = 0;
  dataVelocity.image.data[i + 2] = 0;
  dataVelocity.image.data[i + 3] = 1;

  dataProps.image.data[i] = getRandomFloat(props.VEL_MIN, props.VEL_MAX);
  dataProps.image.data[i + 1] = getRandomFloat(props.VEL_BRAKE_MIN, props.VEL_BRAKE);
  dataProps.image.data[i + 2] = 0;
  dataProps.image.data[i + 3] = 1;
}

// Initialize Position
function initDataPosition(dataTexture = gpuSim.createDataTexture()) {
  switch (props.INITIAL_POS) {
    case TWO_SOURCES:
      const alfTextureArraySize = textureArraySize * 0.5;
      const dist = props.DEMISE_DISTANCE * 2;
      for (let i = 0; i < alfTextureArraySize; i += 4) {
        const radius = getRandomFloat(0, props.MAX_DISTANCE);
        const azimuth = Math.random() * Math.PI;
        const x = ((radius * Math.sin(azimuth) * Math.cos(azimuth)) * 0.1);
        const y = (((radius * Math.sin(azimuth) * Math.sin(azimuth)) - (radius * 0.5)) * 0.1);

        dataTexture.image.data[i] = x + dist;
        dataTexture.image.data[i + 1] = y + dist;
        dataTexture.image.data[i + 2] = getRandomFloat(0.1, 0.2);
        dataTexture.image.data[i + 3] = 0;

        dataTexture.image.data[alfTextureArraySize + i] = x - dist;
        dataTexture.image.data[alfTextureArraySize + i + 1] = y - dist;
        dataTexture.image.data[alfTextureArraySize + i + 2] = getRandomFloat(0.1, 0.2);
        dataTexture.image.data[alfTextureArraySize + i + 3] = 0;
      }
      break;
    case CIRCLE:
    default:
      for (let i = 0; i < textureArraySize; i += 4) {
        const radius = getRandomFloat(props.DEMISE_DISTANCE * 3, props.MAX_DISTANCE);
        const azimuth = Math.random() * Math.PI;
        dataTexture.image.data[i] = radius * Math.sin(azimuth) * Math.cos(azimuth);
        dataTexture.image.data[i + 1] = (radius * Math.sin(azimuth) * Math.sin(azimuth)) - (radius * 0.5);
        dataTexture.image.data[i + 2] = getRandomFloat(0.001, 0.2) * (props.MAX_DISTANCE - radius) * 0.4;
        dataTexture.image.data[i + 3] = 1;
      }
  }
  return dataTexture;
}
initDataPosition(dataPosition);

// Initalize simulations
const velocityFBO = gpuSim.createSimulation(
  'textureVelocity', velocitySimFrag, dataVelocity, {
    uniforms: {
      // positionfBO texture (should be updated)
      positionTexture: { type: 't', value: null },
      // gravity params
      attractionCurve: { type: 'f', value: props.ATT_CURVE },
      attractionDistance: { type: 'f', value: props.ATT_DIST },
      attractionForce: { type: 'f', value: props.ATT_FORCE },
      // velocity params: VEL_MAX, VEL_BRAKE
      propsTexture: { type: 'f', value: dataProps },
      // distance of demise and the external circle distance
      demiseDistance: { type: 'f', value: props.DEMISE_DISTANCE },
      maxDistance: { type: 'f', value: props.MAX_DISTANCE },
    },
  }
);
const positionFBO = gpuSim.createSimulation(
  'texturePosition', positionSimFrag, dataPosition, {
    uniforms: {
      // Fist position of each particle
      initialPositionTexture: { type: 't', value: dataPosition },
      // velocityFBO texture (should be updated)
      velocityTexture: { type: 't', value: velocityFBO.output.texture },
      // Demise distance
      demiseDistance: { type: 'f', value: props.DEMISE_DISTANCE },
      // Global rotation force
      rotationCurve: { type: 'f', value: props.ROT_CURVE },
      rotationDistance: { type: 'f', value: props.ROT_DIST },
      rotationForce: { type: 'f', value: props.ROT_FORCE },
    },
  },
);
// Not need to update the materials on each loop. Just pass per reference
velocityFBO.material.uniforms.positionTexture.value = positionFBO.output.texture;

/* ---- Particles ---- */
 // Create a particle Material
const particleMaterial = new ShaderMaterial({
  uniforms: {
    positions: { type: 't', value: positionFBO.output.texture },
    pointSize: { type: 'f', value: props.POINT_SIZE },
  },
  vertexShader: particleVert,
  fragmentShader: particleFrag,
  transparent: true,
});

// Create a system of particle
const particles = new Particles(TEXTURE_WIDTH, TEXTURE_HEIGHT, particleMaterial);

// Add to the scene
webgl.add(particles);
gpuSim.addSimulation(velocityFBO);
gpuSim.addSimulation(positionFBO);

/* ---- Update ---- */
const update = () => {
  gpuSim.updateAll();
};

/* ---- Helpers ---- */
// axis
const axisHelper = new AxesHelper(1);
webgl.add(axisHelper);

// gui
const gui = new GUI();

// global
const global = gui.addFolder('Global');
global.add(props, 'INITIAL_POS', [CIRCLE, TWO_SOURCES]).onChange(() => {
  positionFBO.initialDataTexture = initDataPosition();
  props.reset();
});
global.add(props, 'POINT_SIZE', 1, 100).onChange(() => {
  particles.material.uniforms.pointSize.value = props.POINT_SIZE;
});
global.add(props, 'DEMISE_DISTANCE', 0, 3).onChange(() => {
  positionFBO.material.uniforms.demiseDistance.value = props.DEMISE_DISTANCE;
  velocityFBO.material.uniforms.demiseDistance.value = props.DEMISE_DISTANCE;
});

// rotation
const rotation = gui.addFolder('Rotation');
rotation.add(props, 'ROT_CURVE', 0, 1).onChange(() => {
  positionFBO.material.uniforms.rotationCurve.value = props.ROT_CURVE;
});
rotation.add(props, 'ROT_DIST', 0, 1).onChange(() => {
  positionFBO.material.uniforms.rotationDistance.value = props.ROT_DIST;
});
rotation.add(props, 'ROT_FORCE', 0, 0.1).onChange(() => {
  positionFBO.material.uniforms.rotationForce.value = props.ROT_FORCE;
});

// attraction
const attraction = gui.addFolder('Attraction');
attraction.add(props, 'ATT_CURVE', 0, 1).onChange(() => {
  velocityFBO.material.uniforms.attractionCurve.value = props.ATT_CURVE;
});
attraction.add(props, 'ATT_DIST', 0, 2).onChange(() => {
  velocityFBO.material.uniforms.attractionDistance.value = props.ATT_DIST;
});
attraction.add(props, 'ATT_FORCE', 0, 2).onChange(() => {
  velocityFBO.material.uniforms.attractionForce.value = props.ATT_FORCE;
});

// velocity FIXME doesn't works
// const velocity = gui.addFolder('Velocity');
// velocity.add(props, 'VEL_MAX', props.VEL_MIN, 80).onChange(() => {
//   for (let i = 0; i < textureArraySize; i += 4) {
//     dataProps.image.data[i] = getRandomFloat(props.VEL_MIN, props.VEL_MAX);
//   }
//   velocityFBO.material.uniforms.propsTexture.value = dataProps;
// });
// velocity.add(props, 'VEL_BRAKE', props.VEL_BRAKE_MIN, 1).onChange(() => {
//   for (let i = 0; i < textureArraySize; i += 4) {
//     dataProps.image.data[i + 1] = getRandomFloat(props.VEL_BRAKE_MIN, props.VEL_BRAKE);
//   }
//   velocityFBO.material.uniforms.propsTexture.value = dataProps;
// });

// Reset button
props.reset = () => {
  gpuSim.updateSimulation(velocityFBO, velocityFBO.initialDataTexture);
  gpuSim.updateSimulation(positionFBO, positionFBO.initialDataTexture);
};
gui.add(props, 'reset');

// Stop button
props.play = true;
gui.add(props, 'play');


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
      props.play && update();
/**/ 	requestAnimationFrame(_loop);
/**/ }
/**/ _loop();
