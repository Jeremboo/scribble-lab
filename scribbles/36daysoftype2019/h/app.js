import {
  WebGLRenderer, Scene, PerspectiveCamera, Object3D,
  ShaderMaterial, Mesh, Color, ShapeGeometry, FontLoader,
  TextureLoader
} from 'three';

import fontFile from 'Glence Black_Regular';

import CameraMouseControl from 'CameraMouseControl';

import fluidVert from '../h/shaders/fluid.v.glsl';
import fluidFrag from '../h/shaders/fluid.f.glsl';

import gradientTexture from 'gradient.jpg';

const BACKGROUND_COLOR = '#040507';

const fontLoader = new FontLoader();
const font = fontLoader.parse(fontFile);

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
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio) || 1);
    this.renderer.setClearColor(new Color(BACKGROUND_COLOR));
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(50, w / h, 1, 1000);
    this.camera.position.set(0, 0, 40);
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

// OBJECTS
class H extends Object3D {
  constructor(texture) {
    super();

    // TODO create a Blender H letter to have a more vertexs
    this.geom = new ShapeGeometry(
      font.generateShapes('H', 10),
    );
    this.geom.computeBoundingBox();

    this.mat = new ShaderMaterial({
      uniforms : {
        timer: { value: 0 },
        texture: { value: texture },
      },
      vertexShader: fluidVert,
      fragmentShader: fluidFrag,
    });

    this.mesh = new Mesh(this.geom, this.mat);

    this.mesh.position.x = -this.geom.boundingBox.max.x * 0.5;
    this.mesh.position.y = -this.geom.boundingBox.max.y * 0.5;

    this.add(this.mesh);

    this.scale.multiplyScalar(2);

    this.update = this.update.bind(this);
    // this.rotation.y = -Math.PI * 0.1;
  }

  update() {
    this.mesh.material.uniforms.timer.value += 0.008;
    // this.rotation.x += 0.03;
    // this.rotation.y += 0.03;
  }
}


const loader = new TextureLoader();
loader.load(gradientTexture, (texture) => {
  const h = new H(texture);
  webgl.add(h);
});

// START


// CAMERA CONTROLLER
const cameraControl = new CameraMouseControl(webgl.camera, {
  mouseMove: [-30, -30],
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
