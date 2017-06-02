import {
  WebGLRenderer, Scene, PerspectiveCamera, Color,
  BufferGeometry, BufferAttribute,
  ShaderMaterial, Points,
} from 'three';

import GPUSimulation from 'GPUSimulation';

import shaderSimulationPosition from './shaders/simulationPosition.f.glsl';
import shaderSimulationVelocity from './shaders/simulationVelocity.f.glsl';

import particleVert from './shaders/particle.v.glsl';
import particleFrag from './shaders/particle.f.glsl';

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
/**/     this.camera.position.set(0, 0, 10);
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


/* ---- INIT ---- */
const TEXTURE_SIZE = 512;
const TEXTURE_HEIGHT = TEXTURE_SIZE;
const TEXTURE_WIDTH = TEXTURE_SIZE;

/* ---- GPUSimulation ---- */
const gpuSim = new GPUSimulation(TEXTURE_WIDTH, TEXTURE_HEIGHT, webgl.renderer);
gpuSim.initHelper(windowWidth, windowHeight);

// Create texture
const dataPosition = gpuSim.createDataTexture();
const dataVelocity = gpuSim.createDataTexture();

// Initialize data
const textureArraySize = TEXTURE_WIDTH * TEXTURE_HEIGHT * 4;
const birandom = () => Math.random() * 2 - 1;
for (let i = 0; i < textureArraySize; i += 4) {
	const radius = (1 - Math.pow(Math.random(), 3)) * 1;
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

const velocityFBO = gpuSim.createSimulation(
  'textureVelocity', shaderSimulationVelocity, dataVelocity
);
const positionFBO = gpuSim.createSimulation(
  'texturePosition', shaderSimulationPosition, dataPosition
);

/* ---- Particles ---- */
const l = TEXTURE_WIDTH * TEXTURE_HEIGHT;
const vertices = new Float32Array(l * 3);
for (let i = 0; i < l; i++) {
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

const particles = new Points(particleGeom, particleMaterial);
webgl.add(particles);

/* ---- UPDATE ---- */
const update = () => {
  gpuSim.update();

  // TODO update the particle texture
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
