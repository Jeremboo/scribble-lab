import {
  WebGLRenderer, Scene, PerspectiveCamera, Object3D, BoxGeometry,
  MeshBasicMaterial, Mesh, Color, FlatShading, PlaneBufferGeometry,
  BoxBufferGeometry
} from 'three';

import ReflectorMaterial from 'ReflectorMaterial';

import CameraMouseControl from 'CameraMouseControl';


const MAIN_COLOR = '#C9F0FF';
const SECONDARY_COLOR = '#070707';
const BACKGROUND_COLOR = '#ffffff';

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
    this.camera.position.set(0, 0, 10);
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
 * * *******************
 */


class Mirror extends Object3D {
  constructor() {
    super();
    this.material = new MeshBasicMaterial({
      color: new Color(MAIN_COLOR),
      // wireframe: true,
    });
    this.geometry = new BoxGeometry(1, 1, 1);
    this.mesh = new Mesh(this.geometry, this.material);
    this.update = this.update.bind(this);

    this.add(this.mesh);
  }

  update() {
    this.rotation.x += 0.03;
    this.rotation.y += 0.03;
  }
}

const geom = new PlaneBufferGeometry( 4, 6 );
const groundMirror = new Reflector( geom, {
  clipBias: 0.003,
  textureWidth: 1024 * 2,
  textureHeight: 1024 * 2,
  color: 0xEEEEEE,
  recursion: 1
} );
groundMirror.position.z = -2;
groundMirror.position.x = -2;
groundMirror.rotation.y = Math.PI * 0.1;
webgl.add( groundMirror );

// START
const mirror = new Mirror();
webgl.add(mirror);

// CAMERA CONTROLLER
const cameraControl = new CameraMouseControl(webgl.camera, {
  mouseMove: [-5, -4],
  velocity: [0.1, 0.1],
});


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
