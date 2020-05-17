import {
  WebGLRenderer, Scene, PerspectiveCamera, Object3D,
  ShaderMaterial, Mesh, Color, TextureLoader,
  DoubleSide, PlaneBufferGeometry,
  RepeatWrapping, NearestFilter
} from 'three';

import CameraMouseControl from '../../../modules/CameraMouseControl';

import { vert, frag } from './shader.glsl';

const nineTexture = './assets/nine-texture.jpg';
const gradientTexture = './assets/gradient.jpg';

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

const NOISE_SPEED      = 0.008;
const PERLIN_FORCE     = 0.1;
const PERLIN_DIMENSION = 1.3;
const TORCED_FORCE     = 0.5;


// OBJECTS
class Nine extends Object3D {
  constructor(texture, gradientTexture) {
    super();

    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    // texture.magFilter = NearestFilter;
    texture.minFilter = NearestFilter;

    const geometry = new PlaneBufferGeometry(10, 20, 128, 128);

    // TODO reverse the 9 on the other side
    const mat = new ShaderMaterial({
      uniforms : {
        textTexture      : { value : texture },
        gradientTexture  : { value : gradientTexture },
        timer            : { value : 0 },
        perlinForce      : { value : PERLIN_FORCE },
        perlinDimension  : { value : PERLIN_DIMENSION },
        perlinTransition : { value : 0 },
        torcedForce      : { value : TORCED_FORCE },
      },
      vertexShader: vert,
      fragmentShader: frag,
      side : DoubleSide,
      wireframe: true,
    });

    this.mesh = new Mesh(geometry, mat);
    this.add(this.mesh)


    this.update = this.update.bind(this);
  }

  update() {
    this.mesh.material.uniforms.timer.value += NOISE_SPEED;
    this.mesh.rotation.y += 0.02;
  }
}

// START
let nine = false;
const loader = new TextureLoader();
loader.load(nineTexture, (texture) => {
  loader.load(gradientTexture, (gradText) => {
    nine = new Nine(texture, gradText);
    webgl.add(nine);
  });
});

// CAMERA CONTROLLER
const cameraControl = new CameraMouseControl(webgl.camera, {
  mouseMove: [-3, -4],
  velocity: [0.1, 0.1],
});

document.body.addEventListener('click', () => {
  nine.mesh.material.wireframe = !nine.mesh.material.wireframe;
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
