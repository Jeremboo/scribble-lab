import {
  WebGLRenderer, Scene, PerspectiveCamera, Object3D, BoxGeometry,
  MeshBasicMaterial, Mesh, Color, FlatShading, FontLoader, ShapeGeometry, TextGeometry, Vector3,
  Fog
} from 'three';

import fontFile from 'font';

import CameraMouseControl from 'CameraMouseControl';

const fontLoader = new FontLoader();
const font = fontLoader.parse(fontFile);

const MAIN_COLOR = '#FF00BD';
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
    this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(1.6, window.devicePixelRatio) || 1);
    this.renderer.setClearColor(new Color(BACKGROUND_COLOR));
    this.scene = new Scene();
    this.scene.fog = new Fog(BACKGROUND_COLOR, 0.1, 40);
    this.camera = new PerspectiveCamera(50, w / h, 1, 1000);
    this.camera.position.set(4, 0, 15);
    this.camera.lookAt(new Vector3(0, 0, 0));
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

 const DIST = 3;

// OBJECTS
class B extends Object3D {
  constructor() {
    super();

    this.geom = new ShapeGeometry(
      font.generateShapes('B', 9, 1),
    );
    this.geom.computeBoundingBox();

    this.mat = new MeshBasicMaterial({
      color: new Color(MAIN_COLOR),
      transparent: true,
      // wireframe : true
    });

    this.bArr = [];
    for (let i = 0; i < 20 ; i++) {
      const b = new Mesh(this.geom, new MeshBasicMaterial({
        color: new Color(MAIN_COLOR),
        transparent: true,
        // wireframe : true
      }));
      b.position.x = -this.geom.boundingBox.max.x * 0.5;
      b.position.y = -this.geom.boundingBox.max.y * 0.5;
      b.position.z = -i * 1.5;
      this.bArr.push(b);
      this.add(b);
    }

    this.update = this.update.bind(this);
  }

  update() {
    // TODO rotate them
    for (let i = 0; i < 20; i++) {
      this.bArr[i].position.z += 0.05;

      if (this.bArr[i].position.z > 0) {
        this.bArr[i].material.opacity = 1 - (this.bArr[i].position.z / DIST);
      }

      if (this.bArr[i].position.z > DIST) {
        this.bArr[i].position.z = -30 + DIST;
        this.bArr[i].material.opacity = 1;
      }
    }
  }
}

// START
const b = new B();
webgl.add(b);

// CAMERA CONTROLLER
const cameraControl = new CameraMouseControl(webgl.camera, { mouseMove : [-10, -10], velocity: [0.1, 0.1]});


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
