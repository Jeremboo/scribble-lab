import {
	WebGLRenderer, Scene, PerspectiveCamera, Color, Group,
	RGBFormat, FloatType, RawShaderMaterial, DoubleSide,
	InstancedBufferGeometry, InstancedBufferAttribute, Mesh,
	Vector3, OctahedronBufferGeometry
} from 'three';

import { GUI } from 'dat.gui';
import OrbitControls from '../../../modules/OrbitControls';


import { particleFrag, particleVert, positionFrag, velocityFrag } from './shaders.glsl';

import GPUSimulation from '../../../modules/GPUSimulation';

import { getRandomFloat } from '../../../utils';

const COLORS = [
  // '#80D39B',
	// '#52489C',
	'#0012FF',
	'#00FCFF',
	'#000000',
	'#000000'
];

const TEXTURE_SIZE = 128;
const TEXTURE_HEIGHT = TEXTURE_SIZE;
const TEXTURE_WIDTH = TEXTURE_SIZE;

const BACKGROUND_COLOR = '#000000';

const ORIGIN = new Vector3();

const props = {
	NBR_OF_PARTICLES : 100,
	PAUSED : false,
	// DISANCE
	DISTANCE : 120,
	ROTATION : 0.003,
	// COLORS
	CONTRAST   : 0.5,
	BRIGHTNESS : 5.1,
	DIRECTION  : 1.2,
	// CURL NOISE
	TURBULENCE : 0.001,
	SPEED      : 0.15,
	COMPLEXITY : 0.01,
	// LIMITATION
	ATTRACTION_FORCE : 0.33,
	ATTRACTION_NOISE : 0.4,
	FRICTION_FORCE   : 0.4,
	FRICTION_NOISE   : 0.5,
	DISTANCE_SIZE    : 10.1,
	DISTANCE_NOISE   : 25.1,
};

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
    this.renderer.setClearColor(new Color(BACKGROUND_COLOR));
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(50, w / h, 1, 1000);
		this.camera.position.set(0, 0, props.DISTANCE);
    this.dom = this.renderer.domElement;
		this.controls = new OrbitControls(this.camera, this.dom);
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
		// gpuSim.helper.update();

		props.DISTANCE = this.camera.position.distanceTo(ORIGIN);
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
 * * *******************
 */

/**
 **********
 * FBO
 **********
 */
const gpuSim = new GPUSimulation(webgl.renderer, { width : TEXTURE_WIDTH, height : TEXTURE_HEIGHT });
// gpuSim.initHelper(windowWidth, windowHeight);


class Fluid extends Group {
	constructor() {
		super();

		this.timer = 0;
		this.normalizedMouse = new Vector3();

		// Create an object of accessible data
		this.data = this.createData();

		this.material = this.createMaterial();
		this.geometry = this.createInstanceGeometry();

		// TODO	 directly create the mesh
		this.mesh = new Mesh(this.geometry, this.material);
		this.add(this.mesh);

    // TARGET MOUSE POSITION
    // const backgroundGeom = new PlaneBufferGeometry(4000, 4000, 1);
    // const backgroundMat = new MeshBasicMaterial( { visible: false } );
    // const background = new Mesh( backgroundGeom, backgroundMat );
    // background.rotation.x = radians(-30);
    // this.add(background)

    // const raycaster = new Raycaster();
    // document.body.addEventListener('mousemove', (e) => {
    //   this.normalizedMouse = getNormalizedPosFromScreen(e.clientX, e.clientY);
    //   raycaster.setFromCamera(this.normalizedMouse, camera);

    //   const intersects = raycaster.intersectObjects(this.children);

    //   let i = 0;
    //   let isIntersected = false;
    //   while (i < intersects.length && !isIntersected) {
    //     if (intersects[i].object.uuid === background.uuid) {
    //       isIntersected = true;
    //       this.data.velocitySimulation.material.uniforms.mousePosition.value = intersects[i].point;
    //       this.data.positionSimulation.material.uniforms.mousePosition.value = intersects[i].point;
    //     }
    //     i += 1;
    //   }
		// });

		this.update = this.update.bind(this);

		// DEBUG
		this.update();
		this.debugPause = props.PAUSED;
	}

