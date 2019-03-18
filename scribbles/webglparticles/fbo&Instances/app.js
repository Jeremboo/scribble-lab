import {
  WebGLRenderer, Scene, PerspectiveCamera,
  Mesh, Color, FlatShading,
  InstancedBufferGeometry, InstancedBufferAttribute,
  ShaderMaterial, AmbientLight,
  DoubleSide, UniformsUtils, UniformsLib, PCFSoftShadowMap,
  PlaneBufferGeometry, MeshStandardMaterial,
  DirectionalLight, DirectionalLightHelper, CameraHelper,
  OctahedronBufferGeometry,
} from 'three';
import OrbitControls from 'OrbitControl';

import GPUSimulation from 'GPUSimulation';
import { getRandomAttribute, getRandomFloat, radians } from 'utils';

import fragInstanced from './shaders/instanced.f.glsl';
import vertInstanced from './shaders/instanced.v.glsl';
import vertDeth from './shaders/depth.v.glsl';
import fragDeth from './shaders/depth.f.glsl';
import shaderSimulationPosition from './shaders/simulationPosition.f.glsl';

/**/ /* ---- CORE ---- */
/**/ const mainColor = '#070707';
/**/ const secondaryColor = '#C9F0FF';
/**/ const bgColor = 0xaaaaaa;
/**/ let windowWidth = window.innerWidth;
/**/ let windowHeight = window.innerHeight;
/**/ class Webgl {
/**/   constructor(w, h) {
/**/     this.meshCount = 0;
/**/     this.meshListeners = [];
/**/     this.renderer = new WebGLRenderer({ antialias: true });
/**/     this.renderer.setPixelRatio(window.devicePixelRatio);
/**/     this.renderer.shadowMap.enabled = true;
/**/     this.renderer.shadowMap.type = PCFSoftShadowMap;
/**/     if (bgColor) this.renderer.setClearColor(new Color(bgColor));
/**/     this.scene = new Scene();
/**/     this.camera = new PerspectiveCamera(50, w / h, 1, 1000);
/**/     this.camera.position.set(150, 100, 80);
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
/* ---- CREATING ZONE ---- */

/**
 * TODO:
 *   - Add shadows
 *   - Orient the geometry
 */

/* --------------------- */
/* ------- Props ------- */
/* --------------------- */

const props = {
  ROT_CURVE: 1, // force of rotation at the center
  ROT_DIST: 0.18, // distance of force at the center
  ROT_FORCE: 0.01, // global rotation force
};

const TEXTURE_SIZE = 12; // 512;
const TEXTURE_HEIGHT = TEXTURE_SIZE;
const TEXTURE_WIDTH = TEXTURE_SIZE;
const INSTANCE_COUNT = TEXTURE_HEIGHT * TEXTURE_WIDTH;

const COLORS = ['#3c6691', '#6394c6', '#146fcd'];

let i, ul;

/* --------------------- */
/* ------- Scene ------- */
/* --------------------- */

// ##
// LIGHTS
const ambiantLight = new AmbientLight(0xffffff, 0.5);
webgl.scene.add(ambiantLight);

const shadowLight = new DirectionalLight(0xffffff, 0.8);
shadowLight.position.set(20, 90, 0);
shadowLight.castShadow = true;
// shadowLight.shadow.camera.near = 1;
// shadowLight.shadow.camera.far = 20;
// shadowLight.shadow.bias = 0.01;
shadowLight.shadow.mapSize.width = 1024;
shadowLight.shadow.mapSize.height = 1024;
shadowLight.shadow.camera.scale.x = 12;
shadowLight.shadow.camera.scale.y = 12;
webgl.scene.add(shadowLight);

// Create a plane that receives shadows (but does not cast them)
const plane = new Mesh(new PlaneBufferGeometry(100, 100, 32, 32), new MeshStandardMaterial());
plane.rotation.x = radians(-90);
plane.position.y = -18;
plane.receiveShadow = true;
webgl.scene.add(plane);

// Create a helper for the shadow camera (optional)
// const helper = new CameraHelper(shadowLight.shadow.camera);
// webgl.scene.add(helper);
// const ligthHelper = new DirectionalLightHelper(shadowLight, 10);
// webgl.scene.add(ligthHelper);


/* ----------------------- */
/* ---- GPUSimulation ---- */
/* ----------------------- */

const gpuSim = new GPUSimulation(TEXTURE_WIDTH, TEXTURE_HEIGHT, webgl.renderer);
gpuSim.initHelper(windowWidth, windowHeight);

// Create textures and init
const dataPosition = gpuSim.createDataTexture();
const textureArraySize = INSTANCE_COUNT * 4;

for (i = 0; i < textureArraySize; i += 4) {
  dataPosition.image.data[i] = getRandomFloat(0, 1);
  dataPosition.image.data[i + 1] = 0;
  dataPosition.image.data[i + 2] = getRandomFloat(0, 0.2);
  dataPosition.image.data[i + 3] = 1;
}

const positionFBO = gpuSim.createSimulation(
  'texturePosition', shaderSimulationPosition, dataPosition, {
    uniforms: {
      // Fist position of each particle
      initialPositionTexture: { type: 't', value: dataPosition },
      // Global rotation force
      rotationCurve: { type: 'f', value: props.ROT_CURVE },
      rotationDistance: { type: 'f', value: props.ROT_DIST },
      rotationForce: { type: 'f', value: props.ROT_FORCE },
    },
  },
);


/* ------------------------ */
/* ------- Instance ------- */
/* ------------------------ */

// ##
// MATERIAL
const uniforms = UniformsUtils.merge([
  UniformsLib.common,
  UniformsLib.lights,
  UniformsLib.shadowmap,
  {
    positions: { type: 't', value: positionFBO.output.texture }, // mustbe updated into the loop
  },
]);

const material = new ShaderMaterial({
  uniforms,
  vertexShader: vertInstanced,
  fragmentShader: fragInstanced,
  lights: true,
  flatShading: FlatShading,
  side: DoubleSide,
});

// ##
// GEOMETRY
const geom = new OctahedronBufferGeometry(1, 0);
geom.scale(1, 30, 1);

// ##
// INSTANCES
const instanceGeom = new InstancedBufferGeometry();
// copy vertices into the instace geometry
const vertices = geom.attributes.position.clone();
instanceGeom.addAttribute('position', vertices);
// const normals = geom.attributes.normal.clone();
// instanceGeom.addAttribute('normal', normals);
// const uvs = geom.attributes.uv.clone();
// instanceGeom.addAttribute('uv', uvs);

const coords = new InstancedBufferAttribute(
  new Float32Array(INSTANCE_COUNT * 2), 2,
);
const colors = new InstancedBufferAttribute(
  new Float32Array(INSTANCE_COUNT * 3), 3,
);

for (i = 0, ul = INSTANCE_COUNT; i < ul; i++) {
  const x = (i % TEXTURE_WIDTH) / TEXTURE_WIDTH;
  const y = Math.floor((i / TEXTURE_WIDTH)) / TEXTURE_HEIGHT;
  coords.setXY(i, x, y);

  const c = new Color(getRandomAttribute(COLORS));
  colors.setXYZ(i, c.r, c.g, c.b);
}
instanceGeom.addAttribute('coord', coords);
instanceGeom.addAttribute('color', colors);

// ##
// MESH
const mesh = new Mesh(instanceGeom, material);
mesh.rotation.x = radians(-90);
mesh.castShadow = true;
mesh.receiveShadow = true;

// Override the default DepthMaterial
mesh.customDepthMaterial = new ShaderMaterial({
  vertexShader: vertDeth,
  fragmentShader: fragDeth,
  uniforms: material.uniforms,
});

webgl.scene.add(mesh);

/* ---- Update ---- */
const update = () => {
  gpuSim.update();
  mesh.material.uniforms.positions.value = positionFBO.output.texture;
  webgl.update();
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
/**/  update();
/**/ 	requestAnimationFrame(_loop);
/**/ }
/**/ _loop();
