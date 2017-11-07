import {
  WebGLRenderer, Scene, PerspectiveCamera,
  Mesh, Color, FlatShading,
  InstancedBufferGeometry, InstancedBufferAttribute,
  ShaderMaterial, AmbientLight,
  DoubleSide, UniformsUtils, UniformsLib, PCFSoftShadowMap,
  PlaneBufferGeometry, MeshStandardMaterial,
  DirectionalLight,
  OctahedronBufferGeometry, Vector3, Fog,
} from 'three';

import GPUSimulation from 'GPUSimulation';
import { getRandomAttribute, getRandomFloat, radians, getNormalizedPosFromScreen, getRandomEuler } from 'utils';

import fragInstanced from './shaders/instanced.f.glsl';
import vertInstanced from './shaders/instanced.v.glsl';
import vertDeth from './shaders/depth.v.glsl';
import fragDeth from './shaders/depth.f.glsl';
import shaderSimulationPosition from './shaders/simulationPosition.f.glsl';

// target mouse position in the 3D view
let normalizedMouse = new Vector3();
window.addEventListener('mousemove', (e) => {
  normalizedMouse = getNormalizedPosFromScreen(e.clientX, e.clientY)
});

/**/ /* ---- CORE ---- */
/**/ const mainColor = '#070707';
/**/ const secondaryColor = '#C9F0FF';
/**/ const bgColor = 0xEDF2F4;
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
this.scene.fog = new Fog(bgColor, 0, 350)
/**/     this.camera = new PerspectiveCamera(50, w / h, 1, 1000);
/**/     this.camera.position.set(0, 0, 200);
         this.camera.lookAt(new Vector3(0, 0, 0))
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

         this.camera.position.x += ((normalizedMouse.x * 40) - this.camera.position.x) * 0.08;
         this.camera.position.y += (30 + (normalizedMouse.y * 20) - this.camera.position.y) * 0.08;
         this.camera.lookAt(new Vector3());
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

const COLORS = ['#A6A6A6', '#545454', '#CCCCCC'];

let i, ul;

/* --------------------- */
/* ------- Scene ------- */
/* --------------------- */

// ##
// LIGHTS
const ambiantLight = new AmbientLight(0xffffff, 0.8);
webgl.scene.add(ambiantLight);

const shadowLight = new DirectionalLight(0xffffff, 0.2);
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
const plane = new Mesh(new PlaneBufferGeometry(1000, 1000, 32, 32), new MeshStandardMaterial({ color: bgColor }));
plane.rotation.x = radians(-90);
plane.position.y = -18;
plane.receiveShadow = true;
webgl.scene.add(plane);

/* ----------------------- */
/* ---- GPUSimulation ---- */
/* ----------------------- */

const gpuSim = new GPUSimulation(TEXTURE_WIDTH, TEXTURE_HEIGHT, webgl.renderer);

// Create textures and init
const dataPosition = gpuSim.createDataTexture();
const textureArraySize = INSTANCE_COUNT * 4;

for (i = 0; i < textureArraySize; i += 4) {
  const ampl = Math.cos(i) * 3
  const radius = getRandomFloat(-ampl, ampl)
  dataPosition.image.data[i] = Math.cos(getRandomFloat(0, 6.2831)) * radius;
  dataPosition.image.data[i + 1] = Math.sin(getRandomFloat(0, 6.2831)) * radius;
  dataPosition.image.data[i + 2] = getRandomFloat(-0.4, 2);
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
      t: { type: 'f', value: 0 },
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
geom.scale(1, 10, 1);

// ##
// INSTANCES
const instanceGeom = new InstancedBufferGeometry();
// copy vertices into the instace geometry
const vertices = geom.attributes.position.clone();
instanceGeom.addAttribute('position', vertices);


const coords = new InstancedBufferAttribute(
  new Float32Array(INSTANCE_COUNT * 2), 2, 1,
);
const colors = new InstancedBufferAttribute(
  new Float32Array(INSTANCE_COUNT * 3), 3, 1,
);
const rotations = new InstancedBufferAttribute(
  new Float32Array(INSTANCE_COUNT * 3), 3, 1,
);

for (i = 0, ul = INSTANCE_COUNT; i < ul; i++) {
  const x = (i % TEXTURE_WIDTH) / TEXTURE_WIDTH;
  const y = Math.floor((i / TEXTURE_WIDTH)) / TEXTURE_HEIGHT;
  coords.setXY(i, x, y);

  const c = new Color(getRandomAttribute(COLORS));
  colors.setXYZ(i, c.r, c.g, c.b);

  const r = getRandomEuler()
  rotations.setXYZ(i, r.x, r.y, r.z);
}
instanceGeom.addAttribute('coord', coords);
instanceGeom.addAttribute('rotation', rotations);
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
  positionFBO.material.uniforms.t.value += 0.1;
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
