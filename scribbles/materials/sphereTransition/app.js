import {
  WebGLRenderer, Scene, PerspectiveCamera, Object3D,
  MeshBasicMaterial, Mesh, Color, ShaderMaterial, SphereBufferGeometry, Vector3,
} from 'three';
import OrbitControls from 'OrbitControl';
import { GUI } from 'dat.gui';
import { onCursorTouchMeshes } from 'utils'

import vertexShader from './shaders/sphereTransition.v.glsl';
import fragmentShader from './shaders/sphereTransition.f.glsl';

const MAIN_COLOR = '#C9F0FF';
const BACKGROUND_COLOR = '#212121';

const PROPS = {
  shift: 0.001,
  gradientSize: 0.4,
  speed: 0.02,
  speedRange: 1,
  color: '#2D2D2D',
  rayColor: '#fc5d2d'
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
    this.camera.position.set(0, 0, 20);
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
class Sphere extends Object3D {
  constructor(touchPosition) {
    super();

    this.normalizedSpeed = 0;

    this.material = new ShaderMaterial({
      uniforms: {
        touchPosition: { value : touchPosition },
        shift: { value: PROPS.shift },
        gradientSize: { value: PROPS.gradientSize },
        speed: { value: -0.5 },
        color: { value: new Color(PROPS.color) },
        rayColor: { value: new Color(PROPS.rayColor) }
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      opacity: 0,
    })
    this.geometry = new SphereBufferGeometry(4, 32, 32);
    this.mesh = new Mesh(this.geometry, this.material);
    this.add(this.mesh);

    this.update = this.update.bind(this);
  }

  update() {
    this.normalizedSpeed = (this.normalizedSpeed + PROPS.speed) % (PROPS.speedRange * 2);
    this.material.uniforms.speed.value = this.normalizedSpeed - PROPS.speedRange;
  }
}

// START
const debugSphere = new Mesh(new SphereBufferGeometry(0.2), new MeshBasicMaterial({ color: 0x00ff00, wireframe: true }));
debugSphere.position.set(3, 3, 3);
webgl.add(debugSphere);

const sphere = new Sphere(debugSphere.position);
webgl.add(sphere);

/**
 * * *******************
 * * GUI
 * * *******************
 */

const gui = new GUI();
// gui.add(PROPS, 'position', -15, 15).onChange((value) => {
//   debugSphere.position.y = value;
// })

gui.add(debugSphere.position, 'x', -10, 10);
gui.add(debugSphere.position, 'y', -10, 10);
gui.add(debugSphere.position, 'z', -10, 10);

gui.add(sphere.material.uniforms.shift, 'value', -0.5, 0.5).name('shift');
gui.add(sphere.material.uniforms.gradientSize, 'value', 0, 50).name('gradientSize');

gui.add(PROPS, 'speed', 0, 0.01).name('speed');
gui.add(PROPS, 'speedRange', 0, 5).name('speedRange');

gui.addColor(PROPS, 'color').onChange((value) => {
  sphere.material.uniforms.color.value = new Color(value);
})
gui.addColor(PROPS, 'rayColor').onChange((value) => {
  sphere.material.uniforms.rayColor.value = new Color(value);
})

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
