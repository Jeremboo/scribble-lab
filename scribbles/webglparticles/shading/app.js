import {
  WebGLRenderer, Scene, PerspectiveCamera,
  Mesh, Color, FlatShading,
  TetrahedronBufferGeometry, InstancedBufferGeometry, InstancedBufferAttribute,
  Matrix4, Quaternion, Euler, Vector3, PointLight, ShaderMaterial, AmbientLight,
  DoubleSide, UniformsUtils, UniformsLib, PCFSoftShadowMap,
  PlaneBufferGeometry, MeshStandardMaterial, PointLightHelper,
} from 'three';

import { getRandomAttribute, getRandomFloat, radians } from 'utils';
import OrbitControls from 'OrbitControl';

import fragInstanced from './shaders/instanced.f.glsl';
import vertInstanced from './shaders/instanced.v.glsl';

const COLORS = ['#c15455', '#6394c6', '#daf4ec'];

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
/**/     this.camera.position.set(0, 0, 100);
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

// Shadows :
// http://blog.edankwan.com/post/three-js-advanced-tips-shadow
// http://learningthreejs.com/blog/2012/01/20/casting-shadows/
// https://github.com/yiwenl/ShadingParticles


let i;
const instanceCount = 25;

// ##
// LIGHTS
const ambiantLight = new AmbientLight(0xffffff, 0.5);
webgl.scene.add(ambiantLight);

const pointLight = new PointLight(0xffffff, 0.5, 300);
pointLight.position.set(50, 50, 0);
pointLight.castShadow = true;
webgl.scene.add(pointLight);

const ligthHelper = new PointLightHelper(pointLight, 10);
webgl.scene.add(ligthHelper);

// ##
// MATERIAL
const uniforms = UniformsUtils.merge([
  UniformsLib.common,
  UniformsLib.lights,
  UniformsLib.shadowmap,
]);

const material = new ShaderMaterial({
  uniforms,
  vertexShader: vertInstanced,
  fragmentShader: fragInstanced,
  lights: true,
  shading: FlatShading,
  side: DoubleSide,
});

// ##
// GEOMETRY
const geom = new TetrahedronBufferGeometry(2, 0);
const instanceGeom = new InstancedBufferGeometry();

// ##
// INSTANCES
// copy vertices into the instace geometry
const vertices = geom.attributes.position.clone();
instanceGeom.addAttribute('position', vertices);

// for the matrix
const mcol0 = new InstancedBufferAttribute(
	new Float32Array(instanceCount * 3), 3, 1
);
const mcol1 = new InstancedBufferAttribute(
	new Float32Array(instanceCount * 3), 3, 1
);
const mcol2 = new InstancedBufferAttribute(
	new Float32Array(instanceCount * 3), 3, 1
);
const mcol3 = new InstancedBufferAttribute(
	new Float32Array(instanceCount * 3), 3, 1
);
instanceGeom.addAttribute('mcol0', mcol0);
instanceGeom.addAttribute('mcol1', mcol1);
instanceGeom.addAttribute('mcol2', mcol2);
instanceGeom.addAttribute('mcol3', mcol3);

// Update Matrix
const position = new Vector3();
const rotation = new Euler();
const quaternion = new Quaternion();
const scale = new Vector3();
const matrix = new Matrix4();
const me = matrix.elements;
for (i = 0; i < instanceCount; i++) {
  // Update matrix
  position.x = getRandomFloat(-20, 20);
  position.y = getRandomFloat(-20, 20);
  position.z = getRandomFloat(-20, 20);
  rotation.x = Math.random() * 2 * Math.PI;
  rotation.y = Math.random() * 2 * Math.PI;
  rotation.z = Math.random() * 2 * Math.PI;
  quaternion.setFromEuler(rotation, false);
  scale.x = scale.y = scale.z = getRandomFloat(2, 4);
  matrix.compose(position, quaternion, scale);

  mcol0.setXYZ(i, me[0], me[1], me[2]);
  mcol1.setXYZ(i, me[4], me[5], me[6]);
  mcol2.setXYZ(i, me[8], me[9], me[10]);
  mcol3.setXYZ(i, me[12], me[13], me[14]);
}

// For the color
const colors = new InstancedBufferAttribute(
	new Float32Array(instanceCount * 3), 3, 1
);
for (let i = 0, ul = colors.count; i < ul; i++) {
  const c = new Color(getRandomAttribute(COLORS));
  colors.setXYZ(i, c.r, c.g, c.b);
}
instanceGeom.addAttribute('color', colors);

// ##
// MESH
const mesh = new Mesh(instanceGeom, material);
mesh.castShadow = true;
mesh.receiveShadow = true;
webgl.scene.add(mesh);

// Create a plane that receives shadows (but does not cast them)
const planeGeometry = new PlaneBufferGeometry(100, 100, 32, 32);
const planeMaterial = new MeshStandardMaterial();
const plane = new Mesh(planeGeometry, planeMaterial);
plane.rotation.x = radians(-90);
plane.position.y = -18;
plane.receiveShadow = true;
webgl.scene.add(plane);


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
