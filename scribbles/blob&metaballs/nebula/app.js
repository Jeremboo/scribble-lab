import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  Mesh,
  Color,
  PlaneBufferGeometry,
  ShaderMaterial,
  DoubleSide,
  TextureLoader,
  Object3D,
  AdditiveBlending
} from 'three';
import { GUI } from 'dat.gui';

import OrbitControl from 'OrbitControl';
import Stars from 'Stars';

import fragGlow from './shaders/glow.f.glsl';
import vertGlow from './shaders/glow.v.glsl';
import textureUrl from 'glow-texture.png';

import { getRandomFloat } from 'utils';

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
    // this.renderer.setClearColor(new Color(BACKGROUND_COLOR));
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(50, w / h, 1, 1000);
    this.controls = new OrbitControl(this.camera, this.renderer.domElement);
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

const PROPS = {
  color: '#4118ca',
  brightness: 5,
  turbulence: 1.3,
  scale: 1,
  distance: 1,
  rotation: 0.01
};

const textureLoader = new TextureLoader();

export default class Glow extends Mesh {
  constructor() {
    const scale = getRandomFloat(0.1, 4);
    const width = getRandomFloat(0.8, 1.2) * scale;
    const height = getRandomFloat(0.8, 1.2) * scale;

    const geometry = new PlaneBufferGeometry(width, height, 1);
    const material = new ShaderMaterial({
      vertexShader: vertGlow,
      fragmentShader: fragGlow,
      uniforms: {
        color: { value: new Color(PROPS.color) },
        alpha: { value: 1 },
        time: { value: 0 },
        texture: { value: null },
        scale: { value: PROPS.scale }
      },
      transparent: true,
      depthWrite: false
    });
    material.blending = AdditiveBlending;
    super(geometry, material);

    this.updateScale();

    // TODO 2020-03-31 jeremboo: improve the random positioning
    this.position.x = this.initialPositionX = getRandomFloat(-1, 1);
    this.position.y = this.initialPositionY = getRandomFloat(-2, 2);
    this.position.z = getRandomFloat(-1, 1);

    this.t = getRandomFloat(0, 10);
    this.increment = 0.025 + getRandomFloat(-0.015, 0.005);
    this.initialOpacity = getRandomFloat(0.15, 0.3);
    this.material.uniforms.alpha.value = this.initialOpacity;

    this.translationXForce = getRandomFloat(-0.5, 0.5);
    this.translationYForce = getRandomFloat(-0.5, 0.5);

    this.update = this.update.bind(this);

    textureLoader.load(textureUrl, text => {
      this.material.uniforms.texture.value = text;
    });

    this.updateScale = this.updateScale.bind(this);
  }

  updateScale() {
    this.material.uniforms.scale.value = PROPS.scale;
  }

  updateDistance() {
    this.initialPositionX = getRandomFloat(-0.5, 0.5) * PROPS.distance;
    this.initialPositionY = getRandomFloat(-0.5, 0.5) * PROPS.distance;
    this.position.z = getRandomFloat(-1, 1) * PROPS.distance;
  }

  update() {
    this.t += this.increment * PROPS.turbulence;

    this.position.x =
      this.initialPositionX + Math.sin(this.t) * this.translationXForce;
    this.position.y =
      this.initialPositionY + Math.cos(this.t) * this.translationYForce;

    this.material.uniforms.alpha.value =
      (Math.sin(this.t) + 1) * this.initialOpacity * PROPS.brightness;

    this.material.uniforms.time.value = Math.sin(this.t);
  }
}

// START
const stars = new Stars();
webgl.add(stars);

const glows = new Object3D();
glows.update = () => {
  for (let i = 0; i < glows.children.length; i++) {
    glows.children[i].update();
  }
};
webgl.add(glows);
for (let i = 0; i < 200; i++) {
  const glow = new Glow();
  glows.add(glow);
}

/**
 * * *******************
 * * GUI
 * * *******************
 */

const gui = new GUI();
gui.addColor(PROPS, 'color').onChange(value => {
  glows.children.forEach(glow => {
    glow.material.uniforms.color.value.set(value);
  });
});
gui.add(PROPS, 'rotation', 0, 0.1);
gui.add(PROPS, 'brightness', 0, 25);
gui.add(PROPS, 'turbulence', 0, 2);
// gui.add(PROPS, 'scale', 0.001, 3).onChange(value => {
//   glows.children.forEach(glow => {
//     glow.updateScale();
//   });
// });
// gui.add(PROPS, 'distance', 0.001, 10).onChange(value => {
//   glows.children.forEach(glow => {
//     glow.updateDistance();
//   });
// });

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
  glows.rotation.y += PROPS.rotation;
  stars.rotation.y += 0.001;
}
loop();
