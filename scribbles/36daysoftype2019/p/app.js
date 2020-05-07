import {
  WebGLRenderer, PerspectiveCamera,
  MeshStandardMaterial, Mesh, Color,
  AmbientLight, MeshBasicMaterial,
  BoxGeometry, Vector3, DirectionalLight, Fog
} from 'three';
import Physijs from 'physi.js';

import CameraMouseControl from '../../../modules/CameraMouseControl';

import physijsWorkedUrl from '../../../workers/physijs_worker';
import ammoUrl from '../../../workers/ammo';

Physijs.scripts.worker = physijsWorkedUrl;
// Physijs.scripts.ammo = ammoUrl;


import OBJLoader from '../../../modules/OBJLoader';

const letterP = './assets/letter_p.obj';

const MAIN_COLOR = '#D741A7';
const BACKGROUND_COLOR = '#040507';

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
    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(1.6, window.devicePixelRatio) || 1);
    this.renderer.setClearColor(new Color(BACKGROUND_COLOR));
    this.scene = new Physijs.Scene;
    this.scene.setGravity(new Vector3( 0, -50, 0 ));
    this.scene.fog = new Fog(BACKGROUND_COLOR, 15, 150);
    this.camera = new PerspectiveCamera(35, w / h, 1, 1000);
    this.camera.position.set( 0, 10, 50 );
		this.camera.lookAt(new Vector3(0, 10, 0));
    this.scene.add(this.camera);

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
    this.scene.simulate();
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
 * * *******************
 */

   // Lights
const ambiantLight = new AmbientLight(0xD61474, 1);
webgl.add(ambiantLight);

const directionalLight = new DirectionalLight( 0x8C29F5, 2 );
directionalLight.position.set(10, 0, 0);
webgl.add( directionalLight );

// const light1 = new PointLight( new Color('#DC415C'), 0.75, 100 );
// light1.position.z = 1;
// light1.position.x = 1;
// webgl.add( light1 );

// const light2 = new PointLight( new Color('#462ADF'), 0.75, 100 );
// light2.position.z = 2;
// light2.position.x = -1;
// webgl.add( light2 );

const collisionMaterial = new Physijs.createMaterial(
  new MeshBasicMaterial({
    visible : false,
    wireframe : true,
    color : 0x000000
  }),
  .6, // medium friction
  .2 // low restitution
);

// OBJECTS
export default class P extends Physijs.BoxMesh {
  constructor(geometry, size) {

    // const size = Math.random() * 3;
    const collisionGeometry = new BoxGeometry(
      0.5 * size,
      0.1 * size,
      0.7 * size
    );

    super(collisionGeometry, collisionMaterial);

    geometry.computeBoundingBox();
    const material = new MeshStandardMaterial({
      color : MAIN_COLOR,
      // side : DoubleSide,
      roughness : 0.2,
      metalness : 0.1,

    });

    this.mesh =  new Mesh(geometry, material);
    this.mesh.scale.multiplyScalar(size);
    this.mesh.position.z -= 0.24;
    this.mesh.position.y -= 0.2;

    this.add(this.mesh);

    this.position.y = 30;

    this.rotation.set(
      Math.random(),
      Math.random(),
      Math.random()
    );


    this.t = 0;

    this.update = this.update.bind(this);

    this.rotation.x = Math.PI / 2;

    this.scale.multiplyScalar(5);
  }

  update() {
    // this.rotation.z += 0.04;
  };
}

// Ground
const ground_material = Physijs.createMaterial(
  new MeshBasicMaterial({
    color : new Color('#ffffff'),
    // wireframe : true,
    visible : false
  }),
  1, // high friction
  2 // low restitution
);

const ground = new Physijs.BoxMesh(
  new BoxGeometry(500, 1, 500),
  ground_material,
  0 // mass
);
ground.receiveShadow = true;
webgl.add( ground );

const loader = new OBJLoader();
loader.load(letterP, obj => {

  // TODO dynamise the position of the pop depending to the mouse position
  // TODO on click, reset all
  for(let i = 1; i < 50; i++) {
    setTimeout(() => {
      const p = new P(obj.children[0].geometry, 1 + i * 0.2);
      p.position.y += i * 2;
      webgl.add(p);
    }, i * 200);
  }
	}, xhr => {
		console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
	}, (error) => {
		console.log( 'An error happened' );
	}
);


// CAMERA CONTROLLER
const cameraControl = new CameraMouseControl(webgl.camera, {
  mouseMove: [-150, -50],
  velocity: [0.1, 0.1],
});
cameraControl.lookAt.y = 10;
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

  // Camera update
  cameraControl.update();

  requestAnimationFrame(loop);
}
loop();
