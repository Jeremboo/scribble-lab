import {
  WebGLRenderer, Scene, PerspectiveCamera, Color,
  BufferGeometry, BufferAttribute,
  ShaderMaterial, Points, Vector3,
  AxisHelper,
} from 'three';

import OrbitControls from 'OrbitControl';
import GPUSimulation from 'GPUSimulation';
import Particles from 'Particles';

import shaderSimulationPosition from './shaders/simulationPosition.f.glsl';
import shaderSimulationVelocity from './shaders/simulationVelocity.f.glsl';

import particleVert from './shaders/particle.v.glsl';
import particleFrag from './shaders/particle.f.glsl';

/**/ /* ---- CORE ---- */
/**/ const mainColor = '#070707';
/**/ const secondaryColor = '#C9F0FF';
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
/**/     this.camera.position.set(0, 0, 10);
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

const props = {
  POINT_SIZE: 10,

  DEMISE_DISTANCE: 0,
  APPARITION_DISTANCE: 350,

  ROTATION_FORCE: 10,

  VEL_MAX: 0.05,
  VEL_MIN: 0,
  VEL_BRAKE_MIN: 0.9,
  VEL_BRAKE_MAX: 0.01,

  ATT_AMPL: 3.8, // To reduce the force of the attraction at cente,
  ATT_ZONE: 0.8,
  ATT_FORCE: 0.02,
};

const axisHelper = new AxisHelper(1);
webgl.add(axisHelper);

/* ---- INIT ---- */
const TEXTURE_SIZE = 200; // 512;
const TEXTURE_HEIGHT = TEXTURE_SIZE;
const TEXTURE_WIDTH = TEXTURE_SIZE;

/* ---- GPUSimulation ---- */
const gpuSim = new GPUSimulation(TEXTURE_WIDTH, TEXTURE_HEIGHT, webgl.renderer);
gpuSim.initHelper(windowWidth, windowHeight);

// Create texture
const dataPosition = gpuSim.createDataTexture();
const dataVelocity = gpuSim.createDataTexture();

// Initialize data
const radius = (1 - Math.pow(Math.random(), 3)) * 1;
const textureArraySize = TEXTURE_WIDTH * TEXTURE_HEIGHT * 4;
for (let i = 0; i < textureArraySize; i += 4) {
  const azimuth = Math.random() * Math.PI;
  const inclination = Math.random() * Math.PI * 2;
  dataPosition.image.data[i] = radius * Math.sin(azimuth) * Math.cos(inclination);
  dataPosition.image.data[i + 1] = radius * Math.sin(azimuth) * Math.sin(inclination);
  dataPosition.image.data[i + 2] = radius * Math.cos(azimuth);
  dataPosition.image.data[i + 3] = 1;

  dataVelocity.image.data[i] = 0;
  dataVelocity.image.data[i + 1] = 0;
  dataVelocity.image.data[i + 2] = 0;
  dataVelocity.image.data[i + 3] = 1;
}

// Initalize simulations
const velocityFBO = gpuSim.createSimulation(
  'textureVelocity', shaderSimulationVelocity, dataVelocity, {
    uniforms: {
      positionTexture: { type: 't', value: null },
      attractionAmplitude: { type: 'f', value: props.ATT_AMPL },
      attractionZone: { type: 'f', value: props.ATT_ZONE },
      attractionForce: { type: 'f', value: props.ATT_FORCE },
      velMax: { type: 'f', value: new Vector3(props.VEL_MAX, props.VEL_MAX, props.VEL_MAX) }, // TODO may be in attribute
      velBrake: { type: 'f', value: props.VEL_BRAKE_MAX }, // TODO may be in attribute
    },
  }
);
const positionFBO = gpuSim.createSimulation(
  'texturePosition', shaderSimulationPosition, dataPosition, {
    uniforms: {
      initialPositionTexture: { type: 't', value: dataPosition },
      velocityTexture: { type: 't', value: velocityFBO.output.texture },
      demiseDistance: { type: 'f', value: props.DEMISE_DISTANCE },
      rotationForce: { type: 'f', value: props.ROTATION_FORCE },
    },
  }
);

/* ---- Particles ---- */
 // Create a particle Material
const particleMaterial = new ShaderMaterial({
  uniforms: {
    positions: { type: 't', value: positionFBO.output.texture },
    pointSize: { type: 'f', value: props.POINT_SIZE },
  },
  vertexShader: particleVert,
  fragmentShader: particleFrag,
});

// Create a system of particle
const particles = new Particles(TEXTURE_WIDTH, TEXTURE_HEIGHT, particleMaterial);

// Add to the scene
webgl.add(particles);

/* ---- UPDATE ---- */
const update = () => {
  positionFBO.material.uniforms.velocityTexture.value = velocityFBO.output.texture;
  velocityFBO.material.uniforms.positionTexture.value = positionFBO.output.texture;
  gpuSim.update();
};


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
      update();
/**/ 	requestAnimationFrame(_loop);
/**/ }
/**/ _loop();