	createData() {
		// POSITION
		const positionDataTexture = gpuSim.createDataTexture({
			format: RGBFormat,
			type: FloatType,
			// TODO	define the correct nbr of particles we want
			with: TEXTURE_SIZE,
			height: TEXTURE_SIZE,
		});

		// VELOCITY
		const velocityDataTexture = gpuSim.createDataTexture({
			format: RGBFormat,
			type: FloatType,
			// TODO	define the correct nbr of particles we want
			with: TEXTURE_SIZE,
			height: TEXTURE_SIZE,
		});

		// INFOS
		// TODO check for why it's necessary
		const dataTextureInfos = gpuSim.createDataTexture({
			format: RGBFormat,
			type: FloatType,
			// TODO	define the correct nbr of particles we want
			with: TEXTURE_SIZE,
			height: TEXTURE_SIZE,
		});

		const length = TEXTURE_SIZE * TEXTURE_SIZE


		// COLOR
		const colors = new Float32Array(length * 3);
		const uv = new Float32Array(length * 2);

		/**
		 * POPULATE THE DATA
		 */

		let idx2 = 0;
		let idx3 = 0;
		for( let i = 0; i < length; i ++ ) {

			// TODO update the initial position
      positionDataTexture.image.data[ idx3 + 0 ] = getRandomFloat(50, 100) * Math.sign(Math.random() - 0.5);
      positionDataTexture.image.data[ idx3 + 1 ] = getRandomFloat(0, 100) * Math.sign(Math.random() - 0.5);
      positionDataTexture.image.data[ idx3 + 2 ] = getRandomFloat(10, 100)

      velocityDataTexture.image.data[ idx3 + 0 ] = 0;
      velocityDataTexture.image.data[ idx3 + 1 ] = 0;
      velocityDataTexture.image.data[ idx3 + 2 ] = 0;

      dataTextureInfos.image.data[ idx3 + 0 ] = getRandomFloat(props.ATTRACTION_FORCE, props.ATTRACTION_FORCE + props.ATTRACTION_NOISE); // attraction force
      dataTextureInfos.image.data[ idx3 + 1 ] = getRandomFloat(props.ATTRACTION_FORCE, props.ATTRACTION_FORCE + props.ATTRACTION_NOISE); // friction
      dataTextureInfos.image.data[ idx3 + 2 ] = getRandomFloat(props.DISTANCE_SIZE, props.DISTANCE_SIZE + props.DISTANCE_NOISE); // limitation zone

			// Set a random color
			const c = new Color(COLORS[i % COLORS.length]);
			// const c = (positionDataTexture.image.data[ idx3 + 1 ] > 0) ?
			// 	new Color(COLORS[0]) :
			// 	new Color(COLORS[1]);

			colors[ idx3 + 0 ] = c.r;
			colors[ idx3 + 1 ] = c.g;
			colors[ idx3 + 2 ] = c.b;

			// Create the UVs
			// TODO check the necessity of that
      uv[idx2 + 0] = (i % TEXTURE_SIZE) / TEXTURE_SIZE;
      uv[idx2 + 1] = Math.floor((i / TEXTURE_SIZE)) / TEXTURE_SIZE;

      idx2 += 2;
			idx3 += 3;
		}

		/**
		 * CREATE THE DATA
		 */
		return {
			positionSimulation: gpuSim.createSimulation('positions', positionFrag, positionDataTexture, {
				format   : RGBFormat,
				uniforms : {
					t_currentForce : { value: velocityDataTexture },
					// props
					expantion      : { value: 0 },
					speed          : { value: props.SPEED },
					complexity     : { value : props.COMPLEXITY },
				}
			}),
			velocitySimulation: gpuSim.createSimulation('velocity', velocityFrag, velocityDataTexture, {
				format   : RGBFormat,
				uniforms : {
					t_currentPosition: { value: positionDataTexture },
					t_infos: { value: dataTextureInfos },
					mousePosition: { value: this.normalizedMouse },
				}
			}),
			dataTextureInfos,
			colors,
			uv
		}
	}

	createMaterial() {
		return new RawShaderMaterial( {
      uniforms: {
        tSimulation: { value: this.data.positionSimulation.output.texture },
        tOldSimulation: { value : this.data.positionSimulation.input.texture },
				tForce: { value: this.data.velocitySimulation.output.texture },
				// lighting
				contrast   : { value: props.CONTRAST },
				brightness : { value: props.BRIGHTNESS },
				directionForce  : { value : props.DIRECTION }
      },
			vertexShader: particleVert,
			fragmentShader: particleFrag,
			transparent: false,
			side: DoubleSide,
			type: "InstancedBufferGeometryExample"
		} )
	}

	createInstanceGeometry() {
		// The initial geometry
		const bufferGeom = new OctahedronBufferGeometry( 0.1, 0);
		bufferGeom.scale(1.5, 1.5, 1.5);

		// const bufferGeom = new SphereBufferGeometry(0.1, 10, 10)
		// bufferGeom.scale(1, 1, 10);

		const instGeom = new InstancedBufferGeometry();
		instGeom.copy(bufferGeom);
		// instGeom.addAttribute('position', bufferGeom.attributes.position.clone());

		instGeom.addAttribute( "aColors", new InstancedBufferAttribute( this.data.colors, 3, false ) );
		instGeom.addAttribute( "aUvs", new InstancedBufferAttribute( this.data.uv, 2, false ) );

		return instGeom;
	}

