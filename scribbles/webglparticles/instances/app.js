import {
  WebGLRenderer, Scene, PerspectiveCamera,
  Mesh, Color, FlatShading,
  TetrahedronBufferGeometry, InstancedBufferGeometry, InstancedBufferAttribute,
  Matrix4, Quaternion, Euler, Vector3, PointLight, ShaderMaterial, AmbientLight,
  PointLightHelper
} from 'three';

import { getRandomAttribute } from 'utils';
import OrbitControls from 'OrbitControl';

import fragInstanced from './shaders/instanced.f.glsl';
import vertInstanced from './shaders/instanced.v.glsl';

const COLORS = ['#c15455', '#6394c6', '#daf4ec'];

/**/ /* ---- CORE ---- */
/**/ const mainColor = '#070707';
/**/ const secondaryColor = '#C9F0FF';
/**/ const bgColor = 0xaaaaaa; // 'rgb(0, 0, 0)';
/**/ let windowWidth = window.innerWidth;
/**/ let windowHeight = window.innerHeight;
/**/ class Webgl {
/**/   constructor(w, h) {
/**/     this.meshCount = 0;
/**/     this.meshListeners = [];
/**/     this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
/**/     this.renderer.setPixelRatio(window.devicePixelRatio);
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
/**/
/* ---- CREATING ZONE ---- */

const instanceCount = 25000; // 25000;

// ##
// LIGHT
const ambiantLight = new AmbientLight(0xffffff, 0.5);
webgl.scene.add(ambiantLight);
const lights = [];
for (let i = 0; i < 4; i++) {
  const light = new PointLight(0xffffff, 0.5, 200);
  webgl.scene.add(light);
  lights.push(light);
}
lights[0].position.set(35, 20, 47);
lights[0].power = 2.5;
lights[1].position.set(-20, 50, -100);
lights[2].position.set(-50, 30, 110);
lights[2].power = 12;
lights[3].position.set(35, 30, 230);
lights[3].power = 8;
// helpers
for (let i = 0; i < 4; i++) {
  const helper = new PointLightHelper(lights[i], 10);
  webgl.scene.add(helper);
}

// ##
// MATRIX
const position = new Vector3();
const rotation = new Euler();
const quaternion = new Quaternion();
const scale = new Vector3();
const matrix = new Matrix4();
const me = matrix.elements;
const updateMatrix = () => {
  position.x = Math.random() * 400 - 200;
  position.y = Math.random() * 400 - 200;
  position.z = Math.random() * 400 - 200;
  rotation.x = Math.random() * 2 * Math.PI;
  rotation.y = Math.random() * 2 * Math.PI;
  rotation.z = Math.random() * 2 * Math.PI;
  quaternion.setFromEuler(rotation, false);
  scale.x = scale.y = scale.z = Math.random() * 4 - 2;
  matrix.compose(position, quaternion, scale);
};

// ##
// MATERIAL
const material = new ShaderMaterial({
  uniforms: {
    eyePosition: { type: 'v3', value: webgl.camera.position },
    lightPosition: { type: 'v3', value: lights[0].position },
    roughness: { type: 'f', value: 10 },
    fresnel: { type: 'f', value: 15 },
  },
  vertexShader: vertInstanced,
  fragmentShader: fragInstanced,
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
// for the color
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
webgl.scene.add(mesh);

// ##
// UPDATE
const updatePosition = () => {
  mesh.geometry.attributes.mcol0.needsUpdate = true;
  mesh.geometry.attributes.mcol1.needsUpdate = true;
  mesh.geometry.attributes.mcol2.needsUpdate = true;
  mesh.geometry.attributes.mcol3.needsUpdate = true;

  let i;
  for (i = 0; i < instanceCount; i++) {
    updateMatrix();
    mcol0.setXYZ(i, me[0], me[1], me[2]);
    mcol1.setXYZ(i, me[4], me[5], me[6]);
    mcol2.setXYZ(i, me[8], me[9], me[10]);
    mcol3.setXYZ(i, me[12], me[13], me[14]);
  }
};

updatePosition();

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
      // updatePosition();
/**/ }
/**/ _loop();
