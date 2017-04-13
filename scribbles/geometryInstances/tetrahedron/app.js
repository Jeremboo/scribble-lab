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

const randomizeMatrix = function() {
	const position = new Vector3();
  const rotation = new Euler();
	const quaternion = new Quaternion();
	const scale = new Vector3();
	return (matrix) => {
		position.x = Math.random() * 40 - 20;
		position.y = Math.random() * 40 - 20;
		position.z = Math.random() * 40 - 20;
		rotation.x = Math.random() * 2 * Math.PI;
		rotation.y = Math.random() * 2 * Math.PI;
		rotation.z = Math.random() * 2 * Math.PI;
		quaternion.setFromEuler(rotation, false);
		scale.x = scale.y = scale.z = Math.random() * 1;
		matrix.compose(position, quaternion, scale);
	};
}();

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
  attribute mat4 matrix;

	#ifdef PICKING
		attribute vec3 pickingColor;
	#else
		attribute vec3 color;
		varying vec3 vPosition;
	#endif

	varying vec3 vColor;
	void main()	{

		mat4 matrix = mat4(
			vec4(mcol0, 0),
			vec4(mcol1, 0),
			vec4(mcol2, 0),
			vec4(mcol3, 1)
		);

		vec3 positionEye = (modelViewMatrix * matrix * vec4(position, 1.0)).xyz;

		#ifdef PICKING
			vColor = pickingColor;
		#else
			vColor = color;
			vPosition = positionEye;
		#endif

		gl_Position = projectionMatrix * vec4(positionEye, 1.0);
	}
`;

const fragInstanced = `
  #define SHADER_NAME fragInstanced
	#extension GL_OES_standard_derivatives : enable
	precision highp float;
	varying vec3 vColor;

	#ifndef PICKING
		varying vec3 vPosition;
	#endif

	void main()	{

		#ifdef PICKING
			gl_FragColor = vec4(vColor, 1.0);
		#else
			vec3 fdx = dFdx(vPosition);
			vec3 fdy = dFdy(vPosition);
			vec3 normal = normalize(cross(fdx, fdy));
			float diffuse = dot(normal, vec3(0.0, 0.0, 1.0));
			gl_FragColor = vec4(diffuse * vColor, 1.0);
		#endif
	}
`;

const instanceCount = 1000;

const material = new RawShaderMaterial({
  vertexShader: vertInstanced,
  fragmentShader: fragInstanced,
});

const geom = new TetrahedronBufferGeometry(1, 0);
const instanceGeom = new InstancedBufferGeometry();

// ##
// copy vertices into the instace geometry
const vertices = geom.attributes.position.clone();
instanceGeom.addAttribute('position', vertices);

// ##
// CREATE RANDOM MATRIX
const matrices = new InstancedBufferAttribute(
	new Float32Array(instanceCount * 16), 16, 1
);
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

const matrix = new Matrix4();
const me = matrix.elements;

for (let i = 0, ul = mcol0.count; i < ul; i++) {
	randomizeMatrix(matrix);

	// var object = new Object3D();
	// objectCount ++;
	// object.applyMatrix(matrix);
	// pickingData[i + 1] = object;

	matrices.set(matrix.elements, i * 16);
	mcol0.setXYZ(i, me[0], me[1], me[2]);
	mcol1.setXYZ(i, me[4], me[5], me[6]);
	mcol2.setXYZ(i, me[8], me[9], me[10]);
	mcol3.setXYZ(i, me[12], me[13], me[14]);
}

instanceGeom.addAttribute('matrix', matrices);
instanceGeom.addAttribute('mcol0', mcol0);
instanceGeom.addAttribute('mcol1', mcol1);
instanceGeom.addAttribute('mcol2', mcol2);
instanceGeom.addAttribute('mcol3', mcol3);

// ##
// RANDOM COLOR
const colors = new InstancedBufferAttribute(
	new Float32Array(instanceCount * 3), 3, 1
);

for (let i = 0, ul = colors.count; i < ul; i++) {
	colors.setXYZ(i, Math.random(), Math.random(), Math.random());
}
instanceGeom.addAttribute('color', colors);


// ##
// MESH
const mesh = new Mesh(instanceGeom, material);
webgl.scene.add(mesh);

// // OBJECTS
// class Example extends Object3D {
//   constructor() {
//     super();
//
//     this.material = new MeshBasicMaterial({
//       color: new Color(secondaryColor),
//       shading: FlatShading,
//       wireframe: true,
//     });
//     this.geometry = new BoxGeometry(1, 1, 1);
//     this.mesh = new Mesh(this.geometry, this.material);
//
//     this.add(this.mesh);
//
//     this.update = this.update.bind(this);
//   }
//
//   update() {
//     this.rotation.x += 0.03;
//     this.rotation.y += 0.03;
//   }
// }
//
// // START
// const ex = new Example();
//
// // ADDS
// webgl.add(ex);

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
