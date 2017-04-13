import {
  WebGLRenderer, Scene, PerspectiveCamera, Object3D, BoxGeometry,
  MeshBasicMaterial, Mesh, Color, FlatShading, RawShaderMaterial,
  TetrahedronBufferGeometry, InstancedBufferGeometry, InstancedBufferAttribute,
  Matrix4, Quaternion, Euler, Vector3,
} from 'three';

import OrbitControls from 'OrbitControl';

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
/**/     this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
/**/     this.renderer.setPixelRatio(window.devicePixelRatio);
/**/     if (bgColor) this.renderer.setClearColor(new Color(bgColor));
/**/     this.scene = new Scene();
/**/     this.camera = new PerspectiveCamera(50, w / h, 1, 1000);
/**/     this.camera.position.set(0, 0, 10);
/**/     this.controls = new OrbitControls(this.camera, this.renderer.domElement);
/**/     this.controls.enableDamping = true;
/**/     this.controls.dampingFactor = 0.1;
/**/     this.controls.rotateSpeed = 0.1;
/**/     this.controls.minDistance = 5;
/**/     this.controls.maxDistance = 20;
/**/     this.controls.maxPolarAngle = Math.PI * 0.45;
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

const getRandomInt = (min, max) => Math.floor((Math.random() * ((max - min) + 1))) + min;
const getRandomAttribute = (json) => {
  const keys = Object.keys(json);
  return json[keys[getRandomInt(0, keys.length - 1)]];
};

const COLORS = {
  YELLOW: 0xFFE700,
  YELLOW_1: 0xFFD700,
  ORANGE: 0xF7AC00,
  ORANGE_1: 0xF19000,
  ORANGE_2: 0xEB6B00,
  ORANGE_3: 0xE85207,
  RED: 0xE3122C,
  GREEN: 0x00A47B,
  GREEN_1: 0x008A35,
  GREEN_2: 0x006B29,
  BLUE: 0x00ADC0,
  BLUE_1: 0x008ED0,
  BLUE_2: 0x0063AD,
  BLUE_3: 0x273A8F,
  PURPLE: 0xC2006B,
  PURPLE_1: 0xB10276,
  PURPLE_2: 0x944492,
  PURPLE_3: 0x80368A,
  PURPLE_4: 0x6F1F81,
  PURPLE_5: 0x522282,
  PURPLE_6: 0x4B2F85,
};

const vertInstanced = `
  #define SHADER_NAME vertInstanced
	precision highp float;
	uniform mat4 modelViewMatrix;
	uniform mat4 projectionMatrix;
	attribute vec3 position;
	attribute vec3 mcol0;
	attribute vec3 mcol1;
	attribute vec3 mcol2;
	attribute vec3 mcol3;

	attribute vec3 color;
	varying vec3 vPosition;

	varying vec3 vColor;
	void main()	{

		mat4 matrix = mat4(
			vec4(mcol0, 0),
			vec4(mcol1, 0),
			vec4(mcol2, 0),
			vec4(mcol3, 1)
		);

		vec3 positionEye = (modelViewMatrix * matrix * vec4(position, 1.0)).xyz;

		vColor = color;
		vPosition = positionEye;

		gl_Position = projectionMatrix * vec4(positionEye, 1.0);
	}
`;

const fragInstanced = `
  #define SHADER_NAME fragInstanced
	#extension GL_OES_standard_derivatives : enable
	precision highp float;

	varying vec3 vColor;
	varying vec3 vPosition;

	void main()	{
		vec3 fdx = dFdx(vPosition);
		vec3 fdy = dFdy(vPosition);
		vec3 normal = normalize(cross(fdx, fdy));
		float diffuse = dot(normal, vec3(0.0, 0.0, 1.0));
		gl_FragColor = vec4(diffuse * vColor, 1.0);
	}
`;

const instanceCount = 100; // 25000;

// ##
// MATRIX
const position = new Vector3();
const rotation = new Euler();
const quaternion = new Quaternion();
const scale = new Vector3();
const matrix = new Matrix4();
const me = matrix.elements;
const updateMatrix = () => {
  position.x = Math.random() * 4 - 2;
  position.y = Math.random() * 4 - 2;
  position.z = Math.random() * 4 - 2;
  rotation.x = Math.random() * 2 * Math.PI;
  rotation.y = Math.random() * 2 * Math.PI;
  rotation.z = Math.random() * 2 * Math.PI;
  quaternion.setFromEuler(rotation, false);
  scale.x = scale.y = scale.z = 1;
  matrix.compose(position, quaternion, scale);
};

// ##
// MATERIAL
const material = new RawShaderMaterial({
  vertexShader: vertInstanced,
  fragmentShader: fragInstanced,
});

// ##
// GEOMETRY
const geom = new TetrahedronBufferGeometry(1, 0);
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
  const c = new Color(getRandomAttribute(COLORS)).getHSL();
  colors.setXYZ(i, c.h, c.s, c.l);
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
      updatePosition();
/**/ }
/**/ _loop();