  update() {
		if (this.debugPause) return;

    this.data.positionSimulation.material.uniforms.t_currentForce.value = this.data.velocitySimulation.output.texture;
		this.data.positionSimulation.material.uniforms.expantion.value += props.TURBULENCE;

		gpuSim.updateSimulation(this.data.positionSimulation);
		this.data.velocitySimulation.material.uniforms.t_currentPosition.value = this.data.positionSimulation.output.texture;
		gpuSim.updateSimulation(this.data.velocitySimulation);

    this.mesh.material.uniforms.tSimulation.value = this.data.positionSimulation.output.texture;
		this.mesh.material.uniforms.tOldSimulation.value = this.data.positionSimulation.input.texture;


		this.mesh.rotation.y += props.ROTATION;
	}

	debugRestart() {
		gpuSim.removeSimulation(this.data.positionSimulation);
		gpuSim.removeSimulation(this.data.velocitySimulation);

		this.data = this.createData();
	}

	debugResetDataTextureInfos() {

		// Need to request an update
		this.data.dataTextureInfos.needsUpdate = true;

		let idx3 = 0;
		const length = TEXTURE_SIZE * TEXTURE_SIZE;
		for( let i = 0; i < length; i ++ ) {
      this.data.dataTextureInfos.image.data[ idx3 + 0 ] = getRandomFloat(props.ATTRACTION_FORCE, props.ATTRACTION_FORCE + props.ATTRACTION_NOISE); // attraction force
      this.data.dataTextureInfos.image.data[ idx3 + 1 ] = getRandomFloat(props.ATTRACTION_FORCE, props.ATTRACTION_FORCE + props.ATTRACTION_NOISE); // friction
			this.data.dataTextureInfos.image.data[ idx3 + 2 ] = getRandomFloat(props.DISTANCE_SIZE, props.DISTANCE_SIZE + props.DISTANCE_NOISE); // limitation zone
			idx3 += 3;
		}

		this.data.velocitySimulation.material.uniforms.t_infos.value = this.data.dataTextureInfos;
	}
}

// START
const fluid = new Fluid();
webgl.add(fluid);

// GUI
const gui = new GUI();

// Distance
gui.add(props, 'DISTANCE', 1, 300).listen().onChange((newDistance) => {
	const currentDistance = webgl.camera.position.distanceTo(ORIGIN);
	const ratio = newDistance / currentDistance;
	webgl.camera.position.multiplyScalar(ratio);
});
gui.add(props, 'ROTATION', 0, 0.01);

// Lighting
const lightingFolder = gui.addFolder('RENDER');
lightingFolder.open();
lightingFolder.add(props, 'CONTRAST', 0, 20).onChange((value) => {
	fluid.mesh.material.uniforms.contrast.value = value;
});
lightingFolder.add(props, 'BRIGHTNESS', 0, 20).onChange((value) => {
	fluid.mesh.material.uniforms.brightness.value = value;
});
lightingFolder.add(props, 'DIRECTION', 0.01, 2).onChange((value) => {
	fluid.mesh.material.uniforms.directionForce.value = value;
});

// Noise
const curlNoiseFolder = gui.addFolder('CURL NOISE');
curlNoiseFolder.open();GPUSimulation
curlNoiseFolder.add(props, 'TURBULENCE', 0.0001, 0.02);
curlNoiseFolder.add(props, 'SPEED', 0.01, 1).onChange((value) => {
	fluid.data.positionSimulation.material.uniforms.speed.value = value;
});
curlNoiseFolder.add(props, 'COMPLEXITY', 0.001, 0.08).onChange((value) => {
	fluid.data.positionSimulation.material.uniforms.complexity.value = value;
});

// Limitations
const edgesFolder = gui.addFolder('ZONE');
edgesFolder.open();
const attractionFolder = edgesFolder.addFolder('ATTRACTION');
attractionFolder.open();
attractionFolder.add(props, 'ATTRACTION_FORCE', 0, 1).name('FORCE').onChange(() => {
	fluid.debugResetDataTextureInfos();
});
attractionFolder.add(props, 'ATTRACTION_NOISE', 0, 1).name('NOISE').onChange(() => {
	fluid.debugResetDataTextureInfos();
});
const frictionFolder = edgesFolder.addFolder('FRICTION');
frictionFolder.open();
frictionFolder.add(props, 'FRICTION_FORCE', 0, 1).name('FORCE').onChange(() => {
	fluid.debugResetDataTextureInfos();
});
frictionFolder.add(props, 'FRICTION_NOISE', 0, 1).name('NOISE').onChange(() => {
	fluid.debugResetDataTextureInfos();
});
const distanceFolder = edgesFolder.addFolder('DISTANCE');
distanceFolder.open();
distanceFolder.add(props, 'DISTANCE_SIZE', 0, 50).name('SIZE').onChange(() => {
	fluid.debugResetDataTextureInfos();
});
distanceFolder.add(props, 'DISTANCE_NOISE', 0, 50).name('NOISE').onChange(() => {
	fluid.debugResetDataTextureInfos();
});

// Functions
gui.add(fluid, 'debugPause').name('pause()');
gui.add(fluid, 'debugRestart').name('restart()');



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
	webgl.update();
  requestAnimationFrame(loop);
}
loop();
