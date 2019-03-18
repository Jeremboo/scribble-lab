import {
  WebGLRenderer, Scene, PerspectiveCamera,
  Mesh, Color, FlatShading,
  InstancedBufferGeometry, InstancedBufferAttribute,
  UniformsUtils, UniformsLib, ShaderMaterial,
  AmbientLight, BufferAttribute, Texture,
  LinearFilter, RGBFormat, PlaneBufferGeometry,
} from 'three';

import OrbitControls from 'OrbitControl';
import GPUSimulation from 'GPUSimulation';

import fragInstanced from './shaders/instanced.f.glsl';
import vertInstanced from './shaders/instanced.v.glsl';
import shaderSimulationPosition from './shaders/simulationPosition.f.glsl';

import { loadVideo } from 'utils';

import videoTest from 'videoTest1.mp4';

/**
* * *******************
* * PROPS
* * *******************
*/

const TEXTURE_SIZE = 64;
const TEXTURE_HEIGHT = TEXTURE_SIZE;
const TEXTURE_WIDTH = TEXTURE_SIZE;
const INSTANCE_COUNT = TEXTURE_HEIGHT * TEXTURE_WIDTH;

const TILE_RADIUS = 1;
const TILE_MARGIN = 0.2;

const WAVE_SPEED = 0.008;
const WAVE_FORCE = 4;
const WAVE_DIMENTION = 2;

// Props auto computed
const TILE_SIZE = TILE_RADIUS * 2;
const LINE_WIDTH = ((TILE_SIZE) + TILE_MARGIN) * TEXTURE_WIDTH;
const LINE_HEIGHT = ((TILE_SIZE) + TILE_MARGIN) * TEXTURE_HEIGHT;

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
    this.camera.position.set(0, 0, 200);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
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
 * * https://threejs.org/examples/?q=video#webgl_materials_video
 * * *******************
 */

 /**
 * * *******************
 * * SCENE
 * * To update the position of the tiles
 */

// LIGHTS
const ambiantLight = new AmbientLight(0xffffff, 1);
webgl.scene.add(ambiantLight);


/**
 * * *******************
 * * GPU SIMULATION
 * * To update the position of the tiles
 */
const gpuSim = new GPUSimulation(TEXTURE_WIDTH, TEXTURE_HEIGHT, webgl.renderer);
gpuSim.initHelper(windowWidth, windowHeight);

// Create the data
const dataPosition = gpuSim.createDataTexture();
const textureArraySize = INSTANCE_COUNT * 4;

for (let i = 0; i < textureArraySize; i += 4) {
  const idx = i / 4;
  // X - Y
  dataPosition.image.data[i] = ((idx % TEXTURE_WIDTH) * (TILE_SIZE + TILE_MARGIN)) - (LINE_WIDTH * 0.5);
  dataPosition.image.data[i + 1] = Math.floor(idx / TEXTURE_WIDTH) * (TILE_SIZE + TILE_MARGIN) - (LINE_HEIGHT * 0.5);

  // Empty for now
  dataPosition.image.data[i + 2] = 1;
  dataPosition.image.data[i + 3] = 1;
}

// Create the FBO simulation
const positionFBO = gpuSim.createSimulation(
  'texturePosition', shaderSimulationPosition, dataPosition, {
    uniforms: {
      // Fist position of each particle
      initialPositionTexture: { type: 't', value: dataPosition },
      // Perlin parameters
      perlinTime      : { type : '1f', value : 0 },
      perlinDimention : { type : '1f', value : WAVE_DIMENTION },
      perlinForce     : { type : '1f', value : WAVE_FORCE },
    },
  },
);

/**
 * * *******************
 * * Instance
 */

// MATERIAL
const uniforms = UniformsUtils.merge([
  UniformsLib.common,
  UniformsLib.lights,
  UniformsLib.shadowmap,
  {
    positions : { type: 't', value: positionFBO.output.texture }, // must be updated into the loop
    videoTexture : { type: 't', value: null },
    tileGrid : { type: 'v2', value: { x: TEXTURE_WIDTH, y: TEXTURE_HEIGHT }}
  },
]);

const material = new ShaderMaterial({
  uniforms,
  vertexShader: vertInstanced,
  fragmentShader: fragInstanced,
  lights: true,
  flatShading: FlatShading,
});

// PLANE GEOMETRY
const planeVertices = new Float32Array( [
	-TILE_RADIUS, -TILE_RADIUS,  TILE_RADIUS,
	 TILE_RADIUS, -TILE_RADIUS,  TILE_RADIUS,
	 TILE_RADIUS,  TILE_RADIUS,  TILE_RADIUS,

	 TILE_RADIUS,  TILE_RADIUS,  TILE_RADIUS,
	-TILE_RADIUS,  TILE_RADIUS,  TILE_RADIUS,
	-TILE_RADIUS, -TILE_RADIUS,  TILE_RADIUS
] );
const planePositionAttribute = new BufferAttribute( planeVertices, 3 );

// INSTANCES
const instanceGeom = new InstancedBufferGeometry();
instanceGeom.addAttribute( 'position', planePositionAttribute );

const fboUv = new InstancedBufferAttribute(
  new Float32Array(INSTANCE_COUNT * 2), 2,
);
for (let i = 0; i < INSTANCE_COUNT; i++) {
  const x = (i % TEXTURE_WIDTH) / TEXTURE_WIDTH;
  const y = (Math.floor((i / TEXTURE_WIDTH)) / TEXTURE_HEIGHT);

  fboUv.setXY(i, x, y);
}
instanceGeom.addAttribute('fboUv', fboUv);


// MESH
const mesh = new Mesh(instanceGeom, material);
webgl.add(mesh);


/**
 * * *******************
 * * LOAD VIDEO
 */
loadVideo(videoTest, { loop: true, muted: true }).then(video => {
  // ! VideoTexture should be used
  // TODO waiting for r103 https://github.com/mrdoob/three.js/issues/13379
  const textureVideo = new Texture(video);
  video.play();
  textureVideo.minFilter = LinearFilter;
  textureVideo.magFilter = LinearFilter;
  textureVideo.format = RGBFormat;
  material.uniforms.videoTexture.value = textureVideo;
});


/**
 * * *******************
 * * UPDATE
 */
const update = () => {

  if (material.uniforms.videoTexture.value) {
    material.uniforms.videoTexture.value.needsUpdate = true;
  }
  // FBO update
  gpuSim.update();
  gpuSim.helper.update();
  positionFBO.material.uniforms.perlinTime.value += WAVE_SPEED;

  // Instancied mesh update
  mesh.material.uniforms.positions.value = positionFBO.output.texture;

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
